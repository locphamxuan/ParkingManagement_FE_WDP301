import { Navigate, Route, Routes } from 'react-router-dom';
import { AdminLayout } from '@/layouts/AdminLayout';
import { DashboardOverviewPage } from '@/pages/admin/DashboardOverviewPage';
import { LoginPage } from '@/pages/admin/LoginPage';
import { BuildingsPage } from '@/pages/admin/BuildingsPage';
import { UsersPage } from '@/pages/admin/UsersPage';
import { RevenueAnalyticsPage } from '@/pages/admin/RevenueAnalyticsPage';
import { AuditLogsPage } from '@/pages/admin/AuditLogsPage';
import { FraudDetectionPage } from '@/pages/admin/FraudDetectionPage';
import { SystemHealthPage } from '@/pages/admin/SystemHealthPage';
import { ModulePlaceholderPage } from '@/pages/admin/ModulePlaceholderPage';
import { HomeRoute } from '@/pages/public/HomeRoute';
import { DashboardRoute } from '@/pages/public/DashboardRoute';
import { PublicLoginRoute, PublicRegisterRoute } from '@/pages/public/AuthRoutes';
import { ProtectedRoute } from '@/routes/ProtectedRoute';

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<HomeRoute />} />
      <Route path="/dashboard" element={<DashboardRoute />} />
      <Route path="/auth/login" element={<PublicLoginRoute />} />
      <Route path="/auth/register" element={<PublicRegisterRoute />} />

      <Route path="/admin/login" element={<LoginPage />} />
      <Route path="/admin" element={<Navigate to="/admin/login" replace />} />
      <Route path="/admin/direct" element={<AdminLayout />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/admin/dashboard" element={<AdminLayout />}>
          <Route index element={<DashboardOverviewPage />} />
          <Route path="buildings" element={<BuildingsPage />} />
          <Route
            path="managers"
            element={<ModulePlaceholderPage title="Managers" description="Manager assignment workflow and governance panel." />}
          />
          <Route path="users" element={<UsersPage />} />
          <Route path="revenue-analytics" element={<RevenueAnalyticsPage />} />
          <Route
            path="wallet-governance"
            element={<ModulePlaceholderPage title="Wallet Governance" description="System wallet controls, distribution windows and approvals." />}
          />
          <Route
            path="pricing-policies"
            element={<ModulePlaceholderPage title="Pricing Policies" description="Global policy ranges, policy templates and role constraints." />}
          />
          <Route
            path="policy-push-logs"
            element={<ModulePlaceholderPage title="Policy Push Logs" description="Cross-building policy push history and rollback actions." />}
          />
          <Route path="audit-logs" element={<AuditLogsPage />} />
          <Route path="fraud-detection" element={<FraudDetectionPage />} />
          <Route path="system-health" element={<SystemHealthPage />} />
          <Route
            path="notifications"
            element={<ModulePlaceholderPage title="Notifications" description="Notification templates, queue monitoring and delivery channels." />}
          />
          <Route
            path="settings"
            element={<ModulePlaceholderPage title="Settings" description="Platform settings, access policy and operational preferences." />}
          />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
