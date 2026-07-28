import { useCallback, useEffect, useState } from 'react';
import { RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable, type DataColumn } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { useBuildingContext } from '@/hooks/useBuildingContext';
import { managerApi } from '@/services/manager/managerApi';

interface StaffMember {
  _id: string;
  fullName: string;
  email: string;
  phone?: string;
  role: string;
  isActive?: boolean;
}

export function ManagerStaffPage() {
  const { buildingId } = useBuildingContext();
  const [items, setItems] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    if (!buildingId) return;
    setLoading(true);
    setError(null);
    managerApi.shifts
      .listStaff(buildingId)
      .then((res) => {
        const raw = res.data?.items ?? (Array.isArray(res.data) ? (res.data as StaffMember[]) : []);
        setItems(raw as StaffMember[]);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load staff list'))
      .finally(() => setLoading(false));
  }, [buildingId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const columns: DataColumn<StaffMember>[] = [
    { key: 'fullName', title: 'Full name' },
    { key: 'email', title: 'Email' },
    { key: 'phone', title: 'Phone number', render: (row) => row.phone || '—' },
    {
      key: 'isActive',
      title: 'Status',
      render: (row) => <StatusBadge status={row.isActive !== false ? 'active' : 'inactive'} />,
    },
  ];

  return (
    <div className="space-y-4">
      {loading ? (
        <div className="text-sm text-slate-500 font-semibold p-6 bg-white rounded-2xl border border-slate-200 shadow-sm text-center">Loading building staff...</div>
      ) : error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700 shadow-sm">
          {error}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-600 shadow-sm flex flex-col items-center justify-center">
          <p className="font-bold text-sm text-slate-700">No staff assigned to this building yet.</p>
          <span className="text-xs text-slate-400 mt-1">An admin must use the "Members" feature to assign staff members.</span>
        </div>
      ) : (
        <DataTable
          title={`Building Staff (${items.length})`}
          rows={items}
          columns={columns}
          rightElement={
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 rounded-lg border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-xs flex items-center gap-1.5"
              onClick={refresh}
            >
              <RefreshCcw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
            </Button>
          }
        />
      )}
    </div>
  );
}
