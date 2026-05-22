import { Pie, PieChart, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { AnalyticsCard } from '@/components/shared/AnalyticsCard';
import { ActivityTimeline } from '@/components/shared/ActivityTimeline';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RevenueChart } from '@/components/shared/RevenueChart';
import { useAdminDataset } from '@/hooks/admin/useAdminDataset';

const pieColors = ['#ea580c', '#f97316', '#f59e0b', '#475569'];

export function DashboardOverviewPage() {
  const { data, isLoading, error } = useAdminDataset();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12 text-sm text-stone-500 font-semibold">
        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
        Đang tải dữ liệu tổng quan...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
        {error || 'Tải dữ liệu thất bại.'}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Welcome Hero Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-stone-200/40 bg-white/60 p-8 shadow-md backdrop-blur-md">
        <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-gradient-to-br from-orange-500/12 to-amber-500/12 blur-2xl pointer-events-none" />
        <div className="absolute -left-12 -bottom-12 h-32 w-32 rounded-full bg-orange-500/8 blur-xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-orange-500">Cổng Quản Trị Hệ Thống</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-stone-900 sm:text-4xl">
              Tổng quan <span className="bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">Hệ Thống PBMS</span>
            </h1>
            <p className="mt-3 max-w-2xl text-xs font-semibold text-stone-500 leading-relaxed">
              Trung tâm giám sát toàn diện bãi đỗ xe nhiều tầng. Theo dõi doanh thu thời gian thực, quản lý phân bổ phương thức thanh toán, rà soát giao dịch gần đây và giám sát hoạt động bãi đỗ trực tiếp.
            </p>
          </div>
          <div className="inline-flex items-center gap-2.5 rounded-full bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/20 px-4.5 py-3 text-sm font-bold text-orange-600 shadow-sm shadow-orange-500/5 self-start sm:self-auto">
            <span>Hệ thống hoạt động</span>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>
        </div>
      </section>

      {/* Analytics Metric Cards Grid */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {data.dashboardStats.map((stat, index) => (
          <AnalyticsCard key={stat.key} label={stat.label} value={stat.value} delta={stat.delta} index={index} />
        ))}
      </section>

      {/* Charts Section */}
      <section className="grid gap-6 xl:grid-cols-[2fr,1fr]">
        <RevenueChart data={data.revenueTrend} />

        <Card className="border border-stone-200/40 bg-white/60 shadow-sm backdrop-blur-md overflow-hidden">
          <CardHeader className="border-b border-stone-200/20 bg-stone-50/20 p-5">
            <CardTitle className="text-sm font-bold text-stone-700 tracking-wide">Phân bổ phương thức thanh toán</CardTitle>
          </CardHeader>
          <CardContent className="h-[320px] pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={data.paymentMethodDistribution} 
                  dataKey="value" 
                  nameKey="name" 
                  outerRadius={96} 
                  stroke="rgba(255,255,255,0.95)" 
                  strokeWidth={2}
                >
                  {data.paymentMethodDistribution.map((entry, index) => (
                    <Cell key={entry.name} fill={pieColors[index % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: '#ffffff',
                    border: '1px solid rgba(234,88,12,0.16)',
                    borderRadius: '0.75rem',
                    boxShadow: '0 16px 36px rgba(120,83,48,0.14)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </section>

      {/* Live Logs & Transactions Section */}
      <section className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <ActivityTimeline title="Hoạt động bãi đỗ trực tiếp" items={data.liveActivities} />

        <Card className="border border-stone-200/40 bg-white/60 shadow-sm backdrop-blur-md overflow-hidden">
          <CardHeader className="border-b border-stone-200/20 bg-stone-50/20 p-5">
            <CardTitle className="text-sm font-bold text-stone-700 tracking-wide">Giao dịch gần đây</CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <ul className="space-y-3">
              {data.transactions.map((tx) => (
                <li
                  key={tx.id}
                  className="rounded-2xl border border-stone-200/50 bg-white/50 p-3.5 text-sm transition-all duration-300 hover:border-orange-500/30 hover:bg-orange-50/20 hover:shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold tracking-tight text-stone-850">
                        {tx.id} - {tx.method}
                      </p>
                      <p className="mt-1 text-xs text-stone-500 font-semibold">{tx.building}</p>
                    </div>
                    <p className="shrink-0 text-sm font-black text-orange-600">{tx.amount.toLocaleString()} VND</p>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="border border-stone-200/40 bg-white/60 shadow-sm backdrop-blur-md overflow-hidden">
          <CardHeader className="border-b border-stone-200/20 bg-stone-50/20 p-5">
            <CardTitle className="text-sm font-bold text-stone-700 tracking-wide">Rào cản vận hành</CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <ul className="space-y-2.5">
              {data.operationalGuardrails.map((rule) => (
                <li 
                  key={rule} 
                  className="rounded-2xl border border-stone-200/50 bg-white/50 p-3.5 text-xs text-stone-600 font-semibold transition-all duration-300 hover:border-orange-500/30 hover:bg-orange-50/20"
                >
                  {rule}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
 
