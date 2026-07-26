import { useEffect, useMemo, useState } from 'react';
import { Outlet, useLocation, useNavigate, useMatch } from 'react-router-dom';
import {
  Building2,
  Car,
  ClipboardList,
  Clock,
  Flag,
  History,
  LayoutDashboard,
  Layers,
  MapPin,
  MessageSquare,
  Package,
  ShieldAlert,
  Banknote,
  SlidersHorizontal,
  Square,
  Truck,
  User,
  Users,
  Wallet,
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { PortalSidebar, type PortalNavEntry } from '@/components/layout/PortalSidebar';
import { MobileNavDrawer, MobileNavButton } from '@/components/layout/MobileNavDrawer';
import { useAuth } from '@/hooks/useAuth';
import { ADMIN_EMAIL_FALLBACK } from '@/utils/constants';
import { useManagerBuildings } from '@/hooks/useManagerBuildings';
import { AppBackdrop } from '@/components/layout/AppBackdrop';

// Sidebar gom nhóm theo tần suất sử dụng: mục thao tác hằng ngày đứng riêng,
// mục cấu hình ít đụng tới được gấp vào nhóm collapsible.
const navItems: readonly PortalNavEntry[] = [
  { to: 'dashboard', label: 'Overview', icon: LayoutDashboard },
  { to: 'sessions', label: 'Parked Vehicles', icon: Car },
  { to: 'session-history', label: 'Session History', icon: History },
  {
    label: 'Infrastructure',
    icon: Building2,
    children: [
      { to: 'buildings', label: 'Buildings', icon: Building2 },
      { to: 'floors', label: 'Floors', icon: ClipboardList },
      { to: 'zones', label: 'Zones', icon: Layers },
      { to: 'gates', label: 'Gates', icon: Flag },
      { to: 'slots', label: 'Parking Slots', icon: Square },
      { to: 'vehicle-types', label: 'Vehicle Types', icon: Truck },
    ],
  },
  {
    label: 'Business',
    icon: Package,
    children: [
      { to: 'packages', label: 'Packages', icon: Package },
      { to: 'price-policies', label: 'Price Policies', icon: SlidersHorizontal },
      { to: 'penalty-pricing', label: 'Penalty Pricing', icon: Banknote },
      { to: 'refund-policy', label: 'Refund Policy', icon: MapPin },
      { to: 'wallet', label: 'Building Wallet', icon: Wallet },
    ],
  },
  {
    label: 'Staff & Shifts',
    icon: Users,
    children: [
      { to: 'staff', label: 'Staff', icon: User },
      { to: 'shifts', label: 'Shifts & Assignments', icon: Users },
      { to: 'operating-hours', label: 'Operating Hours', icon: Clock },
    ],
  },
  {
    label: 'Customer Care',
    icon: MessageSquare,
    children: [
      { to: 'incidents', label: 'Incidents', icon: ShieldAlert },
      { to: 'reviews', label: 'Reviews', icon: MessageSquare },
    ],
  },
];

const titles: Record<string, string> = {
  '/manager': 'Manager Dashboard',
  '/manager/dashboard': 'Management Report',
  '/manager/buildings': 'Building Management',
  '/manager/vehicle-types': 'Vehicle Types',
  '/manager/floors': 'Floors',
  '/manager/gates': 'Gates',
  '/manager/zones': 'Zones',
  '/manager/slots': 'Parking Slots',
  '/manager/operating-hours': 'Operating Hours',
  '/manager/price-policies': 'Price Policies',
  '/manager/penalty-pricing': 'Penalty Pricing',
  '/manager/refund-policy': 'Refund Policy',
  '/manager/packages': 'Package Management',
  '/manager/shifts': 'Shifts & Assignments',
  '/manager/sessions': 'Parked Vehicles',
  '/manager/reviews': 'Reviews',
  '/manager/incidents': 'Incidents',
  '/manager/wallet': 'Building Wallet',
  '/manager/profile': 'Profile',
  '/manager/settings': 'Settings',
};

export function ManagerLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { session, logout } = useAuth();
  const { selectedBuildingId, isLoading } = useManagerBuildings();
  const navigate = useNavigate();
  const location = useLocation();

  const title = useMemo(() => titles[location.pathname] ?? 'Manager Dashboard', [location.pathname]);
  const isProfileRoute = Boolean(useMatch('/manager/profile'));

  useEffect(() => {
    document.body.classList.add('manager-theme');
    document.body.classList.remove('admin-theme');
    return () => {
      document.body.classList.remove('manager-theme');
    };
  }, []);

  return (
    <div className="portal-shell relative min-h-screen text-slate-900">
      <AppBackdrop />
      <div className="relative z-10 flex min-h-screen">
        <PortalSidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed((prev) => !prev)}
          portalLabel="MANAGER PORTAL"
          items={navItems}
          basePath="/manager"
        />
        <div className="flex min-h-screen flex-1 flex-col">
          <Navbar
            title={title}
            email={session?.email ?? ADMIN_EMAIL_FALLBACK}
            fullName={session?.displayName}
            role={session?.role}
            showNotification={false}
            onLogout={() => {
              logout();
              navigate('/auth/login', { replace: true });
            }}
          />
          <main className="portal-main flex-1 p-4 md:p-6 lg:p-8">
            <div className="mx-auto w-full max-w-[1600px]">
              {isLoading && !isProfileRoute ? (
                <div className="app-state-card" role="status">
                  <span className="app-state-card__loader" />
                  <div>
                    <p className="font-bold text-slate-900">Preparing your workspace</p>
                    <p className="mt-1 text-sm text-slate-500">Loading building information…</p>
                  </div>
                </div>
              ) : !selectedBuildingId && !isProfileRoute ? (
                <div className="app-state-card">
                  <div>
                    <p className="font-bold text-slate-900">No building assigned</p>
                    <p className="mt-1 text-sm text-slate-500">
                      This account has not been assigned to a building. Please contact an administrator.
                    </p>
                  </div>
                </div>
              ) : (
                <Outlet
                  context={{
                    buildingId: selectedBuildingId ?? '',
                  }}
                />
              )}
            </div>
          </main>
        </div>
      </div>

      <MobileNavButton onOpen={() => setMobileNavOpen(true)} />
      <MobileNavDrawer open={mobileNavOpen} onClose={() => setMobileNavOpen(false)}>
        <PortalSidebar
          variant="drawer"
          collapsed={false}
          onToggle={() => {}}
          onNavigate={() => setMobileNavOpen(false)}
          portalLabel="MANAGER PORTAL"
          items={navItems}
          basePath="/manager"
        />
      </MobileNavDrawer>
    </div>
  );
}
