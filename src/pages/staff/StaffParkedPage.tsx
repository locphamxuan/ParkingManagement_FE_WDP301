import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCcw, CheckCircle2, Car, ScanLine, QrCode, UserSquare, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
      <div className="aspect-[4/3] overflow-hidden rounded-lg border border-border bg-muted/40 flex items-center justify-center">
        {src ? (
          <img src={src} alt={label} className="h-full w-full object-cover" />
        ) : (
          <span className="text-[10px] text-muted-foreground/60">None</span>
        )}
      </div>
      <p className="mt-0.5 text-center text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}

/**
 * Một component, 2 view:
 *  - view="scanner" (/staff/checkout · tab "Check-out xe ra"): CHỈ camera quét
 *    biển số / QR để tìm xe rồi mở modal thu phí. Không hiện danh sách.
 *  - view="list" (/staff/parked · tab "Xe đang đỗ"): danh sách xe đang đỗ; nhân
 *    viên cổng RA bấm vào xe để checkout, nhân viên khác chỉ xem.
 */
export function StaffParkedPage({ view = 'list' }: { view?: 'scanner' | 'list' }) {
  const { buildingId, building } = useBuildingContext();
  const { user } = useAuth();
  const { showCheckOut } = useAssignedGates();
  // View scanner (tab Check-out) luôn cho thao tác; view list (tab Xe đang đỗ) chỉ
  // cho checkout nếu là nhân viên cổng ra, ngược lại chỉ xem.
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

  // Scanner tìm xe (tuần tự — chỉ 1 camera). Wizard checkout: 1 chụp chân dung ra · 2 thu phí.
  const [identifyMode, setIdentifyMode] = useState<'plate' | 'qr'>('plate');
  const [coStep, setCoStep] = useState<1 | 2>(1);

  const [bankTransfer, setBankTransfer] = useState<BankTransferState | null>(null);
  const [verifying, setVerifying] = useState(false);

  // Frames captured at CHECK-OUT time, to compare against the images stored at
  // check-in (plate + portrait) so staff can verify it's the right vehicle/person.
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
  }, []);

  useEffect(() => {
    refreshSessions();
    const timer = setInterval(refreshSessions, 30_000);
    return () => clearInterval(timer);
  }, [refreshSessions, reloadTick]);

  const totalFee = useMemo(
    () => sessions.reduce((sum, s) => sum + (s.currentFee ?? s.fee ?? 0), 0),
    [sessions],
  );

  // Mở modal checkout cho 1 session. Danh sách (listActive) ĐÃ lược ảnh base64 cho
  // nhẹ payload → fetch chi tiết để lấy ảnh LÚC VÀO (biển số + chân dung) đối chiếu.
  const openCheckout = useCallback(async (session: ParkingSession, exitPlateImage: string | null = null) => {
    setOpMessage(null);
    setCheckoutTarget(session);
    setPaymentMethod('cash');
    setCoStep(1);
    // Giữ ảnh biển số LÚC RA nếu đã quét được (đường quét); card-click thì null.
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
      /* ảnh đối chiếu là phụ trợ — bỏ qua nếu lỗi tải chi tiết */
    }
  }, []);

  // Identify the active session for a plate and open the checkout/payment modal.
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

  // Camera biển số: lưu khung ảnh LÚC RA + tìm xe để mở thu phí.
  const handlePlateDetected = ({ plateNumber, plateImage }: PlateScanResult) => {
    openCheckoutByPlate(plateNumber, plateImage);
  };

  // Camera 3 — QR (token biển số PLT- / ID tài khoản). Reservation/khách chỉ cần
  // quét QR phương tiện là đủ để nhận diện và cho xe ra. Ảnh chân dung do camera
  // chân dung (Camera 1) chụp riêng lúc cho xe ra.
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
    const dueFee = target.currentFee ?? target.fee ?? 0;
    try {
      // Chỉ tạo QR chuyển khoản khi thực sự có tiền phải thu (gói trong hạn mức = 0đ).
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
      // Ảnh chân dung lúc ra: ưu tiên ảnh đã chụp, nếu chưa thì chụp 1 khung từ camera chân dung.
      const exitPortrait = capturedPortraitImage ?? portraitCamRef.current?.capture() ?? null;
      await staffApi.checkOut(target._id, {
        ...(target.isReservation ? {} : { paymentMethod: dueFee > 0 ? paymentMethod : 'cash' }),
        exitPlateImage: capturedPlateImage,
        exitPortraitImage: exitPortrait,
      });
      setOpMessage({
        type: 'ok',
        text: target.isReservation
          ? `Vehicle ${target.plateNumber} released — wallet auto-charged.`
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
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="space-y-5">
      {/* Header — tiêu đề + 2 chỉ số inline + làm mới */}
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-primary">
            {view === 'scanner' ? 'Exit gate · Scan vehicle' : canCheckout ? 'Exit gate' : 'Lot monitoring'}
          </p>
          <h2 className="mt-0.5 text-xl font-bold text-foreground">
            {view === 'scanner' ? 'Vehicle check-out' : 'Parked vehicles'}
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {building ? `${building.code} · ${building.name}` : 'No building selected'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="rounded-xl border border-border bg-background px-4 py-2 text-center min-w-[88px]">
            <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Parked</p>
            <p className="text-lg font-bold text-foreground">{loading ? '–' : sessions.length}</p>
          </div>
          <div className="rounded-xl border border-border bg-background px-4 py-2 text-center">
            <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Total estimated fee</p>
            <p className="text-lg font-bold text-primary">{loading ? '–' : fmtMoney(totalFee)}</p>
          </div>
          <Button variant="secondary" onClick={refreshSessions} className="gap-2 h-11">
            <RefreshCcw size={14} /> Refresh
          </Button>
        </div>
      </div>

      {/* ══ VIEW "scanner" — tab Check-out xe ra: CHỈ camera quét ══ */}
      {view === 'scanner' && (
        <div className="mx-auto w-full max-w-xl space-y-4">
          {!canCheckout ? (
            <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 px-4 py-3 text-sm text-amber-300">
              This account is not exit-gate staff — cannot release vehicles.
            </div>
          ) : !checkoutTarget && !bankTransfer && !rejectOpen ? (
            <section className="space-y-3 rounded-2xl border border-border bg-card p-5">
              <div className="flex gap-2 p-1 rounded-lg bg-muted border border-border">
                <button
                  type="button"
                  onClick={() => setIdentifyMode('plate')}
                  className={`flex-1 flex items-center justify-center gap-1.5 h-9 rounded-md text-xs font-bold transition-all ${identifyMode === 'plate' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <ScanLine size={13} /> Scan plate (AI)
                </button>
                <button
                  type="button"
                  onClick={() => setIdentifyMode('qr')}
                  className={`flex-1 flex items-center justify-center gap-1.5 h-9 rounded-md text-xs font-bold transition-all ${identifyMode === 'qr' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <QrCode size={13} /> Scan QR
                </button>
              </div>
              {identifyMode === 'plate' ? (
                <LivePlateCamera onDetected={handlePlateDetected} busy={loading} />
              ) : (
                <LiveQRCamera onResult={handleResolveIdQr} />
              )}
              <p className="text-center text-[11px] text-muted-foreground">
                Scan the vehicle plate / QR to find it and open fee collection. See all vehicles in the “Parked vehicles” tab.
              </p>
            </section>
          ) : null}
          {opMessage && (
            <div className={`rounded-xl border p-4 text-sm ${opMessage.type === 'ok' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-rose-500/30 bg-rose-500/10 text-rose-400'}`}>
              {opMessage.text}
            </div>
          )}
        </div>
      )}

      {/* ══ VIEW "list" — tab Xe đang đỗ: danh sách (bấm để checkout) ══ */}
      {view === 'list' && (
        <div className="space-y-4">
          {!canCheckout && (
            <div className="rounded-xl border border-sky-500/25 bg-sky-500/5 px-4 py-3 text-sm text-sky-300">
              <strong>View-only</strong> mode. Vehicle exit &amp; fee collection are handled by exit-gate staff.
            </div>
          )}

          {opMessage && (
            <div className={`rounded-xl border p-4 text-sm ${opMessage.type === 'ok' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-rose-500/30 bg-rose-500/10 text-rose-400'}`}>
              {opMessage.text}
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Parked vehicles</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : error ? (
                <p className="text-sm text-rose-400">{error}</p>
              ) : sessions.length === 0 ? (
                <div className="py-10 text-center">
                  <Car size={28} className="mx-auto mb-2 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">No parked vehicles.</p>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
              {sessions.map((s) => (
                <ParkedSessionCard key={s._id} session={s} canCheckout={canCheckout} onCheckout={openCheckout} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
        </div>
      )}

      {/* Thanh toán & cho xe ra */}
      {checkoutTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-primary">Payment · Exit</p>
                <h3 className="text-xl font-semibold text-foreground font-mono">{checkoutTarget.plateNumber}</h3>
              </div>
              <button onClick={() => { setCheckoutTarget(null); setPaymentMethod('cash'); setCoStep(1); setCapturedPlateImage(null); setCapturedPortraitImage(null); }} className="text-muted-foreground hover:text-foreground transition">✕</button>
            </div>

            {/* Step indicator */}
            <div className="mb-4 flex items-center gap-2 text-[11px] font-bold">
              {[{ n: 1, label: 'Capture exit portrait' }, { n: 2, label: 'Compare & collect fee' }].map((s, i) => (
                <div key={s.n} className="flex items-center gap-2">
                  <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] ${coStep >= s.n ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>{s.n}</span>
                  <span className={coStep === s.n ? 'text-foreground' : 'text-muted-foreground'}>{s.label}</span>
                  {i < 1 && <span className="mx-1 h-px w-5 bg-border" />}
                </div>
              ))}
            </div>

            {/* ── BƯỚC 1 — Chụp chân dung lúc ra ── */}
            {coStep === 1 && (
              <div className="space-y-4">
                <LivePortraitCamera ref={portraitCamRef} />
                {capturedPortraitImage && (
                  <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2 text-xs text-emerald-400">
                    <UserSquare size={14} /> Exit portrait captured — you can retake.
                  </div>
                )}
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setCoStep(2)} className="h-11 gap-1">
                    Skip
                  </Button>
                  <Button
                    onClick={() => {
                      const img = portraitCamRef.current?.capture() ?? null;
                      if (!img) { setOpMessage({ type: 'err', text: 'Portrait camera not ready. Please try again.' }); return; }
                      setCapturedPortraitImage(img);
                      setOpMessage(null);
                      setCoStep(2);
                    }}
                    className="flex-1 h-11 gap-2 bg-gradient-to-r from-orange-500 to-amber-400 text-slate-950 hover:brightness-110"
                  >
                    <UserSquare size={16} /> {capturedPortraitImage ? 'Retake & continue' : 'Capture portrait & continue'} <ArrowRight size={16} />
                  </Button>
                </div>
              </div>
            )}

            {/* ── BƯỚC 2 — Đối chiếu & thu phí ── */}
            {coStep === 2 && (
            <>
            {/* Đối chiếu ảnh: lúc vào (đã lưu) vs lúc ra (vừa quét) */}
            <div className="mb-4 rounded-xl border border-amber-500/25 bg-amber-500/5 p-3">
              <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-amber-400">
                Compare plate &amp; portrait photos
              </p>
              <div className="grid grid-cols-2 gap-3">
                {/* Cột: lúc vào */}
                <div className="space-y-1.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">On entry (saved)</p>
                  <CompareImg src={checkoutTarget.plateImage} label="Plate" />
                  <CompareImg src={checkoutTarget.portraitImage} label="Portrait" />
                </div>
                {/* Cột: lúc ra */}
                <div className="space-y-1.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">On exit (just scanned)</p>
                  <CompareImg src={capturedPlateImage} label="Plate" />
                  <CompareImg src={capturedPortraitImage} label="Portrait" />
                </div>
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">
                Verify whether they match. If not, tap <strong className="text-rose-400">Reject</strong>.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card/50 p-4 space-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Guest</span><span className="font-medium text-foreground">{(checkoutTarget.isMember ?? checkoutTarget.user) ? (checkoutTarget.user?.fullName || 'Member') : 'Walk-in guest'}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Vehicle type</span><span className="font-medium text-foreground">{checkoutTarget.vehicleType?.name ?? '—'}{checkoutTarget.vehicleBrand ? ` · ${checkoutTarget.vehicleBrand}` : ''}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Entry time</span><span className="font-medium text-foreground">{fmtTime(checkoutTarget.entryTime)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Parking duration</span><span className="font-medium text-foreground">{fmtDuration(checkoutTarget.entryTime)}</span></div>
              <div className="flex justify-between border-t border-border/60 pt-1.5"><span className="text-muted-foreground">Check-in staff</span><span className="font-medium text-foreground">{checkoutTarget.staff?.fullName ?? '—'}{checkoutTarget.entryGate?.code ? ` · gate ${checkoutTarget.entryGate.code}` : ''}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Check-out staff</span><span className="font-medium text-emerald-400">{user?.fullName || user?.email || 'You'}</span></div>
            </div>

            {checkoutTarget.isLongTerm && (
              <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
                Long-term package vehicle{checkoutTarget.maxHoursPerDay ? ` · free ${checkoutTarget.maxHoursPerDay}h/day` : ''}.{' '}
                {(checkoutTarget.overageHours ?? 0) > 0
                  ? `Overstay ${checkoutTarget.overageHours?.toFixed(1)}h → overage charged at regular rate.`
                  : 'Within limit → free.'}
              </div>
            )}

            {checkoutTarget.isReservation ? (
              <div className="mt-4 rounded-xl border border-sky-500/30 bg-sky-500/10 p-4 text-sm text-sky-300">
                Prior reservation — the system will auto-charge the remaining amount (<strong>{fmtMoney(checkoutTarget.reservationRemainingFee ?? 0)}</strong>) to the wallet after release.
              </div>
            ) : (
              <>
                <div className="mt-4 rounded-xl border border-primary/30 bg-primary/10 p-4 flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">Amount due</span>
                  <span className="font-mono text-2xl font-black text-primary">
                    {(checkoutTarget.currentFee ?? checkoutTarget.fee ?? 0) > 0
                      ? fmtMoney(checkoutTarget.currentFee ?? checkoutTarget.fee)
                      : 'Free'}
                  </span>
                </div>

                {(checkoutTarget.currentFee ?? checkoutTarget.fee ?? 0) > 0 && (
                  <>
                    <p className="mt-4 mb-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">Payment method</p>
                    <div className="grid gap-2 sm:grid-cols-3">
                      {[{ value: 'cash', label: 'Cash' }, { value: 'bank_transfer', label: 'Bank transfer' }, { value: 'wallet', label: 'Wallet' }].map((m) => (
                        <button
                          key={m.value}
                          type="button"
                          onClick={() => setPaymentMethod(m.value as PaymentKind)}
                          className={`rounded-xl border px-3 py-2.5 text-center text-sm font-medium transition ${paymentMethod === m.value ? 'border-primary/40 bg-primary/10 text-foreground' : 'border-border bg-card text-muted-foreground hover:border-primary/20'}`}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}

            <div className="mt-5 flex gap-2">
              <Button type="button" variant="outline" onClick={() => setCoStep(1)} className="h-11 gap-1">
                <ArrowLeft size={16} /> Back
              </Button>
              <Button onClick={onCheckOut} disabled={loading} className="flex-1 h-11 gap-2 bg-gradient-to-r from-orange-500 to-amber-400 text-slate-950 hover:brightness-110 disabled:opacity-60">
                <CheckCircle2 size={16} /> {checkoutTarget.isReservation
                  ? 'Release (auto wallet charge)'
                  : (checkoutTarget.currentFee ?? checkoutTarget.fee ?? 0) <= 0
                    ? 'Release (free)'
                    : paymentMethod === 'bank_transfer' ? 'Create payment QR' : `Collect ${fmtMoney(checkoutTarget.currentFee ?? checkoutTarget.fee)} & release`}
              </Button>
              <Button type="button" variant="outline" onClick={() => setRejectOpen(true)} className="h-11 border-rose-500/40 text-rose-400 hover:bg-rose-500/10">
                Reject
              </Button>
            </div>
            </>
            )}
          </motion.div>
        </div>
      )}

      {/* Reject (xe ra) */}
      <ParkedRejectModal
        open={rejectOpen}
        reason={rejectReason}
        setReason={setRejectReason}
        onClose={() => { setRejectOpen(false); setRejectReason(''); }}
        onReject={onReject}
      />

      {/* Modal chuyển khoản ngân hàng */}
      <BankTransferModal
        bankTransfer={bankTransfer}
        verifying={verifying}
        onVerify={onVerifyBankTransfer}
        onClose={() => setBankTransfer(null)}
      />
    </motion.div>
  );
}
