import type { ParkingSession } from '@/services/staff/staffApi';
import { fmtMoney, fmtDuration } from './staffParkedFormat';
import { motion } from 'framer-motion';

import { LicensePlate } from '@/components/common/LicensePlate';

interface ParkedSessionCardProps {
  session: ParkingSession;
  canCheckout: boolean;
  onCheckout: (session: ParkingSession) => void;
}

export function ParkedSessionCard({ session: s, canCheckout, onCheckout }: ParkedSessionCardProps) {
  const floor = s.slot?.floor?.name || s.slot?.floor?.code || '—';
  const slotCode = s.slot?.code || '—';
  const isMember = Boolean(s.isMember ?? s.user) || s.isLongTerm;
  const hasSlot = Boolean(s.slot);

  return (
    <motion.button
      type="button"
      whileHover={canCheckout ? { y: -4, scale: 1.02 } : {}}
      onClick={canCheckout ? () => onCheckout(s) : undefined}
      title={canCheckout ? 'Tap to collect payment & release' : 'Only exit-gate staff can release vehicles'}
      className={`block w-full rounded-2xl p-4 text-left transition-all duration-200 ${
        canCheckout
          ? 'cursor-pointer hover:border-sky-300 hover:shadow-md'
          : 'cursor-default'
      }`}
      style={{
        background: 'rgba(255,255,255,0.7)',
        border: '1px solid rgba(14,165,233,0.1)',
        boxShadow: '0 2px 10px rgba(14,165,233,0.03), inset 0 1px 0 rgba(255,255,255,0.9)',
        backdropFilter: 'blur(10px)',
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <LicensePlate plateNumber={s.plateNumber} />
          {s.vehicleBrand && (
            <span className="shrink-0 rounded-lg bg-sky-50 border border-sky-100 px-2 py-0.5 text-[9px] font-bold text-sky-600">
              {s.vehicleBrand}
            </span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {s.isLongTerm && (
            <span className="rounded-lg bg-orange-50 border border-orange-100 px-2 py-0.5 text-[9px] font-black uppercase text-orange-500">
              Package
            </span>
          )}
          {isMember ? (
            <span className="rounded-lg bg-emerald-50 border border-emerald-100 px-2 py-0.5 text-[9px] font-black uppercase text-emerald-600">
              Member
            </span>
          ) : (
            <span className="rounded-lg bg-amber-50 border border-amber-100 px-2 py-0.5 text-[9px] font-black uppercase text-amber-600">
              Guest
            </span>
          )}
        </div>
      </div>

      {isMember && s.user?.fullName && (
        <p className="mt-2 text-[10px] font-semibold text-slate-500 truncate">
          👤 {s.user.fullName} ({s.user.email})
        </p>
      )}

      {/* Snapshot section */}
      {(s.plateImage || s.portraitImage) && (
        <div className="mt-3 flex gap-2">
          {s.plateImage && (
            <div className="h-10 w-14 rounded-lg overflow-hidden border border-sky-100 bg-slate-50">
              <img src={s.plateImage} alt="Plate" className="h-full w-full object-cover" />
            </div>
          )}
          {s.portraitImage && (
            <div className="h-10 w-14 rounded-lg overflow-hidden border border-sky-100 bg-slate-50">
              <img src={s.portraitImage} alt="Portrait" className="h-full w-full object-cover" />
            </div>
          )}
        </div>
      )}

      <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-sky-50 pt-3 text-xs">
        <div>
          <span className="text-[9px] font-bold uppercase tracking-wide text-slate-400">Vehicle type</span>
          <p className="font-bold text-slate-700">{s.vehicleType?.name ?? '—'}</p>
        </div>
        <div>
          <span className="text-[9px] font-bold uppercase tracking-wide text-slate-400">Entry gate</span>
          <p className="font-bold text-slate-700">{s.entryGate?.code ?? '—'}</p>
        </div>
        <div>
          <span className="text-[9px] font-bold uppercase tracking-wide text-slate-400">Floor · Slot</span>
          <p className="font-bold text-slate-700">{floor} · {slotCode}</p>
        </div>
        <div>
          <span className="text-[9px] font-bold uppercase tracking-wide text-slate-400">Slot status</span>
          <p className={`font-bold ${hasSlot ? 'text-emerald-500' : 'text-amber-500'}`}>
            {hasSlot ? 'Assigned' : 'No slot assigned'}
          </p>
        </div>
        <div>
          <span className="text-[9px] font-bold uppercase tracking-wide text-slate-400">Entry time</span>
          <p className="font-bold text-slate-700">
            {s.entryTime
              ? `${new Date(s.entryTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} · ${new Date(s.entryTime).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}`
              : '—'}
          </p>
        </div>
        <div>
          <span className="text-[9px] font-bold uppercase tracking-wide text-slate-400">Parking duration</span>
          <p className="font-extrabold text-sky-600">{fmtDuration(s.entryTime, s.exitTime)}</p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-sky-50 pt-2.5">
        <span className="text-[9px] font-bold uppercase tracking-wide text-slate-400">
          {s.isLongTerm ? 'Overage fee' : 'Estimated fee'}
        </span>
        <span className="text-sm font-black text-sky-600">
          {(s.currentFee ?? s.fee ?? 0) > 0
            ? fmtMoney(s.currentFee ?? s.fee)
            : s.isLongTerm ? 'Free' : fmtMoney(0)}
        </span>
      </div>

      {canCheckout && (
        <p className="mt-2.5 text-center text-[10px] font-extrabold text-emerald-600 bg-emerald-50 rounded-lg py-1 border border-emerald-100 animate-pulse">
          Tap to collect payment &amp; release →
        </p>
      )}
    </motion.button>
  );
}
