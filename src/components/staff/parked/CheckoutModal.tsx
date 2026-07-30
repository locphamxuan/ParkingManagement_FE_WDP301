import { motion } from 'framer-motion';
import { CheckCircle2, UserSquare, ArrowLeft, ArrowRight, Wallet, Banknote, QrCode as QrIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LivePortraitCamera } from '@/components/staff/LivePortraitCamera';
import type { LiveCameraHandle } from '@/components/staff/LivePlateCamera';
import { LicensePlate } from '@/components/common/LicensePlate';
import { normalizePlate } from '@/utils/plate';
import { fmtTime, fmtMoney, fmtDuration, computeCheckoutFee } from '@/components/staff/parked/staffParkedFormat';
import type { ParkingSession } from '@/services/staff/staffApi';
import styles from '@/styles/modules/StaffParkedPage.module.css';

export type PaymentKind = 'cash' | 'bank_transfer' | 'wallet';

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

interface CheckoutModalProps {
  checkoutTarget: ParkingSession;
  userLabel: string;
  coStep: 1 | 2;
  setCoStep: (step: 1 | 2) => void;
  capturedPlateImage: string | null;
  capturedPortraitImage: string | null;
  setCapturedPortraitImage: (img: string | null) => void;
  portraitCamRef: React.RefObject<LiveCameraHandle>;
  /** Physical camera assigned to the portrait role, so the exit shot uses the same device as check-in. */
  portraitDeviceId?: string;
  paymentMethod: PaymentKind;
  setPaymentMethod: (m: PaymentKind) => void;
  pendingPenalties: Record<string, number>;
  loading: boolean;
  onClose: () => void;
  onCheckOut: () => void;
  onOpenReject: () => void;
  onCaptureError: (message: string) => void;
}

/** Checkout & release modal — step 1 exit portrait capture, step 2 compare photos + collect fee. */
export function CheckoutModal({
  checkoutTarget,
  userLabel,
  coStep,
  setCoStep,
  capturedPlateImage,
  capturedPortraitImage,
  setCapturedPortraitImage,
  portraitCamRef,
  portraitDeviceId,
  paymentMethod,
  setPaymentMethod,
  pendingPenalties,
  loading,
  onClose,
  onCheckOut,
  onOpenReject,
  onCaptureError,
}: CheckoutModalProps) {
  // Vehicles identified by QR (or picked from the parked list) never go through a
  // plate scan, so there is no exit plate photo to compare — verification is the
  // driver portrait alone and the plate row would only show an empty box.
  const comparePlates = Boolean(capturedPlateImage);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-3xl p-6 shadow-2xl relative border border-sky-100 ${styles.modal}`}
      >
        {/* Top border line */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-sky-400 via-sky-500 to-transparent" />

        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-sky-500">Payment &amp; Release</p>
            <LicensePlate plateNumber={checkoutTarget.plateNumber} className="mt-1.5" />
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close checkout dialog"
            className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={18} />
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
              <LivePortraitCamera ref={portraitCamRef} deviceId={portraitDeviceId} />
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
                  if (!img) { onCaptureError('Portrait camera not ready. Please try again.'); return; }
                  setCapturedPortraitImage(img);
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
                {comparePlates ? 'Compare plate & portrait photos' : 'Compare portrait photos'}
              </p>
              <div className="grid grid-cols-2 gap-4">
                {/* Entry Column */}
                <div className="space-y-2 border-r border-sky-100/50 pr-2">
                  <p className="text-[9px] font-black uppercase tracking-wide text-slate-400">On entry (saved)</p>
                  {comparePlates && <CompareImg src={checkoutTarget.plateImage} label="Plate" />}
                  <CompareImg src={checkoutTarget.portraitImage} label="Portrait" />
                </div>
                {/* Exit Column */}
                <div className="space-y-2 pl-2">
                  <p className="text-[9px] font-black uppercase tracking-wide text-slate-400">On exit (just scanned)</p>
                  {comparePlates && <CompareImg src={capturedPlateImage} label="Plate" />}
                  <CompareImg src={capturedPortraitImage} label="Portrait" />
                </div>
              </div>
              {!comparePlates && (
                <p className="mt-2.5 flex items-center justify-center gap-1.5 text-[10px] font-medium text-slate-500">
                  <QrIcon size={11} className="text-sky-500" /> Vehicle identified without a plate scan — verify the driver portrait only.
                </p>
              )}
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
              <div className="flex justify-between"><span className="text-slate-400 font-medium">Check-out operator</span><span className="font-bold text-sky-600">{userLabel}</span></div>
            </div>

            {checkoutTarget.isLongTerm && (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
                🅿️ Long-term package vehicle{checkoutTarget.maxHoursPerDay ? ` · free ${checkoutTarget.maxHoursPerDay}h/day` : ''}.{' '}
                {(checkoutTarget.overageHours ?? 0) > 0
                  ? `Overstay ${checkoutTarget.overageHours?.toFixed(1)}h → overage charged.`
                  : 'Within limit → Free.'}
              </div>
            )}

            {(() => {
                  const pendingPenalty = pendingPenalties[normalizePlate(checkoutTarget.plateNumber)] || 0;
                  const { isUnderGracePeriod, grandTotal } = computeCheckoutFee(checkoutTarget, pendingPenalty);

                  return (
                    <>
                      {pendingPenalty > 0 && (
                        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50/50 p-3.5 text-xs font-bold text-rose-700 flex items-center justify-between">
                          <span>⚠️ Manager-approved penalty fee for this plate</span>
                          <span>+ {fmtMoney(pendingPenalty)}</span>
                        </div>
                      )}

                      <div className="mt-4 rounded-2xl border border-sky-100 bg-sky-50/50 p-4 flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total due</span>
                          <span className="font-mono text-2xl font-black text-sky-600">
                            {grandTotal <= 0
                              ? 'Free (0 ₫)'
                              : fmtMoney(grandTotal)}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                          Need to fine a violation? Report it via Incidents — a manager approves the penalty fee.
                        </p>
                        {isUnderGracePeriod && pendingPenalty <= 0 && (
                          <p className="text-[10px] text-emerald-600 font-bold mt-0.5 flex items-center gap-1.5">
                            <CheckCircle2 size={11} className="text-emerald-500" /> Free parking under 10-minute Grace Period
                          </p>
                        )}
                      </div>

                      {grandTotal > 0 && (
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
                {(() => {
                  const total = (checkoutTarget.currentFee ?? checkoutTarget.fee ?? 0)
                    + (pendingPenalties[normalizePlate(checkoutTarget.plateNumber)] || 0);
                  if (total <= 0) return 'Release (Free)';
                  if (paymentMethod === 'bank_transfer') return 'Create payment QR';
                  return `Collect ${fmtMoney(total)} & release`;
                })()}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onOpenReject}
                className="h-11 border-rose-200 text-rose-500 hover:bg-rose-50 rounded-xl font-bold"
              >
                Reject
              </Button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
