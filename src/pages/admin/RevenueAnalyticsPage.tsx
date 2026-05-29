import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { DataTable, type DataColumn } from '@/components/shared/DataTable';
import { adminApi } from '@/services/admin/adminApi';

type TrendRow = { date: string; total: number; count: number };
type BuildingRow = { buildingId: string; buildingName: string; buildingCode: string; total: number; count: number };

interface TransferData {
  todayTotal: number;
  todayBreakdown: BuildingRow[];
  trend: TrendRow[];
}

function fmtVnd(n: number | null | undefined) {
  if (n == null) return '—';
  return `${n.toLocaleString('en-US')} ₫`;
}

const trendColumns: DataColumn<TrendRow>[] = [
  { key: 'date', title: 'Date' },
  { key: 'total', title: 'Amount Transferred', render: (row) => fmtVnd(row.total) },
  { key: 'count', title: 'Transfers' },
];

const buildingColumns: DataColumn<BuildingRow>[] = [
  {
    key: 'buildingName',
    title: 'Building',
    render: (row) => (
      <span>
        <span className="font-semibold">{row.buildingName ?? '—'}</span>
        <span className="ml-1.5 text-xs text-muted-foreground">{row.buildingCode}</span>
      </span>
    ),
  },
  { key: 'total', title: "Today's Transfer", render: (row) => fmtVnd(row.total) },
  { key: 'count', title: 'Count' },
];

export function RevenueAnalyticsPage() {
  const [data, setData] = useState<TransferData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    adminApi.wallet
      .dailyTransfers({ days: '30' })
      .then((res) => {
        setData(res.data);
        setError(null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading revenue analytics...</div>;
  }

  if (error || !data) {
    return (
      <div className="text-sm text-rose-600">
        {error ?? 'Failed to load revenue analytics.'}
      </div>
    );
  }

  return (
    <div className="grid gap-5">
      {/* Summary card */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-muted-foreground">
          Total Received Today
        </p>
        <p className="mt-2 text-3xl font-semibold">{fmtVnd(data.todayTotal)}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Transfers from building wallets to system wallet
        </p>
      </div>

      {/* Trend chart */}
      <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <h3 className="mb-3 text-base font-semibold">30-Day Transfer Trend</h3>
        {data.trend.length === 0 ? (
          <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
            No transfer data yet.
          </div>
        ) : (
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.trend}>
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

      <section className="grid gap-5 lg:grid-cols-2">
        {/* Today's breakdown by building */}
        <DataTable
          title={`Today's Transfers by Building (${data.todayBreakdown.length})`}
          rows={data.todayBreakdown}
          columns={buildingColumns}
        />

        {/* 30-day table */}
        <DataTable
          title="Daily Transfer History"
          rows={data.trend}
          columns={trendColumns}
        />
      </section>
    </div>
  );
}
