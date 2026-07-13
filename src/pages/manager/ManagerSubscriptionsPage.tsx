import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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

const fmtDate = (v?: string) => (v ? new Date(v).toLocaleDateString('vi-VN') : '—');
const fmtMoney = (n?: number | null) => (n != null ? `${n.toLocaleString('vi-VN')} ₫` : '—');

export function ManagerSubscriptionsPage() {
  const { buildingId } = useBuildingContext();
  const [items, setItems] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const [cancelTarget, setCancelTarget] = useState<Subscription | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  // % hoàn tiền theo ReservationPolicy của tòa (BE dùng chung cho hủy gói) — mặc định 80.
  const [refundPercent, setRefundPercent] = useState(80);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await managerApi.packages.subscriptions(buildingId, status ? { status } : undefined);
      setItems(res.data.items ?? []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Load failed');
    } finally {
      setLoading(false);
    }
  }, [buildingId, status]);

  useEffect(() => {
    managerApi.reservationPolicy
      .get(buildingId)
      .then((res) => {
        const p = res.data.item?.refundPercent;
        if (typeof p === 'number') setRefundPercent(Math.min(Math.max(p, 0), 100));
      })
      .catch(() => {});
  }, [buildingId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    setCancelError(null);
    try {
      await managerApi.packages.cancelSubscription(buildingId, cancelTarget._id, cancelReason || undefined);
      setCancelTarget(null);
      setCancelReason('');
      await refresh();
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : 'Failed to cancel package');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle>Customer long-term packages</CardTitle>
          <CustomSelect
            value={status}
            onChange={setStatus}
            options={STATUS_FILTERS.map((s) => ({
              value: s.value,
              label: s.label,
            }))}
            className="w-48"
          />
        </CardHeader>
        <CardContent>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No packages yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                    <th className="py-2 pr-3">Customer</th>
                    <th className="py-2 pr-3">Plate</th>
                    <th className="py-2 pr-3">Package</th>
                    <th className="py-2 pr-3">Validity</th>
                    <th className="py-2 pr-3">Status</th>
                    <th className="py-2 pr-3">Package fee / Refund</th>
                    <th className="py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((s) => {
                    // Ưu tiên snapshot lưu lúc hủy; gói cũ chưa có snapshot thì tính theo policy hiện tại.
                    const pct = s.refundPercent ?? refundPercent;
                    const refund =
                      s.refundAmount ??
                      (s.package?.price != null ? Math.round((s.package.price * pct) / 100) : null);
                    const deduction =
                      s.package?.price != null && refund != null ? s.package.price - refund : null;
                    return (
                      <tr key={s._id} className="border-b last:border-0">
                        <td className="py-2 pr-3">
                          <div className="font-medium">{s.user?.fullName ?? '—'}</div>
                          <div className="text-xs text-muted-foreground">{s.user?.email}</div>
                        </td>
                        <td className="py-2 pr-3 font-mono">{s.plateNumber}</td>
                        <td className="py-2 pr-3">{s.package?.name}</td>
                        <td className="py-2 pr-3 whitespace-nowrap">{fmtDate(s.startDate)} → {fmtDate(s.endDate)}</td>
                        <td className="py-2 pr-3"><StatusBadge status={s.status} /></td>
                        <td className="py-2 pr-3">
                          {s.status === 'cancelled' ? (
                            <div className="text-xs">
                              <span className="text-muted-foreground">Original price: </span>
                              <span className="font-medium">{fmtMoney(s.package?.price)}</span>
                              <br />
                              <span className="text-rose-400">{100 - pct}% deduction: </span>
                              <span className="text-rose-400 font-medium">
                                {deduction != null ? fmtMoney(deduction) : '—'}
                              </span>
                              <br />
                              <span className="text-emerald-400">Refunded ({pct}%): </span>
                              <span className="text-emerald-400 font-medium">{refund != null ? fmtMoney(refund) : '—'}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-xs">{fmtMoney(s.package?.price)}</span>
                          )}
                        </td>
                        <td className="py-2">
                          {(s.status === 'active' || s.status === 'pending') && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setCancelTarget(s)}
                              className="text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 text-xs"
                            >
                              Cancel package
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-rose-400">Cancel long-term package</p>
                <h3 className="text-base font-semibold text-foreground">{cancelTarget.user?.fullName}</h3>
                <p className="text-xs text-muted-foreground">{cancelTarget.package?.name} · {cancelTarget.plateNumber}</p>
              </div>
              <button onClick={() => { setCancelTarget(null); setCancelReason(''); setCancelError(null); }} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>

            <div className="rounded-xl border border-amber-500/25 bg-amber-500/8 px-4 py-3 text-sm text-amber-200 mb-4">
              <p className="font-semibold mb-1">Refund policy for manager cancellation (per building reservation policy):</p>
              <ul className="text-xs space-y-0.5 list-disc list-inside">
                <li>Deduct <strong>{100 - refundPercent}%</strong> processing fee</li>
                <li>Refund <strong>{refundPercent}%</strong> = {cancelTarget.package?.price != null ? fmtMoney(Math.round((cancelTarget.package.price * refundPercent) / 100)) : '—'} to the user wallet</li>
              </ul>
            </div>

            <div className="mb-4">
              <label className="text-xs uppercase tracking-wider text-muted-foreground block mb-1">Cancellation reason (optional)</label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={2}
                placeholder="Note the cancellation reason..."
                className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-rose-500/50"
              />
            </div>

            {cancelError && <p className="mb-3 text-xs text-rose-400">{cancelError}</p>}

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="secondary"
                onClick={() => { setCancelTarget(null); setCancelReason(''); setCancelError(null); }}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCancel}
                disabled={cancelling}
                className="bg-rose-500 text-white hover:bg-rose-400 text-xs disabled:opacity-60"
              >
                {cancelling ? 'Processing...' : 'Confirm cancellation'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
