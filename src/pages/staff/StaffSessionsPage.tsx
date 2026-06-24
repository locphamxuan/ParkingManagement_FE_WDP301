import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Banknote,
  Wallet,
  QrCode,
  CircleDollarSign,
  RefreshCw,
  Car,
  LogIn,
  PackageCheck,
  CalendarCheck2,
  UserCheck,
  Users,
  SendHorizonal,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useBuildingContext } from '@/hooks/useBuildingContext';
import {
  staffApi,
  type ShiftRevenueSummary,
  type ShiftRevenueItem,
  type MyShift,
  extractShifts,
  categorizeSession,
} from '@/services/staff/staffApi';

const fmtMoney = (n?: number | null) =>
  n != null ? `${n.toLocaleString('vi-VN')} ₫` : '—';
const fmtTime = (s?: string | null) =>
  s
    ? new Date(s).toLocaleString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
      })
    : '—';

const METHOD_LABELS: Record<string, string> = {
  cash: 'Cash',
  wallet: 'Wallet',
  qr: 'Bank transfer / QR',
  payos: 'Bank transfer / QR',
  card: 'Card',
  long_term: 'Long-term package',
};

type CheckInRecord = {
  _id: string;
  plateNumber: string;
  entryTime: string;
  entryGate?: { code: string; name?: string } | null;
  slot?: { code: string } | null;
  vehicleType?: { name: string } | null;
};

const SESSION_TYPE_CONFIG = {
  package: {
    label: 'Package',
    icon: PackageCheck,
    border: 'border-violet-500/20 bg-violet-500/5',
    color: 'text-violet-400',
    badge: 'bg-violet-500/15 text-violet-400 border-violet-500/25',
  },
  reservation: {
    label: 'Reservation',
    icon: CalendarCheck2,
    border: 'border-sky-500/20 bg-sky-500/5',
    color: 'text-sky-400',
    badge: 'bg-sky-500/15 text-sky-400 border-sky-500/25',
  },
  account: {
    label: 'Registered user',
    icon: UserCheck,
    border: 'border-emerald-500/20 bg-emerald-500/5',
    color: 'text-emerald-400',
    badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  },
  walkin: {
    label: 'Walk-in guest',
    icon: Users,
    border: 'border-amber-500/20 bg-amber-500/5',
    color: 'text-amber-400',
    badge: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
  },
} as const;

type CategoryKey = keyof typeof SESSION_TYPE_CONFIG;

function computeByType(items: ShiftRevenueItem[]): Record<CategoryKey, { amount: number; count: number }> {
  const result: Record<CategoryKey, { amount: number; count: number }> = {
    package: { amount: 0, count: 0 },
    reservation: { amount: 0, count: 0 },
    account: { amount: 0, count: 0 },
    walkin: { amount: 0, count: 0 },
  };
  for (const item of items) {
    const key = categorizeSession(item);
    result[key].amount += item.amount;
    result[key].count += 1;
  }
  return result;
}

export function StaffSessionsPage() {
  const { buildingId } = useBuildingContext();

  const [todayShift, setTodayShift] = useState<MyShift | null | undefined>(undefined);
  const [revenueData, setRevenueData] = useState<ShiftRevenueSummary | null>(null);
  const [checkIns, setCheckIns] = useState<CheckInRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTypeFilter, setActiveTypeFilter] = useState<CategoryKey | 'all'>('all');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportSubmitted, setReportSubmitted] = useState(false);

  const gateDirection = todayShift?.gate?.direction;
  // Entry-only gate: can view revenue but NOT submit report
  const isEntryGate = gateDirection === 'in';
  // Can submit report: exit gate or both-direction gate
  const canSubmitReport = gateDirection === 'out' || gateDirection === 'both';
  // Has a shift today
  const hasShiftToday = todayShift !== null && todayShift !== undefined;

  const refresh = useCallback(async () => {
    if (!buildingId) return;
    setLoading(true);
    setError(null);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const shiftsRes = await staffApi.myShifts({ workDate: today });
      const shifts = extractShifts(shiftsRes as Parameters<typeof extractShifts>[0]);
      const active = shifts.find((s) => s.status === 'active' || s.status === 'scheduled');
      setTodayShift(active ?? null);

      // Revenue only available when staff has a shift today
      if (!active) return;

      const direction = active?.gate?.direction;

      const revenueRes = await staffApi.sessions.myShiftRevenue(buildingId);
      setRevenueData((revenueRes as { data?: ShiftRevenueSummary })?.data ?? null);

      // Check-in history is only relevant for entry-gate staff.
      if (direction === 'in' || direction === 'both') {
        const res = await staffApi.sessions.myCheckins(buildingId);
        setCheckIns((res as { data?: { items?: CheckInRecord[] } })?.data?.items ?? []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load shift data.');
    } finally {
      setLoading(false);
    }
  }, [buildingId]);

  useEffect(() => {
    void refresh();
    const timer = setInterval(() => void refresh(), 30_000);
    return () => clearInterval(timer);
  }, [refresh]);

  const handleSubmitReport = useCallback(async () => {
    if (!todayShift?._id) return;
    setReportSubmitting(true);
    try {
      await staffApi.submitShiftReport(todayShift._id);
      setReportSubmitted(true);
    } catch {
      // ignore — shift might not have been found, silently fail
    } finally {
      setReportSubmitting(false);
    }
  }, [todayShift]);

  const byType = useMemo(
    () => (revenueData ? computeByType(revenueData.items) : null),
    [revenueData],
  );

  const filteredItems = useMemo(() => {
    if (!revenueData) return [];
    if (activeTypeFilter === 'all') return revenueData.items;
    return revenueData.items.filter((it) => categorizeSession(it) === activeTypeFilter);
  }, [revenueData, activeTypeFilter]);

  const methodStats = [
    {
      label: 'Cash',
      value: revenueData?.byMethod.cash ?? 0,
      icon: Banknote,
      border: 'border-emerald-500/20 bg-emerald-500/5',
      color: 'text-emerald-400',
    },
    {
      label: 'Wallet',
      value: revenueData?.byMethod.wallet ?? 0,
      icon: Wallet,
      border: 'border-violet-500/20 bg-violet-500/5',
      color: 'text-violet-400',
    },
    {
      label: 'Bank transfer / QR',
      value: revenueData?.byMethod.online ?? 0,
      icon: QrCode,
      border: 'border-sky-500/20 bg-sky-500/5',
      color: 'text-sky-400',
    },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CircleDollarSign size={18} className="text-primary" />
          <div>
            <h2 className="text-base font-semibold text-foreground">Shift revenue</h2>
            <p className="text-xs text-muted-foreground">
              {todayShift?.gate
                ? `Gate: ${todayShift.gate.name ?? todayShift.gate.code} · `
                : ''}
              Revenue collected this shift · Auto-refreshes every 30 s
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Only exit-gate (or both-direction) staff can submit a revenue report */}
          {canSubmitReport && (
            reportSubmitted ? (
              <span className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-400">
                <CheckCircle2 size={13} /> Report submitted
              </span>
            ) : todayShift?._id ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => void handleSubmitReport()}
                disabled={reportSubmitting}
                className="gap-1.5 border-primary/40 text-primary hover:bg-primary/10"
              >
                <SendHorizonal size={13} className={reportSubmitting ? 'animate-pulse' : ''} />
                {reportSubmitting ? 'Submitting…' : 'Submit report'}
              </Button>
            ) : null
          )}
          <Button variant="secondary" size="sm" onClick={refresh} className="gap-1.5">
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-sm text-rose-500">
          {error}
        </div>
      )}

      {/* ── No shift today: locked state ── */}
      {!loading && todayShift === null && (
        <div className="rounded-xl border border-amber-500/25 bg-amber-500/8 px-5 py-8 text-center">
          <CircleDollarSign size={32} className="mx-auto mb-3 text-amber-500/50" />
          <p className="text-sm font-semibold text-amber-300">Bạn chưa có ca làm việc hôm nay</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Doanh thu chỉ khả dụng khi được manager gán ca. Dashboard và các trang khác vẫn truy cập bình thường.
          </p>
        </div>
      )}

      {/* ── Entry gate: check-in history (shown in addition to revenue) ── */}
      {hasShiftToday && isEntryGate && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Car size={14} className="text-primary" /> Checked-in vehicles
              <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                {checkIns.length}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Loading...</p>
            ) : checkIns.length === 0 ? (
              <div className="py-8 text-center">
                <Car size={28} className="mx-auto mb-2 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">No vehicles checked in today.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                      <th className="pb-2 pr-4">Plate</th>
                      <th className="pb-2 pr-4">Entry gate</th>
                      <th className="pb-2 pr-4">Floor / Slot</th>
                      <th className="pb-2 pr-4">Vehicle type</th>
                      <th className="pb-2">Entry time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {checkIns.map((it) => (
                      <tr key={it._id} className="hover:bg-muted/30">
                        <td className="py-2 pr-4">
                          <span className="rounded border border-amber-500/25 bg-amber-500/10 px-2 py-0.5 font-mono text-xs font-bold text-amber-300">
                            {it.plateNumber}
                          </span>
                        </td>
                        <td className="py-2 pr-4 text-muted-foreground">
                          {it.entryGate?.name ?? it.entryGate?.code ?? '—'}
                        </td>
                        <td className="py-2 pr-4 text-muted-foreground">{it.slot?.code ?? '—'}</td>
                        <td className="py-2 pr-4 text-muted-foreground">{it.vehicleType?.name ?? '—'}</td>
                        <td className="py-2 text-muted-foreground">{fmtTime(it.entryTime)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Revenue breakdown (all staff with a shift today) ── */}
      {hasShiftToday && <>
          {/* Total + count */}
          <div className="grid gap-3 sm:grid-cols-2">
            <Card className="border border-primary/25 bg-primary/5">
              <CardContent className="p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Today's total
                </p>
                <p className="mt-2 text-3xl font-black text-primary">
                  {loading ? '—' : fmtMoney(revenueData?.total)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Vehicles checked out
                </p>
                <p className="mt-2 text-3xl font-black text-foreground">
                  {loading ? '—' : (revenueData?.count ?? 0)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* By payment method */}
          <div className="grid gap-3 sm:grid-cols-3">
            {methodStats.map((s) => {
              const Icon = s.icon;
              return (
                <Card key={s.label} className={`border ${s.border}`}>
                  <CardContent className="p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <Icon size={14} className={s.color} />
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {s.label}
                      </p>
                    </div>
                    <p className="text-xl font-bold text-foreground">
                      {loading ? '—' : fmtMoney(s.value)}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* By session type */}
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              By session type
            </p>
            <div className="grid gap-3 sm:grid-cols-4">
              {(Object.keys(SESSION_TYPE_CONFIG) as CategoryKey[]).map((key) => {
                const cfg = SESSION_TYPE_CONFIG[key];
                const Icon = cfg.icon;
                const stat = byType?.[key];
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActiveTypeFilter((prev) => (prev === key ? 'all' : key))}
                    className={`rounded-xl border p-4 text-left transition-all ${cfg.border} ${
                      activeTypeFilter === key
                        ? 'ring-2 ring-offset-1 ring-offset-background ' + cfg.color.replace('text-', 'ring-')
                        : ''
                    }`}
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <Icon size={14} className={cfg.color} />
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {cfg.label}
                      </p>
                    </div>
                    <p className="text-lg font-bold text-foreground">
                      {loading ? '—' : fmtMoney(stat?.amount ?? 0)}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {loading ? '' : `${stat?.count ?? 0} vehicle(s)`}
                    </p>
                  </button>
                );
              })}
            </div>
            {activeTypeFilter !== 'all' && (
              <button
                type="button"
                onClick={() => setActiveTypeFilter('all')}
                className="mt-2 text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
              >
                View all
              </button>
            )}
          </div>

          {/* Transaction list */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Car size={14} className="text-primary" />
                {activeTypeFilter === 'all'
                  ? 'Paid vehicles'
                  : `${SESSION_TYPE_CONFIG[activeTypeFilter].label} · paid`}
                <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                  {filteredItems.length}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="py-6 text-center text-sm text-muted-foreground">Loading...</p>
              ) : filteredItems.length === 0 ? (
                <div className="py-8 text-center">
                  <CircleDollarSign size={28} className="mx-auto mb-2 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">
                    {activeTypeFilter === 'all'
                      ? 'No payments collected this shift.'
                      : `No "${SESSION_TYPE_CONFIG[activeTypeFilter].label}" sessions this shift.`}
                  </p>
                </div>
              ) : (
                <div className="grid gap-2">
                  {filteredItems.map((it) => {
                    const cat = categorizeSession(it);
                    const catCfg = SESSION_TYPE_CONFIG[cat];
                    return (
                      <div
                        key={it._id}
                        className="flex items-center justify-between rounded-lg border border-border bg-card/50 px-4 py-2.5"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="shrink-0 rounded border border-amber-500/25 bg-amber-500/10 px-2 py-0.5 font-mono text-xs font-bold text-amber-300">
                            {it.plateNumber ?? '—'}
                          </span>
                          <span
                            className={`shrink-0 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${catCfg.badge}`}
                          >
                            <catCfg.icon size={10} />
                            {catCfg.label}
                          </span>
                          <span className="truncate text-xs text-muted-foreground">
                            {METHOD_LABELS[it.method] ?? it.method}
                          </span>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="font-mono font-bold text-emerald-400">+{fmtMoney(it.amount)}</p>
                          <p className="text-[11px] text-muted-foreground">{fmtTime(it.createdAt)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </>}
    </div>
  );
}
