import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Building2, ChevronRight, CircleAlert, CreditCard, Landmark, ReceiptText, ShieldCheck, WalletCards } from 'lucide-react';
import { AnalyticsCard } from '@/components/charts/AnalyticsCard';
import { ActivityTimeline } from '@/components/charts/ActivityTimeline';
import { RevenueChart } from '@/components/charts/RevenueChart';
import { Modal } from '@/components/ui/modal';
import { useAdminDataset } from '@/hooks/admin/useAdminDataset';
import { adminApi } from '@/services/admin/adminApi';
import type { AdminPayment, RevenueReconciliation } from '@/services/admin/adminApi';
import type { LiveActivityItem } from '@/services/admin/types';

const STAT_ICONS = [<Building2 size={18} />, <Activity size={18} />, <CreditCard size={18} />, <ShieldCheck size={18} />];

const occupancyTone = (rate: number) => rate >= 75 ? 'bg-emerald-500' : rate >= 40 ? 'bg-blue-600' : 'bg-amber-500';
const formatVnd = (value: number) => `${Math.round(value || 0).toLocaleString('vi-VN')} ₫`;
const formatTransactionTime = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });
};

const paymentMethodLabel: Record<AdminPayment['method'], string> = {
  cash: 'Cash', wallet: 'Wallet', qr: 'QR transfer', card: 'Bank card', payos: 'PayOS',
};

const paymentStatusTheme: Record<AdminPayment['status'], string> = {
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  pending: 'bg-amber-50 text-amber-700 ring-amber-100',
  failed: 'bg-rose-50 text-rose-700 ring-rose-100',
  refunded: 'bg-slate-100 text-slate-600 ring-slate-200',
  reconciliation_required: 'bg-orange-50 text-orange-700 ring-orange-100',
};

function ActivityDetailsModal({ item, onClose }: { item: LiveActivityItem | null; onClose: () => void }) {
  return (
    <Modal open={Boolean(item)} onOpenChange={(open) => { if (!open) onClose(); }} title="Audit activity details">
      {item ? (
        <div className="space-y-4 text-sm">
          <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-4">
            <p className="text-[11px] font-black uppercase tracking-[0.12em] text-blue-700">{item.action.replace(/_/g, ' ')}</p>
            <p className="mt-2 font-semibold leading-6 text-slate-800">{item.details || item.message || 'No additional description was recorded.'}</p>
          </div>
          <dl className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3"><dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Actor</dt><dd className="mt-1 font-semibold text-slate-700">{item.actor || 'System'}</dd></div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3"><dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Recorded at</dt><dd className="mt-1 font-semibold text-slate-700">{item.timestamp}</dd></div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 sm:col-span-2"><dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Target</dt><dd className="mt-1 font-semibold text-slate-700">{item.type || 'Platform operation'}</dd></div>
          </dl>
        </div>
      ) : null}
    </Modal>
  );
}

export function DashboardOverviewPage() {
  const { data, isLoading, error } = useAdminDataset();
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [reconciliation, setReconciliation] = useState<RevenueReconciliation | null>(null);
  const [isFinanceLoading, setIsFinanceLoading] = useState(true);
  const [selectedActivity, setSelectedActivity] = useState<LiveActivityItem | null>(null);

  useEffect(() => {
    let mounted = true;
    const loadOperationalFinance = async () => {
      try {
        const [transactionsResponse, reconciliationResponse] = await Promise.all([
          adminApi.revenue.transactions({ limit: 6 }),
          adminApi.revenue.reconciliation(24),
        ]);
        if (!mounted) return;
        setPayments(transactionsResponse.data.items || []);
        setReconciliation(reconciliationResponse.data);
      } catch {
        // The overview remains useful if a supplementary finance endpoint is unavailable.
        if (mounted) {
          setPayments([]);
          setReconciliation(null);
        }
      } finally {
        if (mounted) setIsFinanceLoading(false);
      }
    };
    void loadOperationalFinance();
    return () => { mounted = false; };
  }, []);

  const collectionSummary = useMemo(() => {
    const settled = payments.filter((payment) => payment.status === 'success');
    const cash = settled.filter((payment) => payment.method === 'cash').reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    const online = settled.filter((payment) => payment.method !== 'cash').reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    const total = cash + online;
    return { cash, online, total, settledCount: settled.length, cashShare: total > 0 ? Math.round((cash / total) * 100) : 0 };
  }, [payments]);

  const reconciliationIssueCount = (reconciliation?.pendingCash.count || 0) + (reconciliation?.staleElectronic.count || 0) + (reconciliation?.reconciliationRequired.count || 0) + (reconciliation?.walletIntegrity.mismatchCount || 0);
  const systemHealthy = !isFinanceLoading && reconciliationIssueCount === 0;

  if (isLoading) {
    return <div className="glass-premium-deep flex min-h-[320px] flex-col items-center justify-center rounded-2xl text-sm font-medium text-slate-500"><span className="mb-3 h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />Loading dashboard…</div>;
  }
  if (error || !data) {
    return <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm font-semibold text-rose-700">{error || 'Failed to load data.'}</div>;
  }

  return (
    <div className="space-y-6 pb-12">
      <section className="premium-hero-card relative overflow-hidden rounded-2xl bg-[linear-gradient(118deg,#073b8f_0%,#075fc7_54%,#0093e9_100%)] px-6 py-7 text-white shadow-[0_18px_44px_-24px_rgba(0,93,190,0.55)] sm:px-8">
        <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_80%_28%,rgba(0,147,233,0.48),transparent_45%),radial-gradient(circle_at_58%_100%,rgba(128,208,199,0.22),transparent_42%)]" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-200">Central admin portal</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Operations at a glance</h1>
            <p className="mt-3 text-sm leading-6 text-slate-300">Revenue, occupancy and operational controls in one focused workspace.</p>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm">
            <span className={`h-2.5 w-2.5 rounded-full shadow-[0_0_0_4px_rgba(52,211,153,0.12)] ${systemHealthy ? 'bg-emerald-400' : reconciliationIssueCount > 0 ? 'bg-amber-400' : 'bg-blue-300'}`} />
            <div><p className="text-xs font-bold">{systemHealthy ? 'System operational' : reconciliationIssueCount > 0 ? 'Review required' : 'Monitoring finance'}</p><p className="mt-0.5 text-[11px] text-slate-300">{reconciliationIssueCount > 0 ? `${reconciliationIssueCount} reconciliation item${reconciliationIssueCount === 1 ? '' : 's'}` : 'Live monitoring enabled'}</p></div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {data.dashboardStats.map((stat, index) => <AnalyticsCard key={stat.key} label={stat.label} value={stat.value} delta={stat.delta} index={index} icon={STAT_ICONS[index % STAT_ICONS.length]} />)}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.75fr)_minmax(320px,0.9fr)]">
        <RevenueChart data={data.revenueTrend} />
        <section className="card-3d glass-premium-deep rounded-2xl border border-slate-200/80 p-6">
          <div className="mb-5 flex items-start justify-between gap-4"><div><h3 className="text-base font-extrabold text-slate-900">Collections overview</h3><p className="mt-1 text-xs text-slate-500">Settled cash and electronic payments</p></div><Link to="/admin/revenue-analytics" className="flex shrink-0 items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700 transition hover:bg-blue-100">Ledger <ChevronRight size={13} /></Link></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-3.5"><div className="flex items-center gap-2 text-[11px] font-bold text-blue-700"><Landmark size={14} /> Cash</div><p className="mt-2 text-lg font-black tracking-tight text-slate-900">{formatVnd(collectionSummary.cash)}</p></div>
            <div className="rounded-xl border border-cyan-100 bg-gradient-to-br from-cyan-50 to-white p-3.5"><div className="flex items-center gap-2 text-[11px] font-bold text-cyan-700"><WalletCards size={14} /> Online</div><p className="mt-2 text-lg font-black tracking-tight text-slate-900">{formatVnd(collectionSummary.online)}</p></div>
          </div>
          <div className="mt-5"><div className="mb-2 flex items-center justify-between text-xs"><span className="font-semibold text-slate-600">Collection mix</span><span className="font-bold text-slate-900">{collectionSummary.cashShare}% cash / {100 - collectionSummary.cashShare}% online</span></div><div className="flex h-2.5 overflow-hidden rounded-full bg-cyan-100"><span className="bg-blue-600 transition-all duration-700" style={{ width: `${collectionSummary.cashShare}%` }} /><span className="flex-1 bg-gradient-to-r from-cyan-400 to-teal-400" /></div></div>
          <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4"><div><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Settled payments</p><p className="mt-1 text-sm font-black text-slate-900">{isFinanceLoading ? '…' : collectionSummary.settledCount}</p></div><div><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pending cash</p><p className="mt-1 text-sm font-black text-slate-900">{isFinanceLoading ? '…' : reconciliation?.pendingCash.count || 0}</p></div></div>
        </section>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <section className="glass-premium-deep rounded-2xl border border-slate-200/80 p-6"><ActivityTimeline title="Recent activity" items={data.liveActivities} onSelect={setSelectedActivity} /></section>
        <section className="glass-premium-deep rounded-2xl border border-slate-200/80 p-6"><div className="mb-5 flex items-start justify-between"><div><h3 className="text-base font-extrabold text-slate-900">Building occupancy</h3><p className="mt-1 text-xs text-slate-500">Current capacity by building</p></div><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">{data.buildings.length} total</span></div><div className="space-y-4">{data.buildings.slice(0, 5).map((building) => <div key={building.id}><div className="mb-2 flex items-center justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-bold text-slate-800">{building.name}</p><p className="truncate text-[11px] text-slate-500">{building.address}</p></div><span className="shrink-0 text-sm font-black text-slate-900">{building.occupancyRate}%</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full transition-all duration-700 ${occupancyTone(building.occupancyRate)}`} style={{ width: `${Math.min(building.occupancyRate, 100)}%` }} /></div></div>)}{data.buildings.length === 0 ? <p className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-sm text-slate-500">No buildings available.</p> : null}</div></section>
        <section className="glass-premium-deep rounded-2xl border border-slate-200/80 p-6"><div className="mb-5 flex items-start justify-between"><div><h3 className="text-base font-extrabold text-slate-900">Operations health</h3><p className="mt-1 text-xs text-slate-500">Items that need administrative attention</p></div><CircleAlert size={18} className={reconciliationIssueCount ? 'text-amber-500' : 'text-emerald-500'} /></div><div className="space-y-3"><div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5"><div className="flex items-center justify-between text-xs font-semibold text-slate-600"><span>Pending cash handover</span><span className="font-black text-slate-900">{isFinanceLoading ? '…' : reconciliation?.pendingCash.count || 0}</span></div></div><div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5"><div className="flex items-center justify-between text-xs font-semibold text-slate-600"><span>Electronic items to reconcile</span><span className="font-black text-slate-900">{isFinanceLoading ? '…' : (reconciliation?.staleElectronic.count || 0) + (reconciliation?.reconciliationRequired.count || 0)}</span></div></div><div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5"><div className="flex items-center justify-between text-xs font-semibold text-slate-600"><span>Wallet integrity mismatches</span><span className="font-black text-slate-900">{isFinanceLoading ? '…' : reconciliation?.walletIntegrity.mismatchCount || 0}</span></div></div><Link to="/admin/revenue-analytics" className="flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50 px-3.5 py-3 text-xs font-bold text-blue-700 transition hover:border-blue-200 hover:bg-blue-100">Review revenue controls <ChevronRight size={15} /></Link></div></section>
      </section>

      <section className="glass-premium-deep overflow-hidden rounded-2xl border border-slate-200/80">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="text-base font-extrabold text-slate-900">Latest transactions</h3><p className="mt-1 text-xs text-slate-500">Most recent payment records across all buildings</p></div><Link to="/admin/revenue-analytics" className="text-xs font-bold text-blue-700 hover:text-blue-800">Open revenue analytics</Link></div>
        <div className="divide-y divide-slate-100">{isFinanceLoading ? <div className="px-5 py-8 text-center text-sm text-slate-500">Loading transaction records…</div> : payments.length ? payments.slice(0, 5).map((payment) => <div key={payment._id} className="grid gap-2 px-5 py-4 sm:grid-cols-[minmax(0,1.3fr)_0.85fr_0.75fr_auto] sm:items-center"><div className="min-w-0"><p className="truncate text-sm font-bold text-slate-800">{payment.parkingSession?.plateNumber || payment.user?.fullName || 'Parking payment'}</p><p className="mt-0.5 text-xs text-slate-500">{payment.building?.name || 'System-wide'} · {formatTransactionTime(payment.settledAt || payment.createdAt)}</p></div><span className="text-xs font-semibold text-slate-600">{paymentMethodLabel[payment.method]}</span><span className={`w-fit rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-wide ring-1 ${paymentStatusTheme[payment.status]}`}>{payment.status.replace(/_/g, ' ')}</span><span className="text-sm font-black text-slate-900">{formatVnd(payment.amount)}</span></div>) : <div className="flex flex-col items-center gap-2 px-5 py-8 text-center"><ReceiptText size={20} className="text-blue-500" /><p className="text-sm font-semibold text-slate-700">No transaction has been recorded in the current operational window.</p><Link to="/admin/revenue-analytics" className="text-xs font-bold text-blue-700 hover:underline">Check the full ledger</Link></div>}</div>
      </section>

      <section className="glass-premium-deep rounded-2xl border border-slate-200/80 p-6"><div className="mb-5"><h3 className="text-base font-extrabold text-slate-900">Operating reminders</h3><p className="mt-1 text-xs text-slate-500">Controls that keep daily operations consistent</p></div><div className="grid gap-3 lg:grid-cols-3">{data.operationalGuardrails.map((rule) => <div key={rule} className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3.5"><ShieldCheck size={16} className="mt-0.5 shrink-0 text-blue-600" /><p className="text-xs font-medium leading-5 text-slate-600">{rule}</p></div>)}</div></section>
      <ActivityDetailsModal item={selectedActivity} onClose={() => setSelectedActivity(null)} />
    </div>
  );
}
