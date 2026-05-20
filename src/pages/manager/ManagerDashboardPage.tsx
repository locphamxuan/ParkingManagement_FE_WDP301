import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AnalyticsCard } from '@/components/shared/AnalyticsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useBuildingContext } from '@/hooks/useBuildingContext';
import { managerApi, type DashboardOverview } from '@/services/manager/managerApi';

const formatCurrency = (n: number) =>
  `${(n || 0).toLocaleString('vi-VN')} VND`;

export function ManagerDashboardPage() {
  const { buildingId } = useBuildingContext();
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    managerApi
      .getDashboard(buildingId)
      .then((res) => {
        if (mounted) setData(res.data);
      })
      .catch((err) => {
        if (mounted) setError(err instanceof Error ? err.message : 'Tải dữ liệu thất bại');
      })
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [buildingId]);

  if (loading) return <div className="text-sm text-muted-foreground">Đang tải tổng quan...</div>;
  if (error) return <div className="text-sm text-red-600">{error}</div>;
  if (!data) return null;

  const stats = [
    { label: 'Tỉ lệ chiếm dụng', value: `${data.slots.occupancyRate}%`, delta: `${data.slots.occupied ?? 0}/${data.slots.total} ô` },
    { label: 'Phiên hôm nay', value: String(data.sessions.today), delta: `${data.sessions.active} đang hoạt động` },
    { label: 'Doanh thu hôm nay', value: formatCurrency(data.revenue.today), delta: `${Object.keys(data.revenue.byMethod).length} phương thức` },
    { label: 'Gói dài hạn', value: String(data.subscriptions.active), delta: 'đang hiệu lực' },
    { label: 'Cấu trúc tòa', value: `${data.floors} tầng`, delta: `${data.gates} cổng` },
    { label: 'Phản hồi đang chờ', value: String(data.feedbacks.pending), delta: 'Cần xử lý' },
  ];

  return (
    <div className="grid gap-5">
      <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {stats.map((s, i) => (
          <AnalyticsCard key={s.label} label={s.label} value={s.value} delta={s.delta} index={i} />
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Doanh thu 7 ngày gần nhất</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] pt-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.revenue.weekly}>
                <CartesianGrid stroke="rgba(191,161,131,0.22)" strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fill: '#374151', fontSize: 11 }} />
                <YAxis tick={{ fill: '#374151', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    background: '#fffaf3',
                    border: '1px solid rgba(234,88,12,0.16)',
                    borderRadius: '0.6rem',
                  }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Bar dataKey="revenue" fill="#f97316" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Trạng thái ô đỗ</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {[
                { label: 'Trống', key: 'available', color: 'bg-emerald-500' },
                { label: 'Đang dùng', key: 'occupied', color: 'bg-orange-500' },
                { label: 'Đã đặt', key: 'reserved', color: 'bg-amber-500' },
                { label: 'Bảo trì', key: 'maintenance', color: 'bg-stone-500' },
              ].map((s) => (
                <li
                  key={s.key}
                  className="flex items-center justify-between rounded-lg border border-border bg-muted/40 p-3"
                >
                  <span className="flex items-center gap-2 text-foreground">
                    <span className={`h-2 w-2 rounded-full ${s.color}`} />
                    {s.label}
                  </span>
                  <strong className="text-foreground">
                    {(data.slots as unknown as Record<string, number>)[s.key] ?? 0}
                  </strong>
                </li>
              ))}
              <li className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 p-3">
                <span className="text-foreground">Tổng số ô</span>
                <strong className="text-foreground">{data.slots.total}</strong>
              </li>
            </ul>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Doanh thu theo phương thức (hôm nay)</CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(data.revenue.byMethod).length === 0 ? (
            <p className="text-sm text-muted-foreground">Chưa có giao dịch hôm nay.</p>
          ) : (
            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
              {Object.entries(data.revenue.byMethod).map(([method, info]) => (
                <div
                  key={method}
                  className="rounded-lg border border-border bg-muted/40 p-3"
                >
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">{method}</p>
                  <p className="mt-1 text-lg font-semibold text-foreground">
                    {formatCurrency(info.amount)}
                  </p>
                  <p className="text-xs text-muted-foreground">{info.count} giao dịch</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
