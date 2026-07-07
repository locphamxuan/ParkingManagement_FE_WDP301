import type { ParkingSession } from '@/services/staff/staffApi';
import { fmtTime, fmtMoney, fmtDuration } from './staffParkedFormat';

interface ParkedSessionCardProps {
  session: ParkingSession;
  canCheckout: boolean;
  onCheckout: (session: ParkingSession) => void;
}

export function ParkedSessionCard({ session: s, canCheckout, onCheckout }: ParkedSessionCardProps) {
  const floor = s.slot?.floor?.name || s.slot?.floor?.code || '—';
  const slotCode = s.slot?.code || '—';
  const isMember = Boolean(s.isMember ?? s.user) || s.isLongTerm;
  return (
    <button
      type="button"
      onClick={canCheckout ? () => onCheckout(s) : undefined}
      title={canCheckout ? 'Tap to collect payment & release' : 'Only exit-gate staff can release vehicles'}
      className={`block w-full rounded-xl border border-border bg-card p-3.5 text-left transition ${canCheckout ? 'cursor-pointer hover:border-primary/40 hover:bg-primary/5' : 'cursor-default'}`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <p className="font-mono font-bold text-foreground truncate">{s.plateNumber}</p>
          {s.vehicleBrand && (
            <span className="shrink-0 rounded-full bg-sky-500/15 px-2 py-0.5 text-[10px] font-semibold text-sky-400">
              {s.vehicleBrand}
            </span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {s.isLongTerm && (
            <span className="rounded-full bg-orange-500/15 px-2 py-0.5 text-[9px] font-black uppercase text-orange-400">
              Package
            </span>
          )}
          {isMember ? (
            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[9px] font-black uppercase text-emerald-400">
              Member
            </span>
          ) : (
            <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[9px] font-black uppercase text-amber-400">
              Walk-in guest
            </span>
          )}
        </div>
      </div>
      {isMember && s.user?.fullName && (
        <p className="mt-0.5 text-[11px] text-muted-foreground truncate">{s.user.fullName}{s.user.email ? ` · ${s.user.email}` : ''}</p>
      )}
      {/* Check-in bởi nhân viên nào, qua cổng nào (cổng vào) */}
      <p className="mt-0.5 text-[11px] text-muted-foreground truncate">
        Check-in: {s.staff?.fullName ?? '—'}
        {s.entryGate?.code ? ` · gate ${s.entryGate.code}` : ''}
      </p>

      {/* Camera snapshots */}
      {(s.plateImage || s.portraitImage) && (
        <div className="mt-2 flex gap-2">
          {s.plateImage && (
            <img src={s.plateImage} alt="Plate" className="h-12 w-16 rounded border border-border object-cover" />
          )}
          {s.portraitImage && (
            <img src={s.portraitImage} alt="Portrait" className="h-12 w-16 rounded border border-border object-cover" />
          )}
        </div>
      )}

      <div className="mt-2.5 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
        <div>
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Vehicle type</span>
          <p className="font-medium text-foreground">{s.vehicleType?.name ?? '—'}</p>
        </div>
        <div>
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Entry gate</span>
          <p className="font-medium text-foreground">{s.entryGate?.code ?? '—'}</p>
        </div>
        <div>
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Floor</span>
          <p className="font-medium text-foreground">{floor}</p>
        </div>
        <div>
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Slot</span>
          <p className="font-medium text-foreground">{slotCode}</p>
        </div>
        <div>
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Entry time</span>
          <p className="font-medium text-foreground">{fmtTime(s.entryTime)}</p>
        </div>
        <div>
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Parking duration</span>
          <p className="font-medium text-primary">{fmtDuration(s.entryTime, s.exitTime)}</p>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
          {s.isLongTerm ? 'Overage fee' : s.isReservation ? 'Remaining due' : 'Estimated fee'}
        </span>
        <span className="font-bold text-primary">
          {s.isReservation
            ? fmtMoney(s.reservationRemainingFee ?? 0)
            : (s.currentFee ?? s.fee ?? 0) > 0
              ? fmtMoney(s.currentFee ?? s.fee)
              : s.isLongTerm ? 'Free' : fmtMoney(0)}
        </span>
      </div>
      {canCheckout && (
        <p className="mt-2 text-center text-[11px] font-semibold text-primary">Tap to collect payment & release →</p>
      )}
    </button>
  );
}
