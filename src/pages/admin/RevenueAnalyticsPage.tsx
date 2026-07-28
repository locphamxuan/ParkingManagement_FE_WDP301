import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  Building2,
  Calendar,
  CircleAlert,
  Clock3,
  Coins,
  Landmark,
  ReceiptText,
  RefreshCw,
  Scale,
  ShieldCheck,
  TrendingDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  adminApi,
  type AdminPayment,
  type RevenueReconciliation,
  type RevenueReport,
} from '@/services/admin/adminApi';

const fmtVnd = (value: number | null | undefined) =>
  `${Number(value || 0).toLocaleString('vi-VN')} ₫`;
const isoDay = (date: Date) => date.toISOString().slice(0, 10);
const fmtTime = (value?: string | null) =>
  value
    ? new Intl.DateTimeFormat('vi-VN', {
        dateStyle: 'short',
        timeStyle: 'short',
      }).format(new Date(value))
    : 'Not reconciled';

const SOURCE_LABELS: Record<string, string> = {
  parking: 'Parking fee',
  reservation: 'Reservation',
  subscription: 'Subscription package',
  penalty: 'Penalty fee',
};

const TYPE_LABELS: Record<string, string> = {
  session: 'Parking fee',
  reservation: 'Reservation',
  subscription: 'Subscription package',
  penalty: 'Penalty fee',
  refund: 'Refund',
  topup: 'Top-up',
  cancellation_fee: 'Cancellation fee (legacy)',
};

const STATUS_STYLE: Record<string, string> = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  pending: 'border-amber-200 bg-amber-50 text-amber-700',
  failed: 'border-rose-200 bg-rose-50 text-rose-700',
  refunded: 'border-sky-200 bg-sky-50 text-sky-700',
  reconciliation_required: 'border-orange-200 bg-orange-50 text-orange-700',
};

function MetricCard({
  label,
  value,
  note,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  note: string;
  icon: typeof Coins;
  tone: string;
}) {
  return (
    <div className="rounded-2xl border border-sky-100/70 bg-white/70 p-4 shadow-sm backdrop-blur-xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">{label}</p>
          <p className="mt-2 font-mono text-xl font-black text-slate-900">{value}</p>
        </div>
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl border ${tone}`}>
          <Icon size={18} />
        </span>
      </div>
      <p className="mt-2 text-[10px] font-semibold leading-relaxed text-slate-500">{note}</p>
    </div>
  );
}

export function RevenueAnalyticsPage() {
  const [from, setFrom] = useState(() =>
    isoDay(new Date(Date.now() - 29 * 24 * 60 * 60 * 1000)),
  );
  const [to, setTo] = useState(() => isoDay(new Date()));
  const [report, setReport] = useState<RevenueReport | null>(null);
  const [reconciliation, setReconciliation] = useState<RevenueReconciliation | null>(null);
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [paymentType, setPaymentType] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [reportRes, reconciliationRes, paymentsRes] = await Promise.all([
        adminApi.revenue.report({ from, to }),
        adminApi.revenue.reconciliation(24),
        adminApi.revenue.transactions({
          from,
          to,
          limit: 30,
          type: paymentType || undefined,
          status: paymentStatus || undefined,
        }),
      ]);
      setReport((reportRes as { data?: RevenueReport }).data ?? null);
      setReconciliation(
        (reconciliationRes as { data?: RevenueReconciliation }).data ?? null,
      );
      setPayments(
        (paymentsRes as { data?: { items?: AdminPayment[] } }).data?.items ?? [],
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Failed to load revenue data.');
    } finally {
      setLoading(false);
    }
  }, [from, to, paymentStatus, paymentType]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const summary = report?.summary;
  const sourceTotals = useMemo(() => {
    const totals = { parking: 0, reservation: 0, subscription: 0, penalty: 0 };
    report?.items.forEach((row) => {
      Object.keys(totals).forEach((key) => {
        totals[key as keyof typeof totals] += row.bySource?.[key as keyof typeof totals] || 0;
      });
    });
    const max = Math.max(...Object.values(totals), 1);
    return Object.entries(totals).map(([key, value]) => ({
      key,
      value,
      percent: Math.round((value / max) * 100),
    }));
  }, [report]);

  return (
    <div className="space-y-6 pb-12">
      <section className="rounded-3xl border border-sky-100/70 bg-white/65 p-5 shadow-sm backdrop-blur-xl">
        <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-blue-200 bg-blue-50 text-blue-600">
              <Landmark size={20} />
            </span>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">
                System-owner finance
              </p>
              <h2 className="text-lg font-black text-slate-900">System-wide cash flow</h2>
              <p className="text-xs text-slate-500">
                Track collected revenue, refunds, cash not yet handed over and items needing reconciliation.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {[
              { label: 'From', value: from, set: setFrom },
              { label: 'To', value: to, set: setTo },
            ].map((field) => (
              <label
                key={field.label}
                className="flex min-h-11 items-center gap-2 rounded-xl border border-sky-100 bg-white px-3 py-2"
              >
                <Calendar size={13} className="text-slate-400" />
                <span className="text-[9px] font-black uppercase text-slate-400">
                  {field.label}
                </span>
                <input
                  type="date"
                  value={field.value}
                  onChange={(event) => field.set(event.target.value)}
                  className="w-28 bg-transparent text-xs font-bold text-slate-700 outline-none"
                />
              </label>
            ))}
            <Button
              onClick={() => void loadData()}
              disabled={loading}
              className="h-11 gap-2 rounded-xl bg-blue-600 px-5 text-xs font-black text-white"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Refresh
            </Button>
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-700">
          {error}
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          label="Gross revenue"
          value={fmtVnd(summary?.grossRevenue)}
          note="Successfully paid service charges, before refunds."
          icon={ArrowUpRight}
          tone="border-emerald-200 bg-emerald-50 text-emerald-600"
        />
        <MetricCard
          label="Refunded to customers"
          value={fmtVnd(summary?.refunds)}
          note="Money paid back to customers, deducted from gross revenue."
          icon={TrendingDown}
          tone="border-rose-200 bg-rose-50 text-rose-600"
        />
        <MetricCard
          label="Net revenue"
          value={fmtVnd(summary?.netRevenue)}
          note="Gross revenue minus refunds."
          icon={Scale}
          tone="border-blue-200 bg-blue-50 text-blue-600"
        />
        <MetricCard
          label="Cash pending handover"
          value={fmtVnd(summary?.pendingCash)}
          note={`${summary?.pendingCashPayments || 0} item(s) recorded by Staff, not yet confirmed by Manager.`}
          icon={Banknote}
          tone="border-amber-200 bg-amber-50 text-amber-600"
        />
        <MetricCard
          label="Top-up / wallet funding"
          value={fmtVnd(summary?.walletFunding)}
          note="Money moved into building wallets, not counted as revenue."
          icon={Coins}
          tone="border-violet-200 bg-violet-50 text-violet-600"
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
          <p className="text-[9px] font-black uppercase tracking-wider text-amber-600">
            Pending cash
          </p>
          <p className="mt-2 text-lg font-black text-slate-900">
            {reconciliation?.pendingCash.count || 0} item(s)
          </p>
          <p className="text-xs font-bold text-amber-700">
            {fmtVnd(reconciliation?.pendingCash.amount)}
          </p>
        </div>
        <div className="rounded-2xl border border-orange-200 bg-orange-50/70 p-4">
          <p className="text-[9px] font-black uppercase tracking-wider text-orange-600">
            Electronic over 24h
          </p>
          <p className="mt-2 text-lg font-black text-slate-900">
            {reconciliation?.staleElectronic.count || 0} item(s)
          </p>
          <p className="text-xs font-bold text-orange-700">
            {fmtVnd(reconciliation?.staleElectronic.amount)}
          </p>
        </div>
        <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-4">
          <p className="text-[9px] font-black uppercase tracking-wider text-rose-600">
            Needs reconciliation
          </p>
          <p className="mt-2 text-lg font-black text-slate-900">
            {reconciliation?.reconciliationRequired.count || 0} item(s)
          </p>
          <p className="text-xs font-bold text-rose-700">
            {fmtVnd(reconciliation?.reconciliationRequired.amount)}
          </p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
          <p className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider text-emerald-600">
            <ShieldCheck size={13} /> Wallet & ledger
          </p>
          <p className="mt-2 text-lg font-black text-slate-900">
            {reconciliation?.walletIntegrity.mismatchCount || 0} mismatch(es)
          </p>
          <p className="text-xs font-semibold text-emerald-700">
            Checked {reconciliation?.walletIntegrity.checked || 0} building wallet(s).
          </p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-5">
        <div className="rounded-3xl border border-sky-100/70 bg-white/65 p-5 shadow-sm xl:col-span-2">
          <div className="mb-5">
            <h3 className="text-sm font-black text-slate-900">Revenue by source</h3>
            <p className="text-[10px] font-semibold text-slate-500">
              Penalty fees are tracked separately from parking fees.
            </p>
          </div>
          <div className="space-y-5">
            {sourceTotals.map((source) => (
              <div key={source.key}>
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-600">{SOURCE_LABELS[source.key]}</span>
                  <span className="font-mono font-black text-slate-900">
                    {fmtVnd(source.value)}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-400"
                    style={{ width: `${source.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-sky-100/70 bg-white/65 shadow-sm xl:col-span-3">
          <div className="border-b border-sky-100/70 p-5">
            <h3 className="text-sm font-black text-slate-900">Revenue by building</h3>
            <p className="text-[10px] font-semibold text-slate-500">
              Gross, refund, net and cash not yet handed over per building.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-xs">
              <thead className="bg-slate-50/80 text-[9px] font-black uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-5 py-3">Building</th>
                  <th className="px-4 py-3 text-right">Gross</th>
                  <th className="px-4 py-3 text-right">Refund</th>
                  <th className="px-4 py-3 text-right">Net</th>
                  <th className="px-5 py-3 text-right">Pending cash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sky-50">
                {report?.items.length ? (
                  report.items.map((row) => (
                    <tr key={row.buildingId} className="hover:bg-sky-50/40">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <Building2 size={14} className="text-blue-600" />
                          <div>
                            <p className="font-black text-slate-700">{row.buildingName || 'Building'}</p>
                            <p className="font-mono text-[9px] text-slate-400">{row.buildingCode}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right font-mono font-bold text-emerald-600">
                        {fmtVnd(row.grossRevenue)}
                      </td>
                      <td className="px-4 py-4 text-right font-mono font-bold text-rose-600">
                        {fmtVnd(row.refunds)}
                      </td>
                      <td className="px-4 py-4 text-right font-mono font-black text-blue-600">
                        {fmtVnd(row.netRevenue)}
                      </td>
                      <td className="px-5 py-4 text-right font-mono font-bold text-amber-600">
                        {fmtVnd(row.pendingCash)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-slate-400">
                      No cash flow in this date range.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-sky-100/70 bg-white/65 shadow-sm">
        <div className="flex flex-col justify-between gap-3 border-b border-sky-100/70 p-5 md:flex-row md:items-center">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-black text-slate-900">
              <ReceiptText size={16} className="text-blue-600" /> System-wide transaction ledger
            </h3>
            <p className="text-[10px] font-semibold text-slate-500">
              Payment is the source of truth for Admin to review and trace.
            </p>
          </div>
          <div className="flex gap-2">
            <select
              value={paymentType}
              onChange={(event) => setPaymentType(event.target.value)}
              className="h-11 rounded-xl border border-sky-100 bg-white px-3 text-xs font-bold text-slate-600 outline-none"
            >
              <option value="">All types</option>
              {Object.entries(TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <select
              value={paymentStatus}
              onChange={(event) => setPaymentStatus(event.target.value)}
              className="h-11 rounded-xl border border-sky-100 bg-white px-3 text-xs font-bold text-slate-600 outline-none"
            >
              <option value="">All statuses</option>
              <option value="success">Collected</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="reconciliation_required">Needs reconciliation</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-xs">
            <thead className="bg-slate-50/80 text-[9px] font-black uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-5 py-3">Time</th>
                <th className="px-4 py-3">Building / Plate</th>
                <th className="px-4 py-3">Cash flow type</th>
                <th className="px-4 py-3">Channel</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-5 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sky-50">
              {payments.length ? payments.map((payment) => {
                const isOutflow = payment.type === 'refund';
                const effectiveTime = payment.settledAt || payment.createdAt;
                return (
                  <tr key={payment._id} className="hover:bg-sky-50/40">
                    <td className="px-5 py-4">
                      <p className="flex items-center gap-1.5 font-semibold text-slate-600">
                        <Clock3 size={12} /> {fmtTime(effectiveTime)}
                      </p>
                      {payment.status === 'pending' && (
                        <p className="mt-1 text-[9px] font-bold text-amber-600">Not yet recorded as revenue</p>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-bold text-slate-700">{payment.building?.name || 'No building'}</p>
                      <p className="font-mono text-[9px] text-slate-400">
                        {payment.parkingSession?.plateNumber || payment.user?.email || '—'}
                      </p>
                    </td>
                    <td className="px-4 py-4 font-bold text-slate-600">
                      <span className="flex items-center gap-1.5">
                        {isOutflow
                          ? <ArrowDownLeft size={13} className="text-rose-500" />
                          : <ArrowUpRight size={13} className="text-emerald-500" />}
                        {TYPE_LABELS[payment.type] || payment.type}
                      </span>
                    </td>
                    <td className="px-4 py-4 font-mono uppercase text-slate-600">{payment.method}</td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex rounded-full border px-2 py-1 text-[9px] font-black uppercase ${STATUS_STYLE[payment.status] || 'border-slate-200 bg-slate-50 text-slate-600'}`}>
                        {String(payment.status).replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className={`px-5 py-4 text-right font-mono font-black ${isOutflow ? 'text-rose-600' : 'text-slate-900'}`}>
                      {isOutflow ? '−' : '+'}{fmtVnd(payment.amount)}
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    No transactions match the current filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="flex gap-3 rounded-2xl border border-blue-200 bg-blue-50/70 p-4 text-xs text-blue-800">
        <CircleAlert size={18} className="mt-0.5 shrink-0 text-blue-600" />
        <div>
          <p className="font-black">Separation of duties principle</p>
          <p className="mt-1 leading-relaxed text-blue-700">
            Admin monitors and investigates anomalies system-wide. The building Manager remains
            the one who confirms actual cash on site; Admin never confirms on their behalf, to
            preserve reconciliation integrity.
          </p>
        </div>
      </div>
    </div>
  );
}
