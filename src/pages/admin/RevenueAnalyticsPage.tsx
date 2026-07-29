import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  Building2,
  Calendar,
  ChevronDown,
  CircleAlert,
  Coins,
  Landmark,
  ReceiptText,
  RefreshCw,
  ShieldCheck,
  TrendingDown,
  Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  adminApi,
  type AdminPayment,
  type RevenueReconciliation,
  type RevenueReport,
} from '@/services/admin/adminApi';

const fmtVnd = (value: number | null | undefined) => `${Number(value || 0).toLocaleString('vi-VN')} ₫`;
const isoDay = (date: Date) => date.toISOString().slice(0, 10);
const fmtTime = (value?: string | null) => value ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : 'Not reconciled';

const SOURCE_LABELS: Record<string, string> = {
  parking: 'Parking fee', reservation: 'Reservation', subscription: 'Subscription package', penalty: 'Penalty fee',
};
const TYPE_LABELS: Record<string, string> = {
  session: 'Parking fee', reservation: 'Reservation', subscription: 'Subscription package', penalty: 'Penalty fee', refund: 'Refund', topup: 'Top-up', cancellation_fee: 'Cancellation fee',
};
const STATUS_STYLE: Record<string, string> = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700', pending: 'border-amber-200 bg-amber-50 text-amber-700', failed: 'border-rose-200 bg-rose-50 text-rose-700', refunded: 'border-sky-200 bg-sky-50 text-sky-700', reconciliation_required: 'border-orange-200 bg-orange-50 text-orange-700',
};

function DateControl({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="flex h-10 items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 text-left backdrop-blur-sm">
    <Calendar size={13} className="text-blue-100" />
    <span className="text-[9px] font-black uppercase tracking-wider text-blue-100/80">{label}</span>
    <input type="date" value={value} onChange={(event) => onChange(event.target.value)} className="w-[106px] bg-transparent text-xs font-bold text-white outline-none [color-scheme:dark]" />
  </label>;
}

function SupportingMetric({ label, value, note, icon: Icon, tone }: { label: string; value: string; note: string; icon: typeof Coins; tone: string }) {
  return <div className="min-w-0 rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 transition-colors hover:border-blue-100 hover:bg-white">
    <div className="flex items-center gap-2"><span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${tone}`}><Icon size={14} /></span><p className="truncate text-[10px] font-black uppercase tracking-[0.1em] text-slate-500">{label}</p></div>
    <p className="mt-3 truncate text-lg font-black tracking-tight text-slate-900">{value}</p><p className="mt-1 line-clamp-2 text-[10px] leading-4 text-slate-500">{note}</p>
  </div>;
}

function ReconciliationSignal({ label, count, amount, tone }: { label: string; count: number; amount: number; tone: 'amber' | 'orange' | 'rose' | 'emerald' }) {
  const theme = {
    amber: 'border-amber-200 bg-amber-50/70 text-amber-700', orange: 'border-orange-200 bg-orange-50/70 text-orange-700', rose: 'border-rose-200 bg-rose-50/70 text-rose-700', emerald: 'border-emerald-200 bg-emerald-50/70 text-emerald-700',
  }[tone];
  return <div className={`rounded-xl border px-3.5 py-3 ${theme}`}><div className="flex items-center justify-between gap-3"><p className="text-[10px] font-black uppercase tracking-[0.09em]">{label}</p><span className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-black">{count}</span></div><p className="mt-1.5 text-sm font-black text-slate-900">{fmtVnd(amount)}</p></div>;
}

export function RevenueAnalyticsPage() {
  const [from, setFrom] = useState(() => isoDay(new Date(Date.now() - 29 * 24 * 60 * 60 * 1000)));
  const [to, setTo] = useState(() => isoDay(new Date()));
  const [report, setReport] = useState<RevenueReport | null>(null);
  const [reconciliation, setReconciliation] = useState<RevenueReconciliation | null>(null);
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [totalWalletBalance, setTotalWalletBalance] = useState(0);
  const [paymentType, setPaymentType] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAllTransactions, setShowAllTransactions] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [reportRes, reconciliationRes, paymentsRes, usersRes] = await Promise.all([
        adminApi.revenue.report({ from, to }), adminApi.revenue.reconciliation(24),
        adminApi.revenue.transactions({ from, to, limit: 30, type: paymentType || undefined, status: paymentStatus || undefined }),
        adminApi.users.list({ role: 'user', limit: '200' }),
      ]);
      setReport((reportRes as { data?: RevenueReport }).data ?? null);
      setReconciliation((reconciliationRes as { data?: RevenueReconciliation }).data ?? null);
      setPayments((paymentsRes as { data?: { items?: AdminPayment[] } }).data?.items ?? []);
      const users = (usersRes as { data?: { items?: Array<{ role?: string; walletBalance?: number }> } }).data?.items ?? [];
      setTotalWalletBalance(users.filter((user) => user.role === 'user').reduce((total, user) => total + Number(user.walletBalance || 0), 0));
      setShowAllTransactions(false);
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Failed to load revenue data.'); }
    finally { setLoading(false); }
  }, [from, to, paymentStatus, paymentType]);

  useEffect(() => { void loadData(); }, [loadData]);

  const summary = report?.summary;
  const sourceTotals = useMemo(() => {
    const totals = { parking: 0, reservation: 0, subscription: 0, penalty: 0 };
    report?.items.forEach((row) => Object.keys(totals).forEach((key) => { totals[key as keyof typeof totals] += row.bySource?.[key as keyof typeof totals] || 0; }));
    const max = Math.max(...Object.values(totals), 1);
    return Object.entries(totals).map(([key, value]) => ({ key, value, percent: Math.round((value / max) * 100) }));
  }, [report]);
  const visiblePayments = showAllTransactions ? payments : payments.slice(0, 8);
  const reconciliationCount = (reconciliation?.pendingCash.count || 0) + (reconciliation?.staleElectronic.count || 0) + (reconciliation?.reconciliationRequired.count || 0) + (reconciliation?.walletIntegrity.mismatchCount || 0);

  return <div className="space-y-5 pb-12">
    <section className="premium-hero-card relative overflow-hidden rounded-3xl bg-[#0b132b] p-5 text-white shadow-[0_22px_46px_-24px_rgba(11,19,43,0.8)] sm:p-6">
      <div className="absolute inset-y-0 right-0 w-3/5 bg-[radial-gradient(circle_at_90%_20%,rgba(0,147,233,0.52),transparent_44%),radial-gradient(circle_at_50%_100%,rgba(128,208,199,0.22),transparent_44%)]" />
      <div className="relative flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-xl"><p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-200">System-owner finance</p><h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">Revenue, without the noise.</h2><p className="mt-2 text-sm leading-5 text-slate-300">A focused view of collected revenue, exceptions and the payment ledger.</p></div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end"><div className="flex flex-wrap gap-2"><DateControl label="From" value={from} onChange={setFrom} /><DateControl label="To" value={to} onChange={setTo} /></div><Button onClick={() => void loadData()} disabled={loading} className="h-10 gap-2 rounded-xl bg-[#0093e9] px-4 text-xs font-black text-white shadow-[0_8px_18px_-8px_rgba(0,147,233,0.9)] hover:bg-[#0086d6]"><RefreshCw size={14} className={loading ? 'animate-spin' : ''} />Refresh</Button></div>
      </div>
      <div className="relative mt-6 grid gap-4 border-t border-white/10 pt-5 md:grid-cols-[minmax(0,1.3fr)_0.7fr_0.7fr]">
        <div><p className="text-[10px] font-black uppercase tracking-[0.15em] text-blue-100">Net revenue</p><p className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">{fmtVnd(summary?.netRevenue)}</p><p className="mt-2 text-xs text-slate-300">Collected charges less customer refunds.</p></div>
        <div className="rounded-xl border border-white/10 bg-white/10 p-3.5 backdrop-blur-sm"><p className="text-[10px] font-bold uppercase tracking-wider text-blue-100">Gross revenue</p><p className="mt-2 text-xl font-black">{fmtVnd(summary?.grossRevenue)}</p></div>
        <div className="rounded-xl border border-white/10 bg-white/10 p-3.5 backdrop-blur-sm"><p className="text-[10px] font-bold uppercase tracking-wider text-blue-100">Refunded</p><p className="mt-2 text-xl font-black">{fmtVnd(summary?.refunds)}</p></div>
      </div>
    </section>

    {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-700">{error}</div> : null}

    <section className="grid gap-4 lg:grid-cols-3"><SupportingMetric label="Cash awaiting handover" value={fmtVnd(summary?.pendingCash)} note={`${summary?.pendingCashPayments || 0} staff-recorded item(s) awaiting manager confirmation.`} icon={Banknote} tone="bg-amber-100 text-amber-700" /><SupportingMetric label="Wallet funding" value={fmtVnd(summary?.walletFunding)} note="Customer top-ups; held separately and never counted as revenue." icon={Coins} tone="bg-violet-100 text-violet-700" /><SupportingMetric label="Customer wallet liability" value={fmtVnd(totalWalletBalance)} note="Prepaid customer credit held by the system, not realised revenue." icon={Wallet} tone="bg-cyan-100 text-cyan-700" /></section>

    <section className="card-3d glass-premium-deep rounded-2xl border border-slate-200/80 p-4 sm:p-5"><div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><span className={`flex h-9 w-9 items-center justify-center rounded-xl ${reconciliationCount ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>{reconciliationCount ? <CircleAlert size={18} /> : <ShieldCheck size={18} />}</span><div><h3 className="text-sm font-black text-slate-900">Reconciliation pulse</h3><p className="text-xs text-slate-500">{reconciliationCount ? `${reconciliationCount} item(s) require attention` : 'No finance exceptions currently detected'}</p></div></div><span className={`w-fit rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${reconciliationCount ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>{reconciliationCount ? 'Attention' : 'Healthy'}</span></div><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><ReconciliationSignal label="Pending cash" count={reconciliation?.pendingCash.count || 0} amount={reconciliation?.pendingCash.amount || 0} tone="amber" /><ReconciliationSignal label="Electronic over 24h" count={reconciliation?.staleElectronic.count || 0} amount={reconciliation?.staleElectronic.amount || 0} tone="orange" /><ReconciliationSignal label="Needs reconciliation" count={reconciliation?.reconciliationRequired.count || 0} amount={reconciliation?.reconciliationRequired.amount || 0} tone="rose" /><ReconciliationSignal label="Wallet mismatches" count={reconciliation?.walletIntegrity.mismatchCount || 0} amount={0} tone="emerald" /></div></section>

    <section className="grid gap-5 xl:grid-cols-[minmax(300px,0.85fr)_minmax(0,1.5fr)]">
      <section className="card-3d glass-premium-deep rounded-2xl border border-slate-200/80 p-5"><div className="mb-5"><h3 className="text-base font-black text-slate-900">Revenue sources</h3><p className="mt-1 text-xs text-slate-500">Where collected service revenue originates.</p></div><div className="space-y-5">{sourceTotals.map((source) => <div key={source.key}><div className="mb-2 flex items-center justify-between gap-3 text-xs"><span className="font-bold text-slate-600">{SOURCE_LABELS[source.key]}</span><span className="font-mono font-black text-slate-900">{fmtVnd(source.value)}</span></div><div className="h-2.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-[#0093e9] to-[#80d0c7] shadow-[0_3px_10px_rgba(0,147,233,0.3)] transition-all duration-700" style={{ width: `${source.percent}%` }} /></div></div>)}</div></section>
      <section className="card-3d glass-premium-deep overflow-hidden rounded-2xl border border-slate-200/80"><div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5"><div><h3 className="text-base font-black text-slate-900">Building performance</h3><p className="mt-1 text-xs text-slate-500">Net revenue and exceptions per building.</p></div><Building2 size={18} className="text-blue-600" /></div><div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead className="bg-slate-50 text-[10px] font-black uppercase tracking-[0.1em] text-slate-400"><tr><th className="px-5 py-3">Building</th><th className="px-4 py-3 text-right">Gross</th><th className="hidden px-4 py-3 text-right md:table-cell">Refund</th><th className="px-5 py-3 text-right">Net</th></tr></thead><tbody className="divide-y divide-slate-100">{report?.items.length ? report.items.map((row) => <tr key={row.buildingId} className="transition-colors hover:bg-blue-50/50"><td className="px-5 py-3.5"><p className="font-bold text-slate-700">{row.buildingName || 'Building'}</p><p className="mt-0.5 font-mono text-[9px] text-slate-400">{row.buildingCode}</p></td><td className="px-4 py-3.5 text-right font-mono font-bold text-slate-700">{fmtVnd(row.grossRevenue)}</td><td className="hidden px-4 py-3.5 text-right font-mono font-bold text-rose-600 md:table-cell">{fmtVnd(row.refunds)}</td><td className="px-5 py-3.5 text-right font-mono font-black text-[#0086d6]">{fmtVnd(row.netRevenue)}</td></tr>) : <tr><td colSpan={4} className="px-5 py-10 text-center text-slate-400">No cash flow in this date range.</td></tr>}</tbody></table></div></section>
    </section>

    <section className="card-3d glass-premium-deep overflow-hidden rounded-2xl border border-slate-200/80"><div className="flex flex-col gap-4 border-b border-slate-100 p-5 lg:flex-row lg:items-center lg:justify-between"><div><h3 className="flex items-center gap-2 text-base font-black text-slate-900"><ReceiptText size={17} className="text-[#0093e9]" />Transaction ledger</h3><p className="mt-1 text-xs text-slate-500">Source records for traceability. Showing newest records first.</p></div><div className="flex flex-wrap gap-2"><select value={paymentType} onChange={(event) => setPaymentType(event.target.value)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 outline-none"><option value="">All types</option>{Object.entries(TYPE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><select value={paymentStatus} onChange={(event) => setPaymentStatus(event.target.value)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 outline-none"><option value="">All statuses</option><option value="success">Collected</option><option value="pending">Pending</option><option value="failed">Failed</option><option value="reconciliation_required">Needs reconciliation</option></select></div></div>
      {loading ? <div className="p-10 text-center text-sm font-medium text-slate-500">Loading payment records…</div> : payments.length ? <><div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[820px] text-left text-xs"><thead className="bg-slate-50 text-[10px] font-black uppercase tracking-[0.1em] text-slate-400"><tr><th className="px-5 py-3">Time</th><th className="px-4 py-3">Building / payer</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Channel</th><th className="px-4 py-3">Status</th><th className="px-5 py-3 text-right">Amount</th></tr></thead><tbody className="divide-y divide-slate-100">{visiblePayments.map((payment) => { const isOutflow = payment.type === 'refund'; return <tr key={payment._id} className="transition-colors hover:bg-blue-50/50"><td className="px-5 py-3.5 font-medium text-slate-500">{fmtTime(payment.settledAt || payment.createdAt)}</td><td className="px-4 py-3.5"><p className="font-bold text-slate-700">{payment.building?.name || 'No building'}</p><p className="mt-0.5 font-mono text-[9px] text-slate-400">{payment.parkingSession?.plateNumber || payment.user?.email || '—'}</p></td><td className="px-4 py-3.5"><span className="flex items-center gap-1.5 font-bold text-slate-600">{isOutflow ? <ArrowDownLeft size={13} className="text-rose-500" /> : <ArrowUpRight size={13} className="text-emerald-500" />}{TYPE_LABELS[payment.type] || payment.type}</span></td><td className="px-4 py-3.5 font-mono uppercase text-slate-500">{payment.method}</td><td className="px-4 py-3.5"><span className={`inline-flex rounded-full border px-2 py-1 text-[9px] font-black uppercase ${STATUS_STYLE[payment.status] || 'border-slate-200 bg-slate-50 text-slate-600'}`}>{payment.status.replace(/_/g, ' ')}</span></td><td className={`px-5 py-3.5 text-right font-mono font-black ${isOutflow ? 'text-rose-600' : 'text-slate-900'}`}>{isOutflow ? '−' : '+'}{fmtVnd(payment.amount)}</td></tr>; })}</tbody></table></div><div className="space-y-2 p-3 md:hidden">{visiblePayments.map((payment) => { const isOutflow = payment.type === 'refund'; return <div key={payment._id} className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-bold text-slate-800">{payment.building?.name || 'No building'}</p><p className="mt-0.5 text-[10px] text-slate-500">{fmtTime(payment.settledAt || payment.createdAt)} · {payment.method.toUpperCase()}</p></div><span className={`shrink-0 text-sm font-black ${isOutflow ? 'text-rose-600' : 'text-slate-900'}`}>{isOutflow ? '−' : '+'}{fmtVnd(payment.amount)}</span></div><div className="mt-3 flex items-center justify-between"><span className="text-xs font-semibold text-slate-600">{TYPE_LABELS[payment.type] || payment.type}</span><span className={`rounded-full border px-2 py-1 text-[9px] font-black uppercase ${STATUS_STYLE[payment.status] || 'border-slate-200 bg-slate-50 text-slate-600'}`}>{payment.status.replace(/_/g, ' ')}</span></div></div>; })}</div>{payments.length > 8 ? <div className="border-t border-slate-100 p-3 text-center"><button type="button" onClick={() => setShowAllTransactions((value) => !value)} className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-black text-blue-700 transition hover:bg-blue-50">{showAllTransactions ? 'Show fewer records' : `Show ${payments.length - 8} more records`}<ChevronDown size={14} className={showAllTransactions ? 'rotate-180 transition-transform' : 'transition-transform'} /></button></div> : null}</> : <div className="p-10 text-center text-sm text-slate-500">No transactions match the current filter.</div>}
    </section>

    <div className="flex gap-3 rounded-2xl border border-blue-100 bg-blue-50/60 p-4 text-xs text-blue-800"><CircleAlert size={17} className="mt-0.5 shrink-0 text-[#0093e9]" /><div><p className="font-black">Operational boundary</p><p className="mt-1 leading-relaxed text-blue-700">Admin monitors financial anomalies system-wide. Building Managers confirm physical cash on site, preserving the separation of duties and reconciliation integrity.</p></div></div>
  </div>;
}
