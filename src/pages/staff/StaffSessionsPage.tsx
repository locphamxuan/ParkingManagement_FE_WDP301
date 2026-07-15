import { useCallback, useEffect, useState } from 'react';
import { Banknote, Wallet, QrCode, CircleDollarSign, RefreshCw, Car, MapPin, Clock, ClipboardCheck, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useBuildingContext } from '@/hooks/useBuildingContext';
import { useAssignedGates } from '@/hooks/staff/useAssignedGates';
import { staffApi, extractShifts, type ShiftRevenueSummary, type ParkingSession, type MyShift } from '@/services/staff/staffApi';

const todayKey = () => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

const fmtMoney = (n?: number | null) => (n != null ? `${n.toLocaleString('vi-VN')} ₫` : '—');
const fmtTime = (s?: string | null) =>
  s ? new Date(s).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '—';
const fmtDate = (s?: string | null) =>
  s ? new Date(s).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '';

const METHOD_LABELS: Record<string, string> = {
  cash: 'Cash',
  wallet: 'Wallet',
  qr: 'Bank transfer',
  payos: 'Bank transfer',
  card: 'Card',
};

function CheckInHistory({ buildingId }: { buildingId: string }) {
  const [items, setItems] = useState<ParkingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!buildingId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await staffApi.sessions.myCheckIns(buildingId);
      const raw = (res as any)?.data;
      setItems(raw?.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history');
    } finally {
      setLoading(false);
    }
  }, [buildingId]);

  useEffect(() => {
    void refresh();
    const timer = setInterval(() => void refresh(), 30_000);
    return () => clearInterval(timer);
  }, [refresh]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Car size={18} className="text-primary" />
          <div>
            <h2 className="text-base font-semibold text-foreground">Entry history</h2>
            <p className="text-xs text-muted-foreground">
              Vehicles you have admitted — today {fmtDate(new Date().toISOString())}
            </p>
          </div>
        </div>
        <Button variant="secondary" size="sm" onClick={refresh} className="gap-1.5">
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{error}</div>
      )}

      <div className="grid gap-2 sm:grid-cols-2">
        <Card className="border border-primary/25 bg-primary/5">
          <CardContent className="p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total entries</p>
            <p className="mt-2 text-3xl font-black text-primary">{loading ? '—' : items.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Car size={14} className="text-primary" /> Entries today
            <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
              {items.length}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Loading...</p>
          ) : items.length === 0 ? (
            <div className="py-8 text-center">
              <Car size={28} className="mx-auto mb-2 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No entries in this shift yet.</p>
            </div>
          ) : (
            <div className="grid gap-2">
              {items.map((s) => (
                <div key={s._id} className="rounded-xl border border-border bg-card/50 px-4 py-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="rounded border border-amber-500/25 bg-amber-500/10 px-2 py-0.5 font-mono text-xs font-bold text-amber-300">
                      {s.plateNumber}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock size={11} />
                      {fmtTime(s.entryTime)}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <MapPin size={11} className="text-primary" />
                      Entry gate: <strong className="text-foreground ml-1">{s.entryGate?.code ?? '—'}</strong>
                    </span>
                    <span className="text-muted-foreground">
                      Floor: <strong className="text-foreground">{(s.slot as any)?.floor?.name ?? (s.slot as any)?.floor?.code ?? '—'}</strong>
                    </span>
                    <span className="text-muted-foreground">
                      Slot: <strong className="text-foreground">{s.slot?.code ?? '—'}</strong>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Check-in staff: lịch sử xe vào hôm nay (có location).
 * Check-out staff: doanh thu ca (tiền đã thu theo phương thức).
 */
export function StaffSessionsPage() {
  const { buildingId } = useBuildingContext();
  const { showCheckOut } = useAssignedGates();
  const [data, setData] = useState<ShiftRevenueSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ca hôm nay của nhân viên tại tòa này → để gửi báo cáo doanh thu cuối ca cho manager.
  const [todayShift, setTodayShift] = useState<MyShift | null>(null);
  const [reportBusy, setReportBusy] = useState(false);
  const [reportMsg, setReportMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const reportSubmittedAt = todayShift?.revenueReport?.submittedAt ?? null;

  const refresh = useCallback(async () => {
    if (!buildingId || !showCheckOut) return;
    setLoading(true);
    setError(null);
    try {
      const [revRes, shiftsRes] = await Promise.all([
        staffApi.sessions.myShiftRevenue(buildingId),
        staffApi.myShifts({ workDate: todayKey(), building: buildingId }),
      ]);
      setData((revRes as { data?: ShiftRevenueSummary })?.data ?? null);
      const shifts = extractShifts(shiftsRes);
      setTodayShift(shifts.find((s) => s.building?._id === buildingId) ?? shifts[0] ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load shift revenue');
    } finally {
      setLoading(false);
    }
  }, [buildingId, showCheckOut]);

  const submitReport = useCallback(async () => {
    if (!todayShift?._id) {
      setReportMsg({ type: 'err', text: 'No shift assigned today — nothing to report.' });
      return;
    }
    setReportBusy(true);
    setReportMsg(null);
    try {
      const res = await staffApi.submitShiftReport(todayShift._id);
      const item = (res as { data?: { item: MyShift } })?.data?.item;
      if (item) setTodayShift(item);
      setReportMsg({ type: 'ok', text: 'End-of-shift report submitted to your manager.' });
    } catch (err) {
      setReportMsg({ type: 'err', text: err instanceof Error ? err.message : 'Failed to submit report' });
    } finally {
      setReportBusy(false);
    }
  }, [todayShift]);

  useEffect(() => {
    if (!showCheckOut) return;
    void refresh();
    const timer = setInterval(() => void refresh(), 30_000);
    return () => clearInterval(timer);
  }, [refresh, showCheckOut]);

  // Check-in staff: show check-in history
  if (!showCheckOut) {
    return <CheckInHistory buildingId={buildingId} />;
  }

  // Check-out staff: show revenue summary
  const stats = [
    { label: 'Cash', value: data?.byMethod.cash ?? 0, icon: Banknote, border: 'border-emerald-500/20 bg-emerald-500/5', color: 'text-emerald-500' },
    { label: 'Wallet', value: data?.byMethod.wallet ?? 0, icon: Wallet, border: 'border-violet-500/20 bg-violet-500/5', color: 'text-violet-500' },
    { label: 'Bank transfer / QR', value: data?.byMethod.online ?? 0, icon: QrCode, border: 'border-sky-500/20 bg-sky-500/5', color: 'text-sky-500' },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CircleDollarSign size={18} className="text-primary" />
          <div>
            <h2 className="text-base font-semibold text-foreground">Doanh thu ca</h2>
            <p className="text-xs text-muted-foreground">
              Fees you collected on exit — today {fmtDate(data?.date)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {reportSubmittedAt ? (
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-500">
              <CheckCircle2 size={13} /> Report submitted
            </span>
          ) : (
            <Button size="sm" onClick={submitReport} disabled={reportBusy || loading} className="gap-1.5">
              {reportBusy ? <RefreshCw size={13} className="animate-spin" /> : <ClipboardCheck size={13} />}
              Submit end-of-shift report
            </Button>
          )}
          <Button variant="secondary" size="sm" onClick={refresh} className="gap-1.5">
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
          </Button>
        </div>
      </div>

      {reportMsg && (
        <div className={`rounded-lg border px-3 py-2 text-sm ${reportMsg.type === 'ok' ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-500' : 'border-rose-500/25 bg-rose-500/10 text-rose-500'}`}>
          {reportMsg.text}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{error}</div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="border border-primary/25 bg-primary/5">
          <CardContent className="p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total collected today</p>
            <p className="mt-2 text-3xl font-black text-primary">{loading ? '—' : fmtMoney(data?.total)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Number of releases</p>
            <p className="mt-2 text-3xl font-black text-foreground">{loading ? '—' : (data?.count ?? 0)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className={`border ${s.border}`}>
              <CardContent className="p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Icon size={14} className={s.color} />
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{s.label}</p>
                </div>
                <p className="text-xl font-bold text-foreground">{loading ? '—' : fmtMoney(s.value)}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Car size={14} className="text-primary" /> Collected transactions
            <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
              {data?.items.length ?? 0}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Loading...</p>
          ) : !data || data.items.length === 0 ? (
            <div className="py-8 text-center">
              <CircleDollarSign size={28} className="mx-auto mb-2 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No collections in this shift yet.</p>
            </div>
          ) : (
            <div className="grid gap-2">
              {data.items.map((it) => (
                <div key={it._id} className="flex items-center justify-between rounded-lg border border-border bg-card/50 px-4 py-2.5">
                  <div className="flex items-center gap-3">
                    <span className="rounded border border-amber-500/25 bg-amber-500/10 px-2 py-0.5 font-mono text-xs font-bold text-amber-300">
                      {it.plateNumber ?? '—'}
                    </span>
                    <span className="text-xs text-muted-foreground">{METHOD_LABELS[it.method] ?? it.method}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-bold text-emerald-400">+{fmtMoney(it.amount)}</p>
                    <p className="text-[11px] text-muted-foreground">{fmtTime(it.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
