import { Pie, PieChart, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { motion } from 'framer-motion';
import { AnalyticsCard } from '@/components/charts/AnalyticsCard';
import { ActivityTimeline } from '@/components/charts/ActivityTimeline';
import { RevenueChart } from '@/components/charts/RevenueChart';
import { BuildingOccupancyChart } from '@/components/charts/BuildingOccupancyChart';
import { useAdminDataset } from '@/hooks/admin/useAdminDataset';
import { Activity, CreditCard, ShieldCheck, TrendingUp } from 'lucide-react';
import styles from '@/styles/modules/DashboardOverviewPage.module.css';

const pieColors = ['#2563eb', '#10b981', '#8b5cf6', '#f59e0b']; // Blue, Green, Purple, Amber
const STAT_ICONS = [
  <TrendingUp size={18} />,
  <Activity size={18} />,
  <CreditCard size={18} />,
  <ShieldCheck size={18} />,
];

const sectionVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 90, damping: 18, delay: i * 0.1 },
  }),
};

const getOccupancyTextColor = (rate: number) => {
  if (rate >= 75) return 'text-emerald-600';
  if (rate >= 40) return 'text-blue-600';
  return 'text-amber-600';
};

export function DashboardOverviewPage() {
  const { data, isLoading, error } = useAdminDataset();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-24 text-sm text-slate-500 font-semibold glass-premium rounded-3xl">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-orange-500 border-t-transparent mb-3" />
        Loading parking overview...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-rose-500/20 bg-rose-950/20 p-5 text-sm font-semibold text-rose-400 backdrop-blur-md">
        {error || 'Failed to load data.'}
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 relative">
      {/* Dynamic 5D Crystal Ambient Glows */}
      <div className={`absolute top-0 right-1/4 w-[450px] h-[450px] rounded-full bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.18),transparent_70%)] pointer-events-none blur-3xl -z-10 animate-pulse ${styles.ambientGlow}`} />
      <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-[radial-gradient(circle_at_center,rgba(14,165,233,0.16),transparent_70%)] pointer-events-none blur-3xl -z-10" />
      <div className="absolute top-1/2 left-1/3 w-[300px] h-[300px] rounded-full bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.12),transparent_70%)] pointer-events-none blur-3xl -z-10" />

      {/* ── SECTION 1: Welcome Hero Banner ── */}
      <motion.section
        custom={0}
        initial="hidden"
        animate="visible"
        variants={sectionVariants}
        className="relative overflow-hidden rounded-3xl border border-indigo-400/20 bg-gradient-to-br from-blue-700 via-indigo-600 to-purple-600 p-8 text-white shadow-xl"
      >
        {/* Radial glows inside the hero */}
        <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.15),transparent_70%)] pointer-events-none blur-xl animate-pulse" />
        <div className="absolute -left-12 -bottom-12 h-48 w-48 rounded-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08),transparent_70%)] pointer-events-none blur-xl" />
        {/* Horizontal scan line on hero */}
        <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
          <div className="w-full h-[1.5px] bg-gradient-to-r from-transparent via-white/25 to-transparent absolute top-1/2 cyber-shimmer" />
        </div>

        <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/10 border border-white/20 text-[9px] font-black uppercase tracking-widest text-white font-mono shadow-sm">
              Central Admin Portal
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)]">
              PBMS System Overview
            </h1>
            <p className="mt-3.5 max-w-2xl text-xs font-semibold text-blue-50/90 leading-relaxed drop-shadow-[0_1px_2px_rgba(0,0,0,0.1)]">
              A comprehensive monitoring center for multi-story parking. Track real-time revenue, manage payment-method distribution, review recent transactions and monitor live parking activity.
            </p>
          </div>
          <div className="inline-flex items-center gap-2.5 rounded-full bg-white/10 border border-white/20 px-4 py-2.5 text-xs font-black text-white uppercase font-mono shadow-md backdrop-blur-md">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
            <span>Live system</span>
          </div>
        </div>
      </motion.section>

      {/* ── SECTION 2: Metric Cards Grid with stagger ── */}
      <motion.section
        custom={1}
        initial="hidden"
        animate="visible"
        variants={sectionVariants}
        className={`grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4 ${styles.statGrid}`}
      >
        {data.dashboardStats.map((stat, index) => (
          <AnalyticsCard
            key={stat.key}
            label={stat.label}
            value={stat.value}
            delta={stat.delta}
            index={index}
            icon={STAT_ICONS[index % STAT_ICONS.length]}
          />
        ))}
      </motion.section>

      {/* ── SECTION 3: Revenue Chart + Pie Distribution ── */}
      <motion.section
        custom={2}
        initial="hidden"
        animate="visible"
        variants={sectionVariants}
        className="grid gap-6 xl:grid-cols-[2fr,1fr]"
      >
        <RevenueChart data={data.revenueTrend} />

        {/* Pie Distribution Card */}
        <div className="relative overflow-hidden rounded-3xl glass-premium p-6 shadow-lg border border-sky-100/80 transition-all duration-500 hover:shadow-[0_22px_45px_rgba(37,99,235,0.08)] hover:-translate-y-1 hover:border-blue-500/30 group">
          {/* Crystal Bevel Border */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500/10 via-blue-500/40 to-indigo-500/10" />
          
          <div className="absolute -right-16 -top-16 h-32 w-32 rounded-full bg-[radial-gradient(circle_at_center,rgba(14,165,233,0.12),transparent_65%)] pointer-events-none blur-2xl animate-pulse" />
          
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-400 font-mono">Method distribution</h3>
            <span className="px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-[9px] font-black text-blue-500 font-mono uppercase tracking-wider shadow-[0_0_8px_rgba(59,130,246,0.1)]">Live</span>
          </div>

          <div className="h-[240px] w-full flex items-center justify-center cyber-scanline rounded-xl">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.paymentMethodDistribution}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={90}
                  innerRadius={52}
                  paddingAngle={4}
                  stroke="rgba(255,255,255,0.9)"
                  strokeWidth={2.5}
                >
                  {data.paymentMethodDistribution.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={pieColors[index % pieColors.length]}
                      style={{ filter: `drop-shadow(0 2px 8px ${pieColors[index % pieColors.length]}45)` }}
                    />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white/95 border border-blue-500/20 px-3 py-2 rounded-xl shadow-xl text-[10px] text-slate-800 backdrop-blur-md">
                          <p className="font-mono font-black uppercase tracking-wider text-slate-400">{payload[0].name}</p>
                          <p className="font-black mt-1 font-mono text-xs" style={{ color: payload[0].payload.fill }}>
                            {payload[0].value}%
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Neon legend rows */}
          <div className="mt-3 space-y-2">
            {data.paymentMethodDistribution.map((entry, idx) => {
              const color = pieColors[idx % pieColors.length];
              return (
                <div key={entry.name} className="flex items-center justify-between text-[10px] font-bold font-mono">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}30` }} />
                    <span className="text-slate-500 uppercase tracking-wider">{entry.name}</span>
                  </div>
                  <span className="font-black text-slate-700" style={{ color }}>{entry.value}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </motion.section>

      {/* ── SECTION 4: Activity / Transactions / Guardrails ── */}
      <motion.section
        custom={3}
        initial="hidden"
        animate="visible"
        variants={sectionVariants}
        className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3"
      >
        {/* Activity logs */}
        <div className="relative overflow-hidden rounded-3xl glass-premium p-6 shadow-lg border border-sky-100/80 transition-all duration-500 hover:shadow-[0_22px_45px_rgba(37,99,235,0.08)] hover:-translate-y-1 hover:border-blue-500/30 group">
          {/* Crystal Bevel Border */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500/10 via-blue-500/40 to-indigo-500/10" />
          <ActivityTimeline title="Live parking activity" items={data.liveActivities as any} />
        </div>

        {/* Buildings performance */}
        <div className="relative overflow-hidden rounded-3xl glass-premium p-6 shadow-lg border border-sky-100/80 transition-all duration-500 hover:shadow-[0_22px_45px_rgba(37,99,235,0.08)] hover:-translate-y-1 hover:border-blue-500/30 group">
          {/* Crystal Bevel Border */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500/10 via-blue-500/40 to-indigo-500/10" />
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-400 font-mono">Building performance</h3>
            <span className="px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-[9px] font-black text-blue-500 font-mono uppercase tracking-wider shadow-[0_0_8px_rgba(59,130,246,0.1)]">{data.buildings.length} bldg</span>
          </div>

          <BuildingOccupancyChart buildings={data.buildings} />

          {data.buildings.length > 0 && (
            <div className="mt-3 max-h-[180px] overflow-y-auto pr-1 space-y-2">
              {data.buildings.slice(0, 8).map((b) => (
                <motion.div
                  key={b.id}
                  whileHover={{ scale: 1.01, x: 2 }}
                  className="flex items-center justify-between gap-3 rounded-xl border border-blue-500/10 bg-sky-50/40 px-3 py-2 transition-all duration-300 hover:border-blue-500/35 hover:shadow-[0_0_12px_rgba(37,99,235,0.06)]"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-black text-xs text-slate-800 truncate">{b.name}</p>
                    <p className="mt-0.5 text-[10px] text-slate-500 font-semibold truncate">{b.address}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className={`text-xs font-black font-mono ${getOccupancyTextColor(b.occupancyRate)}`}>{b.occupancyRate}%</p>
                    <p className="text-[10px] text-slate-500 font-mono">{b.revenueToday.toLocaleString('vi-VN')} VND</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Operational guardrails */}
        <div className="relative overflow-hidden rounded-3xl glass-premium p-6 shadow-lg border border-sky-100/80 transition-all duration-500 hover:shadow-[0_22px_45px_rgba(37,99,235,0.08)] hover:-translate-y-1 hover:border-blue-500/30 group">
          {/* Crystal Bevel Border */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500/10 via-blue-500/40 to-indigo-500/10" />
          <div className="mb-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-400 font-mono">Operational blockers</h3>
          </div>
          <div className="space-y-3">
            {data.operationalGuardrails.map((rule, idx) => {
              const dotColors = [
                'bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.45)]',
                'bg-purple-500 shadow-[0_0_6px_rgba(139,92,246,0.45)]',
                'bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.45)]',
              ];
              const dotColor = dotColors[idx % dotColors.length];
              return (
                <motion.div
                  key={rule}
                  whileHover={{ x: 3 }}
                  className="rounded-2xl border border-blue-500/10 bg-sky-50/40 p-4 text-[11px] text-slate-700 font-semibold leading-relaxed transition-all hover:border-blue-500/35 hover:shadow-[0_0_10px_rgba(59,130,246,0.06)]"
                >
                  <div className="flex gap-2.5 items-start">
                    <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${dotColor}`} />
                    <span>{rule}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.section>
    </div>
  );
}
