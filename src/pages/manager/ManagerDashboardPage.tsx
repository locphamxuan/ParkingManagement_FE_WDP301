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
import {
  BUILDING_STATE_BADGE,
  BUILDING_STATE_DOT,
  BUILDING_STATE_HINTS,
  BUILDING_STATE_LABELS,
  isOperationalNow,
  resolveBuildingOperationalState,
} from '@/utils/buildingOperationalState';

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

  // Badge phải tự đổi khi qua mốc mở/đóng dù manager không thao tác gì → tick mỗi phút.
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  // Trạng thái VẬN HÀNH (open/closed) — khác `building.status` là trạng thái HÀNH CHÍNH.
  const selectedState = useMemo(
    () =>
      selectedBuilding
        ? resolveBuildingOperationalState(selectedBuilding.status, selectedBuilding.operatingHours, now)
        : null,
    [selectedBuilding, now],
  );

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
      className="relative mx-auto w-full space-y-6 pb-12"
    >
      {/* Hero: Clean, Premium Layered Welcome Panel */}
      <motion.section
        variants={itemVariants}
        className="relative overflow-hidden rounded-3xl border border-blue-200/80 bg-gradient-to-tr from-white via-blue-50/20 to-indigo-50/30 p-6 md:p-8 shadow-sm hover:shadow-md transition-all duration-300"
      >
        {/* Subtle Ambient Glows */}
        <div className="absolute -right-20 -top-20 h-52 w-52 rounded-full bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.08),transparent_70%)] pointer-events-none blur-3xl animate-pulse" />
        <div className="absolute -left-20 -bottom-20 h-44 w-44 rounded-full bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.05),transparent_70%)] pointer-events-none blur-3xl" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-stretch justify-between gap-8">
          {/* Left Column: Welcome & Clean Info Row */}
          <div className="flex-1 flex flex-col justify-between space-y-4">
            <div>
              <div className="inline-flex items-center gap-2">
                <div className="px-3 py-1 rounded-lg bg-blue-600 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
                  Manager Portal
                </div>
                {selectedBuilding && selectedState && (
                  <div
                    title={BUILDING_STATE_HINTS[selectedState]}
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider select-none ${BUILDING_STATE_BADGE[selectedState]}`}
                  >
                    <span className="relative flex h-1.5 w-1.5">
                      {isOperationalNow(selectedState) && (
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      )}
                      <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${BUILDING_STATE_DOT[selectedState]}`}></span>
                    </span>
                    <span>{BUILDING_STATE_LABELS[selectedState]}</span>
                  </div>
                )}
              </div>

              <h1 className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                Welcome back,{' '}
                <span className="bg-gradient-to-r from-blue-700 via-indigo-600 to-indigo-800 bg-clip-text text-transparent">
                  {userName}
                </span>
              </h1>
              <p className="mt-2 max-w-2xl text-xs sm:text-sm font-medium text-slate-600 leading-relaxed">
                Monitor real-time occupancy levels, configure price tiers, assign staff shifts, and manage long-term parking package subscriptions below.
              </p>
            </div>

            {/* Clean Horizontal API Info Row */}
            {selectedBuilding && (
              <div className="flex flex-wrap items-center gap-2.5 pt-4 border-t border-slate-200/60">
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:border-blue-300">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Code:</span>
                  <span className="font-extrabold text-slate-900">{selectedBuilding.code}</span>
                </div>
                
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:border-blue-300">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Floors:</span>
                  <span className="font-extrabold text-slate-900">
                    {selectedBuilding.totalFloors} {selectedBuilding.totalFloors === 1 ? 'floor' : 'floors'}
                  </span>
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:border-blue-300">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Hours:</span>
                  <span className="font-extrabold text-slate-900">
                    {selectedBuilding.operatingHours ? `${selectedBuilding.operatingHours.open} - ${selectedBuilding.operatingHours.close}` : '24/7'}
                  </span>
                </div>

                {selectedBuilding.contactPhone && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:border-blue-300">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Support:</span>
                    <span className="font-extrabold text-slate-900">{selectedBuilding.contactPhone}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Premium Interactive Building Status Card */}
          {selectedBuilding && selectedState && (
            <div className="hidden lg:flex flex-col justify-between p-5 rounded-2xl border border-blue-400/30 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white shadow-md shadow-blue-500/10 min-w-[220px] max-w-[260px] relative overflow-hidden group hover:scale-[1.02] transition-all duration-300">
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-white/20 via-white/5 to-transparent pointer-events-none" />
              <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full bg-white/10 blur-xl pointer-events-none" />
              
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-xl bg-white/15 border border-white/20">
                  <Building2 size={18} className="text-white" />
                </div>
                <div
                  title={BUILDING_STATE_HINTS[selectedState]}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider border border-white/20 text-white"
                >
                  <span
                    className={`inline-flex h-1.5 w-1.5 rounded-full ${BUILDING_STATE_DOT[selectedState]} ${
                      isOperationalNow(selectedState) ? 'animate-pulse' : ''
                    }`}
                  />
                  <span>{BUILDING_STATE_LABELS[selectedState]}</span>
                </div>
              </div>

              <div className="mt-6">
                <p className="text-[10px] font-extrabold text-blue-100 uppercase tracking-widest">Facility</p>
                <h3 className="mt-0.5 truncate text-lg font-black tracking-tight text-white">{selectedBuilding.name}</h3>
              </div>
            </div>
          )}
        </div>
      </motion.section>

      {/* Quick actions: Glass Cards */}
      <motion.div variants={itemVariants} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Pricing', desc: 'Adjust parking price policies', href: '/manager/price-policies', color: 'border-orange-200/80 bg-orange-50/50 text-orange-800 hover:bg-orange-100/50 hover:border-orange-300' },
          { label: 'Staff & shifts', desc: 'Assign shifts and manage staff', href: '/manager/shifts', color: 'border-blue-200/80 bg-blue-50/50 text-blue-800 hover:bg-blue-100/50 hover:border-blue-300' },
          { label: 'Long-term packages', desc: 'Manage packages and subscriptions', href: '/manager/packages', color: 'border-purple-200/80 bg-purple-50/50 text-purple-800 hover:bg-purple-100/50 hover:border-purple-300' },
          { label: 'Reviews', desc: 'View and respond to complaints', href: '/manager/reviews', color: 'border-indigo-200/80 bg-indigo-50/50 text-indigo-800 hover:bg-indigo-100/50 hover:border-indigo-300' },
        ].map((action) => (
          <button
            key={action.href}
            type="button"
            onClick={() => navigate(action.href)}
            className={`rounded-2xl border p-4 text-left transition-all duration-300 hover:scale-[1.02] hover:shadow-sm ${action.color}`}
          >
            <p className="font-extrabold text-sm text-slate-900">{action.label}</p>
            <p className="mt-1 text-xs font-semibold text-slate-500 leading-normal">{action.desc}</p>
          </button>
        ))}
      </motion.div>

      <section className="grid gap-6 lg:grid-cols-[1.3fr,0.7fr]">
        <div className="space-y-6">
          {/* Assigned buildings */}
          <motion.div variants={itemVariants}>
            <Card className="border border-slate-200/80 bg-white shadow-sm overflow-hidden rounded-2xl">
              <CardHeader className="border-b border-slate-100 bg-slate-50/70 px-5 py-4">
                <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-slate-800">Assigned buildings</CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                {isBuildingsLoading ? (
                  <div className="flex items-center gap-2 text-slate-650 text-xs font-semibold">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                    <span>Loading buildings...</span>
                  </div>
                ) : buildingsError ? (
                  <p className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 p-3.5 rounded-xl">{buildingsError}</p>
                ) : buildings.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">This account is not assigned to manage any building.</p>
                ) : (
                  <div className={`grid gap-3 ${buildings.length === 1 ? 'grid-cols-1' : 'sm:grid-cols-2'}`}>
                    {buildings.map((b) => {
                      const isSelected = selectedBuildingId === b._id;
                      const state = resolveBuildingOperationalState(b.status, b.operatingHours, now);
                      return (
                        <button
                          key={b._id}
                          type="button"
                          onClick={() => setSelectedBuildingId(b._id)}
                          className={`rounded-xl border p-4 text-left transition-all duration-200 ${
                            isSelected
                              ? 'border-blue-500 bg-blue-50/70 shadow-sm ring-1 ring-blue-500/20'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-slate-50/60'
                          }`}
                        >
                          <p className={`font-extrabold text-sm ${isSelected ? 'text-blue-900' : 'text-slate-800'}`}>
                            {b.name || b.code || 'Building'}
                          </p>
                          <p
                            title={BUILDING_STATE_HINTS[state]}
                            className="mt-2 text-[11px] font-bold text-slate-500 flex items-center gap-1.5 uppercase tracking-wider"
                          >
                            <span
                              className={`h-2 w-2 rounded-full ${BUILDING_STATE_DOT[state]} ${
                                isOperationalNow(state) ? 'animate-pulse' : ''
                              }`}
                            />
                            {BUILDING_STATE_LABELS[state]}
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
            <Card className="border border-slate-200/80 bg-white shadow-sm overflow-hidden rounded-2xl">
              <CardHeader className="border-b border-slate-100 bg-slate-50/70 px-5 py-4">
                <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-slate-800">Quick report today</CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                {isLoadingOverview ? (
                  <div className="flex items-center gap-2 text-slate-600 text-xs font-bold">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                    <span>Aggregating data...</span>
                  </div>
                ) : overviewError ? (
                  needsSubscription ? (
                    <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
                      <div className="flex items-center gap-2 text-amber-800">
                        <Crown size={16} />
                        <p className="text-xs font-extrabold uppercase tracking-wider">Subscription required</p>
                      </div>
                      <p className="mt-2 text-xs font-semibold text-amber-700 leading-relaxed">
                        This building has no active system subscription. Purchase one to unlock the manager dashboard.
                      </p>
                      <button
                        type="button"
                        onClick={() => navigate('/manager/wallet')}
                        className="mt-3 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-650 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:brightness-110"
                      >
                        <Crown size={14} /> Buy subscription
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 p-3.5 rounded-xl">{overviewError}</p>
                  )
                ) : overview ? (
                  <div className="grid gap-3.5 grid-cols-2 xl:grid-cols-4">
                    {cards.map((card) => {
                      const Icon = card.icon;
                      return (
                        <div key={card.label} className="rounded-xl border border-slate-200/80 bg-slate-50/40 p-3.5 transition-all duration-200 hover:border-blue-300 hover:shadow-sm">
                          <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded-lg border ${card.bg} ${card.color}`}>
                              <Icon size={14} className="stroke-[2.5]" />
                            </div>
                            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{card.label}</p>
                          </div>
                          <p className={`mt-3 text-2xl font-black ${card.color}`}>{card.value}</p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 font-medium italic text-center py-4">Select a building above to see detailed metrics.</p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Xu hướng doanh thu 7 ngày */}
          <motion.div variants={itemVariants}>
            {isLoadingOverview ? (
              <Card className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                <CardHeader className="border-b border-slate-100 bg-slate-50/70 px-6 py-4">
                  <div className="h-4 w-32 animate-pulse rounded bg-slate-200" />
                  <div className="mt-2 h-3 w-56 animate-pulse rounded bg-slate-100" />
                </CardHeader>
                <CardContent className="p-6">
                  <div className="h-[252px] animate-pulse rounded-xl bg-gradient-to-br from-slate-50 to-blue-50/60" />
                </CardContent>
              </Card>
            ) : overview ? (
              <RevenueChart
                data={overview.revenue.weekly.map((w) => ({
                  date: w.date,
                  revenue: w.revenue,
                  sessions: w.sessions,
                }))}
              />
            ) : (
              <Card className="rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                <CardContent className="flex min-h-[180px] items-center justify-center p-6 text-center">
                  <p className="max-w-sm text-sm font-medium leading-relaxed text-slate-500">
                    Revenue data will appear here after the building report has loaded.
                  </p>
                </CardContent>
              </Card>
            )}
          </motion.div>

        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Parking performance */}
          <motion.div variants={itemVariants}>
            <Card className="border border-slate-200/80 bg-white shadow-sm overflow-hidden rounded-2xl">
              <CardHeader className="border-b border-slate-100 bg-slate-50/70 px-5 py-4">
                <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-slate-800">Parking performance</CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <SlotOccupancyChart
                  available={overview?.slots?.available ?? Math.max((overview?.slots?.total ?? 0) - (overview?.slots?.occupied ?? 0), 0)}
                  occupied={overview?.slots?.occupied ?? 0}
                  reserved={overview?.slots?.reserved ?? 0}
                  maintenance={overview?.slots?.maintenance ?? 0}
                />

                <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3.5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Occupancy rate</p>
                  <p className="mt-1.5 text-2xl font-black bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">{overview?.slots?.occupancyRate ?? 0}%</p>
                </div>

                <div className="rounded-xl border border-blue-200/80 bg-gradient-to-r from-blue-50/80 to-indigo-50/40 p-4 border-l-4 border-l-blue-600 shadow-sm">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-blue-800">Revenue today</p>
                  <p className="mt-2 text-2xl font-black bg-gradient-to-r from-blue-700 via-indigo-750 to-blue-600 bg-clip-text text-transparent">
                    {(overview?.revenue?.today ?? 0).toLocaleString('vi-VN')}{' '}
                    <span className="text-xs font-bold text-slate-500">VND</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Customer long-term packages */}
          <motion.div variants={itemVariants}>
            <Card className="border border-slate-200/80 bg-white shadow-sm overflow-hidden rounded-2xl">
              <CardHeader className="border-b border-slate-100 bg-slate-50/70 px-5 py-4">
                <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-slate-800">Customer long-term packages</CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-3">
                <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3.5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Active long-term packages</p>
                  <p className="mt-1.5 text-xl font-black text-blue-700">
                    {overview?.subscriptions?.active ?? 0}{' '}
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">packages</span>
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
