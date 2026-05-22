import { useMemo, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/shared/Navbar';
import { ManagerSidebar } from '@/components/shared/ManagerSidebar';
import { useAuth } from '@/hooks/useAuth';
import { ADMIN_EMAIL_FALLBACK } from '@/utils/constants';
import { useManagerBuildings } from '@/hooks/useManagerBuildings';

const titles: Record<string, string> = {
  '/manager': 'Bảng điều khiển Manager',
  '/manager/dashboard': 'Báo cáo quản lý',
  '/manager/buildings': 'Quản lý tòa nhà',
  '/manager/vehicle-types': 'Loại xe',
  '/manager/floors': 'Tầng',
  '/manager/gates': 'Cổng',
  '/manager/slots': 'Chỗ đỗ',
  '/manager/price-policies': 'Chính sách giá',
  '/manager/reservation-policy': 'Chính sách đặt chỗ',
  '/manager/packages': 'Gói đăng ký',
  '/manager/shifts': 'Ca trực',
  '/manager/feedbacks': 'Phản hồi',
  '/manager/profile': 'Xem hồ sơ',
  '/manager/settings': 'Cài đặt',
};

export function ManagerLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const { session, logout } = useAuth();
  const { buildings, selectedBuildingId, setSelectedBuildingId, isLoading } = useManagerBuildings();
  const navigate = useNavigate();
  const location = useLocation();

  const title = useMemo(() => titles[location.pathname] ?? 'Manager Dashboard', [location.pathname]);

  return (
    <div className="admin-theme relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_10%,rgba(14,116,144,0.12),transparent_22%),radial-gradient(circle_at_90%_6%,rgba(249,115,22,0.08),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.72),rgba(248,250,252,0.18))]" />
      <div className="relative z-10 flex min-h-screen">
        <ManagerSidebar collapsed={collapsed} onToggle={() => setCollapsed((prev) => !prev)} />
        <div className="flex min-h-screen flex-1 flex-col">
          <Navbar
            title={title}
            email={session?.email ?? ADMIN_EMAIL_FALLBACK}
            onLogout={() => {
              logout();
              navigate('/manager/login', { replace: true });
            }}
          />
          <main className="flex-1 p-4 md:p-6">
            {isLoading ? (
              <div className="text-sm text-muted-foreground">Đang tải...</div>
            ) : !selectedBuildingId ? (
              <div className="rounded-md border border-border bg-card p-6 text-sm text-muted-foreground">
                Tài khoản này chưa được gán tòa nhà nào. Vui lòng liên hệ quản lý.
              </div>
            ) : (
              <Outlet context={{ buildingId: selectedBuildingId }} />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
