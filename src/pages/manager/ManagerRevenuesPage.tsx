import { useCallback, useEffect, useState } from 'react';
import { AnalyticsCard } from '@/components/shared/AnalyticsCard';
import { Button } from '@/components/ui/button';
import { DataTable, type DataColumn } from '@/components/shared/DataTable';
import { useBuildingContext } from '@/hooks/useBuildingContext';
import { managerApi, type ShiftRevenue } from '@/services/manager/managerApi';

const fmt = (n: number) => `${(n || 0).toLocaleString('vi-VN')} đ`;

export function ManagerRevenuesPage() {
  const { buildingId } = useBuildingContext();
  const [items, setItems] = useState<ShiftRevenue[]>([]);
  const [totals, setTotals] = useState<{
    sessionCount: number;
    totalRevenue: number;
    cashAmount: number;
    walletAmount: number;
    qrAmount: number;
  }>({ sessionCount: 0, totalRevenue: 0, cashAmount: 0, walletAmount: 0, qrAmount: 0 });
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setLoading(true);
    managerApi.shifts
      .revenues(buildingId, { from: from || undefined, to: to || undefined })
      .then((res) => {
        setItems(res.data.items);
        setTotals(res.data.totals);
        setError(null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Tải thất bại'))
      .finally(() => setLoading(false));
  }, [buildingId, from, to]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const columns: DataColumn<ShiftRevenue>[] = [
    {
      key: 'workDate',
      title: 'Ngày',
      render: (row) => new Date(row.workDate).toLocaleDateString('vi-VN'),
    },
    { key: 'shift', title: 'Ca', render: (row) => row.shift?.code ?? '?' },
    { key: 'staff', title: 'Nhân viên', render: (row) => row.staff?.fullName ?? '?' },
    { key: 'sessionCount', title: 'Số phiên' },
    { key: 'totalRevenue', title: 'Tổng thu', render: (row) => fmt(row.totalRevenue) },
    { key: 'cashAmount', title: 'Tiền mặt', render: (row) => fmt(row.cashAmount) },
    { key: 'walletAmount', title: 'Ví', render: (row) => fmt(row.walletAmount) },
    { key: 'qrAmount', title: 'QR', render: (row) => fmt(row.qrAmount) },
    {
      key: 'reconciled',
      title: 'Đối soát',
      render: (row) => (row.reconciled ? 'Đã đối soát' : 'Chưa'),
    },
  ];

  return (
    <div className="grid gap-4">
      <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <AnalyticsCard label="Tổng số phiên" value={String(totals.sessionCount)} delta="" />
        <AnalyticsCard label="Tổng doanh thu" value={fmt(totals.totalRevenue)} delta="" />
        <AnalyticsCard label="Tiền mặt" value={fmt(totals.cashAmount)} delta="" />
        <AnalyticsCard label="Ví + QR" value={fmt(totals.walletAmount + totals.qrAmount)} delta="" />
      </section>

      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-card p-3">
        <div className="grid gap-1">
          <label className="text-xs uppercase text-muted-foreground">Từ ngày</label>
          <input
            type="date"
            className="h-9 rounded-md border border-border bg-card px-3 text-sm"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </div>
        <div className="grid gap-1">
          <label className="text-xs uppercase text-muted-foreground">Đến ngày</label>
          <input
            type="date"
            className="h-9 rounded-md border border-border bg-card px-3 text-sm"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>
        <Button variant="ghost" size="sm" onClick={() => { setFrom(''); setTo(''); }}>
          Reset
        </Button>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Đang tải...</div>
      ) : error ? (
        <div className="text-sm text-red-600">{error}</div>
      ) : (
        <DataTable title="Doanh thu theo ca" rows={items} columns={columns} />
      )}
    </div>
  );
}
