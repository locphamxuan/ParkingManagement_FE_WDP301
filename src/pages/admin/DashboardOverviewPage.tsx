import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Activity, Building2, CreditCard, ShieldCheck, TrendingUp } from 'lucide-react';
import { AnalyticsCard } from '@/components/charts/AnalyticsCard';
import { ActivityTimeline } from '@/components/charts/ActivityTimeline';
import { RevenueChart } from '@/components/charts/RevenueChart';
import { useAdminDataset } from '@/hooks/admin/useAdminDataset';

const pieColors = ['#2563eb', '#14b8a6', '#8b5cf6', '#f59e0b'];
const STAT_ICONS = [<Building2 size={18} />, <Activity size={18} />, <CreditCard size={18} />, <ShieldCheck size={18} />];

const occupancyTone = (rate: number) => rate >= 75 ? 'bg-emerald-500' : rate >= 40 ? 'bg-blue-600' : 'bg-amber-500';

export function DashboardOverviewPage() {
  const { data, isLoading, error } = useAdminDataset();

  if (isLoading) {
    return <div className="glass-premium-deep flex min-h-[320px] flex-col items-center justify-center rounded-2xl text-sm font-medium text-slate-500"><span className="mb-3 h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />Loading dashboard…</div>;
  }
  if (error || !data) {
    return <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm font-semibold text-rose-700">{error || 'Failed to load data.'}</div>;
  }

  return (
    <div className="space-y-6 pb-12">
      <section className="relative overflow-hidden rounded-2xl bg-slate-950 px-6 py-7 text-white shadow-[0_18px_44px_-24px_rgba(15,23,42,0.8)] sm:px-8">
        <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_80%_28%,rgba(59,130,246,0.45),transparent_45%),radial-gradient(circle_at_58%_100%,rgba(20,184,166,0.2),transparent_42%)]" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-200">Central admin portal</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Operations at a glance</h1>
            <p className="mt-3 text-sm leading-6 text-slate-300">A clear view of what is happening across your parking operations today.</p>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(52,211,153,0.12)]" />
            <div><p className="text-xs font-bold">System operational</p><p className="mt-0.5 text-[11px] text-slate-300">Live monitoring enabled</p></div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {data.dashboardStats.map((stat, index) => <AnalyticsCard key={stat.key} label={stat.label} value={stat.value} delta={stat.delta} index={index} icon={STAT_ICONS[index % STAT_ICONS.length]} />)}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.75fr)_minmax(300px,0.85fr)]">
        <RevenueChart data={data.revenueTrend} />
        <section className="card-3d glass-premium-deep rounded-2xl border border-slate-200/80 p-6">
          <div className="mb-5 flex items-start justify-between"><div><h3 className="text-base font-extrabold text-slate-900">Payment methods</h3><p className="mt-1 text-xs text-slate-500">Share of collected payments</p></div><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">Today</span></div>
          {data.paymentMethodDistribution.length ? <><div className="h-[190px]"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={data.paymentMethodDistribution} dataKey="value" nameKey="name" innerRadius={54} outerRadius={76} paddingAngle={3} stroke="#fff" strokeWidth={3}>{data.paymentMethodDistribution.map((entry, index) => <Cell key={entry.name} fill={pieColors[index % pieColors.length]} />)}</Pie><Tooltip content={({ active, payload }) => active && payload?.length ? <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg"><p className="font-semibold text-slate-500">{payload[0].name}</p><p className="mt-1 font-black text-slate-900">{payload[0].value}%</p></div> : null} /></PieChart></ResponsiveContainer></div><div className="space-y-2.5">{data.paymentMethodDistribution.map((entry, index) => <div key={entry.name} className="flex items-center justify-between text-sm"><div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: pieColors[index % pieColors.length] }} /><span className="font-medium text-slate-600">{entry.name}</span></div><span className="font-bold text-slate-900">{entry.value}%</span></div>)}</div></> : <div className="flex h-[250px] items-center justify-center rounded-xl bg-slate-50 text-sm text-slate-500">No payment data available.</div>}
        </section>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <section className="glass-premium-deep rounded-2xl border border-slate-200/80 p-6"><ActivityTimeline title="Recent activity" items={data.liveActivities} /></section>
        <section className="glass-premium-deep rounded-2xl border border-slate-200/80 p-6"><div className="mb-5 flex items-start justify-between"><div><h3 className="text-base font-extrabold text-slate-900">Building occupancy</h3><p className="mt-1 text-xs text-slate-500">Current capacity by building</p></div><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">{data.buildings.length} total</span></div><div className="space-y-4">{data.buildings.slice(0, 5).map((building) => <div key={building.id}><div className="mb-2 flex items-center justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-bold text-slate-800">{building.name}</p><p className="truncate text-[11px] text-slate-500">{building.address}</p></div><span className="shrink-0 text-sm font-black text-slate-900">{building.occupancyRate}%</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${occupancyTone(building.occupancyRate)}`} style={{ width: `${Math.min(building.occupancyRate, 100)}%` }} /></div></div>)}{data.buildings.length === 0 ? <p className="py-8 text-center text-sm text-slate-500">No buildings available.</p> : null}</div></section>
        <section className="glass-premium-deep rounded-2xl border border-slate-200/80 p-6"><div className="mb-5"><h3 className="text-base font-extrabold text-slate-900">Operating reminders</h3><p className="mt-1 text-xs text-slate-500">Controls that keep daily operations consistent</p></div><div className="space-y-3">{data.operationalGuardrails.map((rule) => <div key={rule} className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3.5"><TrendingUp size={16} className="mt-0.5 shrink-0 text-blue-600" /><p className="text-xs font-medium leading-5 text-slate-600">{rule}</p></div>)}</div></section>
      </section>
    </div>
  );
}
