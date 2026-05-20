import { useEffect, useState } from 'react';
import { DataTable, type DataColumn } from '@/components/shared/DataTable';
import { useBuildingContext } from '@/hooks/useBuildingContext';
import { managerApi, type PolicyPushLog } from '@/services/manager/managerApi';

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString('vi-VN', { hour12: false });

export function ManagerPolicyLogsPage() {
  const { buildingId } = useBuildingContext();
  const [items, setItems] = useState<PolicyPushLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    managerApi.pricePolicies
      .pushLogs(buildingId)
      .then((res) => setItems(res.data.items))
      .catch((err) => setError(err instanceof Error ? err.message : 'Tải thất bại'))
      .finally(() => setLoading(false));
  }, [buildingId]);

  const columns: DataColumn<PolicyPushLog>[] = [
    { key: 'createdAt', title: 'Thời điểm', render: (row) => formatDate(row.createdAt) },
    { key: 'action', title: 'Hành động' },
    { key: 'pricePolicy', title: 'Chính sách', render: (row) => row.pricePolicy?.name ?? '—' },
    {
      key: 'actor',
      title: 'Người thực hiện',
      render: (row) => `${row.actor?.fullName ?? '—'} (${row.actor?.role ?? '—'})`,
    },
  ];

  if (loading) return <div className="text-sm text-muted-foreground">Đang tải...</div>;
  if (error) return <div className="text-sm text-red-600">{error}</div>;

  return <DataTable title="Lịch sử đẩy chính sách giá" rows={items} columns={columns} />;
}
