import { useEffect, useState } from 'react';
import { staffApi, extractShifts, type MyShift } from '@/services/staff/staffApi';

type Gate = NonNullable<MyShift['gate']>;

function sameLocalDay(iso: string, now: Date): boolean {
  const d = new Date(iso);
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

/**
 * Resolves the gate(s) the current staff is assigned to for today's shift(s).
 * Falls back to the most recent shift's gate when there is no shift dated today,
 * so the dashboard/nav still reflect where the staff works.
 *
 * Gate direction is used as an operational hint. Legacy deployments without
 * gate assignments remain usable until a manager finishes gate configuration.
 */
export function useAssignedGates() {
  const [gates, setGates] = useState<Gate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    staffApi
      .myShifts()
      .then((res) => {
        if (cancelled) return;
        const shifts = extractShifts(res as Parameters<typeof extractShifts>[0]);
        const now = new Date();
        const today = shifts.filter((s) => sameLocalDay(s.workDate, now));
        const pick = today.length > 0 ? today : shifts.slice(0, 1);
        const map = new Map<string, Gate>();
        pick.forEach((s) => {
          if (s.gate?._id) map.set(s.gate._id, s.gate);
        });
        setGates(Array.from(map.values()));
      })
      .catch(() => setGates([]))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const hasIn = gates.some((g) => g.direction === 'in' || g.direction === 'both');
  const hasOut = gates.some((g) => g.direction === 'out' || g.direction === 'both');
  const unassigned = gates.length === 0;

  return {
    gates,
    loading,
    hasIn,
    hasOut,
    unassigned,
    showCheckIn: hasIn || unassigned,
    showCheckOut: hasOut || unassigned,
  };
}
