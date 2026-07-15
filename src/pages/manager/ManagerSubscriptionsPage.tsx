import { useCallback, useEffect, useState } from 'react';
import { CreditCard, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { CustomSelect } from '@/components/ui/select';
import { DataTable, type DataColumn } from '@/components/common/DataTable';
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

  const closeCancelModal = () => {
    setCancelTarget(null);
    setCancelReason('');
    setCancelError(null);
  };

  const handleCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    setCancelError(null);
    try {
      await managerApi.packages.cancelSubscription(buildingId, cancelTarget._id, cancelReason || undefined);
      closeCancelModal();
      await refresh();
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : 'Failed to cancel package');
    } finally {
      setCancelling(false);
    }
  };

  const columns: DataColumn<Subscription>[] = [
    {
      key: 'user',
      title: 'Customer',
      render: (s) => (
        <div>
          <div className="font-medium">{s.user?.fullName ?? '—'}</div>
          <div className="text-xs text-muted-foreground">{s.user?.email}</div>
        </div>
      ),
    },
    { key: 'plateNumber', title: 'Plate', render: (s) => <span className="font-mono">{s.plateNumber}</span> },
    { key: 'package', title: 'Package', render: (s) => s.package?.name ?? '—' },
    {
      key: 'validity',
      title: 'Validity',
      render: (s) => (
        <span className="whitespace-nowrap">{fmtDate(s.startDate)} → {fmtDate(s.endDate)}</span>
      ),
    },
    { key: 'status', title: 'Status', render: (s) => <StatusBadge status={s.status} /> },
    {
      key: 'fee',
      title: 'Package fee / Refund',
      render: (s) => {
        // Ưu tiên snapshot lưu lúc hủy; gói cũ chưa có snapshot thì tính theo policy hiện tại.
        const pct = s.refundPercent ?? refundPercent;
        const refund =
          s.refundAmount ??
          (s.package?.price != null ? Math.round((s.package.price * pct) / 100) : null);
        const deduction = s.package?.price != null && refund != null ? s.package.price - refund : null;
        if (s.status !== 'cancelled') {
          return <span className="text-muted-foreground text-xs">{fmtMoney(s.package?.price)}</span>;
        }
        return (
          <div className="text-xs">
            <span className="text-muted-foreground">Original price: </span>
            <span className="font-medium">{fmtMoney(s.package?.price)}</span>
            <br />
            <span className="text-danger">{100 - pct}% deduction: </span>
            <span className="text-danger font-medium">{deduction != null ? fmtMoney(deduction) : '—'}</span>
            <br />
            <span className="text-success">Refunded ({pct}%): </span>
            <span className="text-success font-medium">{refund != null ? fmtMoney(refund) : '—'}</span>
          </div>
        );
      },
    },
    {
      key: 'actions',
      title: '',
      render: (s) =>
        s.status === 'active' || s.status === 'pending' ? (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setCancelTarget(s)}
            className="text-danger hover:text-danger hover:bg-danger/10 text-xs"
          >
            Cancel package
          </Button>
        ) : null,
    },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Premium Header Hero Card */}
      <div className="premium-hero-card relative overflow-hidden rounded-3xl border-2 border-blue-100 bg-gradient-to-br from-white via-blue-50/5 to-indigo-50/10 p-6 shadow-md transition-all duration-300">
        {/* Ambient Glows */}
        <div className="absolute -right-16 -top-16 h-36 w-36 rounded-full bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.06),transparent_70%)] pointer-events-none blur-2xl animate-pulse" />
        
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-blue-600 text-[9px] font-black uppercase tracking-widest text-white shadow-sm font-mono">
              Policies & Subscriptions
            </div>
            <h1 className="mt-2 text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <CreditCard size={20} className="text-blue-600 animate-pulse stroke-[2.5]" />
              Customer Packages
            </h1>
            <p className="mt-1 text-xs font-bold text-slate-500">
              Monitor active customer packages, registrations, duration limits, and manage package cancellations.
            </p>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 z-20">
            <CustomSelect
              value={status}
              onChange={setStatus}
              options={STATUS_FILTERS.map((s) => ({ value: s.value, label: s.label === 'All' ? 'All statuses' : s.label }))}
              className="w-48 bg-white border-blue-100 text-slate-800 rounded-xl"
            />
          </div>
        </div>
      </div>

      <Card className="border border-slate-200/80 bg-white shadow-sm overflow-hidden rounded-2xl">
        <CardContent className="p-6">
          {error ? (
            <p className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 p-3.5 rounded-2xl">{error}</p>
          ) : null}
          
          {loading ? (
            <div className="flex items-center gap-2 text-slate-650 text-xs font-bold p-8 justify-center bg-white rounded-2xl">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent mr-2" />
              <span>Loading customer subscriptions...</span>
            </div>
          ) : items.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-6 text-center">No active or pending package subscriptions found.</p>
          ) : (
            <DataTable title={`Subscriptions (${items.length})`} rows={items} columns={columns} />
          )}
        </CardContent>
      </Card>

      {/* Modal hủy gói — dùng Modal chuẩn (Radix) thay overlay fixed inset-0 tự viết. */}
      <Modal
        open={!!cancelTarget}
        onOpenChange={(o) => !o && closeCancelModal()}
        title="Cancel long-term package"
      >
        {cancelTarget && (
          <div className="grid gap-4">
            <div>
              <h3 className="text-base font-semibold text-foreground">{cancelTarget.user?.fullName}</h3>
              <p className="text-xs text-muted-foreground">
                {cancelTarget.package?.name} · {cancelTarget.plateNumber}
              </p>
            </div>

            <div className="rounded-xl border border-warning/25 bg-warning/10 px-4 py-3 text-sm text-foreground">
              <p className="font-semibold mb-1">Refund policy for manager cancellation (per building reservation policy):</p>
              <ul className="text-xs space-y-0.5 list-disc list-inside">
                <li>Deduct <strong>{100 - refundPercent}%</strong> processing fee</li>
                <li>
                  Refund <strong>{refundPercent}%</strong> ={' '}
                  {cancelTarget.package?.price != null
                    ? fmtMoney(Math.round((cancelTarget.package.price * refundPercent) / 100))
                    : '—'}{' '}
                  to the user wallet
                </li>
              </ul>
            </div>

            <div>
              <label className="text-xs uppercase tracking-wider text-muted-foreground block mb-1">
                Cancellation reason (optional)
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={2}
                placeholder="Note the cancellation reason..."
                className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-danger/50"
              />
            </div>

            {cancelError && <p className="text-xs text-danger">{cancelError}</p>}

            <div className="grid grid-cols-2 gap-3">
              <Button variant="secondary" onClick={closeCancelModal} className="text-xs">
                Cancel
              </Button>
              <Button
                onClick={handleCancel}
                disabled={cancelling}
                className="bg-danger text-danger-foreground hover:brightness-110 text-xs disabled:opacity-60"
              >
                {cancelling ? 'Processing...' : 'Confirm cancellation'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
