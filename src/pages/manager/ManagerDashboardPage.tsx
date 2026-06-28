import { useCallback, useEffect, useMemo, useState } from 'react';
import { Building2, Layers, Activity, Square, TrendingUp, Banknote, Wallet, QrCode } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useManagerBuildings } from '@/hooks/useManagerBuildings';
import { managerApi, type DashboardOverview } from '@/services/manager/managerApi';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 18 } },
};

export function ManagerDashboardPage() {
  const { session } = useAuth();
  const {
    buildings,
    selectedBuilding,
    selectedBuildingId,
    setSelectedBuildingId,
    isLoading: isBuildingsLoading,
    error: buildingsError,
  } = useManagerBuildings();

  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [isLoadingOverview, setIsLoadingOverview] = useState(false);
  const [overviewError, setOverviewError] = useState<string | null>(null);

  const userName = useMemo(
    () => session?.displayName || session?.email || 'Management',
    [session],
  );

  const fetchOverview = useCallback(async () => {
    if (!selectedBuildingId) {
      setOverview(null);
      return;
      }
    setIsLoadingOverview(true);
    setOverviewError(null);
    try {
      const res = await managerApi.getDashboard(selectedBuildingId);
      setOverview((res as { data?: DashboardOverview })?.data ?? null);
    } catch (err) {
      setOverviewError(err instanceof Error ? err.message : 'Failed to load report.');
      setOverview(null);
    } finally {
      setIsLoadingOverview(false);
    }
  }, [selectedBuildingId]);

  useEffect(() => {
    void fetchOverview();
  }, [fetchOverview]);

  const cards = useMemo(
    () => [
      { label: 'Total floors', value: overview?.floors ?? 0, sub: 'Configured levels', icon: Layers, color: 'text-sky-600', bg: 'bg-sky-50 border-sky-100' },
      { label: 'Gates', value: overview?.gates ?? 0, sub: 'Active access points', icon: Building2, color: 'text-purple-600', bg: 'bg-purple-50 border-purple-100' },
      { label: 'Parking slots', value: overview?.slots?.total ?? 0, sub: `${overview?.slots?.occupied ?? 0} active parkings`, icon: Square, color: 'text-sky-500', bg: 'bg-sky-50 border-sky-100' },
      { label: 'Active', value: overview?.sessions?.active ?? 0, sub: 'Live sessions now', icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },
    ],
    [overview],
  );

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={containerVariants}
      className="mx-auto max-w-6xl space-y-6 pb-12 relative text-foreground"
    >
      {/* Hero */}
      <motion.section
        variants={itemVariants}
        className="relative overflow-hidden rounded-3xl glow-border-pulse glass-premium p-8 shadow-sm"
      >
        <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-[radial-gradient(circle_at_center,rgba(14,165,233,0.06),transparent_70%)] pointer-events-none blur-2xl" />
        <div className="absolute -left-12 -bottom-12 h-32 w-32 rounded-full bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.04),transparent_70%)] pointer-events-none blur-2xl" />
        <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
          <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-sky-400/10 to-transparent absolute top-1/2 cyber-shimmer" />
        </div>

        <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-sky-50 border border-sky-100 text-[9px] font-black uppercase tracking-widest text-sky-600 font-mono">Manager Dashboard</div>
            <h1 className="mt-2.5 text-3xl font-black tracking-tight text-slate-800 sm:text-4xl">
              Good morning,{' '}
              <span className="bg-gradient-to-r from-sky-600 via-cyan-600 to-sky-700 bg-clip-text text-transparent">
                {userName}
              </span>
            </h1>
            <p className="mt-3 max-w-2xl text-xs font-semibold text-slate-500 leading-relaxed">
              Monitor lot status, approve shifts, update pricing and respond to customer complaints in real time.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white border border-sky-100 px-4 py-2.5 text-xs font-black text-sky-600 uppercase font-mono shadow-sm self-start sm:self-auto">
            <Building2 size={14} />
            <span>{selectedBuilding?.name ?? 'No building selected'}</span>
          </div>
        </div>
      </motion.section>

      <section className="grid gap-6 lg:grid-cols-[1.3fr,0.7fr]">
        <div className="space-y-6">
          {/* Buildings list */}
          <motion.div variants={itemVariants}>
            <Card className="border border-sky-100/80 bg-white shadow-sm overflow-hidden rounded-3xl">
              <CardHeader className="border-b border-sky-100/50 bg-sky-50/10 p-5">
                <CardTitle className="text-xs font-black uppercase tracking-wider text-slate-600 font-mono">Assigned building</CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                {isBuildingsLoading ? (
                  <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
                    <span>Loading buildings...</span>
                  </div>
                ) : buildingsError ? (
                  <p className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 p-3.5 rounded-2xl">{buildingsError}</p>
                ) : buildings.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">This account has not been assigned to manage any building.</p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {buildings.map((b) => {
                      const isSelected = selectedBuildingId === b._id;
                      return (
                        <button
                          key={b._id}
                          type="button"
                          onClick={() => setSelectedBuildingId(b._id)}
                          className={`rounded-2xl border p-4 text-left transition-all duration-300 ${
                            isSelected
                              ? 'border-sky-500 bg-sky-50/50 text-sky-700 shadow-sm scale-[1.01]'
                              : 'border-sky-100/50 bg-white text-slate-600 hover:border-sky-200 hover:bg-sky-50/10'
                          }`}
                        >
                          <p className={`font-black text-sm ${isSelected ? 'text-sky-600' : 'text-slate-700'}`}>
                            {b.name || b.code || 'Building'}
                          </p>
                          <p className="mt-2.5 text-[10px] font-bold text-slate-500 flex items-center gap-1.5 font-mono uppercase tracking-wide">
                            <span className={`h-1.5 w-1.5 rounded-full ${b.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                            {b.status === 'active' ? 'Active' : b.status === 'maintenance' ? 'Maintenance' : 'Suspended'}
                            {b.totalFloors ? ` • ${b.totalFloors} Floors` : ''}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick report */}
          <motion.div variants={itemVariants}>
            <Card className="border border-sky-100/80 bg-white shadow-sm overflow-hidden rounded-3xl">
              <CardHeader className="border-b border-sky-100/50 bg-sky-50/10 p-5">
                <CardTitle className="text-xs font-black uppercase tracking-wider text-slate-600 font-mono">Today's quick report</CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                {isLoadingOverview ? (
                  <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
                    <span>Aggregating data...</span>
                  </div>
                ) : overviewError ? (
                  <p className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 p-3.5 rounded-2xl">{overviewError}</p>
                ) : overview ? (
                  <div className="grid gap-4 grid-cols-2 xl:grid-cols-4">
                    {cards.map((card) => {
                      const Icon = card.icon;
                      return (
                        <div key={card.label} className="rounded-2xl border border-sky-100 bg-white p-4 transition-all duration-300 hover:border-sky-300 hover:shadow-sm hover:scale-[1.02]">
                          <div className="flex items-center gap-2.5">
                            <div className={`p-1.5 rounded-lg border ${card.bg} ${card.color}`}>
                              <Icon size={14} />
                            </div>
                            <p className="text-[9px] font-black uppercase tracking-wider text-slate-500 font-mono">{card.label}</p>
                          </div>
                          <div className="mt-4 flex items-baseline justify-between">
                            <p className="text-2xl font-black text-slate-800 font-mono">{card.value}</p>
                            <span className="text-[9px] text-slate-400 font-bold font-mono tracking-wide">{card.sub}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 font-semibold italic text-center py-4">Select a building above to view detailed metrics.</p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Weekly activity */}
          {overview?.revenue?.weekly && overview.revenue.weekly.length > 0 && (
            <motion.div variants={itemVariants}>
              <Card className="border border-sky-100/80 bg-white shadow-sm overflow-hidden rounded-3xl">
                <CardHeader className="border-b border-sky-100/50 bg-sky-50/10 p-5">
                  <CardTitle className="text-xs font-black uppercase tracking-wider text-slate-600 font-mono">Weekly Activity (Last 7 days)</CardTitle>
                </CardHeader>
                <CardContent className="p-5">
                  <div className="grid gap-3 grid-cols-4 sm:grid-cols-7">
                    {overview.revenue.weekly.map((d) => {
                      const dayName = new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' });
                      const dateNum = new Date(d.date).getDate();
                      const maxRevenue = Math.max(...overview.revenue.weekly.map(w => w.revenue), 1);
                      const barHeight = Math.max(8, (d.revenue / maxRevenue) * 80); // max 80px
                      return (
                        <div key={d.date} className="flex flex-col items-center justify-end rounded-2xl border border-sky-100 bg-sky-50/5 p-3 transition-all duration-300 hover:border-sky-300">
                          <span className="text-[10px] font-black text-slate-700 font-mono">
                             {d.sessions} {d.sessions === 1 ? 'session' : 'sessions'}
                          </span>
                          <div className="my-2.5 w-4 rounded-t bg-sky-500/85 shadow-[0_-2px_10px_rgba(14,165,233,0.1)]" style={{ height: `${barHeight}px` }} />
                          <span className="text-[11px] font-black text-sky-600 font-mono">{dayName}</span>
                          <span className="text-[9px] text-slate-400 font-bold font-mono">{dateNum}</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Parking performance */}
          <motion.div variants={itemVariants}>
            <Card className="border border-sky-100/80 bg-white shadow-sm overflow-hidden rounded-3xl">
              <CardHeader className="border-b border-sky-100/50 bg-sky-50/10 p-5">
                <CardTitle className="text-xs font-black uppercase tracking-wider text-slate-600 font-mono">Parking performance</CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div className="rounded-2xl border border-sky-100 bg-white p-4">
                  <p className="text-[9px] font-black uppercase tracking-wider text-slate-500 font-mono">Occupied slots</p>
                  <div className="mt-2 flex items-baseline justify-between">
                    <p className="text-2xl font-black text-slate-800 font-mono">{overview?.slots?.occupied ?? 0}</p>
                    <p className="text-xs font-bold text-slate-400 font-mono">/ {overview?.slots?.total ?? 0} slots</p>
                  </div>
                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full bg-gradient-to-r from-sky-500 to-cyan-400 shadow-sm transition-all duration-500"
                      style={{ width: `${overview?.slots?.occupancyRate ?? 0}%` }}
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-sky-100 bg-white p-4">
                  <p className="text-[9px] font-black uppercase tracking-wider text-slate-500 font-mono">Occupancy rate</p>
                  <p className="mt-2 text-2xl font-black text-sky-600 font-mono">{overview?.slots?.occupancyRate ?? 0}%</p>
                </div>

                <div className="rounded-2xl border border-sky-100 bg-white p-4 border-l-4 border-l-sky-500 shadow-sm">
                  <p className="text-[9px] font-black uppercase tracking-wider text-sky-600 font-mono">Today's revenue</p>
                  <p className="mt-2.5 text-2xl font-black text-slate-800 font-mono">
                    {(overview?.revenue?.today ?? 0).toLocaleString('vi-VN')}{' '}
                    <span className="text-xs font-black text-slate-500">VND</span>
                  </p>
                </div>

                {overview?.revenue?.byMethod && (
                  <div className="rounded-2xl border border-sky-100 bg-white p-4">
                    <p className="text-[9px] font-black uppercase tracking-wider text-slate-500 font-mono">Revenue by method</p>
                    <div className="mt-3 space-y-3">
                      {['cash', 'wallet', 'online'].map((method) => {
                        const methodData = overview.revenue.byMethod[method] || { amount: 0, count: 0 };
                        const label = method === 'cash' ? 'Cash' : method === 'wallet' ? 'Wallet' : 'Bank / QR';
                        const Icon = method === 'cash' ? Banknote : method === 'wallet' ? Wallet : QrCode;
                        const color = method === 'cash' ? 'bg-emerald-500' : method === 'wallet' ? 'bg-purple-500' : 'bg-sky-500';
                        const textColor = method === 'cash' ? 'text-emerald-600' : method === 'wallet' ? 'text-purple-600' : 'text-sky-600';
                        const bgLite = method === 'cash' ? 'bg-emerald-50' : method === 'wallet' ? 'bg-purple-50' : 'bg-sky-50';
                        const totalRevenue = overview.revenue.today || 1;
                        const pct = Math.min(100, (methodData.amount / totalRevenue) * 100);
                        return (
                          <div key={method} className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold text-slate-650 flex items-center gap-1">
                                <span className={`p-1 rounded ${bgLite} ${textColor}`}>
                                  <Icon size={11} />
                                </span>
                                {label} ({methodData.count})
                              </span>
                              <span className="font-bold text-slate-800 font-mono">{methodData.amount.toLocaleString('vi-VN')} ₫</span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                              <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Subscriptions */}
          <motion.div variants={itemVariants}>
            <Card className="border border-sky-100/80 bg-white shadow-sm overflow-hidden rounded-3xl">
              <CardHeader className="border-b border-sky-100/50 bg-sky-50/10 p-5">
                <CardTitle className="text-xs font-black uppercase tracking-wider text-slate-600 font-mono">Subscriptions</CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-3">
                <div className="rounded-2xl border border-sky-100 bg-white p-4">
                  <p className="text-[9px] font-black uppercase tracking-wider text-slate-500 font-mono">Active subscriptions</p>
                  <p className="mt-1.5 text-xl font-black text-slate-800 font-mono">
                    {overview?.subscriptions?.active ?? 0}{' '}
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">subscriptions</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>
    </motion.div>
  );
}
