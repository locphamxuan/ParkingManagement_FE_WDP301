import { useCallback, useEffect, useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CustomSelect } from '@/components/ui/select';
import { StatusBadge } from '@/components/common/StatusBadge';
import { useBuildingContext } from '@/hooks/useBuildingContext';
import { managerApi, type Subscription } from '@/services/manager/managerApi';

const STATUS_FILTERS = [
  { value: '', label: 'Tất cả' },
  { value: 'active', label: 'Đang hoạt động' },
  { value: 'expired', label: 'Hết hạn' },
  { value: 'cancelled', label: 'Đã hủy' },
] as const;

const fmtDate = (v?: string) => (v ? new Date(v).toLocaleDateString('vi-VN') : '—');
const fmtMoney = (n?: number | null) => (n != null ? `${n.toLocaleString('vi-VN')} ₫` : '—');

export function ManagerSubscriptionsPage() {
  const { buildingId } = useBuildingContext();
  const [items, setItems] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState('');

  // Cancel modal state
  const [cancelTarget, setCancelTarget] = useState<Subscription | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await managerApi.packages.subscriptions(buildingId, status ? { status } : undefined);
      setItems(res.data.items ?? []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải danh sách gói.');
    } finally {
      setLoading(false);
    }
  }, [buildingId, status]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const openCancel = (sub: Subscription) => {
    setCancelTarget(sub);
    setCancelReason('');
    setCancelError(null);
  };

  const closeCancel = () => {
    setCancelTarget(null);
    setCancelReason('');
    setCancelError(null);
  };

  const confirmCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    setCancelError(null);
    try {
      await managerApi.packages.cancelSubscription(buildingId, cancelTarget._id, cancelReason.trim() || undefined);
      setSuccessMsg('Đã hủy gói — hoàn 95% vào ví người dùng.');
      setTimeout(() => setSuccessMsg(null), 4000);
      closeCancel();
      await refresh();
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : 'Hủy gói thất bại.');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle>Gói dài hạn khách hàng</CardTitle>
          <CustomSelect
            value={status}
            onChange={setStatus}
            options={STATUS_FILTERS.map((s) => ({ value: s.value, label: s.label }))}
            className="w-52"
          />
        </CardHeader>
        <CardContent>
          {successMsg && (
            <div className="mb-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-400">
              {successMsg}
            </div>
          )}
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {loading ? (
            <p className="text-sm text-muted-foreground">Đang tải…</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Chưa có gói nào.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                    <th className="py-2 pr-3">Khách hàng</th>
                    <th className="py-2 pr-3">Biển số</th>
                    <th className="py-2 pr-3">Gói</th>
                    <th className="py-2 pr-3">Hiệu lực</th>
                    <th className="py-2 pr-3">Trạng thái</th>
                    <th className="py-2">Hành động</th>
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
                      <td className="py-2 pr-3"><StatusBadge status={s.status} /></td>
                      <td className="py-2">
                        {s.status === 'active' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openCancel(s)}
                            className="h-7 border-rose-500/40 px-2 text-[11px] text-rose-400 hover:bg-rose-500/10"
                          >
                            Hủy gói
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cancel confirmation modal */}
      {cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-rose-500/30 bg-card p-6 shadow-2xl">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-rose-400">Hủy gói dài hạn</p>
                <h3 className="mt-1 text-xl font-semibold text-foreground">{cancelTarget.package?.name}</h3>
              </div>
              <button onClick={closeCancel} className="text-muted-foreground transition hover:text-foreground">
                <X size={18} />
              </button>
            </div>

            <div className="mb-4 space-y-1.5 rounded-xl border border-border bg-muted/30 p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Khách hàng</span>
                <span className="font-medium">{cancelTarget.user?.fullName ?? '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Biển số</span>
                <span className="font-mono font-semibold">{cancelTarget.plateNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Giá gói</span>
                <span className="font-semibold text-amber-400">{fmtMoney(cancelTarget.package?.price)}</span>
              </div>
              <div className="flex justify-between border-t border-border/60 pt-1.5">
                <span className="text-muted-foreground">Hoàn tiền (95%)</span>
                <span className="font-semibold text-emerald-400">
                  {fmtMoney(cancelTarget.package?.price ? Math.round(cancelTarget.package.price * 0.95) : undefined)}
                </span>
              </div>
            </div>

            <div className="mb-1 flex items-center gap-1.5 text-xs text-amber-400">
              <AlertTriangle size={12} /> Hệ thống sẽ tự động hoàn 95% vào ví người dùng.
            </div>

            <div className="mb-4">
              <label className="mb-1 block text-xs font-semibold text-foreground">Lý do hủy (tùy chọn)</label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
                placeholder="Nhập lý do hủy gói..."
                className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-rose-500/50"
              />
            </div>

            {cancelError && (
              <p className="mb-3 text-xs text-rose-400">{cancelError}</p>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Button variant="secondary" onClick={closeCancel} disabled={cancelling} className="text-xs">
                Không hủy
              </Button>
              <Button
                onClick={confirmCancel}
                disabled={cancelling}
                className="bg-rose-500 text-white hover:bg-rose-400 text-xs disabled:opacity-60"
              >
                {cancelling ? 'Đang hủy...' : 'Xác nhận hủy gói'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
