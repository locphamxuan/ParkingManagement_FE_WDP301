import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CustomSelect } from '@/components/ui/select';
import { StatusBadge } from '@/components/common/StatusBadge';
import { useBuildingContext } from '@/hooks/useBuildingContext';
import { managerApi, type Subscription } from '@/services/manager/managerApi';

const STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'expired', label: 'Expired' },
  { value: 'cancelled', label: 'Cancelled' },
] as const;

const fmtDate = (v?: string) => (v ? new Date(v).toLocaleDateString('en-GB') : '—');

const slotLabel = (slot: Subscription['slot']): { code: string; floor: string } | null => {
  if (!slot || typeof slot === 'string') return null;
  const floor =
    slot.floor && typeof slot.floor === 'object' ? slot.floor.name || slot.floor.code || '' : '';
  return { code: slot.code, floor };
};


export function ManagerSubscriptionsPage() {
  const { buildingId } = useBuildingContext();
  const [items, setItems] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await managerApi.packages.subscriptions(buildingId, status ? { status } : undefined);
      setItems(res.data.items ?? []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load subscriptions.');
    } finally {
      setLoading(false);
    }
  }, [buildingId, status]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <CardTitle>Customer Long-Term Subscriptions</CardTitle>
        <CustomSelect
          value={status}
          onChange={setStatus}
          options={STATUS_FILTERS.map((s) => ({ value: s.value, label: s.label }))}
          className="w-48"
        />
      </CardHeader>
      <CardContent>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No subscriptions yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                  <th className="py-2 pr-3">Customer</th>
                  <th className="py-2 pr-3">Plate</th>
                  <th className="py-2 pr-3">Package</th>
                  <th className="py-2 pr-3">Validity</th>
                  <th className="py-2 pr-3">Fixed slot</th>
                  <th className="py-2 pr-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map((s) => (
                  <tr key={s._id} className="border-b last:border-0">
                    <td className="py-2 pr-3">
                      <div className="font-medium">{s.user?.fullName ?? '—'}</div>
                      <div className="text-xs text-muted-foreground">{s.user?.email}</div>
                    </td>
                    <td className="py-2 pr-3 font-mono">{s.plateNumber}</td>
                    <td className="py-2 pr-3">{s.package?.name}</td>
                    <td className="py-2 pr-3 whitespace-nowrap">{fmtDate(s.startDate)} → {fmtDate(s.endDate)}</td>
                    <td className="py-2 pr-3">
                      {(() => {
                        const sl = slotLabel(s.slot);
                        if (!sl) return <span className="text-xs text-muted-foreground">None</span>;
                        return (
                          <div className="text-xs">
                            <span className="font-mono font-semibold text-foreground">{sl.code}</span>
                            {sl.floor ? <span className="text-muted-foreground"> · {sl.floor}</span> : null}
                            {s.slotReleased ? (
                              <span className="text-rose-500"> (released)</span>
                            ) : (
                              <span className="text-emerald-600"> · held</span>
                            )}
                          </div>
                        );
                      })()}
                    </td>
                    <td className="py-2 pr-3"><StatusBadge status={s.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
