import { useEffect, useState } from 'react';
import {
  Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { DataTable, type DataColumn } from '@/components/shared/DataTable';
import { adminApi, type SubscriptionTransfer } from '@/services/admin/adminApi';

function fmtVnd(n: number | null | undefined) {
  if (n == null) return '—';
  return `${n.toLocaleString('en-US')} ₫`;
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' });
}

const columns: DataColumn<SubscriptionTransfer>[] = [
  {
    key: 'building',
    title: 'Building',
    render: (row) => row.building
      ? <span><span className="font-semibold">{row.building.name}</span> <span className="ml-1.5 text-xs text-muted-foreground">{row.building.code}</span></span>
      : <span className="text-muted-foreground">—</span>,
  },
  {
    key: 'performedBy',
    title: 'Manager',
    render: (row) => row.performedBy
      ? <span className="text-sm">{row.performedBy.fullName}</span>
      : <span className="text-muted-foreground">—</span>,
  },
  { key: 'amount', title: 'Amount', render: (row) => <span className="font-semibold text-emerald-500">{fmtVnd(row.amount)}</span> },
  { key: 'createdAt', title: 'Date', render: (row) => fmtTime(row.createdAt) },
];

// Group transfers by date for the chart
function buildChartData(transfers: SubscriptionTransfer[]) {
  const map = new Map<string, number>();
  transfers.forEach((t) => {
    const day = t.createdAt.split('T')[0];
    map.set(day, (map.get(day) ?? 0) + t.amount);
  });
  return Array.from(map.entries())
    .map(([date, total]) => ({ date, total }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function RevenueAnalyticsPage() {
  const [transfers, setTransfers] = useState<SubscriptionTransfer[]>([]);
  const [grandTotal, setGrandTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    adminApi.subscriptionRevenue()
      .then((res) => {
        setTransfers((res as any)?.data?.items ?? []);
        setGrandTotal((res as any)?.data?.grandTotal ?? 0);
        setError(null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-sm text-muted-foreground">Loading revenue analytics...</div>;
  if (error) return <div className="text-sm text-rose-600">{error}</div>;

  const chartData = buildChartData(transfers);

  return (
    <div className="grid gap-5">
      {/* Summary */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-muted-foreground">
          Total Subscription Revenue Received
        </p>
        <p className="mt-2 text-3xl font-semibold">{fmtVnd(grandTotal)}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Revenue from manager subscription purchases
        </p>
      </div>

      {/* Chart */}
      <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <h3 className="mb-3 text-base font-semibold">Subscription Revenue by Date</h3>
        {chartData.length === 0 ? (
          <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
            No subscription transfers yet.
          </div>
        ) : (
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid stroke="rgba(191,161,131,0.22)" strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={(v) => `${(v / 1_000_000).toFixed(1)}M`} />
                <Tooltip
                  formatter={(v: number) => [fmtVnd(v), 'Amount']}
                  contentStyle={{
                    background: '#fffaf3',
                    border: '1px solid rgba(234,88,12,0.16)',
                    borderRadius: '0.6rem',
                    boxShadow: '0 16px 36px rgba(120,83,48,0.14)',
                  }}
                />
                <Bar dataKey="total" fill="#f97316" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* All transfers table */}
      <DataTable
        title={`Subscription Transfer History (${transfers.length})`}
        rows={transfers}
        columns={columns}
      />
    </div>
  );
}
