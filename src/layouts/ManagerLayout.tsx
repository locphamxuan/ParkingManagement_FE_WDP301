import { useEffect, useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  Building2,
  CalendarClock,
  CarFront,
  ChevronDown,
  ClipboardCheck,
  DoorOpen,
  Gauge,
  History,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  ParkingCircle,
  Receipt,
  TicketPercent,
  Users,
  Wallet,
} from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useManagerStore } from '@/store/managerStore';
import { cn } from '@/utils/cn';

const navItems = [
  { to: '', label: 'Tổng quan', icon: LayoutDashboard, end: true },
  { to: 'building', label: 'Thông tin tòa', icon: Building2 },
  { to: 'vehicle-types', label: 'Loại phương tiện', icon: CarFront },
  { to: 'floors', label: 'Tầng', icon: Gauge },
  { to: 'gates', label: 'Cổng', icon: DoorOpen },
  { to: 'slots', label: 'Ô đỗ', icon: ParkingCircle },
  { to: 'pricing', label: 'Bảng giá', icon: Wallet },
  { to: 'policy-logs', label: 'Lịch sử đẩy giá', icon: History },
  { to: 'packages', label: 'Gói dài hạn', icon: TicketPercent },
  { to: 'subscriptions', label: 'Đăng ký gói', icon: ClipboardCheck },
  { to: 'reservation-policy', label: 'Chính sách đặt chỗ', icon: CalendarClock },
  { to: 'shifts', label: 'Ca trực', icon: CalendarClock },
  { to: 'staff-shifts', label: 'Phân ca nhân viên', icon: Users },
  { to: 'revenues', label: 'Doanh thu ca', icon: Receipt },
  { to: 'feedbacks', label: 'Phản hồi', icon: MessageSquare },
];

const pageTitle: Record<string, string> = {
  '': 'Tổng quan',
  building: 'Thông tin tòa nhà',
  'vehicle-types': 'Loại phương tiện',
  floors: 'Quản lý tầng',
  gates: 'Quản lý cổng',
  slots: 'Quản lý ô đỗ',
  pricing: 'Bảng giá',
  'policy-logs': 'Lịch sử đẩy chính sách',
  packages: 'Gói dài hạn',
  subscriptions: 'Đăng ký gói dài hạn',
  'reservation-policy': 'Chính sách đặt chỗ',
  shifts: 'Ca trực',
  'staff-shifts': 'Phân ca nhân viên',
  revenues: 'Doanh thu theo ca',
  feedbacks: 'Phản hồi khách hàng',
};

export function ManagerLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const onLogout = () => {
    logout();
    navigate('/auth/login', { replace: true });
  };
  const { buildings, selectedBuildingId, isLoading, error, loadBuildings, selectBuilding } =
    useManagerStore();
  const [bootstrapping, setBootstrapping] = useState(true);

  useEffect(() => {
    loadBuildings()
      .catch(() => undefined)
      .finally(() => setBootstrapping(false));
  }, [loadBuildings]);

  const slug = useMemo(() => {
    const tail = location.pathname.replace(/^\/manager\/?/, '');
    if (!tail) return '';
    return tail.split('/')[0];
  }, [location.pathname]);

  const title = pageTitle[slug] ?? 'Manager';
  const selectedBuilding = buildings.find((b) => b._id === selectedBuildingId);

  return (
    <div className="admin-theme relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_8%,rgba(249,115,22,0.18),transparent_24%),radial-gradient(circle_at_86%_10%,rgba(251,191,36,0.12),transparent_22%),linear-gradient(180deg,rgba(255,255,255,0.55),rgba(255,247,237,0.16))]" />

      <div className="relative z-10 flex min-h-screen">
        <aside className="sticky top-0 hidden h-screen w-[260px] flex-col border-r border-border/80 bg-[rgba(255,250,243,0.92)] p-3 shadow-[12px_0_36px_rgba(120,83,48,0.12)] backdrop-blur-2xl lg:flex">
          <div className="mb-4 rounded-2xl border border-border/80 bg-white/78 p-3 shadow-[0_10px_24px_rgba(120,83,48,0.08)]">
            <p className="text-xs uppercase tracking-[0.2em] text-stone-600">PBMS Manager</p>
            <p className="mt-1 text-sm font-semibold text-black">Vận hành tòa nhà</p>
            {selectedBuilding ? (
              <p className="mt-1 truncate text-xs text-stone-600">
                {selectedBuilding.code} · {selectedBuilding.name}
              </p>
            ) : null}
          </div>

          <nav className="flex-1 space-y-0.5 overflow-y-auto pr-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.label}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition',
                      isActive
                        ? 'bg-gradient-to-r from-primary to-orange-400 text-primary-foreground shadow-[0_8px_18px_rgba(249,115,22,0.22)]'
                        : 'text-stone-700 hover:bg-primary/10 hover:text-black'
                    )
                  }
                >
                  <Icon size={15} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-border/80 bg-[rgba(255,250,243,0.86)] px-4 py-3 backdrop-blur-2xl">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-stone-600">Trang quản lý</p>
                <h1 className="text-xl font-semibold text-black">{title}</h1>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-red-600 hover:bg-red-50 hover:text-red-700"
                  onClick={onLogout}
                >
                  <LogOut size={14} />
                  <span className="hidden sm:inline">Đăng xuất</span>
                </Button>

                {buildings.length > 0 ? (
                  <select
                    value={selectedBuildingId ?? ''}
                    onChange={(e) => selectBuilding(e.target.value)}
                    className="h-9 rounded-md border border-border bg-white px-3 text-sm text-foreground outline-none"
                  >
                    {buildings.map((b) => (
                      <option key={b._id} value={b._id}>
                        {b.code} — {b.name}
                      </option>
                    ))}
                  </select>
                ) : null}

                <Button variant="secondary" size="sm" className="gap-2">
                  <Bell size={14} />
                  <span className="hidden sm:inline">Thông báo</span>
                </Button>

                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild>
                    <Button variant="secondary" size="sm" className="gap-2">
                      <span className="max-w-[150px] truncate text-xs sm:text-sm">
                        {user?.email}
                      </span>
                      <ChevronDown size={14} />
                    </Button>
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Portal>
                    <DropdownMenu.Content
                      sideOffset={6}
                      className="z-50 min-w-[200px] rounded-md border border-border/80 bg-[rgba(255,250,243,0.98)] p-1 shadow-[0_20px_45px_rgba(120,83,48,0.16)]"
                    >
                      <div className="px-3 py-2">
                        <p className="text-sm font-semibold text-foreground">{user?.fullName}</p>
                        <p className="text-xs text-muted-foreground">{user?.role}</p>
                      </div>
                    </DropdownMenu.Content>
                  </DropdownMenu.Portal>
                </DropdownMenu.Root>
              </div>
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6">
            {bootstrapping || isLoading ? (
              <div className="text-sm text-muted-foreground">Đang tải tòa nhà được giao...</div>
            ) : error ? (
              <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            ) : !selectedBuildingId ? (
              <div className="rounded-md border border-border bg-card p-6 text-sm text-muted-foreground">
                Tài khoản này chưa được gán tòa nhà nào. Vui lòng liên hệ Admin.
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
