import { useCallback, useEffect, useState } from 'react';
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
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle>Customer long-term packages</CardTitle>
          <CustomSelect
            value={status}
            onChange={setStatus}
            options={STATUS_FILTERS.map((s) => ({ value: s.value, label: s.label }))}
            className="w-48"
          />
        </CardHeader>
        <CardContent>
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No packages yet.</p>
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
    </>
  );
}
