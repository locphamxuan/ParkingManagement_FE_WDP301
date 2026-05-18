import { useMemo, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from '@/components/shared/Sidebar';
import { Navbar } from '@/components/shared/Navbar';
import { useAuth } from '@/hooks/useAuth';
import { MOCK_ADMIN } from '@/utils/constants';

const titles: Record<string, string> = {
  '/admin/dashboard': 'Enterprise Dashboard',
  '/admin/dashboard/buildings': 'Buildings Operations',
  '/admin/dashboard/managers': 'Manager Governance',
  '/admin/dashboard/users': 'User Governance',
  '/admin/dashboard/revenue-analytics': 'Revenue Analytics',
  '/admin/dashboard/wallet-governance': 'Wallet Governance',
  '/admin/dashboard/pricing-policies': 'Pricing Policies',
  '/admin/dashboard/policy-push-logs': 'Policy Push Logs',
  '/admin/dashboard/audit-logs': 'Audit Logs',
  '/admin/dashboard/fraud-detection': 'Fraud Detection',
  '/admin/dashboard/system-health': 'System Health',
  '/admin/dashboard/notifications': 'Notifications',
  '/admin/dashboard/settings': 'Settings',
};

export function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const { session, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const title = useMemo(() => titles[location.pathname] ?? 'Admin Dashboard', [location.pathname]);

  return (
    <div className="admin-theme relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_8%,rgba(249,115,22,0.18),transparent_24%),radial-gradient(circle_at_86%_10%,rgba(251,191,36,0.12),transparent_22%),linear-gradient(180deg,rgba(255,255,255,0.55),rgba(255,247,237,0.16))]" />
      <div className="relative z-10 flex min-h-screen">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((prev) => !prev)} />
        <div className="flex min-h-screen flex-1 flex-col">
        <Navbar
          title={title}
          email={session?.email ?? MOCK_ADMIN.email}
          onLogout={() => {
            logout();
            navigate('/admin/login', { replace: true });
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
