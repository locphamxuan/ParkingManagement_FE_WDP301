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
    <main className="min-h-screen bg-slate-50 px-6 py-8 text-slate-900">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-sky-600">Bảng điều khiển Manager</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Chào mừng, {userName}</h1>
              <p className="mt-3 max-w-2xl text-sm text-slate-600">
                Hệ thống quản lý tòa nhà giúp bạn xem báo cáo, cập nhật cấu hình và kiểm soát các tài nguyên vận hành.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-4 py-3 text-sky-700">
              <Building2 size={20} />
              <span>{selectedBuilding?.name ?? 'Chưa chọn tòa nhà'}</span>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.4fr,0.8fr]">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Tiểu mục tòa nhà</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4">
                {isBuildingsLoading ? (
                  <p>Đang tải danh sách tòa nhà...</p>
                ) : buildingsError ? (
                  <p className="text-sm text-red-600">{buildingsError}</p>
                ) : buildings.length === 0 ? (
                  <p>Không có tòa nhà được phân quyền.</p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {buildings.map((building) => (
                      <button
                        key={building._id}
                        type="button"
                        onClick={() => setSelectedBuildingId(building._id)}
                        className={`rounded-3xl border p-4 text-left transition hover:border-primary/60 hover:bg-slate-50 ${
                          selectedBuildingId === building._id ? 'border-primary bg-primary/5' : 'border-border'
                        }`}
                      >
                        <p className="font-semibold text-slate-900">{building.name || building.code || 'Tòa nhà không tên'}</p>
                        <p className="mt-2 text-sm text-slate-600">Trạng thái: {building.status || 'Chưa xác định'}</p>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Báo cáo nhanh</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingOverview ? (
                  <p>Đang tải báo cáo...</p>
                ) : overviewError ? (
                  <p className="text-sm text-red-600">{overviewError}</p>
                ) : overview ? (
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {cards.map((card) => {
                      const Icon = card.icon;
                      return (
                        <div key={card.label} className="rounded-3xl border border-border bg-slate-50 p-4">
                          <div className="flex items-center gap-3 text-sky-600">
                            <Icon size={18} />
                            <p className="text-sm font-medium text-slate-900">{card.label}</p>
                          </div>
                          <p className="mt-4 text-3xl font-semibold text-slate-900">{card.value}</p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p>Chọn tòa nhà để xem báo cáo chi tiết.</p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Tỉ lệ sử dụng</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  <div className="rounded-3xl border border-border bg-slate-50 p-4">
                    <p className="text-sm text-slate-600">Chỗ đỗ đã lấp đầy</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">{overview?.slots?.occupied ?? 0}</p>
                  </div>
                  <div className="rounded-3xl border border-border bg-slate-50 p-4">
                    <p className="text-sm text-slate-600">Tỉ lệ lấp đầy</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">{overview?.slots?.occupancyRate ?? 0}%</p>
                  </div>
                  <div className="rounded-3xl border border-border bg-slate-50 p-4">
                    <p className="text-sm text-slate-600">Doanh thu hôm nay</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">{overview?.revenue?.today?.toLocaleString() ?? 0} VND</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Trạng thái phản hồi</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <div className="rounded-3xl border border-border bg-slate-50 p-4">
                    <p className="text-sm text-slate-600">Phản hồi cần xử lý</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">{overview?.feedbacks?.pending ?? 0}</p>
                  </div>
                  <div className="rounded-3xl border border-border bg-slate-50 p-4">
                    <p className="text-sm text-slate-600">Đăng ký đang hoạt động</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">{overview?.subscriptions?.active ?? 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </main>
  );
}
