import { useCallback, useEffect, useMemo, useState } from 'react';
import { Building2, Gauge, Layers, MessageSquare, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { useManagerBuildings } from '@/hooks/useManagerBuildings';
import { managerApi, type ManagerOverviewData } from '@/services/managerApi';

export function ManagerDashboardPage() {
  const { session } = useAuth();
  const { buildings, selectedBuilding, selectedBuildingId, setSelectedBuildingId, isLoading: isBuildingsLoading, error: buildingsError } = useManagerBuildings();
  const [overview, setOverview] = useState<ManagerOverviewData | null>(null);
  const [isLoadingOverview, setIsLoadingOverview] = useState(false);
  const [overviewError, setOverviewError] = useState<string | null>(null);

  const userName = useMemo(() => {
    if (!session) return 'Người quản lý';
    return session.displayName || session.email || 'Người quản lý';
  }, [session]);

  const fetchOverview = useCallback(async () => {
    if (!selectedBuildingId || !session?.token) {
      setOverview(null);
      return;
    }

    setIsLoadingOverview(true);
    setOverviewError(null);

    try {
      const data = await managerApi.getBuildingDashboard(selectedBuildingId, session.token);
      setOverview(data);
    } catch (error) {
      setOverviewError(error instanceof Error ? error.message : 'Không thể tải báo cáo.');
      setOverview(null);
    } finally {
      setIsLoadingOverview(false);
    }
  }, [selectedBuildingId, session?.token]);

  useEffect(() => {
    void fetchOverview();
  }, [fetchOverview]);

  const cards = useMemo(
    () => [
      {
        label: 'Số tầng',
        value: overview?.floors ?? 0,
        icon: Layers,
      },
      {
        label: 'Số cổng',
        value: overview?.gates ?? 0,
        icon: Building2,
      },
      {
        label: 'Chỗ đỗ',
        value: overview?.slots?.total ?? 0,
        icon: Square,
      },
      {
        label: 'Phiên đang hoạt động',
        value: overview?.sessions?.active ?? 0,
        icon: MessageSquare,
      },
    ],
    [overview],
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-fadeIn pb-12">
      {/* Welcome Hero Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-stone-200/40 bg-white/60 p-8 shadow-md backdrop-blur-md">
        <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-gradient-to-br from-orange-500/12 to-amber-500/12 blur-2xl pointer-events-none" />
        <div className="absolute -left-12 -bottom-12 h-32 w-32 rounded-full bg-orange-500/8 blur-xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-orange-500">Cổng Quản Trị Viên</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-stone-900 sm:text-4xl">
              Chào ngày mới, <span className="bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">{userName}</span>
            </h1>
            <p className="mt-3 max-w-2xl text-xs font-semibold text-stone-500 leading-relaxed">
              Trung tâm điều khiển tòa nhà giúp bạn kiểm tra tình hình chỗ đỗ đỗ xe, phê duyệt các ca trực của nhân viên, cập nhật bảng giá franchise và phản hồi thắc mắc của khách hàng theo thời gian thực.
            </p>
          </div>
          <div className="inline-flex items-center gap-2.5 rounded-full bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/20 px-4.5 py-3 text-sm font-bold text-orange-600 shadow-sm shadow-orange-500/5 self-start sm:self-auto">
            <Building2 size={16} />
            <span>{selectedBuilding?.name ?? 'Chưa chọn tòa nhà'}</span>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.3fr,0.7fr]">
        <div className="space-y-6">
          {/* Building Selection Card */}
          <Card className="border border-stone-200/40 bg-white/60 shadow-sm backdrop-blur-md overflow-hidden">
            <CardHeader className="border-b border-stone-200/20 bg-stone-50/20 p-5">
              <CardTitle className="text-sm font-bold text-stone-700 tracking-wide">Tòa nhà phụ trách</CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              {isBuildingsLoading ? (
                <div className="flex items-center gap-2 text-stone-500 text-xs">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
                  <span>Đang tải danh sách tòa nhà phụ trách...</span>
                </div>
              ) : buildingsError ? (
                <p className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 p-3.5 rounded-2xl">{buildingsError}</p>
              ) : buildings.length === 0 ? (
                <p className="text-xs text-stone-500 italic">Tài khoản này chưa được phân quyền quản lý bãi xe nào.</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {buildings.map((building) => {
                    const isSelected = selectedBuildingId === building._id;
                    return (
                      <button
                        key={building._id}
                        type="button"
                        onClick={() => setSelectedBuildingId(building._id)}
                        className={`rounded-2xl border p-4 text-left transition-all duration-300 ${
                          isSelected
                            ? 'border-orange-500/80 bg-gradient-to-br from-orange-500/10 to-amber-500/5 shadow-md shadow-orange-500/5 scale-[1.01]'
                            : 'border-stone-200/60 bg-white/70 hover:border-stone-300 hover:bg-stone-50/50'
                        }`}
                      >
                        <p className={`font-bold text-sm ${isSelected ? 'text-orange-600' : 'text-stone-800'}`}>
                          {building.name || building.code || 'Tòa nhà'}
                        </p>
                        <p className="mt-2.5 text-[11px] font-semibold text-stone-500 flex items-center gap-1.5">
                          <span className={`h-1.5 w-1.5 rounded-full ${building.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                          Trạng thái: {building.status === 'active' ? 'Hoạt động' : 'Tạm dừng'}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Reports Stats */}
          <Card className="border border-stone-200/40 bg-white/60 shadow-sm backdrop-blur-md overflow-hidden">
            <CardHeader className="border-b border-stone-200/20 bg-stone-50/20 p-5">
              <CardTitle className="text-sm font-bold text-stone-700 tracking-wide">Báo cáo nhanh hôm nay</CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              {isLoadingOverview ? (
                <div className="flex items-center gap-2 text-stone-500 text-xs">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
                  <span>Đang tổng hợp dữ liệu bãi xe...</span>
                </div>
              ) : overviewError ? (
                <p className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 p-3.5 rounded-2xl">{overviewError}</p>
              ) : overview ? (
                <div className="grid gap-4 grid-cols-2 xl:grid-cols-4">
                  {cards.map((card) => {
                    const Icon = card.icon;
                    return (
                      <div key={card.label} className="rounded-2xl border border-stone-200/40 bg-white/70 p-4 transition-all duration-300 hover:shadow-md hover:scale-[1.02]">
                        <div className="flex items-center gap-2.5 text-orange-500">
                          <div className="p-1.5 rounded-lg bg-orange-500/8 text-orange-600">
                            <Icon size={14} />
                          </div>
                          <p className="text-[10px] font-extrabold uppercase tracking-wide text-stone-500">{card.label}</p>
                        </div>
                        <p className="mt-4 text-2xl font-black text-stone-850">{card.value}</p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-stone-500 italic text-center py-4">Vui lòng chọn một tòa nhà cụ thể ở trên để xem số liệu chi tiết.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Stats Sidebar column */}
        <div className="space-y-6">
          {/* Capacity and Occupancy Stats Card */}
          <Card className="border border-stone-200/40 bg-white/60 shadow-sm backdrop-blur-md overflow-hidden">
            <CardHeader className="border-b border-stone-200/20 bg-stone-50/20 p-5">
              <CardTitle className="text-sm font-bold text-stone-700 tracking-wide">Hiệu suất bãi đỗ</CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="rounded-2xl border border-stone-200/40 bg-white/70 p-4">
                <p className="text-[10px] font-extrabold uppercase tracking-wide text-stone-500">Số ô đang có xe</p>
                <div className="mt-2 flex items-baseline justify-between">
                  <p className="text-2xl font-black text-stone-850">{overview?.slots?.occupied ?? 0}</p>
                  <p className="text-xs font-semibold text-stone-400">/ {overview?.slots?.total ?? 0} ô đỗ</p>
                </div>
                {/* Visual Progress Bar */}
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-stone-150">
                  <div 
                    className="h-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-500" 
                    style={{ width: `${overview?.slots?.occupancyRate ?? 0}%` }} 
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-stone-200/40 bg-white/70 p-4">
                <p className="text-[10px] font-extrabold uppercase tracking-wide text-stone-500">Tỉ lệ lấp đầy</p>
                <p className="mt-2 text-2xl font-black text-orange-600">{overview?.slots?.occupancyRate ?? 0}%</p>
              </div>

              <div className="rounded-2xl border border-stone-200/40 bg-gradient-to-br from-orange-500/10 to-amber-500/10 p-4 border-l-4 border-l-orange-500">
                <p className="text-[10px] font-extrabold uppercase tracking-wide text-orange-600">Doanh thu ghi nhận ca ngày</p>
                <p className="mt-2.5 text-2xl font-black text-stone-850">{overview?.revenue?.today?.toLocaleString() ?? 0} <span className="text-xs font-bold text-stone-500">VND</span></p>
              </div>
            </CardContent>
          </Card>

          {/* Feedbacks and subscriptions states */}
          <Card className="border border-stone-200/40 bg-white/60 shadow-sm backdrop-blur-md overflow-hidden">
            <CardHeader className="border-b border-stone-200/20 bg-stone-50/20 p-5">
              <CardTitle className="text-sm font-bold text-stone-700 tracking-wide">Yêu cầu & Gói dài hạn</CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-3">
              <div className="rounded-2xl border border-stone-200/40 bg-white/70 p-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-wide text-stone-500">Phản hồi cần xử lý</p>
                  <p className="mt-1 text-xl font-black text-stone-850">{overview?.feedbacks?.pending ?? 0}</p>
                </div>
                {overview?.feedbacks?.pending && overview.feedbacks.pending > 0 ? (
                  <span className="flex h-2.5 w-2.5 rounded-full bg-rose-500 animate-pulse" />
                ) : null}
              </div>

              <div className="rounded-2xl border border-stone-200/40 bg-white/70 p-4">
                <p className="text-[10px] font-extrabold uppercase tracking-wide text-stone-500">Đăng ký gói tháng đang hoạt động</p>
                <p className="mt-1.5 text-xl font-black text-stone-850">{overview?.subscriptions?.active ?? 0} <span className="text-[11px] font-semibold text-stone-400">thuê bao</span></p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
