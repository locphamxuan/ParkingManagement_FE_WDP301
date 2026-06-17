import { useCallback, useEffect, useMemo, useState } from 'react';
import { Banknote, Building2, QrCode, RefreshCw, TrendingUp, Wallet } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { adminApi, type RevenueReport } from '@/services/admin/adminApi';

const fmtVnd = (n: number | undefined | null) =>
  n != null ? `${n.toLocaleString('en-US')} ₫` : '—';

/** YYYY-MM-DD for <input type="date"> and the API query. */
const toDateInput = (d: Date) => d.toISOString().slice(0, 10);

export function RevenueAnalyticsPage() {
  const today = useMemo(() => new Date(), []);
  const monthAgo = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 29);
    return d;
  }, []);

  const [from, setFrom] = useState(toDateInput(monthAgo));
  const [to, setTo] = useState(toDateInput(today));
  const [report, setReport] = useState<RevenueReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.revenue.report({ from, to });
      setReport((res as { data?: RevenueReport })?.data ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load revenue report.');
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    void load();
  }, [load]);

  const totals = useMemo(() => {
    const items = report?.items ?? [];
    return items.reduce(
      (acc, r) => {
        acc.cash += r.cashAmount;
        acc.wallet += r.walletAmount;
        acc.qr += r.qrAmount;
        acc.sessions += r.sessionCount;
        return acc;
      },
      { cash: 0, wallet: 0, qr: 0, sessions: 0 },
    );
  }, [report]);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground">From</label>
          <Input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} className="w-[160px]" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground">To</label>
          <Input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} className="w-[160px]" />
        </div>
        <Button variant="secondary" size="sm" onClick={() => void load()} className="gap-1.5">
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-500">
          {error}
        </div>
      )}

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          icon={<TrendingUp size={16} className="text-emerald-500" />}
          label="Total revenue"
          value={fmtVnd(report?.grandTotal)}
          sub={`${totals.sessions} payments`}
          accent="emerald"
        />
        <SummaryCard
          icon={<Banknote size={16} className="text-amber-500" />}
          label="Cash"
          value={fmtVnd(totals.cash)}
          accent="amber"
        />
        <SummaryCard
          icon={<Wallet size={16} className="text-sky-500" />}
          label="Wallet"
          value={fmtVnd(totals.wallet)}
          accent="sky"
        />
        <SummaryCard
          icon={<QrCode size={16} className="text-violet-500" />}
          label="QR / Card"
          value={fmtVnd(totals.qr)}
          accent="violet"
        />
      </div>

      {/* Per-building breakdown */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Building2 size={14} className="text-primary" />
            Revenue by building
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
              <RefreshCw size={14} className="animate-spin" /> Loading revenue report…
            </div>
          ) : !report?.items?.length ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No revenue recorded for this period.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="py-2 pr-4 font-semibold">Building</th>
                    <th className="py-2 pr-4 text-right font-semibold">Payments</th>
                    <th className="py-2 pr-4 text-right font-semibold">Cash</th>
                    <th className="py-2 pr-4 text-right font-semibold">Wallet</th>
                    <th className="py-2 pr-4 text-right font-semibold">QR / Card</th>
                    <th className="py-2 text-right font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {report.items.map((r) => (
                    <tr key={r.buildingId} className="border-b border-border/50 last:border-0">
                      <td className="py-2.5 pr-4">
                        {r.buildingCode && (
                          <span className="mr-1.5 font-mono text-xs text-muted-foreground">{r.buildingCode}</span>
                        )}
                        <span className="font-medium text-foreground">{r.buildingName ?? 'Unknown building'}</span>
                      </td>
                      <td className="py-2.5 pr-4 text-right tabular-nums text-muted-foreground">{r.sessionCount}</td>
                      <td className="py-2.5 pr-4 text-right tabular-nums">{fmtVnd(r.cashAmount)}</td>
                      <td className="py-2.5 pr-4 text-right tabular-nums">{fmtVnd(r.walletAmount)}</td>
                      <td className="py-2.5 pr-4 text-right tabular-nums">{fmtVnd(r.qrAmount)}</td>
                      <td className="py-2.5 text-right font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                        {fmtVnd(r.totalRevenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  accent: 'emerald' | 'amber' | 'sky' | 'violet';
}) {
  const ring: Record<string, string> = {
    emerald: 'border-emerald-500/20 bg-emerald-500/5',
    amber: 'border-amber-500/20 bg-amber-500/5',
    sky: 'border-sky-500/20 bg-sky-500/5',
    violet: 'border-violet-500/20 bg-violet-500/5',
  };
  return (
    <Card className={ring[accent]}>
      <CardContent className="p-5">
        <div className="mb-2 flex items-center gap-2">
          {icon}
          <p className="text-xs font-black uppercase tracking-wider text-muted-foreground">{label}</p>
        </div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  );
}
