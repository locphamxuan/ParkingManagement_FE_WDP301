import { useEffect, useMemo, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileNavDrawer, MobileNavButton } from '@/components/layout/MobileNavDrawer';
import { Navbar } from '@/components/layout/Navbar';
import { useAuth } from '@/hooks/useAuth';
import { ADMIN_EMAIL_FALLBACK } from '@/utils/constants';

const titles: Record<string, string> = {
  '/admin/dashboard': 'Enterprise Dashboard',
  '/admin/dashboard/buildings': 'Building Management',
  '/admin/dashboard/users': 'User Management',
  '/admin/dashboard/revenue-analytics': 'Revenue Analytics',
  '/admin/dashboard/audit-logs': 'Audit Logs',
  '/admin/dashboard/notifications': 'Notifications',
  '/admin/dashboard/profile': 'Profile',
  '/admin/dashboard/settings': 'Settings',
};

export function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { session, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const title = useMemo(() => titles[location.pathname] ?? 'Admin Dashboard', [location.pathname]);

  // Áp theme sáng của admin (đồng nhất tông với manager/staff) lên body.
  useEffect(() => {
    document.body.classList.add('admin-theme');
    document.body.classList.remove('manager-theme');
    return () => {
      document.body.classList.remove('admin-theme');
    };
  }, []);

  return (
    <div className="relative min-h-screen bg-background text-foreground transition-colors duration-200">
      {/* Subtle blue/cyan ambient glow for admin theme */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle_at_center,rgba(14,165,233,0.04),transparent_65%)] blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.03),transparent_60%)] blur-3xl" />
      </div>
      <div className="relative z-10 flex min-h-screen">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((prev) => !prev)} />
        {/* Điều hướng mobile (<lg): sidebar desktop bị hidden nên cần drawer + FAB. */}
        <MobileNavButton onOpen={() => setMobileNavOpen(true)} />
        <MobileNavDrawer open={mobileNavOpen} onClose={() => setMobileNavOpen(false)}>
          <Sidebar
            collapsed={false}
            onToggle={() => {}}
            variant="drawer"
            onNavigate={() => setMobileNavOpen(false)}
          />
        </MobileNavDrawer>
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
          <main className="flex-1 p-4 md:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
