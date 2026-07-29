import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { AdminHeroBanner } from '@/components/admin/AdminHeroBanner';
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
    <div className="relative overflow-hidden rounded-2xl glass-premium border border-sky-100/70 p-4 shadow-sm backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-blue-500/25 group">
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500/10 via-blue-500/30 to-indigo-500/10" />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400 font-mono">{label}</p>
          <p className="mt-2 font-mono text-xl font-black text-slate-900">{value}</p>
        </div>
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${tone} transition-transform duration-300 group-hover:scale-110`}>
          <Icon size={18} />
        </span>
      </div>
      <p className="mt-2 text-[10px] font-semibold leading-relaxed text-slate-500">{note}</p>
    </div>
  );
}


export function RevenueAnalyticsPage() {
  const [from, setFrom] = useState(() => isoDay(new Date(Date.now() - 29 * 24 * 60 * 60 * 1000)));
  const [to, setTo] = useState(() => isoDay(new Date()));
  const [report, setReport] = useState<RevenueReport | null>(null);
  const [reconciliation, setReconciliation] = useState<RevenueReconciliation | null>(null);
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [paymentType, setPaymentType] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [reportRes, reconciliationRes, paymentsRes] = await Promise.all([
        adminApi.revenue.report({ from, to }), adminApi.revenue.reconciliation(24),
        adminApi.revenue.transactions({ from, to, limit: 30, type: paymentType || undefined, status: paymentStatus || undefined }),
      ]);
      setReport((reportRes as { data?: RevenueReport }).data ?? null);
      setReconciliation((reconciliationRes as { data?: RevenueReconciliation }).data ?? null);
      setPayments((paymentsRes as { data?: { items?: AdminPayment[] } }).data?.items ?? []);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Failed to load revenue data.');
    } finally {
      setLoading(false);
    }
  }, [from, to, paymentStatus, paymentType]);

  useEffect(() => { void loadData(); }, [loadData]);

  const summary = report?.summary;
  const sourceTotals = useMemo(() => {
    const totals = { parking: 0, reservation: 0, subscription: 0, penalty: 0 };
    report?.items.forEach((row) => Object.keys(totals).forEach((key) => { totals[key as keyof typeof totals] += row.bySource?.[key as keyof typeof totals] || 0; }));
    const max = Math.max(...Object.values(totals), 1);
    return Object.entries(totals).map(([key, value]) => ({ key, value, percent: Math.round((value / max) * 100) }));
  }, [report]);

  const reconciliationCount = (reconciliation?.pendingCash.count || 0) + (reconciliation?.staleElectronic.count || 0) + (reconciliation?.reconciliationRequired.count || 0) + (reconciliation?.walletIntegrity.mismatchCount || 0);

  return (
    <div className="space-y-6 pb-12">

      {/* ── SECTION 1: Revenue Hero Banner ── */}
      <AdminHeroBanner
        badge="SYSTEM-OWNER FINANCE"
        title="Revenue, without the noise."
        description="A focused view of collected revenue, exceptions, refunds and system payment ledger."
        icon={<Landmark size={22} />}
        rightElement={
          <div className="flex flex-wrap items-center gap-2.5">
            {[
              { label: 'From', value: from, set: setFrom },
              { label: 'To', value: to, set: setTo },
            ].map((field) => (
              <label
                key={field.label}
                className="flex min-h-11 items-center gap-2.5 rounded-xl border border-white/20 bg-white/10 hover:bg-white/15 px-3.5 py-2 backdrop-blur-md transition-all shadow-sm group focus-within:border-white/50 focus-within:ring-2 focus-within:ring-white/20"
              >
                <Calendar size={14} className="text-blue-300 group-hover:text-white transition-colors shrink-0" />
                <span className="text-[9px] font-black uppercase text-blue-200 font-mono tracking-wider">
                  {field.label}
                </span>
                <input
                  type="date"
                  value={field.value}
                  onChange={(event) => field.set(event.target.value)}
                  className="w-28 bg-transparent text-xs font-mono font-bold text-white outline-none cursor-pointer [color-scheme:dark]"
                />
              </label>
            ))}
            <Button
              onClick={() => void loadData()}
              disabled={loading}
              className="h-11 gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 border border-white/20 px-5 text-xs font-black text-white shadow-md shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Refresh
            </Button>
          </div>
        }
      />



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

      {/* ── Reconciliation Status Cards ── */}
      <section className="grid gap-4 lg:grid-cols-4">
        {[
          {
            label: 'Pending cash',
            count: `${reconciliation?.pendingCash.count || 0} item(s)`,
            amount: fmtVnd(reconciliation?.pendingCash.amount),
            accent: { bg: 'rgba(245,158,11,0.07)', border: 'rgba(245,158,11,0.25)', top: 'linear-gradient(90deg, transparent, #f59e0b, transparent)', text: '#d97706', badge: 'rgba(245,158,11,0.12)' },
            icon: <Banknote size={16} />,
          },
          {
            label: 'Electronic over 24h',
            count: `${reconciliation?.staleElectronic.count || 0} item(s)`,
            amount: fmtVnd(reconciliation?.staleElectronic.amount),
            accent: { bg: 'rgba(249,115,22,0.07)', border: 'rgba(249,115,22,0.25)', top: 'linear-gradient(90deg, transparent, #f97316, transparent)', text: '#ea580c', badge: 'rgba(249,115,22,0.12)' },
            icon: <Clock3 size={16} />,
          },
          {
            label: 'Needs reconciliation',
            count: `${reconciliation?.reconciliationRequired.count || 0} item(s)`,
            amount: fmtVnd(reconciliation?.reconciliationRequired.amount),
            accent: { bg: 'rgba(239,68,68,0.07)', border: 'rgba(239,68,68,0.22)', top: 'linear-gradient(90deg, transparent, #ef4444, transparent)', text: '#dc2626', badge: 'rgba(239,68,68,0.12)' },
            icon: <CircleAlert size={16} />,
          },
          {
            label: 'Wallet & ledger',
            count: `${reconciliation?.walletIntegrity.mismatchCount || 0} mismatch(es)`,
            amount: `Checked ${reconciliation?.walletIntegrity.checked || 0} wallet(s)`,
            accent: { bg: 'rgba(16,185,129,0.07)', border: 'rgba(16,185,129,0.22)', top: 'linear-gradient(90deg, transparent, #10b981, transparent)', text: '#059669', badge: 'rgba(16,185,129,0.12)' },
            icon: <ShieldCheck size={16} />,
          },
        ].map((card) => (
          <div
            key={card.label}
            className="relative overflow-hidden rounded-2xl p-4 transition-all duration-300"
            style={{
              background: card.accent.bg,
              border: `1px solid ${card.accent.border}`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}
          >
            <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: card.accent.top }} />
            <div className="flex items-center gap-2 mb-3">
              <span
                className="flex h-7 w-7 items-center justify-center rounded-lg"
                style={{ background: card.accent.badge, color: card.accent.text }}
              >
                {card.icon}
              </span>
              <p
                className="text-[10px] font-black uppercase tracking-[0.14em]"
                style={{ color: card.accent.text }}
              >
                {card.label}
              </p>
            </div>
            <p className="text-lg font-black text-slate-900">{card.count}</p>
            <p className="text-xs font-bold mt-0.5" style={{ color: card.accent.text }}>{card.amount}</p>
          </div>
        ))}
      </section>

      {/* ── Revenue Breakdown Section ── */}
      <section className="grid gap-6 xl:grid-cols-5">
        {/* Revenue by source */}
        <div
          className="rounded-3xl p-5 xl:col-span-2"
          style={{
            background: '#fff',
            border: '1px solid rgba(226,232,240,0.8)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
          }}
        >
          <div className="mb-5">
            <h3 className="text-sm font-black text-slate-900">Revenue by source</h3>
            <p className="text-[10px] font-semibold text-slate-400 mt-0.5">
              Penalty fees are tracked separately from parking fees.
            </p>
          </div>
          <div className="space-y-5">
            {sourceTotals.map((source) => (
              <div key={source.key}>
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-600">{SOURCE_LABELS[source.key]}</span>
                  <span className="font-mono font-black text-slate-900">{fmtVnd(source.value)}</span>
                </div>
                <div
                  className="h-2 overflow-hidden rounded-full"
                  style={{ background: 'rgba(226,232,240,0.6)' }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${source.percent}%`,
                      background: 'linear-gradient(90deg, #0093E9, #00C6FF)',
                      boxShadow: source.percent > 0 ? '0 0 8px rgba(0,147,233,0.4)' : 'none',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue by building */}
        <div
          className="overflow-hidden rounded-3xl xl:col-span-3"
          style={{
            background: '#fff',
            border: '1px solid rgba(226,232,240,0.8)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
          }}
        >
          <div
            className="p-5"
            style={{ borderBottom: '1px solid rgba(226,232,240,0.6)' }}
          >
            <h3 className="text-sm font-black text-slate-900">Revenue by building</h3>
            <p className="text-[10px] font-semibold text-slate-400 mt-0.5">
              Gross, refund, net and cash not yet handed over per building.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-xs">
              <thead
                className="text-[9px] font-black uppercase tracking-wider"
                style={{ background: 'rgba(248,250,252,0.9)', color: '#94a3b8' }}
              >
                <tr>
                  <th className="px-5 py-3">Building</th>
                  <th className="px-4 py-3 text-right">Gross</th>
                  <th className="px-4 py-3 text-right">Refund</th>
                  <th className="px-4 py-3 text-right">Net</th>
                  <th className="px-5 py-3 text-right">Pending cash</th>
                </tr>
              </thead>
              <tbody style={{ '--tw-divide-color': 'rgba(226,232,240,0.4)' } as React.CSSProperties}>
                {report?.items.length ? (
                  report.items.map((row) => (
                    <tr
                      key={row.buildingId}
                      className="border-t border-slate-100 transition-colors duration-150 hover:bg-sky-50/40"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <Building2 size={14} style={{ color: '#0093E9' }} />
                          <div>
                            <p className="font-black text-slate-700">{row.buildingName || 'Building'}</p>
                            <p className="font-mono text-[9px] text-slate-400">{row.buildingCode}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right font-mono font-bold" style={{ color: '#059669' }}>
                        {fmtVnd(row.grossRevenue)}
                      </td>
                      <td className="px-4 py-4 text-right font-mono font-bold" style={{ color: '#dc2626' }}>
                        {fmtVnd(row.refunds)}
                      </td>
                      <td className="px-4 py-4 text-right font-mono font-black" style={{ color: '#0073b7' }}>
                        {fmtVnd(row.netRevenue)}
                      </td>
                      <td className="px-5 py-4 text-right font-mono font-bold" style={{ color: '#d97706' }}>
                        {fmtVnd(row.pendingCash)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center" style={{ color: '#94a3b8' }}>
                      No cash flow in this date range.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── Transaction Ledger ── */}
      <section
        className="overflow-hidden rounded-3xl"
        style={{
          background: '#fff',
          border: '1px solid rgba(226,232,240,0.8)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
        }}
      >
        <div
          className="flex flex-col justify-between gap-3 p-5 md:flex-row md:items-center"
          style={{ borderBottom: '1px solid rgba(226,232,240,0.6)' }}
        >
          <div>
            <h3 className="flex items-center gap-2 text-sm font-black text-slate-900">
              <ReceiptText size={16} style={{ color: '#0093E9' }} /> System-wide transaction ledger
            </h3>
            <p className="text-[10px] font-semibold text-slate-400 mt-0.5">
              Payment is the source of truth for Admin to review and trace.
            </p>
          </div>
          <div className="flex gap-2">
            <select
              value={paymentType}
              onChange={(event) => setPaymentType(event.target.value)}
              className="h-10 rounded-xl px-3 text-xs font-bold text-slate-600 outline-none transition-all"
              style={{ background: '#f8fafc', border: '1px solid rgba(226,232,240,0.9)' }}
            >
              <option value="">All types</option>
              {Object.entries(TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <select
              value={paymentStatus}
              onChange={(event) => setPaymentStatus(event.target.value)}
              className="h-10 rounded-xl px-3 text-xs font-bold text-slate-600 outline-none transition-all"
              style={{ background: '#f8fafc', border: '1px solid rgba(226,232,240,0.9)' }}
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
            <thead
              className="text-[9px] font-black uppercase tracking-wider"
              style={{ background: 'rgba(248,250,252,0.9)', color: '#94a3b8' }}
            >
              <tr>
                <th className="px-5 py-3">Time</th>
                <th className="px-4 py-3">Building / Plate</th>
                <th className="px-4 py-3">Cash flow type</th>
                <th className="px-4 py-3">Channel</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-5 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {payments.length ? payments.map((payment) => {
                const isOutflow = payment.type === 'refund';
                const effectiveTime = payment.settledAt || payment.createdAt;
                return (
                  <tr
                    key={payment._id}
                    className="border-t border-slate-100 transition-colors duration-150 hover:bg-sky-50/30"
                  >
                    <td className="px-5 py-4">
                      <p className="flex items-center gap-1.5 font-semibold text-slate-600">
                        <Clock3 size={12} /> {fmtTime(effectiveTime)}
                      </p>
                      {payment.status === 'pending' && (
                        <p className="mt-1 text-[9px] font-bold" style={{ color: '#d97706' }}>Not yet recorded as revenue</p>
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
                          ? <ArrowDownLeft size={13} style={{ color: '#dc2626' }} />
                          : <ArrowUpRight size={13} style={{ color: '#059669' }} />}
                        {TYPE_LABELS[payment.type] || payment.type}
                      </span>
                    </td>
                    <td className="px-4 py-4 font-mono uppercase text-slate-500">{payment.method}</td>
                    <td className="px-4 py-4">
                      <span
                        className="inline-flex rounded-full border px-2 py-1 text-[9px] font-black uppercase"
                        style={{
                          ...(() => {
                            const styles: Record<string, { borderColor: string; background: string; color: string }> = {
                              success: { borderColor: 'rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.1)', color: '#059669' },
                              pending: { borderColor: 'rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.1)', color: '#d97706' },
                              failed: { borderColor: 'rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.1)', color: '#dc2626' },
                              refunded: { borderColor: 'rgba(100,116,139,0.25)', background: 'rgba(100,116,139,0.08)', color: '#475569' },
                              reconciliation_required: { borderColor: 'rgba(249,115,22,0.3)', background: 'rgba(249,115,22,0.1)', color: '#ea580c' },
                            };
                            return styles[payment.status] ?? { borderColor: 'rgba(226,232,240,0.8)', background: '#f8fafc', color: '#64748b' };
                          })()
                        }}
                      >
                        {String(payment.status).replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className={`px-5 py-4 text-right font-mono font-black`} style={{ color: isOutflow ? '#dc2626' : '#0f172a' }}>
                      {isOutflow ? '−' : '+'}{fmtVnd(payment.amount)}
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center" style={{ color: '#94a3b8' }}>
                    No transactions match the current filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Separation of Duties Info Banner ── */}
      <div
        className="flex gap-3 rounded-2xl p-4 text-xs"
        style={{
          background: 'linear-gradient(135deg, rgba(0,82,212,0.06), rgba(67,100,247,0.04))',
          border: '1px solid rgba(0,82,212,0.18)',
          boxShadow: '0 2px 12px rgba(0,82,212,0.08)',
        }}
      >
        <CircleAlert size={18} className="mt-0.5 shrink-0" style={{ color: '#0073b7' }} />
        <div>
          <p className="font-black" style={{ color: '#0052D4' }}>Separation of duties principle</p>
          <p className="mt-1 leading-relaxed" style={{ color: '#1a6fe8' }}>
            Admin monitors and investigates anomalies system-wide. The building Manager remains
            the one who confirms actual cash on site; Admin never confirms on their behalf, to
            preserve reconciliation integrity.
          </p>
        </div>
      </div>
    </div>
  );
}


