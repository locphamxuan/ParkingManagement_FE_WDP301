import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Car, Crown, Square, TrendingUp, Ticket } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RevenueChart } from '@/components/charts/RevenueChart';
import { SlotOccupancyChart } from '@/components/charts/SlotOccupancyChart';
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

  const navigate = useNavigate();
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [isLoadingOverview, setIsLoadingOverview] = useState(false);
  const [overviewError, setOverviewError] = useState<string | null>(null);
  const needsSubscription = /subscription|gói/i.test(overviewError ?? '');

  const userName = useMemo(
    () => session?.displayName || session?.email || 'Manager',
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
      setOverviewError(err instanceof Error ? err.message : 'Unable to load report.');
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
      { label: 'Parked vehicles', value: overview?.sessions?.active ?? 0, icon: Car, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
      { label: 'Entries today', value: overview?.sessions?.today ?? 0, icon: TrendingUp, color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
      { label: 'Free slots', value: (overview?.slots?.available ?? (overview?.slots?.total ?? 0) - (overview?.slots?.occupied ?? 0)), icon: Square, color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200' },
      { label: 'Long-term packages', value: overview?.subscriptions?.active ?? 0, icon: Ticket, color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' },
    ],
    [overview],
  );

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={containerVariants}
      className="mx-auto max-w-6xl space-y-6 pb-12 relative"    >      {/* Hero: Clean, Premium Layered Welcome Panel */}
      <motion.section
        variants={itemVariants}
        className="relative overflow-hidden rounded-3xl border-2 border-blue-200 bg-gradient-to-tr from-white via-blue-50/10 to-indigo-50/20 p-8 shadow-lg hover:shadow-xl transition-all duration-300"
      >
        {/* Subtle Ambient Glows */}
        <div className="absolute -right-20 -top-20 h-52 w-52 rounded-full bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.08),transparent_70%)] pointer-events-none blur-3xl animate-pulse" />
        <div className="absolute -left-20 -bottom-20 h-44 w-44 rounded-full bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.05),transparent_70%)] pointer-events-none blur-3xl" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-stretch justify-between gap-8">
          {/* Left Column: Welcome & Clean Info Row */}
          <div className="flex-1 flex flex-col justify-between space-y-4">
            <div>
              <div className="inline-flex items-center gap-2">
                <div className="px-2.5 py-0.5 rounded-md bg-blue-600 text-[9px] font-black uppercase tracking-widest text-white shadow-md shadow-blue-500/10 font-mono">
                  Manager Portal
                </div>
                {selectedBuilding && (
                  <div className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider font-mono select-none">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                    </span>
                    <span>{selectedBuilding.status}</span>
                  </div>
                )}
              </div>

              <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                Welcome back,{' '}
                <span className="bg-gradient-to-r from-blue-700 via-indigo-650 to-indigo-800 bg-clip-text text-transparent">
                  {userName}
                </span>
              </h1>
              <p className="mt-2.5 max-w-2xl text-xs font-bold text-slate-500 leading-relaxed">
                Monitor real-time occupancy levels, configure price tiers, assign staff shifts, and manage long-term parking package subscriptions below.
              </p>
            </div>

            {/* Clean Horizontal API Info Row */}
            {selectedBuilding && (
              <div className="flex flex-wrap items-center gap-2.5 pt-4 border-t border-slate-100/80">
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-[10px] font-bold text-slate-700 shadow-sm transition-all duration-200 hover:border-blue-300">
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 font-mono">Code:</span>
                  <span className="font-black text-slate-900">{selectedBuilding.code}</span>
                </div>
                
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-[10px] font-bold text-slate-700 shadow-sm transition-all duration-200 hover:border-blue-300">
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 font-mono">Floors:</span>
                  <span className="font-black text-slate-900">{selectedBuilding.totalFloors} floors</span>
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-[10px] font-bold text-slate-700 shadow-sm transition-all duration-200 hover:border-blue-300">
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 font-mono">Hours:</span>
                  <span className="font-black text-slate-900">
                    {selectedBuilding.operatingHours ? `${selectedBuilding.operatingHours.open} - ${selectedBuilding.operatingHours.close}` : '24/7'}
                  </span>
                </div>

                {selectedBuilding.contactPhone && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-[10px] font-bold text-slate-700 shadow-sm transition-all duration-200 hover:border-blue-300">
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 font-mono">Support:</span>
                    <span className="font-black text-slate-900">{selectedBuilding.contactPhone}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Premium Interactive Building Status Card */}
          {selectedBuilding && (
            <div className="hidden lg:flex flex-col justify-between p-5 rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-600 via-blue-600 to-indigo-800 text-white shadow-lg shadow-blue-500/10 min-w-[220px] max-w-[260px] relative overflow-hidden group hover:scale-[1.02] hover:shadow-xl transition-all duration-300">
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-white/20 via-white/5 to-transparent pointer-events-none" />
              <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full bg-white/10 blur-xl pointer-events-none" />
              
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-xl bg-white/10 border border-white/20">
                  <Building2 size={16} className="text-white" />
                </div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider border border-white/10 font-mono">
                  ACTIVE
                </div>
              </div>
              
              <div className="mt-6">
                <p className="text-[9px] font-bold text-blue-200 uppercase tracking-widest font-mono">Facility</p>
                <h3 className="text-base font-black tracking-tight mt-0.5 truncate">{selectedBuilding.name}</h3>
              </div>
            </div>
          )}
        </div>
      </motion.section>

      {/* Quick actions: Glass Cards */}
      <motion.div variants={itemVariants} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Pricing', desc: 'Adjust parking price policies', href: '/manager/price-policies', color: 'border-orange-200 bg-orange-500/[0.04] text-orange-700 hover:bg-orange-500/[0.08] hover:border-orange-400' },
          { label: 'Staff & shifts', desc: 'Assign shifts and manage staff', href: '/manager/shifts', color: 'border-blue-200 bg-blue-500/[0.04] text-blue-700 hover:bg-blue-500/[0.08] hover:border-blue-400' },
          { label: 'Long-term packages', desc: 'Manage packages and subscriptions', href: '/manager/packages', color: 'border-purple-200 bg-purple-500/[0.04] text-purple-700 hover:bg-purple-500/[0.08] hover:border-purple-400' },
          { label: 'Reviews', desc: 'View and respond to complaints', href: '/manager/reviews', color: 'border-indigo-200 bg-indigo-500/[0.04] text-indigo-700 hover:bg-indigo-500/[0.08] hover:border-indigo-400' },
        ].map((action) => (
          <button
            key={action.href}
            type="button"
            onClick={() => navigate(action.href)}
            className={`rounded-2xl border-2 p-4 text-left transition-all duration-300 hover:scale-[1.03] hover:shadow-md ${action.color}`}
          >
            <p className="font-black text-sm text-indigo-950">{action.label}</p>
            <p className="mt-1 text-[10px] font-bold text-slate-600 leading-normal">{action.desc}</p>
          </button>
        ))}
      </motion.div>

      <section className="grid gap-6 lg:grid-cols-[1.3fr,0.7fr]">
        <div className="space-y-6">
          {/* Assigned buildings */}
          <motion.div variants={itemVariants}>
            <Card className="border-2 border-blue-200 bg-white shadow-md overflow-hidden rounded-3xl">
              <CardHeader className="border-b-2 border-blue-100 bg-slate-50 p-5">
                <CardTitle className="text-xs font-black uppercase tracking-wider text-indigo-950 font-mono">Assigned buildings</CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                {isBuildingsLoading ? (
                  <div className="flex items-center gap-2 text-slate-605 text-xs font-bold">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                    <span>Loading buildings...</span>
                  </div>
                ) : buildingsError ? (
                  <p className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 p-3.5 rounded-2xl">{buildingsError}</p>
                ) : buildings.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">This account is not assigned to manage any building.</p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {buildings.map((b) => {
                      const isSelected = selectedBuildingId === b._id;
                      return (
                        <button
                          key={b._id}
                          type="button"
                          onClick={() => setSelectedBuildingId(b._id)}
                          className={`rounded-2xl border-2 p-4 text-left transition-all duration-300 ${
                            isSelected
                              ? 'border-blue-600 bg-blue-500/10 shadow-[0_4px_20px_rgba(37,99,235,0.12)] scale-[1.01]'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-blue-400 hover:bg-slate-50/50'
                          }`}
                        >
                          <p className={`font-black text-sm ${isSelected ? 'text-blue-800' : 'text-slate-800'}`}>
                            {b.name || b.code || 'Building'}
                          </p>
                          <p className="mt-2.5 text-[10px] font-black text-slate-600 flex items-center gap-1.5 font-mono uppercase tracking-wide">
                            <span className={`h-2 w-2 rounded-full ${b.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                            {b.status === 'active' ? 'Active' : b.status === 'maintenance' ? 'Maintenance' : 'Paused'}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick report today */}
          <motion.div variants={itemVariants}>
            <Card className="border-2 border-blue-200 bg-white shadow-md overflow-hidden rounded-3xl">
              <CardHeader className="border-b-2 border-blue-100 bg-slate-50 p-5">
                <CardTitle className="text-xs font-black uppercase tracking-wider text-indigo-950 font-mono">Quick report today</CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                {isLoadingOverview ? (
                  <div className="flex items-center gap-2 text-slate-600 text-xs font-bold">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                    <span>Aggregating data...</span>
                  </div>
                ) : overviewError ? (
                  needsSubscription ? (
                    <div className="rounded-2xl border-2 border-amber-300 bg-amber-55/10 p-4">
                      <div className="flex items-center gap-2 text-amber-800">
                        <Crown size={15} />
                        <p className="text-xs font-black uppercase tracking-wider font-mono">Subscription required</p>
                      </div>
                      <p className="mt-2 text-xs font-bold text-amber-700">
                        This building has no active system subscription. Purchase one to unlock the manager dashboard.
                      </p>
                      <button
                        type="button"
                        onClick={() => navigate('/manager/wallet')}
                        className="mt-3 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-650 px-4 py-2 text-xs font-black text-white shadow-md transition hover:brightness-110"
                      >
                        <Crown size={13} /> Buy subscription
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 p-3.5 rounded-2xl">{overviewError}</p>
                  )
                ) : overview ? (
                  <div className="grid gap-4 grid-cols-2 xl:grid-cols-4">
                    {cards.map((card) => {
                      const Icon = card.icon;
                      return (
                        <div key={card.label} className="rounded-2xl border-2 border-blue-100 bg-slate-50/50 p-4 transition-all duration-300 hover:border-blue-450 hover:shadow-sm hover:scale-[1.02]">
                          <div className="flex items-center gap-2.5">
                            <div className={`p-2 rounded-lg border-2 ${card.bg} ${card.color}`}>
                              <Icon size={14} className="stroke-[3]" />
                            </div>
                            <p className="text-[9px] font-black uppercase tracking-wider text-slate-550 font-mono">{card.label}</p>
                          </div>
                          <p className={`mt-4 text-2xl font-black ${card.color} font-mono`}>{card.value}</p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 font-bold italic text-center py-4">Select a building above to see detailed metrics.</p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Xu hướng doanh thu 7 ngày — dùng chung RevenueChart với admin (BE trả revenue.weekly). */}
          <motion.div variants={itemVariants}>
            <RevenueChart
              data={(overview?.revenue?.weekly ?? []).map((w) => ({
                date: w.date,
                revenue: w.revenue,
                sessions: w.sessions,
              }))}
            />
          </motion.div>

        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Parking performance */}
          <motion.div variants={itemVariants}>
            <Card className="border-2 border-blue-200 bg-white shadow-md overflow-hidden rounded-3xl">
              <CardHeader className="border-b-2 border-blue-100 bg-slate-50 p-5">
                <CardTitle className="text-xs font-black uppercase tracking-wider text-indigo-950 font-mono">Parking performance</CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <SlotOccupancyChart
                  available={overview?.slots?.available ?? Math.max((overview?.slots?.total ?? 0) - (overview?.slots?.occupied ?? 0), 0)}
                  occupied={overview?.slots?.occupied ?? 0}
                  reserved={overview?.slots?.reserved ?? 0}
                  maintenance={overview?.slots?.maintenance ?? 0}
                />

                <div className="rounded-2xl border-2 border-blue-100 bg-slate-50/50 p-4">
                  <p className="text-[9px] font-black uppercase tracking-wider text-slate-550 font-mono">Occupancy rate</p>
                  <p className="mt-2 text-2xl font-black bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-800 bg-clip-text text-transparent font-mono">{overview?.slots?.occupancyRate ?? 0}%</p>
                </div>

                <div className="rounded-2xl border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50/30 p-4 border-l-4 border-l-blue-600 shadow-md">
                  <p className="text-[9px] font-black uppercase tracking-wider text-blue-700 font-mono">Revenue today</p>
                  <p className="mt-2.5 text-2xl font-black bg-gradient-to-r from-blue-700 via-indigo-750 to-blue-600 bg-clip-text text-transparent font-mono">
                    {(overview?.revenue?.today ?? 0).toLocaleString('vi-VN')}{' '}
                    <span className="text-xs font-black text-slate-500">VND</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Customer long-term packages */}
          <motion.div variants={itemVariants}>
            <Card className="border-2 border-blue-200 bg-white shadow-md overflow-hidden rounded-3xl">
              <CardHeader className="border-b-2 border-blue-100 bg-slate-50 p-5">
                <CardTitle className="text-xs font-black uppercase tracking-wider text-indigo-950 font-mono">Customer long-term packages</CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-3">
                <div className="rounded-2xl border-2 border-blue-100 bg-slate-50/50 p-4">
                  <p className="text-[9px] font-black uppercase tracking-wider text-slate-550 font-mono">Active long-term packages</p>
                  <p className="mt-1.5 text-xl font-black text-blue-700 font-mono">
                    {overview?.subscriptions?.active ?? 0}{' '}
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">packages</span>
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
