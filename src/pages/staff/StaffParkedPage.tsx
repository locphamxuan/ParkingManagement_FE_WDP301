import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCcw, Car, ScanLine, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBuildingContext } from '@/hooks/useBuildingContext';
import { useAuth } from '@/hooks/useAuth';
import { useAssignedGates } from '@/hooks/staff/useAssignedGates';
import { staffApi, type ParkingSession } from '@/services/staff/staffApi';
import { LivePlateCamera, type PlateScanResult, type LiveCameraHandle } from '@/components/staff/LivePlateCamera';
import { LiveQRCamera } from '@/components/staff/LiveQRCamera';
import { normalizePlate } from '@/utils/plate';
import { resolveErrorMessage } from '@/utils/apiErrors';
import { fmtMoney, computeCheckoutFee } from '@/components/staff/parked/staffParkedFormat';
import { ParkedSessionCard } from '@/components/staff/parked/ParkedSessionCard';
import { ParkedRejectModal } from '@/components/staff/parked/ParkedRejectModal';
import { BankTransferModal } from '@/components/staff/parked/BankTransferModal';
import { CheckoutModal, type PaymentKind } from '@/components/staff/parked/CheckoutModal';
import { BarrierGateOverlay, type BarrierState } from '@/components/staff/BarrierGateOverlay';
import styles from '@/styles/modules/StaffParkedPage.module.css';

interface BankTransferState {
  sessionId: string;
  orderCode: number;
  checkoutUrl: string;
  amount: number;
  plate: string;
  status: 'pending' | 'success';
}

export function StaffParkedPage({ view = 'list' }: { view?: 'scanner' | 'list' }) {
  const { buildingId, building } = useBuildingContext();
  const { user } = useAuth();
  const { showCheckOut } = useAssignedGates();
  const canCheckout = view === 'scanner' ? true : showCheckOut;

  const [sessions, setSessions] = useState<ParkingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadTick, setReloadTick] = useState(0);
  const [opMessage, setOpMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const [checkoutTarget, setCheckoutTarget] = useState<ParkingSession | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentKind>('cash');
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [barrierState, setBarrierState] = useState<BarrierState>('closed');

  const [identifyMode, setIdentifyMode] = useState<'plate' | 'qr'>('plate');
  const [coStep, setCoStep] = useState<1 | 2>(1);

  const [bankTransfer, setBankTransfer] = useState<BankTransferState | null>(null);
  const [verifying, setVerifying] = useState(false);

  const [capturedPlateImage, setCapturedPlateImage] = useState<string | null>(null);
  const [capturedPortraitImage, setCapturedPortraitImage] = useState<string | null>(null);
  const portraitCamRef = useRef<LiveCameraHandle>(null);

  // Biển số đang có incident 'penalty_pending' (manager đã duyệt phí phạt, chờ staff
  // thu lúc check-out) — map plate đã normalize → số tiền, để hiện banner cảnh báo.
  const [pendingPenalties, setPendingPenalties] = useState<Record<string, number>>({});

  const refreshSessions = useCallback(() => {
    setLoading(true);
    staffApi
      .getActiveSessions({ building: buildingId, populate: 'slot.floor,vehicleType,entryGate,exitGate' })
      .then((res) => {
        const rows = (res as { data?: { items?: ParkingSession[] } | ParkingSession[] })?.data;
        const list = Array.isArray(rows) ? rows : ((rows as { items?: ParkingSession[] })?.items ?? []);
        setSessions(list.filter((s) => s.status === 'active'));
        setError(null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load data'))
      .finally(() => setLoading(false));

    staffApi.incidents.list(buildingId, { status: 'penalty_pending' })
      .then((res) => {
        const items = (res.data as { items?: { violatorPlate?: string; penaltyFee?: number | null }[] } | { violatorPlate?: string; penaltyFee?: number | null }[]);
        const list = Array.isArray(items) ? items : (items.items ?? []);
        const map: Record<string, number> = {};
        list.forEach((it) => {
          if (it.violatorPlate && it.penaltyFee) map[normalizePlate(it.violatorPlate)] = it.penaltyFee;
        });
        setPendingPenalties(map);
      })
      .catch(() => setPendingPenalties({}));
  }, [buildingId]);

  useEffect(() => {
    refreshSessions();
    const timer = setInterval(refreshSessions, 30_000);
    return () => clearInterval(timer);
  }, [refreshSessions, reloadTick]);

  const totalFee = useMemo(
    () => sessions.reduce((sum, s) => sum + (s.currentFee ?? s.fee ?? 0), 0),
    [sessions],
  );

  const openCheckout = useCallback(async (session: ParkingSession, exitPlateImage: string | null = null) => {
    setOpMessage(null);
    setCheckoutTarget(session);
    setPaymentMethod('cash');
    setCoStep(1);
    setCapturedPlateImage(exitPlateImage);
    setCapturedPortraitImage(null);
    try {
      const res = await staffApi.sessions.detail(session._id);
      const full = (res as { data?: ParkingSession })?.data;
      if (full) {
        setCheckoutTarget((prev) =>
          prev && prev._id === session._id
            ? { ...prev, plateImage: full.plateImage, portraitImage: full.portraitImage }
            : prev,
        );
      }
    } catch (_err) {
      // Ignored
    }
  }, []);

  const openCheckoutByPlate = (plate: string, exitPlateImage: string | null = null) => {
    const clean = normalizePlate(plate) || plate.trim().toUpperCase();
    const found = sessions.find(
      (s) => (normalizePlate(s.plateNumber) || s.plateNumber.toUpperCase()) === clean,
    );
    if (found) {
      void openCheckout(found, exitPlateImage);
    } else {
      setOpMessage({
        type: 'err',
        text: `No parked vehicle found with plate ${clean}. Tap “Refresh” and try again.`,
      });
    }
  };

  const handlePlateDetected = ({ plateNumber, plateImage }: PlateScanResult) => {
    openCheckoutByPlate(plateNumber, plateImage);
  };

  const handleResolveIdQr = async (code: string) => {
    // QR chỉ được tra cứu trong đúng tòa đang chọn.
    if (!buildingId) {
      setOpMessage({ type: 'err', text: 'Select a building before scanning a QR code.' });
      return;
    }
    try {
      const res = await staffApi.resolveQr(code, buildingId);
      const data = (res as {
        data?: {
          kind: 'plate' | 'user';
          plate?: { plateNumber: string } | null;
          activeSessions?: { plateNumber: string }[];
        };
      })?.data;
      if (data?.kind === 'plate' && data.plate?.plateNumber) {
        openCheckoutByPlate(data.plate.plateNumber);
      } else if (data?.activeSessions && data.activeSessions.length > 0) {
        openCheckoutByPlate(data.activeSessions[0].plateNumber);
      } else {
        setOpMessage({ type: 'err', text: 'No parked vehicle found for this QR code.' });
      }
    } catch (err) {
      setOpMessage({ type: 'err', text: err instanceof Error ? err.message : 'QR lookup error.' });
    }
  };

  const onCheckOut = async () => {
    const target = checkoutTarget;
    if (!target) return;
    setOpMessage(null);
    
    // Phí phạt (nếu có) đang chờ thu cho biển số này — BE tự cộng/khấu trừ khi check-out
    // (settlePendingPenaltyAtCheckout), nhưng phương thức thanh toán gửi lên phải phản
    // ánh đúng lựa chọn của staff kể cả khi phí gửi xe = 0 (miễn phí/grace period) mà
    // vẫn còn phạt phải thu.
    const pendingPenalty = pendingPenalties[normalizePlate(target.plateNumber)] || 0;
    const { isUnderGracePeriod, dueFee, grandTotal } = computeCheckoutFee(target, pendingPenalty);

    try {
      const exitPortrait = capturedPortraitImage ?? portraitCamRef.current?.capture() ?? null;
      const paymentEvidence = {
        exitPlateImage: capturedPlateImage,
        exitPortraitImage: exitPortrait,
      };

      if (paymentMethod === 'bank_transfer' && pendingPenalty > 0) {
        setOpMessage({
          type: 'err',
          text: 'A pending penalty must be collected through the staffed checkout flow; PayOS QR is unavailable for this vehicle.',
        });
        return;
      }

      if (paymentMethod === 'bank_transfer' && dueFee > 0) {
        const existingIntent = await staffApi.getSessionPaymentIntent(target._id);
        const existing = existingIntent.data;
        if (existing) {
          setBankTransfer({
            sessionId: target._id,
            orderCode: existing.orderCode,
            checkoutUrl: existing.checkoutUrl,
            amount: existing.amount,
            plate: existing.plateNumber || target.plateNumber,
            status: existing.status,
          });
          setCheckoutTarget(null);
          return;
        }

        const res = await staffApi.initiateSessionPayment(target._id, paymentEvidence);
        const d = (res as unknown as { data?: { orderCode: number; checkoutUrl: string; amount: number; plateNumber?: string } })?.data;
        if (d) {
          setBankTransfer({
            sessionId: target._id,
            orderCode: d.orderCode,
            checkoutUrl: d.checkoutUrl,
            amount: d.amount,
            plate: d.plateNumber || target.plateNumber,
            status: 'pending',
          });
          setCheckoutTarget(null);
        }
        return;
      }

      // Bank transfer chỉ có QR thật cho phí gửi xe (nhánh trên) — không có luồng QR
      // riêng cho phí phạt, nên nếu chỉ còn phạt (dueFee = 0) mà staff chọn "Transfer"
      // thì hạ về cash thay vì gửi thẳng 'bank_transfer' (tránh BE đánh dấu đã thu điện
      // tử trong khi chưa hề có giao dịch thật nào).
      const effectivePaymentMethod = grandTotal > 0
        ? (paymentMethod === 'bank_transfer' ? 'cash' : paymentMethod)
        : 'cash';

      const payload: any = {
        ...(target.isReservation ? {} : { paymentMethod: effectivePaymentMethod }),
        exitPlateImage: capturedPlateImage,
        exitPortraitImage: exitPortrait,
      };

      await staffApi.checkOut(target._id, payload);

      setBarrierState('opening');
      setTimeout(() => {
        setBarrierState('open');
        setTimeout(() => {
          setBarrierState('closing');
          setTimeout(() => {
            setBarrierState('closed');
          }, 1000);
        }, 3000);
      }, 1000);

      setOpMessage({
        type: 'ok',
        text: target.isReservation
          ? `Vehicle ${target.plateNumber} released — wallet auto-charged.`
          : pendingPenalty > 0
            ? `Fee collected (${grandTotal.toLocaleString('vi-VN')} ₫, incl. ${pendingPenalty.toLocaleString('vi-VN')} ₫ penalty). Vehicle ${target.plateNumber} released.`
            : isUnderGracePeriod
              ? `Vehicle ${target.plateNumber} released under 10-minute Grace Period (free).`
              : dueFee > 0
                ? `Fee collected (${dueFee.toLocaleString('vi-VN')} ₫). Vehicle ${target.plateNumber} released.`
                : `Vehicle ${target.plateNumber} released (free under package).`,
      });
      setPaymentMethod('cash');
      setCheckoutTarget(null);
      setCapturedPlateImage(null);
      setCapturedPortraitImage(null);
      setReloadTick((n) => n + 1);
    } catch (err) {
      setOpMessage({ type: 'err', text: resolveErrorMessage(err, 'Check-out failed') });
    }
  };

  const onReject = async () => {
    if (!checkoutTarget || !rejectReason.trim()) return;
    if (!buildingId) {
      setOpMessage({ type: 'err', text: 'Select a building before rejecting an exit.' });
      return;
    }
    try {
      const res = await staffApi.reject({
        plateNumber: checkoutTarget.plateNumber,
        stage: 'check-out',
        reason: rejectReason.trim(),
        building: buildingId,
      });
      const notified = (res as { data?: { notified?: boolean } })?.data?.notified;
      setOpMessage({
        type: 'ok',
        text: `Rejected exit for plate ${checkoutTarget.plateNumber}.${notified ? ' Guest has been notified.' : ''}`,
      });
      setRejectOpen(false);
      setRejectReason('');
      setCheckoutTarget(null);
      setCapturedPlateImage(null);
      setCapturedPortraitImage(null);
    } catch (err) {
      setOpMessage({ type: 'err', text: resolveErrorMessage(err, 'Rejection failed') });
    }
  };

  const onVerifyBankTransfer = async () => {
    if (!bankTransfer) return;
    setVerifying(true);
    try {
      const res = await staffApi.verifySessionPayment(bankTransfer.orderCode);
      const status = (res as { data?: { status?: string } })?.data?.status;
      if (status === 'success') {
        await staffApi.checkOut(bankTransfer.sessionId, { paymentMethod: 'payos' });
        setBarrierState('opening');
        setTimeout(() => {
          setBarrierState('open');
          setTimeout(() => {
            setBarrierState('closing');
            setTimeout(() => setBarrierState('closed'), 1000);
          }, 3000);
        }, 1000);
        setBankTransfer(null);
        setPaymentMethod('cash');
        setOpMessage({ type: 'ok', text: 'Payment received — parking session completed.' });
        setReloadTick((n) => n + 1);
      } else if (status === 'cancelled' || status === 'expired') {
        setBankTransfer(null);
        setOpMessage({ type: 'err', text: `Payment ${status}. Please try again.` });
      } else if (status === 'reconciliation_required') {
        setBankTransfer(null);
        setOpMessage({
          type: 'err',
          text: 'This session was already settled by another payment. The transfer is flagged for manager reconciliation — do not collect again.',
        });
        setReloadTick((n) => n + 1);
      } else {
        setOpMessage({ type: 'err', text: 'Payment not received yet. The guest must complete the transfer.' });
      }
    } catch (err) {
      setOpMessage({ type: 'err', text: resolveErrorMessage(err, 'Payment confirmation failed') });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-5"
    >
      {/* Header Banner */}
      <div
        className={`flex flex-col gap-4 rounded-2xl p-5 lg:flex-row lg:items-center lg:justify-between ${styles.headerBanner}`}
      >
        <div className="flex items-center gap-3.5">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${styles.headerIcon}`}>
            <Car className="text-sky-600" size={22} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-sky-500">
              {view === 'scanner' ? 'Exit gate · Scan vehicle' : canCheckout ? 'Exit gate' : 'Lot monitoring'}
            </p>
            <h2 className="text-lg font-extrabold text-slate-800 leading-tight">
              {view === 'scanner' ? 'Vehicle Check-out' : 'Parked Vehicles'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {building ? `${building.code} · ${building.name}` : 'No building selected'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="rounded-xl border border-sky-100 bg-white/70 px-4 py-1.5 text-center min-w-[88px] shadow-sm">
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Parked</p>
            <p className="text-base font-black text-slate-700 leading-tight">{loading ? '–' : sessions.length}</p>
          </div>
          <div className="rounded-xl border border-sky-100 bg-white/70 px-4 py-1.5 text-center shadow-sm">
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Total estimated fee</p>
            <p className="text-base font-black text-sky-600 leading-tight">{loading ? '–' : fmtMoney(totalFee)}</p>
          </div>
          <Button
            onClick={refreshSessions}
            className="gap-2 h-9 rounded-xl border border-sky-100 bg-sky-50 text-sky-700 hover:bg-sky-100/70 font-bold text-xs"
          >
            <RefreshCcw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
          </Button>
        </div>
      </div>

      {/* ══ VIEW "scanner" — Checkout scanner page ══ */}
      {view === 'scanner' && (
        <div className="mx-auto w-full max-w-xl space-y-4">
          {!canCheckout ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 font-medium">
              ⚠️ This account is not exit-gate staff — cannot release vehicles.
            </div>
          ) : !checkoutTarget && !bankTransfer && !rejectOpen ? (
            <section
              className={`space-y-4 rounded-3xl p-5 ${styles.panel}`}
            >
              <div className="flex gap-2 p-1 rounded-xl bg-slate-50 border border-sky-100">
                <button
                  type="button"
                  onClick={() => setIdentifyMode('plate')}
                  className={`flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg text-xs font-extrabold transition-all duration-200 ${identifyMode === 'plate' ? 'bg-white text-sky-600 shadow-sm border border-sky-100/50' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  <ScanLine size={13} className="text-sky-500" /> Scan plate (AI)
                </button>
                <button
                  type="button"
                  onClick={() => setIdentifyMode('qr')}
                  className={`flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg text-xs font-extrabold transition-all duration-200 ${identifyMode === 'qr' ? 'bg-white text-sky-600 shadow-sm border border-sky-100/50' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  <QrCode size={13} className="text-sky-500" /> Scan QR
                </button>
              </div>
              <div className="relative overflow-hidden rounded-2xl border border-sky-100 bg-slate-50 shadow-inner">
                {identifyMode === 'plate' ? (
                  <LivePlateCamera
                    onDetected={handlePlateDetected}
                    busy={loading}
                    buildingId={buildingId}
                  />
                ) : (
                  <LiveQRCamera onResult={handleResolveIdQr} />
                )}
              </div>
              <p className="text-center text-[11px] text-slate-400 font-medium px-4">
                Scan the vehicle plate / QR code to find the vehicle record and open fee collection.
              </p>
            </section>
          ) : null}
          {opMessage && (
            <div className={`rounded-xl border p-4 text-sm font-semibold ${opMessage.type === 'ok' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800'}`}>
              {opMessage.text}
            </div>
          )}
        </div>
      )}

      {/* ══ VIEW "list" — Parked list page ══ */}
      {view === 'list' && (
        <div className="space-y-4">
          {!canCheckout && (
            <div className="rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-800 font-medium">
              ℹ️ View-only mode. Vehicle exit &amp; fee collection are handled by exit-gate staff.
            </div>
          )}

          {opMessage && (
            <div className={`rounded-xl border p-4 text-sm font-semibold ${opMessage.type === 'ok' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800'}`}>
              {opMessage.text}
            </div>
          )}

          <div
            className={`relative overflow-hidden rounded-3xl p-5 md:p-6 ${styles.panel}`}
          >
            {/* Top accent */}
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-sky-400 via-sky-500 to-transparent" />

            <div className="mb-5">
              <h3 className="text-base font-extrabold text-slate-800 tracking-tight">Active Parking Sessions</h3>
              <p className="text-xs text-slate-400 mt-0.5">Vehicles currently inside the building</p>
            </div>

            {loading ? (
              <p className="text-sm text-slate-400">Loading parked vehicles...</p>
            ) : error ? (
              <p className="text-sm text-rose-600 font-semibold">{error}</p>
            ) : sessions.length === 0 ? (
              <div className="py-12 text-center border border-dashed border-sky-100 rounded-2xl bg-sky-50/20">
                <Car size={32} className="mx-auto mb-2 text-slate-300" />
                <p className="text-sm text-slate-400 font-medium">No parked vehicles found.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
                {sessions.map((s) => (
                  <ParkedSessionCard key={s._id} session={s} canCheckout={canCheckout} onCheckout={openCheckout} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Checkout and Payment Modal */}
      {checkoutTarget && (
        <CheckoutModal
          checkoutTarget={checkoutTarget}
          userLabel={user?.fullName || user?.email || 'You'}
          coStep={coStep}
          setCoStep={setCoStep}
          capturedPlateImage={capturedPlateImage}
          capturedPortraitImage={capturedPortraitImage}
          setCapturedPortraitImage={setCapturedPortraitImage}
          portraitCamRef={portraitCamRef}
          paymentMethod={paymentMethod}
          setPaymentMethod={setPaymentMethod}
          pendingPenalties={pendingPenalties}
          loading={loading}
          onClose={() => { setCheckoutTarget(null); setPaymentMethod('cash'); setCoStep(1); setCapturedPlateImage(null); setCapturedPortraitImage(null); }}
          onCheckOut={onCheckOut}
          onOpenReject={() => setRejectOpen(true)}
          onCaptureError={(text) => setOpMessage({ type: 'err', text })}
        />
      )}

      {/* Rejection modal */}
      <ParkedRejectModal
        open={rejectOpen}
        reason={rejectReason}
        setReason={setRejectReason}
        onClose={() => { setRejectOpen(false); setRejectReason(''); }}
        onReject={onReject}
      />

      {/* Bank transfer payment QR modal */}
      <BankTransferModal
        bankTransfer={bankTransfer}
        verifying={verifying}
        onVerify={onVerifyBankTransfer}
        onClose={() => setBankTransfer(null)}
      />
      {/* Barrier Gate IoT Simulation Overlay */}
      <BarrierGateOverlay barrierState={barrierState} />
    </motion.div>
  );
}
