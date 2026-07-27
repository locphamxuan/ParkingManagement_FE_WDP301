import { useEffect, useMemo, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Building2,
  CircleDollarSign,
  FileSearch,
  LayoutDashboard,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { PortalSidebar, type PortalNavItem } from '@/components/layout/PortalSidebar';
import { MobileNavDrawer, MobileNavButton } from '@/components/layout/MobileNavDrawer';
import { Navbar } from '@/components/layout/Navbar';
import { useAuth } from '@/hooks/useAuth';
import { ADMIN_EMAIL_FALLBACK } from '@/utils/constants';
import { AppBackdrop } from '@/components/layout/AppBackdrop';

const navItems: readonly PortalNavItem[] = [
  { to: '', label: 'Overview', icon: LayoutDashboard },
  { to: 'buildings', label: 'Buildings', icon: Building2 },
  { to: 'users', label: 'Users', icon: Users },
  { to: 'revenue-analytics', label: 'Revenue Analytics', icon: CircleDollarSign },
  { to: 'role-governance', label: 'Roles & Governance', icon: ShieldCheck },
  { to: 'audit-logs', label: 'Audit Logs', icon: FileSearch },
];

const titles: Record<string, string> = {
  '/admin': 'Business Dashboard',
  '/admin/dashboard': 'Business Dashboard',
  '/admin/buildings': 'Building Management',
  '/admin/users': 'User Management',
  '/admin/revenue-analytics': 'Revenue Analytics',
  '/admin/role-governance': 'Roles & Governance',
  '/admin/audit-logs': 'Audit Logs',
  '/admin/notifications': 'Notifications',
  '/admin/profile': 'Profile',
  '/admin/settings': 'Settings',
};

export function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { session, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const title = useMemo(() => titles[location.pathname] ?? 'Admin Dashboard', [location.pathname]);

  useEffect(() => {
    document.body.classList.add('admin-theme');
    document.body.classList.remove('manager-theme');
    return () => {
      document.body.classList.remove('admin-theme');
    };
  }, []);

  return (
    <div className="portal-shell relative min-h-screen text-slate-900">
      <AppBackdrop />
      <div className="relative z-10 flex min-h-screen">
        <PortalSidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed((prev) => !prev)}
          portalLabel="ADMIN PORTAL"
          items={navItems}
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
              <Outlet />
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
          portalLabel="ADMIN PORTAL"
          items={navItems}
        />
      </MobileNavDrawer>
    </div>
  );
}
