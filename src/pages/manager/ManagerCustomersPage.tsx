import { useCallback, useEffect, useState } from 'react';
import { UserCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { CustomSelect } from '@/components/ui/select';
import { DataTable, type DataColumn } from '@/components/common/DataTable';
import { useBuildingContext } from '@/hooks/useBuildingContext';
import { managerApi, type ManagerCustomer } from '@/services/manager/managerApi';

const PACKAGE_FILTERS = [
  { value: '', label: 'All' },
  { value: 'true', label: 'Registered' },
  { value: 'false', label: 'Not registered' },
] as const;

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
 * của tòa nhà, kèm trạng thái đăng ký gói dài hạn — để manager biết ai nên
 * được mời chào mua gói.
 */
export function ManagerCustomersPage() {
  const { buildingId } = useBuildingContext();
  const [items, setItems] = useState<ManagerCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasPackage, setHasPackage] = useState('');

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
    refresh();
  }, [refresh]);

  const columns: DataColumn<ManagerCustomer>[] = [
    {
      key: 'fullName',
      title: 'Customer',
      render: (c) => (
        <div>
          <div className="font-medium">{c.fullName}</div>
          <div className="text-xs text-muted-foreground">{c.email}</div>
        </div>
      ),
    },
    { key: 'phone', title: 'Phone', render: (c) => c.phone || '—' },
    { key: 'status', title: 'Package status', render: (c) => <PackageStatusBadge customer={c} /> },
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
              Registered users who have used this building, and whether they have signed up for a long-term package.
            </p>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 z-20">
            <CustomSelect
              value={hasPackage}
              onChange={setHasPackage}
              options={PACKAGE_FILTERS.map((f) => ({ value: f.value, label: f.label === 'All' ? 'All customers' : f.label }))}
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
              <span>Loading customers...</span>
            </div>
          ) : items.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-6 text-center">No customers found for this building yet.</p>
          ) : (
            <DataTable title={`Customers (${items.length})`} rows={items} columns={columns} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
