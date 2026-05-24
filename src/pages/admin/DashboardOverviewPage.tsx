import { motion } from "framer-motion";
import { AnalyticsCard } from "@/components/shared/AnalyticsCard";
import { ActivityTimeline } from "@/components/shared/ActivityTimeline";
import { RevenueChart } from "@/components/shared/RevenueChart";
import { useAdminDataset } from "@/hooks/admin/useAdminDataset";
import { Activity, CreditCard, ShieldCheck, TrendingUp } from "lucide-react";

const STAT_ICONS = [
  <TrendingUp size={14} />,
  <Activity size={14} />,
  <CreditCard size={14} />,
  <ShieldCheck size={14} />,
];

const sectionVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 90, damping: 18, delay: i * 0.1 },
  }),
};

export function DashboardOverviewPage() {
  const { data, isLoading, error } = useAdminDataset();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-24 text-sm text-slate-400 font-semibold bg-slate-950/40 rounded-3xl border border-white/5 backdrop-blur-md">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-orange-500 border-t-transparent mb-3" />
        Đang tải dữ liệu tổng quan bãi đỗ...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-rose-500/20 bg-rose-950/20 p-5 text-sm font-semibold text-rose-400 backdrop-blur-md">
        {error || "Tải dữ liệu thất bại."}
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 relative">
      {/* ── SECTION 1: Welcome Hero Banner ── */}
      <motion.section
        custom={0}
        initial="hidden"
        animate="visible"
        variants={sectionVariants}
        className="relative overflow-hidden rounded-3xl glow-border-pulse glass-premium p-8 shadow-2xl"
      >
        {/* Radial glows inside the hero */}
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-[radial-gradient(circle_at_center,rgba(249,115,22,0.12),transparent_70%)] pointer-events-none blur-2xl" />
        <div className="absolute -left-12 -bottom-12 h-36 w-36 rounded-full bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.09),transparent_70%)] pointer-events-none blur-2xl" />
        {/* Horizontal scan line on hero */}
        <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
          <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-orange-500/30 to-transparent absolute top-1/2 cyber-shimmer" />
        </div>

        <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-orange-500/10 border border-orange-500/20 text-[9px] font-black uppercase tracking-widest text-orange-400 font-mono">
              Cổng Quản Trị Trung Tâm
            </div>
            <h1 className="mt-2.5 text-3xl font-black tracking-tight text-white sm:text-4xl">
              Tổng quan{" "}
              <span className="bg-gradient-to-r from-orange-400 via-amber-400 to-purple-400 bg-clip-text text-transparent">
                Hệ Thống PBMS
              </span>
            </h1>
            <p className="mt-3.5 max-w-2xl text-xs font-semibold text-slate-300 leading-relaxed">
              Trung tâm giám sát toàn diện bãi đỗ xe nhiều tầng. Theo dõi doanh
              thu thời gian thực, rà soát giao dịch gần đây và giám sát hoạt
              động bãi đỗ trực tiếp.
            </p>
          </div>
          <div className="inline-flex items-center gap-2.5 rounded-full bg-slate-950/80 border border-emerald-500/20 px-4 py-2.5 text-xs font-black text-emerald-400 uppercase font-mono shadow-xl self-start sm:self-auto backdrop-blur-md neon-glow-emerald">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
            <span>Hệ thống Live</span>
          </div>
        </div>
      </motion.section>

      {/* ── SECTION 2: Metric Cards Grid with stagger ── */}
      <motion.section
        custom={1}
        initial="hidden"
        animate="visible"
        variants={sectionVariants}
        className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4"
        style={{ perspective: "1400px" }}
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

      {/* ── SECTION 3: Revenue Chart ── */}
      <motion.section
        custom={2}
        initial="hidden"
        animate="visible"
        variants={sectionVariants}
        className="grid gap-6"
      >
        <RevenueChart data={data.revenueTrend} />
      </motion.section>

      {/* ── SECTION 4: Activity / Transactions ── */}
      <motion.section
        custom={3}
        initial="hidden"
        animate="visible"
        variants={sectionVariants}
        className="grid gap-6 lg:grid-cols-2"
      >
        {/* Activity logs */}
        <div className="relative overflow-hidden rounded-3xl glass-premium glow-border-pulse p-6 shadow-2xl">
          <ActivityTimeline
            title="Hoạt động bãi đỗ trực tiếp"
            items={data.liveActivities}
          />
        </div>

        {/* Transactions list */}
        <div className="relative overflow-hidden rounded-3xl glass-premium glow-border-pulse p-6 shadow-2xl">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-300 font-mono">
              Giao dịch gần đây
            </h3>
            <span className="px-2 py-0.5 rounded-md bg-orange-500/10 border border-orange-500/20 text-[9px] font-black text-orange-400 font-mono uppercase tracking-wider">
              {data.transactions.length} tx
            </span>
          </div>
          <div className="max-h-[360px] overflow-y-auto pr-1 space-y-3">
            {data.transactions.map((tx) => (
              <motion.div
                key={tx.id}
                whileHover={{ scale: 1.01, x: 2 }}
                className="rounded-2xl border border-white/5 bg-slate-900/50 p-4 transition-all duration-300 hover:border-orange-500/25 hover:shadow-[0_0_12px_rgba(249,115,22,0.08)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono font-black text-xs text-white">
                      {tx.id} -{" "}
                      <span className="text-slate-400 text-[10px]">
                        {tx.method}
                      </span>
                    </p>
                    <p className="mt-1.5 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                      {tx.building}
                    </p>
                  </div>
                  <p className="shrink-0 text-xs font-black text-orange-400 font-mono">
                    +{tx.amount.toLocaleString()} VND
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>
    </div>
  );
}
