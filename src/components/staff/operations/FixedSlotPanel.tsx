import { AlertCircle } from 'lucide-react';

export interface FixedPackageSlot {
  code: string;
  floor?: { name?: string; code?: string } | null;
}

/**
 * The customer reserved a specific bay when buying the long-term package, so the
 * backend assigns it at check-in. Staff only confirms it — there is nothing to
 * pick, which is why this replaces the zone/slot selector rather than sitting
 * inside it.
 */
export function FixedSlotPanel({ slot, packageName }: { slot: FixedPackageSlot; packageName?: string | null }) {
  const floor = slot.floor?.name || slot.floor?.code;

  return (
    <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 space-y-2.5">
      <p className="flex items-center gap-1.5 text-[11px] font-bold text-amber-800">
        <AlertCircle size={13} />
        Fixed slot reserved with the package{packageName ? ` "${packageName}"` : ''} — no selection needed.
      </p>
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] text-amber-700">
          The customer picked this bay when subscribing; it is held for them until entry.
        </p>
        <span className="inline-flex shrink-0 items-center rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-black uppercase text-white shadow-sm">
          {slot.code}
          {floor ? ` · Floor ${floor}` : ''}
        </span>
      </div>
    </div>
  );
}
