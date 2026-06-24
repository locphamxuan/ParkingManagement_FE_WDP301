import { useCallback, useEffect, useState } from 'react';
import { ClipboardCheck, RefreshCw, TrendingUp, Banknote, Wallet, QrCode } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useOutletContext } from 'react-router-dom';
import { managerApi, type ShiftReportSubmission } from '@/services/manager/managerApi';

const fmtMoney = (n?: number | null) =>
  n != null ? `${n.toLocaleString('vi-VN')} ₫` : '—';

const fmtDatetime = (s?: string | null) =>
  s
    ? new Date(s).toLocaleString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
      })
    : '—';

const fmtDate = (s?: string | null) =>
  s
    ? new Date(s).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : '—';

const DIRECTION_LABEL: Record<string, string> = {
  in: 'Entry',
  out: 'Exit',
  both: 'Both',
};

export function ManagerShiftReportsPage() {
  const { buildingId } = useOutletContext<{ buildingId: string }>();

  const [reports, setReports] = useState<ShiftReportSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!buildingId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await managerApi.shifts.listReports(buildingId);
      const raw = (res as { data?: { items?: ShiftReportSubmission[] } })?.data?.items ?? [];
      setReports(raw);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load shift reports.');
    } finally {
      setLoading(false);
    }
  }, [buildingId]);

  useEffect(() => { void refresh(); }, [refresh]);

  const totalRevenue = reports.reduce((s, r) => s + (r.revenueReport?.total ?? 0), 0);
  const totalSessions = reports.reduce((s, r) => s + (r.revenueReport?.count ?? 0), 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ClipboardCheck size={18} className="text-primary" />
          <div>
            <h2 className="text-base font-semibold text-foreground">Shift revenue reports</h2>
            <p className="text-xs text-muted-foreground">
              Reports submitted by exit-gate staff at end of shift
            </p>
          </div>
        </div>
        <Button variant="secondary" size="sm" onClick={refresh} className="gap-1.5">
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-sm text-rose-500">
          {error}
        </div>
      )}

      {/* Summary cards */}
      {!loading && reports.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-3">
          <Card className="border border-primary/25 bg-primary/5">
            <CardContent className="p-5">
              <div className="mb-1 flex items-center gap-2">
                <TrendingUp size={14} className="text-primary" />
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total revenue</p>
              </div>
              <p className="text-2xl font-black text-primary">{fmtMoney(totalRevenue)}</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">{reports.length} report(s)</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="mb-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">Total sessions</p>
              <p className="text-2xl font-black text-foreground">{totalSessions}</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">vehicles checked out</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="mb-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">Avg. per report</p>
              <p className="text-2xl font-black text-foreground">
                {fmtMoney(reports.length > 0 ? Math.round(totalRevenue / reports.length) : 0)}
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">per staff shift</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Reports table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <ClipboardCheck size={14} className="text-primary" />
            Submitted reports
            <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
              {reports.length}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Loading…</p>
          ) : reports.length === 0 ? (
            <div className="py-10 text-center">
              <ClipboardCheck size={28} className="mx-auto mb-2 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No shift reports submitted yet.</p>
              <p className="mt-1 text-xs text-muted-foreground/70">
                Exit-gate staff submit reports from their Shift page.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((r) => (
                <div
                  key={r._id}
                  className="rounded-xl border border-border bg-card/50 p-4"
                >
                  {/* Top row: staff + gate + date */}
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {r.staff?.fullName ?? '—'}
                      </p>
                      <p className="text-xs text-muted-foreground">{r.staff?.email ?? ''}</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {r.gate && (
                        <span className="rounded-full border border-sky-500/25 bg-sky-500/10 px-2 py-0.5 text-[10px] font-semibold text-sky-400">
                          {r.gate.name ?? r.gate.code} · {DIRECTION_LABEL[r.gate.direction] ?? r.gate.direction}
                        </span>
                      )}
                      {r.shift && (
                        <span className="rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[10px] text-muted-foreground">
                          {r.shift.name ?? r.shift.code}
                        </span>
                      )}
                      <span className="rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[10px] text-muted-foreground">
                        {fmtDate(r.workDate)}
                      </span>
                    </div>
                  </div>

                  {/* Revenue breakdown */}
                  <div className="mt-3 grid gap-2 sm:grid-cols-4">
                    <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total</p>
                      <p className="mt-1 text-lg font-black text-primary">{fmtMoney(r.revenueReport?.total)}</p>
                      <p className="text-[11px] text-muted-foreground">{r.revenueReport?.count ?? 0} vehicle(s)</p>
                    </div>
                    <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
                      <div className="mb-1 flex items-center gap-1.5">
                        <Banknote size={11} className="text-emerald-400" />
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Cash</p>
                      </div>
                      <p className="text-base font-bold text-emerald-400">{fmtMoney(r.revenueReport?.byMethod.cash)}</p>
                    </div>
                    <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 p-3">
                      <div className="mb-1 flex items-center gap-1.5">
                        <Wallet size={11} className="text-violet-400" />
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Wallet</p>
                      </div>
                      <p className="text-base font-bold text-violet-400">{fmtMoney(r.revenueReport?.byMethod.wallet)}</p>
                    </div>
                    <div className="rounded-lg border border-sky-500/20 bg-sky-500/5 p-3">
                      <div className="mb-1 flex items-center gap-1.5">
                        <QrCode size={11} className="text-sky-400" />
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Bank / QR</p>
                      </div>
                      <p className="text-base font-bold text-sky-400">{fmtMoney(r.revenueReport?.byMethod.online)}</p>
                    </div>
                  </div>

                  <p className="mt-2 text-right text-[11px] text-muted-foreground">
                    Submitted {fmtDatetime(r.revenueReport?.submittedAt)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
