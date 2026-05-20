import { useEffect, useState } from 'react';
import { DataTable, type DataColumn } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useBuildingContext } from '@/hooks/useBuildingContext';
import { managerApi, type Subscription } from '@/services/manager/managerApi';

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('vi-VN');

export function ManagerSubscriptionsPage() {
  const { buildingId } = useBuildingContext();
  const [items, setItems] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    managerApi.packages
      .subscriptions(buildingId)
      .then((res) => setItems(res.data.items))
      .catch((err) => setError(err instanceof Error ? err.message : 'Tải thất bại'))
      .finally(() => setLoading(false));
  }, [buildingId]);

  const columns: DataColumn<Subscription>[] = [
    { key: 'plateNumber', title: 'Biển số' },
    { key: 'user', title: 'Khách hàng', render: (row) => row.user?.fullName ?? '?' },
    { key: 'package', title: 'Gói', render: (row) => row.package?.name ?? '?' },
    { key: 'startDate', title: 'Bắt đầu', render: (row) => formatDate(row.startDate) },
    { key: 'endDate', title: 'Kết thúc', render: (row) => formatDate(row.endDate) },
    {
      key: 'status',
      title: 'Trạng thái',
      render: (row) => <StatusBadge status={row.status} />,
    },
  ];

  if (loading) return <div className="text-sm text-muted-foreground">Đang tải...</div>;
  if (error) return <div className="text-sm text-red-600">{error}</div>;

  return <DataTable title={`Đăng ký gói (${items.length})`} rows={items} columns={columns} />;
}
