import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCcw, CheckCircle2, Car, ScanLine, QrCode, UserSquare, ArrowLeft, ArrowRight, Wallet, Banknote, QrCode as QrIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBuildingContext } from '@/hooks/useBuildingContext';
import { useAuth } from '@/hooks/useAuth';
import { useAssignedGates } from '@/hooks/staff/useAssignedGates';
import { staffApi, type ParkingSession } from '@/services/staff/staffApi';
import { LivePlateCamera, type PlateScanResult, type LiveCameraHandle } from '@/components/staff/LivePlateCamera';
import { LiveQRCamera } from '@/components/staff/LiveQRCamera';
import { LivePortraitCamera } from '@/components/staff/LivePortraitCamera';
import { normalizePlate } from '@/utils/plate';
import { fmtTime, fmtMoney, fmtDuration } from '@/components/staff/parked/staffParkedFormat';
import { ParkedSessionCard } from '@/components/staff/parked/ParkedSessionCard';
import { ParkedRejectModal } from '@/components/staff/parked/ParkedRejectModal';
import { BankTransferModal } from '@/components/staff/parked/BankTransferModal';
import { LicensePlate } from '@/components/common/LicensePlate';

type PaymentKind = 'cash' | 'bank_transfer' | 'wallet';

interface BankTransferState {
  orderCode: number;
  checkoutUrl: string;
  amount: number;
  plate: string;
}

function CompareImg({ src, label }: { src?: string | null; label: string }) {
  return (
    <div>
      <div className="aspect-[4/3] overflow-hidden rounded-xl border border-sky-100 bg-slate-50 flex items-center justify-center shadow-inner">
        {src ? (
          <img src={src} alt={label} className="h-full w-full object-cover" />
        ) : (
          <span className="text-[10px] text-slate-400">None</span>
        )}
      </div>
      <p className="mt-1 text-center text-[10px] font-bold text-slate-500">{label}</p>
    </div>
  );
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
  const [barrierState, setBarrierState] = useState<'closed' | 'opening' | 'open' | 'closing'>('closed');

  const [identifyMode, setIdentifyMode] = useState<'plate' | 'qr'>('plate');
  const [coStep, setCoStep] = useState<1 | 2>(1);

  const [bankTransfer, setBankTransfer] = useState<BankTransferState | null>(null);
  const [verifying, setVerifying] = useState(false);

  const [capturedPlateImage, setCapturedPlateImage] = useState<string | null>(null);
  const [capturedPortraitImage, setCapturedPortraitImage] = useState<string | null>(null);
  const portraitCamRef = useRef<LiveCameraHandle>(null);

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
    } catch {
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
    try {
      const res = await staffApi.resolveQr(code);
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
    
    let entry = new Date();
    try {
      entry = new Date(target.entryTime);
    } catch {
      // fallback
    }
    const diffMin = Math.max(0, Math.floor((Date.now() - entry.getTime()) / 60000));
    const isUnderGracePeriod = diffMin < 10;
    const dueFee = isUnderGracePeriod ? 0 : (target.currentFee ?? target.fee ?? 0);

    try {
      if (paymentMethod === 'bank_transfer' && dueFee > 0) {
        const res = await staffApi.initiateSessionPayment(target._id);
        const d = (res as unknown as { data?: { orderCode: number; checkoutUrl: string; amount: number; plateNumber?: string } })?.data;
        if (d) {
          setBankTransfer({
            orderCode: d.orderCode,
            checkoutUrl: d.checkoutUrl,
            amount: d.amount,
            plate: d.plateNumber || target.plateNumber,
          });
          setCheckoutTarget(null);
        }
        return;
      }
      const exitPortrait = capturedPortraitImage ?? portraitCamRef.current?.capture() ?? null;
      await staffApi.checkOut(target._id, {
        ...(target.isReservation ? {} : { paymentMethod: dueFee > 0 ? paymentMethod : 'cash' }),
        exitPlateImage: capturedPlateImage,
        exitPortraitImage: exitPortrait,
      });

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
          : isUnderGracePeriod
            ? `Vehicle ${target.plateNumber} released under 10-minute Grace Period (free).`
            : dueFee > 0
              ? `Fee collected & vehicle ${target.plateNumber} released.`
              : `Vehicle ${target.plateNumber} released (free under package).`,
      });
      setPaymentMethod('cash');
      setCheckoutTarget(null);
      setCapturedPlateImage(null);
      setCapturedPortraitImage(null);
      setReloadTick((n) => n + 1);
    } catch (err) {
      setOpMessage({ type: 'err', text: err instanceof Error ? err.message : 'Check-out failed' });
    }
  };

  const onReject = async () => {
    if (!checkoutTarget || !rejectReason.trim()) return;
    try {
      const res = await staffApi.reject({
        plateNumber: checkoutTarget.plateNumber,
        stage: 'check-out',
        reason: rejectReason.trim(),
        building: buildingId || undefined,
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
      setOpMessage({ type: 'err', text: err instanceof Error ? err.message : 'Rejection failed' });
    }
  };

  const onVerifyBankTransfer = async () => {
    if (!bankTransfer) return;
    setVerifying(true);
    try {
      const res = await staffApi.verifySessionPayment(bankTransfer.orderCode);
      const status = (res as { data?: { status?: string } })?.data?.status;
      if (status === 'success') {
        setBankTransfer(null);
        setPaymentMethod('cash');
        setOpMessage({ type: 'ok', text: 'Payment received — parking session completed.' });
        setReloadTick((n) => n + 1);
      } else if (status === 'cancelled' || status === 'expired') {
        setBankTransfer(null);
        setOpMessage({ type: 'err', text: `Payment ${status}. Please try again.` });
      } else {
        setOpMessage({ type: 'err', text: 'Payment not received yet. The guest must complete the transfer.' });
      }
    } catch (err) {
      setOpMessage({ type: 'err', text: err instanceof Error ? err.message : 'Payment confirmation failed' });
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
        className="flex flex-col gap-4 rounded-2xl p-5 lg:flex-row lg:items-center lg:justify-between"
        style={{
          background: 'linear-gradient(135deg, rgba(224,242,254,0.7) 0%, rgba(255,255,255,0.75) 50%, rgba(219,234,254,0.5) 100%)',
          border: '1px solid rgba(14,165,233,0.18)',
          boxShadow: '0 4px 24px rgba(14,165,233,0.06), inset 0 1px 0 rgba(255,255,255,0.9)',
          backdropFilter: 'blur(16px)',
        }}
      >
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
            style={{
              background: 'linear-gradient(135deg, #e0f2fe, #bae6fd)',
              border: '1px solid rgba(14,165,233,0.22)',
              boxShadow: '0 4px 12px rgba(14,165,233,0.12)',
            }}>
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
              className="space-y-4 rounded-3xl p-5"
              style={{
                background: 'rgba(255,255,255,0.72)',
                border: '1px solid rgba(14,165,233,0.14)',
                boxShadow: '0 10px 30px rgba(14,165,233,0.05), inset 0 1px 0 rgba(255,255,255,0.9)',
                backdropFilter: 'blur(20px)',
              }}
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
                  <LivePlateCamera onDetected={handlePlateDetected} busy={loading} />
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
            className="relative overflow-hidden rounded-3xl p-5 md:p-6"
            style={{
              background: 'rgba(255,255,255,0.72)',
              border: '1px solid rgba(14,165,233,0.14)',
              boxShadow: '0 10px 30px rgba(14,165,233,0.05), inset 0 1px 0 rgba(255,255,255,0.9)',
              backdropFilter: 'blur(20px)',
            }}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-md">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-3xl p-6 shadow-2xl relative border border-sky-100"
            style={{
              background: 'rgba(255,255,255,0.96)',
              boxShadow: '0 24px 60px rgba(14,165,233,0.12)',
            }}
          >
            {/* Top border line */}
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-sky-400 via-sky-500 to-transparent" />

            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-sky-500">Payment &amp; Release</p>
                <LicensePlate plateNumber={checkoutTarget.plateNumber} className="mt-1.5" />
              </div>
              <button
                onClick={() => { setCheckoutTarget(null); setPaymentMethod('cash'); setCoStep(1); setCapturedPlateImage(null); setCapturedPortraitImage(null); }}
                className="text-slate-400 hover:text-slate-700 transition text-lg"
              >
                ✕
              </button>
            </div>

            {/* Step indicator */}
            <div className="mb-5 flex items-center gap-2 rounded-xl bg-sky-50/50 border border-sky-100 p-2.5 text-[11px] font-bold">
              {[{ n: 1, label: 'Exit portrait' }, { n: 2, label: 'Compare & Release' }].map((s, i) => (
                <div key={s.n} className="flex items-center gap-2">
                  <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black transition-all ${coStep >= s.n ? 'bg-sky-500 text-white' : 'bg-slate-200 text-slate-400'}`}>{s.n}</span>
                  <span className={coStep === s.n ? 'text-slate-800 font-extrabold' : 'text-slate-400'}>{s.label}</span>
                  {i < 1 && <span className="mx-1 h-px w-5 bg-sky-200/50" />}
                </div>
              ))}
            </div>

            {/* ── CO STEP 1: Exit portrait ── */}
            {coStep === 1 && (
              <div className="space-y-4">
                <div className="relative overflow-hidden rounded-2xl border border-sky-100 bg-slate-50 shadow-inner">
                  <LivePortraitCamera ref={portraitCamRef} />
                </div>
                {capturedPortraitImage && (
                  <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-2.5 text-xs text-emerald-800">
                    <UserSquare size={14} className="text-emerald-600 animate-pulse" /> Exit portrait captured — ready to proceed.
                  </div>
                )}
                <div className="flex gap-2.5">
                  <Button type="button" variant="outline" onClick={() => setCoStep(2)} className="h-11 rounded-xl border-sky-100 hover:bg-sky-50 text-slate-600 font-bold">
                    Skip capture
                  </Button>
                  <Button
                    onClick={() => {
                      const img = portraitCamRef.current?.capture() ?? null;
                      if (!img) { setOpMessage({ type: 'err', text: 'Portrait camera not ready. Please try again.' }); return; }
                      setCapturedPortraitImage(img);
                      setOpMessage(null);
                      setCoStep(2);
                    }}
                    className="flex-1 h-11 gap-2 bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-extrabold hover:brightness-110 rounded-xl shadow-md"
                  >
                    <UserSquare size={16} /> {capturedPortraitImage ? 'Retake & continue' : 'Capture & continue'} <ArrowRight size={16} />
                  </Button>
                </div>
              </div>
            )}

            {/* ── CO STEP 2: Compare & Release ── */}
            {coStep === 2 && (
              <>
                {/* Photo comparisons */}
                <div className="mb-4 rounded-2xl border border-sky-100 bg-sky-50/30 p-3.5 shadow-inner">
                  <p className="mb-2.5 text-[10px] font-bold uppercase tracking-[0.2em] text-sky-600">
                    Compare plate &amp; portrait photos
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    {/* Entry Column */}
                    <div className="space-y-2 border-r border-sky-100/50 pr-2">
                      <p className="text-[9px] font-black uppercase tracking-wide text-slate-400">On entry (saved)</p>
                      <CompareImg src={checkoutTarget.plateImage} label="Plate" />
                      <CompareImg src={checkoutTarget.portraitImage} label="Portrait" />
                    </div>
                    {/* Exit Column */}
                    <div className="space-y-2 pl-2">
                      <p className="text-[9px] font-black uppercase tracking-wide text-slate-400">On exit (just scanned)</p>
                      <CompareImg src={capturedPlateImage} label="Plate" />
                      <CompareImg src={capturedPortraitImage} label="Portrait" />
                    </div>
                  </div>
                  <p className="mt-3 text-[10px] text-slate-400 text-center font-medium">
                    Ensure details match. If there is a mismatch, click <strong className="text-rose-500 font-bold">Reject</strong>.
                  </p>
                </div>

                <div className="rounded-2xl border border-sky-100 bg-white p-4 space-y-2 text-xs shadow-sm">
                  <div className="flex justify-between"><span className="text-slate-400 font-medium">Guest</span><span className="font-bold text-slate-700">{(checkoutTarget.isMember ?? checkoutTarget.user) ? (checkoutTarget.user?.fullName || 'Member') : 'Walk-in guest'}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400 font-medium">Vehicle info</span><span className="font-bold text-slate-700">{checkoutTarget.vehicleType?.name ?? '—'}{checkoutTarget.vehicleBrand ? ` · ${checkoutTarget.vehicleBrand}` : ''}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400 font-medium">Entry time</span><span className="font-bold text-slate-700">{fmtTime(checkoutTarget.entryTime)}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400 font-medium">Parking duration</span><span className="font-bold text-sky-600">{fmtDuration(checkoutTarget.entryTime)}</span></div>
                  <div className="flex justify-between border-t border-sky-50 pt-2"><span className="text-slate-400 font-medium">Check-in gate</span><span className="font-bold text-slate-700">{checkoutTarget.staff?.fullName ?? '—'}{checkoutTarget.entryGate?.code ? ` · Gate ${checkoutTarget.entryGate.code}` : ''}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400 font-medium">Check-out operator</span><span className="font-bold text-sky-600">{user?.fullName || user?.email || 'You'}</span></div>
                </div>

                {checkoutTarget.isLongTerm && (
                  <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
                    🅿️ Long-term package vehicle{checkoutTarget.maxHoursPerDay ? ` · free ${checkoutTarget.maxHoursPerDay}h/day` : ''}.{' '}
                    {(checkoutTarget.overageHours ?? 0) > 0
                      ? `Overstay ${checkoutTarget.overageHours?.toFixed(1)}h → overage charged.`
                      : 'Within limit → Free.'}
                  </div>
                )}

                {checkoutTarget.isReservation ? (
                  <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50 p-4 text-xs text-sky-800">
                    📅 Prior reservation — system will auto-charge remaining amount (<strong>{fmtMoney(checkoutTarget.reservationRemainingFee ?? 0)}</strong>) to member's wallet.
                  </div>
                ) : (
                  <>
                    {(() => {
                      let entry = new Date();
                      try { entry = new Date(checkoutTarget.entryTime); } catch { }
                      const diffMin = Math.max(0, Math.floor((Date.now() - entry.getTime()) / 60000));
                      const isUnderGracePeriod = diffMin < 10;
                      return (
                        <>
                          <div className="mt-4 rounded-2xl border border-sky-100 bg-sky-50/50 p-4 flex flex-col gap-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Amount due</span>
                              <span className="font-mono text-2xl font-black text-sky-600">
                                {isUnderGracePeriod
                                  ? '0 ₫'
                                  : (checkoutTarget.currentFee ?? checkoutTarget.fee ?? 0) > 0
                                    ? fmtMoney(checkoutTarget.currentFee ?? checkoutTarget.fee)
                                    : 'Free'}
                              </span>
                            </div>
                            {isUnderGracePeriod && (
                              <p className="text-[10px] text-emerald-600 font-bold mt-0.5 flex items-center gap-1.5">
                                <CheckCircle2 size={11} className="text-emerald-500" /> Free parking under 10-minute Grace Period
                              </p>
                            )}
                          </div>

                          {(checkoutTarget.currentFee ?? checkoutTarget.fee ?? 0) > 0 && !isUnderGracePeriod && (
                            <div className="mt-4 space-y-2">
                              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Payment method</p>
                              <div className="grid gap-2 grid-cols-3">
                                {[
                                  { value: 'cash', label: 'Cash', icon: Banknote },
                                  { value: 'bank_transfer', label: 'Transfer', icon: QrIcon },
                                  { value: 'wallet', label: 'Wallet', icon: Wallet }
                                ].map((m) => (
                                  <button
                                    key={m.value}
                                    type="button"
                                    onClick={() => setPaymentMethod(m.value as PaymentKind)}
                                    className={`rounded-xl border p-2.5 flex flex-col items-center justify-center gap-1.5 text-xs font-bold transition-all duration-200 ${paymentMethod === m.value ? 'border-sky-300 bg-sky-50 text-sky-700 shadow-sm' : 'border-sky-100 bg-white text-slate-500 hover:border-sky-200'}`}
                                  >
                                    <m.icon size={16} />
                                    <span>{m.label}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </>
                )}

                <div className="mt-5 flex gap-2.5">
                  <Button type="button" variant="outline" onClick={() => setCoStep(1)} className="h-11 rounded-xl border-sky-100 hover:bg-sky-50 text-slate-600 font-bold">
                    <ArrowLeft size={16} /> Back
                  </Button>
                  <Button
                    onClick={onCheckOut}
                    disabled={loading}
                    className="flex-1 h-11 gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-extrabold hover:brightness-110 disabled:opacity-60 rounded-xl shadow-md"
                  >
                    <CheckCircle2 size={16} />
                    {checkoutTarget.isReservation
                      ? 'Release (auto wallet charge)'
                      : (checkoutTarget.currentFee ?? checkoutTarget.fee ?? 0) <= 0
                        ? 'Release (Free)'
                        : paymentMethod === 'bank_transfer'
                        ? 'Create payment QR'
                        : `Collect ${fmtMoney(checkoutTarget.currentFee ?? checkoutTarget.fee)} & release`}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setRejectOpen(true)}
                    className="h-11 border-rose-200 text-rose-500 hover:bg-rose-50 rounded-xl font-bold"
                  >
                    Reject
                  </Button>
                </div>
              </>
            )}
          </motion.div>
        </div>
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
      <AnimatePresence>
        {barrierState !== 'closed' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-8 text-center shadow-2xl space-y-6"
            >
              {/* Barrier Arm Animation Container */}
              <div className="relative h-32 w-full flex items-center justify-center overflow-hidden bg-slate-950/50 rounded-2xl border border-slate-800">
                {/* Gate Post */}
                <div className="absolute bottom-4 left-1/4 w-6 h-16 bg-slate-700 rounded-md border border-slate-600 z-10 flex flex-col justify-around items-center py-2">
                  <div className={`w-3.5 h-3.5 rounded-full ${barrierState === 'open' ? 'bg-emerald-500 shadow-[0_0_12px_#10b981]' : 'bg-amber-500 shadow-[0_0_12px_#f59e0b]'} transition-all duration-300`} />
                  <div className="w-1.5 h-6 bg-slate-900 rounded" />
                </div>
                
                {/* Barrier Arm (Pole) */}
                <motion.div
                  style={{ originX: 0.1, originY: 0.5 }}
                  animate={{
                    rotate: barrierState === 'open' ? -90 : barrierState === 'opening' ? -45 : barrierState === 'closing' ? -45 : 0
                  }}
                  transition={{ duration: 0.8, ease: "easeInOut" }}
                  className="absolute bottom-10 left-1/4 w-40 h-3 bg-gradient-to-r from-slate-200 via-rose-500 to-rose-600 rounded-full border border-slate-900 z-20 origin-left flex justify-around animate-pulse"
                >
                  <div className="w-4 h-full bg-white" />
                  <div className="w-4 h-full bg-white" />
                  <div className="w-4 h-full bg-white" />
                </motion.div>

                {/* Ground Line */}
                <div className="absolute bottom-4 left-0 right-0 h-1 bg-slate-800" />
              </div>

              {/* Status Message */}
              <div className="space-y-2">
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider ${
                  barrierState === 'open' 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                    : barrierState === 'opening' 
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}>
                  {barrierState === 'opening' && 'Gate opening...'}
                  {barrierState === 'open' && 'Barrier Raised - Pass through'}
                  {barrierState === 'closing' && 'Closing barrier...'}
                </span>
                
                <h3 className="text-lg font-black text-slate-100 uppercase tracking-wide">
                  {barrierState === 'opening' && 'Releasing Vehicle...'}
                  {barrierState === 'open' && 'Gate barrier open'}
                  {barrierState === 'closing' && 'Security Gate warning'}
                </h3>
                
                <p className="text-xs text-slate-400 px-4">
                  {barrierState === 'opening' && 'Triggering IoT controller. Gate is opening.'}
                  {barrierState === 'open' && 'Please drive the vehicle forward slowly. The barrier will automatically close.'}
                  {barrierState === 'closing' && 'Safety check complete. Closing gate arm.'}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
