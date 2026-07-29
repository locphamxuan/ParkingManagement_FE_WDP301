import { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, UserCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { CustomSelect } from '@/components/ui/select';
import { DataTable, type DataColumn } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { useBuildingContext } from '@/hooks/useBuildingContext';
import { managerApi, type ManagerCustomer, type CustomerSubscription } from '@/services/manager/managerApi';

const PACKAGE_FILTERS = [
  { value: '', label: 'All customers' },
  { value: 'true', label: 'Registered' },
  { value: 'false', label: 'Not registered' },
] as const;

const fmtDate = (v?: string | null) => (v ? new Date(v).toLocaleDateString('vi-VN') : '—');
const fmtMoney = (n?: number | null) => (n != null ? `${n.toLocaleString('vi-VN')} ₫` : '—');

/** Small local status pill — the three states here (registered / lapsed / never
 * registered) don't map onto the shared StatusBadge's status vocabulary. */
function PackageStatusBadge({ customer }: { customer: ManagerCustomer }) {
  if (customer.hasActivePackage) {
    return (
      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200/50">
        <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
        Registered
      </span>
    );
  }
  if (customer.hasAnyPackage) {
    return (
      <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200/50">
        <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-amber-500" />
        Expired/Lapsed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-semibold text-stone-600 border border-stone-200/50">
      Not registered
    </span>
  );
}

/**
 * Danh sách khách hàng (user có account, không tính vãng lai) đã từng dùng bãi
 * của tòa nhà — dùng cho 2 việc: (1) manager tra cứu nhanh biển số/tên khi xử lý
 * sự cố (báo cáo có violatorPlate), (2) quản lý từng lượt đăng ký gói dài hạn
 * (trước đây là tab "Subscribers" riêng, đã gộp vào đây 2026-07-22 theo yêu cầu
 * chủ dự án — 1 user có thể có nhiều subscription, hiện đủ trong ô "Packages").
 */
export function ManagerCustomersPage() {
  const { buildingId } = useBuildingContext();
  const [items, setItems] = useState<ManagerCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasPackage, setHasPackage] = useState('');
  const [search, setSearch] = useState('');

  const [refundPercent, setRefundPercent] = useState(80);
  const [cancelTarget, setCancelTarget] = useState<{ sub: CustomerSubscription; customerName: string } | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await managerApi.customers.list(buildingId, hasPackage ? { hasPackage } : undefined);
      setItems(res.data.items ?? []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Load failed');
    } finally {
      setLoading(false);
    }
  }, [buildingId, hasPackage]);

  useEffect(() => {
    managerApi.refundPolicy
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

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((c) => {
      if (c.fullName.toLowerCase().includes(q)) return true;
      if (c.email.toLowerCase().includes(q)) return true;
      if (c.phone?.toLowerCase().includes(q)) return true;
      return c.licensePlates.some((p) => p.plateNumber.toLowerCase().includes(q));
    });
  }, [items, search]);

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
      await managerApi.packages.cancelSubscription(buildingId, cancelTarget.sub._id, cancelReason || undefined);
      closeCancelModal();
      await refresh();
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : 'Failed to cancel package');
    } finally {
      setCancelling(false);
    }
  };

  const columns: DataColumn<ManagerCustomer>[] = [
    {
      key: 'fullName',
      title: 'Customer',
      render: (c) => (
        <div>
          <div className="font-medium">{c.fullName}</div>
          <div className="text-xs text-muted-foreground">{c.email}</div>
          <div className="text-xs text-muted-foreground">{c.phone || 'No phone'}</div>
        </div>
      ),
    },
    {
      key: 'licensePlates',
      title: 'Vehicles',
      render: (c) =>
        !c.licensePlates || c.licensePlates.length === 0 ? (
          <span className="text-muted-foreground">—</span>
        ) : (
          <div className="flex flex-wrap gap-1">
            {c.licensePlates.map((p) => (
              <span
                key={p.plateNumber}
                className="inline-flex items-center rounded-md border border-border bg-card px-1.5 py-0.5 font-mono text-xs"
              >
                {p.plateNumber}
              </span>
            ))}
          </div>
        ),
    },
    { key: 'status', title: 'Package status', render: (c) => <PackageStatusBadge customer={c} /> },
    {
      key: 'subscriptions',
      title: 'Packages',
      render: (c) =>
        !c.subscriptions || c.subscriptions.length === 0 ? (
          <span className="text-xs text-muted-foreground italic">No packages registered</span>
        ) : (
          <div className="grid gap-2 min-w-[260px]">
            {c.subscriptions.map((s) => {
              const pct = s.refundPercent ?? refundPercent;
              const refund =
                s.refundAmount ?? (s.package?.price != null ? Math.round((s.package.price * pct) / 100) : null);
              return (
                <div key={s._id} className="rounded-lg border border-border bg-card/50 p-2 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{s.package?.name ?? '—'}</span>
                    <StatusBadge status={s.status} />
                  </div>
                  <div className="mt-0.5 font-mono text-muted-foreground">{s.plateNumber}</div>
                  <div className="text-muted-foreground">
                    {fmtDate(s.startDate)} → {fmtDate(s.endDate)}
                  </div>
                  {s.status === 'cancelled' ? (
                    <div className="mt-1 text-[11px]">
                      <span className="text-danger">{100 - pct}% deduction</span>
                      {' · '}
                      <span className="text-success">Refunded {fmtMoney(refund)}</span>
                    </div>
                  ) : (
                    <div className="mt-1 text-muted-foreground">{fmtMoney(s.package?.price)}</div>
                  )}
                  {(s.status === 'active' || s.status === 'pending') && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setCancelTarget({ sub: s, customerName: c.fullName })}
                      className="mt-1 h-6 px-2 text-danger hover:text-danger hover:bg-danger/10 text-[11px]"
                    >
                      Cancel package
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        ),
    },
    {
      key: 'visits',
      title: 'Visits (this building)',
      render: (c) => (
        <div className="text-xs">
          <div>{c.sessionCount} session{c.sessionCount === 1 ? '' : 's'}</div>
          <div className="text-muted-foreground">Last: {fmtDate(c.lastVisitAt)}</div>
        </div>
      ),
    },
    { key: 'walletBalance', title: 'Wallet balance', render: (c) => fmtMoney(c.walletBalance) },
    {
      key: 'isActive',
      title: 'Account',
      render: (c) =>
        c.isActive ? (
          <span className="text-xs font-semibold text-success">Active</span>
        ) : (
          <span className="text-xs font-semibold text-danger">Locked</span>
        ),
    },
    { key: 'createdAt', title: 'Member since', render: (c) => fmtDate(c.createdAt) },
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
              <UserCheck size={20} className="text-blue-600 animate-pulse stroke-[2.5]" />
              Building Customers
            </h1>
            <p className="mt-1 text-xs font-bold text-slate-500">
              Registered users who have used this building — package status, subscriptions, and plate lookup
              (for cross-checking incident reports) in one place.
            </p>
          </div>
        </div>

        <div className="relative z-10 mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, phone, or plate..."
              className="h-11 rounded-xl bg-white border-blue-100 pl-9 text-slate-800 focus:border-blue-500/40"
            />
          </div>
          <CustomSelect
            value={hasPackage}
            onChange={setHasPackage}
            options={PACKAGE_FILTERS.map((f) => ({ value: f.value, label: f.label }))}
            className="w-48 bg-white border-blue-100 text-slate-800 rounded-xl"
          />
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
              <span>Loading customers...</span>
            </div>
          ) : filteredItems.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-6 text-center">
              {items.length === 0 ? 'No customers found for this building yet.' : 'No customers match your search.'}
            </p>
          ) : (
            <DataTable title={`Customers (${filteredItems.length})`} rows={filteredItems} columns={columns} />
          )}
        </CardContent>
      </Card>

      {/* Modal hủy gói */}
      <Modal open={!!cancelTarget} onOpenChange={(o) => !o && closeCancelModal()} title="Cancel long-term package">
        {cancelTarget && (
          <div className="grid gap-4">
            <div>
              <h3 className="text-base font-semibold text-foreground">{cancelTarget.customerName}</h3>
              <p className="text-xs text-muted-foreground">
                {cancelTarget.sub.package?.name} · {cancelTarget.sub.plateNumber}
              </p>
            </div>

            <div className="rounded-xl border border-warning/25 bg-warning/10 px-4 py-3 text-sm text-foreground">
              <p className="font-semibold mb-1">Refund policy for manager cancellation (per building refund policy):</p>
              <ul className="text-xs space-y-0.5 list-disc list-inside">
                <li>Deduct <strong>{100 - refundPercent}%</strong> processing fee</li>
                <li>
                  Refund <strong>{refundPercent}%</strong> ={' '}
                  {cancelTarget.sub.package?.price != null
                    ? fmtMoney(Math.round((cancelTarget.sub.package.price * refundPercent) / 100))
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
