import { useCallback, useEffect, useState } from 'react';
import { ClipboardCheck, RefreshCw, TrendingUp, Banknote, Wallet, QrCode, Loader2 } from 'lucide-react';
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
      const res = await (managerApi.shifts as any).listReports(buildingId);
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
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Premium Header Hero Card */}
      <div className="premium-hero-card relative overflow-hidden rounded-3xl border-2 border-blue-100 bg-gradient-to-br from-white via-blue-50/5 to-indigo-50/10 p-6 shadow-md transition-all duration-300">
        {/* Ambient Glows */}
        <div className="absolute -right-16 -top-16 h-36 w-36 rounded-full bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.06),transparent_70%)] pointer-events-none blur-2xl animate-pulse" />
        
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-blue-600 text-[9px] font-black uppercase tracking-widest text-white shadow-sm font-mono">
              Finance & Audit
            </div>
            <h1 className="mt-2 text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <ClipboardCheck size={20} className="text-blue-600 animate-pulse stroke-[2.5]" />
              Shift Revenue Reports
            </h1>
            <p className="mt-1 text-xs font-bold text-slate-500">
              Audit and verify shift checkout reports submitted by exit-gate staff members.
            </p>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <Button
              variant="outline"
              onClick={refresh}
              disabled={loading}
              className="h-11 px-5 rounded-xl border-blue-100 bg-white text-slate-850 hover:bg-slate-50 font-black text-xs uppercase tracking-wider shadow-sm transition-all duration-200 active:scale-[0.98] gap-1.5"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
            </Button>
          </div>
        </div>
      </div>

      {error && (
        <p className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 p-3.5 rounded-2xl">{error}</p>
      )}

      {/* Summary cards with Left Accent Border */}
      {!loading && reports.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: 'Total revenue', val: fmtMoney(totalRevenue), sub: `${reports.length} report(s)`, borderLeft: 'border-l-blue-500', icon: TrendingUp, color: 'text-blue-650 bg-blue-50/50 border-blue-100' },
            { label: 'Total sessions', val: `${totalSessions} sessions`, sub: 'vehicles checked out', borderLeft: 'border-l-indigo-500', icon: Wallet, color: 'text-indigo-655 bg-indigo-50/50 border-indigo-105' },
            { label: 'Avg. per report', val: fmtMoney(reports.length > 0 ? Math.round(totalRevenue / reports.length) : 0), sub: 'per staff shift', borderLeft: 'border-l-purple-500', icon: Banknote, color: 'text-purple-650 bg-purple-50/50 border-purple-100' },
          ].map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div key={idx} className={`rounded-2xl border border-slate-200/80 border-l-4 ${stat.borderLeft} bg-white p-5 shadow-sm hover:scale-[1.01] hover:shadow-md transition-all duration-305 flex items-center justify-between group select-none`}>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 font-mono">{stat.label}</p>
                  <p className="mt-1.5 text-xl font-black text-slate-800 font-mono group-hover:text-blue-755 transition-colors">{stat.val}</p>
                  <p className="mt-0.5 text-[10px] text-slate-400 font-semibold">{stat.sub}</p>
                </div>
                <div className={`p-2.5 rounded-xl border ${stat.color} group-hover:scale-105 transition-transform duration-355 shrink-0`}>
                  <Icon size={16} className="stroke-[2.5]" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reports table / list */}
      <Card className="border border-slate-200/80 bg-white shadow-sm overflow-hidden rounded-2xl">
        <CardHeader className="border-b border-slate-100 bg-slate-50/30 p-5">
          <CardTitle className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <ClipboardCheck size={14} className="text-blue-600 stroke-[2.5]" />
            Submitted Shift Reports
            <span className="ml-1 rounded-md bg-blue-50 px-2 py-0.5 text-[9px] font-black text-blue-600 border border-blue-100 font-mono">
              {reports.length}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {loading ? (
            <div className="flex items-center gap-2 text-slate-650 text-xs font-bold p-8 justify-center bg-white rounded-2xl">
              <Loader2 className="animate-spin mr-2" size={16} />
              <span>Loading shift revenue reports...</span>
            </div>
          ) : reports.length === 0 ? (
            <div className="py-10 text-center">
              <ClipboardCheck size={28} className="mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-semibold text-slate-600">No shift reports submitted yet.</p>
              <p className="mt-1 text-xs text-slate-450 font-medium">
                Exit-gate staff submit reports from their Shift page.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map((r) => (
                <div
                  key={r._id}
                  className="rounded-2xl border border-slate-100 bg-white p-5 transition-all duration-300 hover:border-blue-300 hover:shadow-sm"
                >
                  {/* Top row: staff + gate + date */}
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-50 pb-3">
                    <div>
                      <p className="text-sm font-bold text-slate-850">
                        {r.staff?.fullName ?? '—'}
                      </p>
                      <p className="text-[10px] text-slate-400 font-semibold">{r.staff?.email ?? ''}</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {r.gate && (
                        <span className="rounded-md border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[9px] font-black uppercase text-blue-600 font-mono">
                          {r.gate.name ?? r.gate.code} · {DIRECTION_LABEL[r.gate.direction] ?? r.gate.direction}
                        </span>
                      )}
                      {r.shift && (
                        <span className="rounded-md border border-slate-100 bg-slate-50 px-2.5 py-0.5 text-[9px] font-black uppercase text-slate-600 font-mono">
                          {r.shift.name ?? r.shift.code}
                        </span>
                      )}
                      <span className="rounded-md border border-slate-100 bg-slate-50 px-2.5 py-0.5 text-[9px] font-black uppercase text-slate-600 font-mono">
                        {fmtDate(r.workDate)}
                      </span>
                    </div>
                  </div>

                  {/* Revenue breakdown */}
                  <div className="mt-3 grid gap-3 grid-cols-2 sm:grid-cols-4">
                    <div className="rounded-xl border border-blue-200 bg-blue-50/20 p-3">
                      <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 font-mono">Total Revenue</p>
                      <p className="mt-1 text-base font-black text-blue-600 font-mono">{fmtMoney(r.revenueReport?.total)}</p>
                      <p className="text-[10px] text-slate-450 font-semibold">{r.revenueReport?.count ?? 0} vehicles</p>
                    </div>
                    <div className="rounded-xl border border-emerald-100 bg-emerald-50/20 p-3">
                      <div className="mb-1 flex items-center gap-1.5">
                        <Banknote size={12} className="text-emerald-600" />
                        <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 font-mono">Cash</p>
                      </div>
                      <p className="text-base font-black text-emerald-700 font-mono">{fmtMoney(r.revenueReport?.byMethod.cash)}</p>
                    </div>
                    <div className="rounded-xl border border-purple-105 bg-purple-50/20 p-3">
                      <div className="mb-1 flex items-center gap-1.5">
                        <Wallet size={12} className="text-purple-650" />
                        <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 font-mono">Wallet</p>
                      </div>
                      <p className="text-base font-black text-purple-700 font-mono">{fmtMoney(r.revenueReport?.byMethod.wallet)}</p>
                    </div>
                    <div className="rounded-xl border border-blue-105 bg-blue-50/20 p-3">
                      <div className="mb-1 flex items-center gap-1.5">
                        <QrCode size={12} className="text-blue-650" />
                        <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 font-mono">Bank / QR</p>
                      </div>
                      <p className="text-base font-black text-blue-700 font-mono">{fmtMoney(r.revenueReport?.byMethod.online)}</p>
                    </div>
                  </div>

                  <p className="mt-2.5 text-right text-[10px] text-slate-400 font-bold font-mono uppercase tracking-wide">
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
