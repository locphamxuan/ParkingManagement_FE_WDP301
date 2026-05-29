import { useCallback, useEffect, useState } from 'react';
import { RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable, type DataColumn } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useBuildingContext } from '@/hooks/useBuildingContext';
import { managerApi } from '@/services/manager/managerApi';

interface StaffMember {
  _id: string;
  fullName: string;
  email: string;
  phone?: string;
  role: string;
  isActive?: boolean;
  assignedAt?: string;
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
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load staff'))
      .finally(() => setLoading(false));
  }, [buildingId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const columns: DataColumn<StaffMember>[] = [
    { key: 'fullName', title: 'Name' },
    { key: 'email',    title: 'Email' },
    { key: 'phone',    title: 'Phone', render: (row) => row.phone || '—' },
    {
      key: 'isActive',
      title: 'Status',
      render: (row) => (
        <StatusBadge status={row.isActive !== false ? 'active' : 'inactive'} />
      ),
    },
  ];

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Staff of this building</h2>
        <Button variant="ghost" size="sm" className="gap-1" onClick={refresh}>
          <RefreshCcw size={14} /> Refresh
        </Button>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading staff...</div>
      ) : error ? (
        <div className="text-sm text-red-600">{error}</div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
          No staff assigned to this building yet.
          <br />
          Ask an admin to use{' '}
          <code className="rounded bg-muted px-1 text-xs">
            POST /admin/buildings/:id/assign-staff
          </code>{' '}
          to assign staff members.
        </div>
      ) : (
        <DataTable title={`Staff (${items.length})`} rows={items} columns={columns} />
      )}
    </div>
  );
}
