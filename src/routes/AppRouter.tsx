import { Navigate, Route, Routes } from 'react-router-dom';

// Layouts
import { AdminLayout } from '@/layouts/AdminLayout';
import { ManagerLayout } from '@/layouts/ManagerLayout';
import { StaffLayout } from '@/layouts/StaffLayout';

// Auth & Public
import { HomeRoute } from '@/pages/public/HomeRoute';
import { DashboardRoute } from '@/pages/public/DashboardRoute';
import { PublicLoginRoute, PublicRegisterRoute } from '@/pages/public/AuthRoutes';

// Admin pages
import { DashboardOverviewPage } from '@/pages/admin/DashboardOverviewPage';
import { BuildingsPage } from '@/pages/admin/BuildingsPage';
import { UsersPage } from '@/pages/admin/UsersPage';
import { RevenueAnalyticsPage } from '@/pages/admin/RevenueAnalyticsPage';
import { AuditLogsPage } from '@/pages/admin/AuditLogsPage';
import { FraudDetectionPage } from '@/pages/admin/FraudDetectionPage';
import { SystemHealthPage } from '@/pages/admin/SystemHealthPage';
import { ModulePlaceholderPage } from '@/pages/admin/ModulePlaceholderPage';

// Manager pages
import { ManagerDashboardPage } from '@/pages/manager/ManagerDashboardPage';
import { ManagerBuildingInfoPage } from '@/pages/manager/ManagerBuildingInfoPage';
import { ManagerVehicleTypesPage } from '@/pages/manager/ManagerVehicleTypesPage';
import { ManagerFloorsPage } from '@/pages/manager/ManagerFloorsPage';
import { ManagerGatesPage } from '@/pages/manager/ManagerGatesPage';
import { ManagerSlotsPage } from '@/pages/manager/ManagerSlotsPage';
import { ManagerPricingPage } from '@/pages/manager/ManagerPricingPage';
import { ManagerPolicyLogsPage } from '@/pages/manager/ManagerPolicyLogsPage';
import { ManagerPackagesPage } from '@/pages/manager/ManagerPackagesPage';
import { ManagerSubscriptionsPage } from '@/pages/manager/ManagerSubscriptionsPage';
import { ManagerReservationPolicyPage } from '@/pages/manager/ManagerReservationPolicyPage';
import { ManagerShiftsPage } from '@/pages/manager/ManagerShiftsPage';
import { ManagerStaffShiftsPage } from '@/pages/manager/ManagerStaffShiftsPage';
import { ManagerRevenuesPage } from '@/pages/manager/ManagerRevenuesPage';
import { ManagerFeedbacksPage } from '@/pages/manager/ManagerFeedbacksPage';

// Staff pages
import { StaffDashboardPage } from '@/pages/staff/StaffDashboardPage';
import { StaffShiftsPage } from '@/pages/staff/StaffShiftsPage';
import { StaffSessionsPage } from '@/pages/staff/StaffSessionsPage';

// Guards
import { ProtectedRoute } from '@/routes/ProtectedRoute';

export function AppRouter() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<HomeRoute />} />
      <Route path="/dashboard" element={<DashboardRoute />} />
      <Route path="/auth/login" element={<PublicLoginRoute />} />
      <Route path="/auth/register" element={<PublicRegisterRoute />} />

      {/* Legacy redirects */}
      <Route path="/login" element={<Navigate to="/auth/login" replace />} />
      <Route path="/admin/login" element={<Navigate to="/auth/login" replace />} />
      <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
      <Route path="/manager/dashboard" element={<Navigate to="/manager" replace />} />

      {/* Admin — protected */}
      <Route element={<ProtectedRoute role="admin" />}>
        <Route path="/admin/dashboard" element={<AdminLayout />}>
          <Route index element={<DashboardOverviewPage />} />
          <Route path="buildings" element={<BuildingsPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="revenue-analytics" element={<RevenueAnalyticsPage />} />
          <Route path="audit-logs" element={<AuditLogsPage />} />
          <Route path="fraud-detection" element={<FraudDetectionPage />} />
          <Route path="system-health" element={<SystemHealthPage />} />
          <Route
            path="managers"
            element={
              <ModulePlaceholderPage
                title="Quản lý"
                description="Quy trình phân công quản lý và bảng điều khiển quản trị."
              />
            }
          />
          <Route
            path="wallet-governance"
            element={
              <ModulePlaceholderPage
                title="Quản lý ví"
                description="Điều khiển ví hệ thống, khung phân phối và phê duyệt."
              />
            }
          />
          <Route
            path="pricing-policies"
            element={
              <ModulePlaceholderPage
                title="Chính sách giá"
                description="Phạm vi chính sách, mẫu chính sách và ràng buộc theo vai trò."
              />
            }
          />
          <Route
            path="policy-push-logs"
            element={
              <ModulePlaceholderPage
                title="Lịch sử đẩy chính sách"
                description="Lịch sử đẩy chính sách giữa tòa nhà và thao tác hoàn tác."
              />
            }
          />
          <Route
            path="notifications"
            element={
              <ModulePlaceholderPage
                title="Thông báo"
                description="Mẫu thông báo, giám sát hàng đợi và kênh gửi."
              />
            }
          />
          <Route
            path="settings"
            element={
              <ModulePlaceholderPage
                title="Cài đặt"
                description="Cấu hình nền tảng, chính sách truy cập và tùy chọn vận hành."
              />
            }
          />
        </Route>
      </Route>

      {/* Manager — protected */}
      <Route element={<ProtectedRoute role="manager" />}>
        <Route path="/manager" element={<ManagerLayout />}>
          <Route index element={<ManagerDashboardPage />} />
          <Route path="building" element={<ManagerBuildingInfoPage />} />
          <Route path="vehicle-types" element={<ManagerVehicleTypesPage />} />
          <Route path="floors" element={<ManagerFloorsPage />} />
          <Route path="gates" element={<ManagerGatesPage />} />
          <Route path="slots" element={<ManagerSlotsPage />} />
          <Route path="pricing" element={<ManagerPricingPage />} />
          <Route path="policy-logs" element={<ManagerPolicyLogsPage />} />
          <Route path="packages" element={<ManagerPackagesPage />} />
          <Route path="subscriptions" element={<ManagerSubscriptionsPage />} />
          <Route path="reservation-policy" element={<ManagerReservationPolicyPage />} />
          <Route path="shifts" element={<ManagerShiftsPage />} />
          <Route path="staff-shifts" element={<ManagerStaffShiftsPage />} />
          <Route path="revenues" element={<ManagerRevenuesPage />} />
          <Route path="feedbacks" element={<ManagerFeedbacksPage />} />
        </Route>
      </Route>

      {/* Staff — protected */}
      <Route element={<ProtectedRoute role="staff" />}>
        <Route path="/staff" element={<StaffLayout />}>
          <Route index element={<StaffDashboardPage />} />
          <Route path="my-shifts" element={<StaffShiftsPage />} />
          <Route path="sessions" element={<StaffSessionsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
