import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import type { FreeSlot } from '@/services/staff/staffApi';

const USAGE_LABEL: Record<string, string> = {
  walk_in: 'Walk-in guest',
  registered: 'Registered user',
  subscriber: 'Long-term package',
  reserved: 'Reservation',
};

const zoneIdOf = (s: FreeSlot): string =>
  !s.zone ? '' : typeof s.zone === 'string' ? s.zone : s.zone._id;
const zoneCodeOf = (s: FreeSlot): string =>
  !s.zone || typeof s.zone === 'string' ? '' : s.zone.code;
const vtNameOf = (s: FreeSlot): string =>
  !s.vehicleType ? '' : typeof s.vehicleType === 'string' ? '' : s.vehicleType.name;

/**
 * After the camera auto-detects everything (plate, user/guest, vehicle kind), staff
 * ONLY picks Zone → Slot. The session's vehicle type is decided by the zone/slot
 * (configured by the manager), so any vehicle type is supported — no hardcoded
 * car/motorcycle.
 */
export function CheckInSlotPicker({
  slots,
  value,
  onChange,
  suggestedSlotId,
  intro,
}: {
  slots: FreeSlot[];
  value: string;
  onChange: (slotId: string) => void;
  suggestedSlotId?: string;
  intro?: ReactNode;
}) {
  // Các dãy (zone) suy ra từ danh sách slot trống, kèm nhãn loại xe + đối tượng.
  const zones = useMemo(() => {
    const seen = new Map<string, { id: string; label: string }>();
    for (const s of slots) {
      const id = zoneIdOf(s);
      if (seen.has(id)) continue;
      const code = zoneCodeOf(s) || (s.floor?.name || s.floor?.code || 'Zone');
      const vt = vtNameOf(s);
      const usage = s.usageType ? USAGE_LABEL[s.usageType] || s.usageType : '';
      const label = [code, vt, usage].filter(Boolean).join(' · ');
      seen.set(id, { id, label });
    }
    return Array.from(seen.values());
  }, [slots]);

  const [zoneId, setZoneId] = useState('');

  // Khi BE đổi gợi ý (đổi loại xe/đối tượng sau khi quét), chọn sẵn dãy của slot gợi ý.
  useEffect(() => {
    const sug = slots.find((s) => s._id === suggestedSlotId);
    setZoneId(sug ? zoneIdOf(sug) : '');
  }, [suggestedSlotId, slots]);

  const slotsForZone = useMemo(
    () => (zones.length >= 2 && zoneId ? slots.filter((s) => zoneIdOf(s) === zoneId) : slots),
    [slots, zoneId, zones]
  );

  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 space-y-2">
      {intro}
      {zones.length >= 2 && (
        <div>
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-amber-200/60">Zone:</p>
          <div className="flex flex-wrap gap-1.5">
            {zones.map((z) => (
              <button
                key={z.id}
                type="button"
                onClick={() => { setZoneId(z.id); onChange(''); }}
                className={`rounded-lg px-3 py-1 text-xs font-bold transition-all ${
                  zoneId === z.id
                    ? 'bg-amber-500 text-slate-950 shadow-[0_0_8px_rgba(245,158,11,0.3)]'
                    : 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
                }`}
              >
                {z.label}
              </button>
            ))}
          </div>
        </div>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={zones.length >= 2 && !zoneId}
        className="h-10 w-full rounded-lg border border-white/10 bg-slate-950 px-3 text-sm font-semibold text-white outline-none focus:border-amber-400/60 disabled:opacity-40"
      >
        <option value="">
          {zones.length >= 2 && !zoneId ? '-- Select a zone first --' : '-- Select a slot --'}
        </option>
        {slotsForZone.map((s) => (
          <option key={s._id} value={s._id}>
            {s.code}
            {zones.length < 2 && zoneCodeOf(s) ? ` · ${zoneCodeOf(s)}` : ''}
            {s._id === suggestedSlotId ? ' · (suggested)' : ''}
          </option>
        ))}
      </select>
      {slots.length === 0 && (
        <p className="text-[11px] text-rose-300 flex items-center gap-1">
          <AlertCircle size={12} /> No matching slots available.
        </p>
      )}
    </div>
  );
}
