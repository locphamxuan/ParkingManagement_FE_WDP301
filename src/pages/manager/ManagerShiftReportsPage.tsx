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
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-755 font-medium">
          {error}
        </div>
      )}

      {/* Summary cards */}
      {!loading && reports.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-3">
          <Card className="border border-sky-100 bg-sky-50/30 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-sky-500" />
            <CardContent className="p-5">
              <div className="mb-1 flex items-center gap-2">
                <TrendingUp size={14} className="text-sky-600" />
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Total revenue</p>
              </div>
              <p className="text-2xl font-black text-sky-600 font-mono">{fmtMoney(totalRevenue)}</p>
              <p className="mt-0.5 text-[11px] text-slate-400 font-semibold">{reports.length} report(s)</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="p-5">
              <p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-500">Total sessions</p>
              <p className="text-2xl font-black text-slate-800 font-mono">{totalSessions}</p>
              <p className="mt-0.5 text-[11px] text-slate-400 font-semibold">vehicles checked out</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="p-5">
              <p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-500">Avg. per report</p>
              <p className="text-2xl font-black text-slate-800 font-mono">
                {fmtMoney(reports.length > 0 ? Math.round(totalRevenue / reports.length) : 0)}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-400 font-semibold">per staff shift</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Reports table */}
      <Card className="border border-sky-100 shadow-sm">
        <CardHeader className="pb-3 border-b border-sky-100/50">
          <CardTitle className="flex items-center gap-2 text-sm text-slate-800">
            <ClipboardCheck size={14} className="text-sky-600" />
            Submitted reports
            <span className="ml-1 rounded-lg bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-600 border border-sky-100">
              {reports.length}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          {loading ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Loading…</p>
          ) : reports.length === 0 ? (
            <div className="py-10 text-center">
              <ClipboardCheck size={28} className="mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-semibold text-slate-600">No shift reports submitted yet.</p>
              <p className="mt-1 text-xs text-slate-400">
                Exit-gate staff submit reports from their Shift page.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((r) => (
                <div
                  key={r._id}
                  className="rounded-2xl border border-sky-100 bg-white p-4 transition-all duration-300 hover:border-sky-300 hover:shadow-sm"
                >
                  {/* Top row: staff + gate + date */}
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold text-slate-850">
                        {r.staff?.fullName ?? '—'}
                      </p>
                      <p className="text-xs text-slate-500 font-medium">{r.staff?.email ?? ''}</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {r.gate && (
                        <span className="rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-0.5 text-[10px] font-bold text-sky-600">
                          {r.gate.name ?? r.gate.code} · {DIRECTION_LABEL[r.gate.direction] ?? r.gate.direction}
                        </span>
                      )}
                      {r.shift && (
                        <span className="rounded-lg border border-sky-100 bg-slate-50 px-2.5 py-0.5 text-[10px] font-semibold text-slate-600">
                          {r.shift.name ?? r.shift.code}
                        </span>
                      )}
                      <span className="rounded-lg border border-sky-100 bg-slate-50 px-2.5 py-0.5 text-[10px] font-semibold text-slate-600">
                        {fmtDate(r.workDate)}
                      </span>
                    </div>
                  </div>

                  {/* Revenue breakdown */}
                  <div className="mt-3 grid gap-2 sm:grid-cols-4">
                    <div className="rounded-xl border border-sky-200 bg-sky-50/20 p-3">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total</p>
                      <p className="mt-1 text-lg font-black text-sky-600 font-mono">{fmtMoney(r.revenueReport?.total)}</p>
                      <p className="text-[11px] text-slate-400 font-semibold">{r.revenueReport?.count ?? 0} vehicle(s)</p>
                    </div>
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/20 p-3">
                      <div className="mb-1 flex items-center gap-1.5">
                        <Banknote size={12} className="text-emerald-600" />
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Cash</p>
                      </div>
                      <p className="text-base font-black text-emerald-700 font-mono">{fmtMoney(r.revenueReport?.byMethod.cash)}</p>
                    </div>
                    <div className="rounded-xl border border-purple-200 bg-purple-50/20 p-3">
                      <div className="mb-1 flex items-center gap-1.5">
                        <Wallet size={12} className="text-purple-600" />
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Wallet</p>
                      </div>
                      <p className="text-base font-black text-purple-700 font-mono">{fmtMoney(r.revenueReport?.byMethod.wallet)}</p>
                    </div>
                    <div className="rounded-xl border border-sky-200 bg-sky-50/20 p-3">
                      <div className="mb-1 flex items-center gap-1.5">
                        <QrCode size={12} className="text-sky-600" />
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Bank / QR</p>
                      </div>
                      <p className="text-base font-black text-sky-750 font-mono">{fmtMoney(r.revenueReport?.byMethod.online)}</p>
                    </div>
                  </div>

                  <p className="mt-2.5 text-right text-[11px] text-slate-400 font-medium">
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
