import { Navigate, Route, Routes } from 'react-router-dom';
import { AdminLayout } from '@/layouts/AdminLayout';
import { DashboardOverviewPage } from '@/pages/admin/DashboardOverviewPage';
import { LoginPage } from '@/pages/admin/LoginPage';
import { BuildingsPage } from '@/pages/admin/BuildingsPage';
import { UsersPage } from '@/pages/admin/UsersPage';
import { RevenueAnalyticsPage } from '@/pages/admin/RevenueAnalyticsPage';
import { AuditLogsPage } from '@/pages/admin/AuditLogsPage';
import { AdminProfilePage } from '@/pages/admin/AdminProfilePage';
import { FraudDetectionPage } from '@/pages/admin/FraudDetectionPage';
import { SystemHealthPage } from '@/pages/admin/SystemHealthPage';
import { ModulePlaceholderPage } from '@/pages/admin/ModulePlaceholderPage';
import { HomeRoute } from '@/pages/public/HomeRoute';
import ProfilePage from '@/pages/public/ProfilePage';
import { PublicLoginRoute, PublicRegisterRoute } from '@/pages/public/AuthRoutes';
import { ProtectedRoute } from '@/routes/ProtectedRoute';
import { ManagerLayout } from '@/layouts/ManagerLayout';
import { ManagerBuildingsPage } from '@/pages/manager/ManagerBuildingsPage';
import { ManagerDashboardPage } from '@/pages/manager/ManagerDashboardPage';
import { ManagerFeedbackPage } from '@/pages/manager/ManagerFeedbackPage';
import { ManagerLoginPage } from '@/pages/manager/ManagerLoginPage';
import { ManagerPlaceholderPage } from '@/pages/manager/ManagerPlaceholderPage';
import { ManagerProfilePage } from '@/pages/manager/ManagerProfilePage';
import { ManagerProtectedRoute } from '@/routes/ManagerProtectedRoute';
import { ManagerVehicleTypesPage } from '@/pages/manager/ManagerVehicleTypesPage';

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<HomeRoute />} />
      <Route path="/dashboard" element={<Navigate to="/" replace />} />
      <Route path="/auth/login" element={<PublicLoginRoute />} />
      <Route path="/auth/register" element={<PublicRegisterRoute />} />
      <Route path="/profile" element={<ProfilePage />} />

      <Route path="/manager/login" element={<ManagerLoginPage />} />
      <Route path="/manager" element={<Navigate to="/manager/dashboard" replace />} />
      <Route element={<ManagerProtectedRoute />}>
        <Route path="/manager" element={<ManagerLayout />}>
          <Route index element={<ManagerDashboardPage />} />
          <Route path="dashboard" element={<ManagerDashboardPage />} />
          <Route path="buildings" element={<ManagerBuildingsPage />} />
          <Route path="vehicle-types" element={<ManagerVehicleTypesPage />} />
          <Route path="feedbacks" element={<ManagerFeedbackPage />} />
          <Route path="profile" element={<ManagerProfilePage />} />
          <Route
            path="floors"
            element={
              <ManagerPlaceholderPage
                title="Tầng"
                description="Quản lý tầng có thể điều chỉnh số lượng và thông tin khu vực cho mỗi tòa nhà."
              />
            }
          />
          <Route
            path="gates"
            element={
              <ManagerPlaceholderPage
                title="Cổng"
                description="Quản lý cổng cho phép định cấu hình đầu vào/đầu ra và trạng thái hoạt động."
              />
            }
          />
          <Route
            path="slots"
            element={
              <ManagerPlaceholderPage
                title="Chỗ đỗ"
                description="Quản lý chỗ đỗ cho phép cập nhật trạng thái, phân bổ và theo dõi tình trạng sử dụng."
              />
            }
          />
          <Route
            path="price-policies"
            element={
              <ManagerPlaceholderPage
                title="Chính sách giá"
                description="Cấu hình chính sách giá theo từng tòa nhà, gói và trạng thái khách hàng."
              />
            }
          />
          <Route
            path="reservation-policy"
            element={
              <ManagerPlaceholderPage
                title="Chính sách đặt chỗ"
                description="Quản lý điều kiện và giới hạn đặt chỗ cho từng tòa nhà."
              />
            }
          />
          <Route
            path="packages"
            element={
              <ManagerPlaceholderPage
                title="Gói đăng ký"
                description="Quản lý gói dịch vụ, ưu đãi và trạng thái đăng ký của khách hàng."
              />
            }
          />
          <Route
            path="shifts"
            element={
              <ManagerPlaceholderPage
                title="Ca trực"
                description="Quản lý lịch trực, nhân sự và doanh thu ca trực."
              />
            }
          />
          <Route
            path="settings"
            element={
              <ManagerPlaceholderPage
                title="Cài đặt"
                description="Cấu hình bảo mật, thông báo và tham số vận hành cho manager."
              />
            }
          />
        </Route>
      </Route>

      <Route path="/admin/login" element={<LoginPage />} />
      <Route path="/admin" element={<Navigate to="/admin/login" replace />} />
      <Route path="/admin/direct" element={<AdminLayout />} />

      <Route element={<ProtectedRoute role="admin" />}>
        <Route path="/admin/dashboard" element={<AdminLayout />}>
          <Route index element={<DashboardOverviewPage />} />
          <Route path="buildings" element={<BuildingsPage />} />
          <Route
            path="managers"
            element={<ModulePlaceholderPage title="Quản lý" description="Quy trình phân công quản lý và bảng điều khiển quản trị." />}
          />
          <Route path="users" element={<UsersPage />} />
          <Route path="revenue-analytics" element={<RevenueAnalyticsPage />} />
          <Route
            path="wallet-governance"
            element={<ModulePlaceholderPage title="Quản lý ví" description="Điều khiển ví hệ thống, khung phân phối và phê duyệt." />}
          />
          <Route
            path="pricing-policies"
            element={<ModulePlaceholderPage title="Chính sách giá" description="Phạm vi chính sách, mẫu chính sách và ràng buộc theo vai trò." />}
          />
          <Route
            path="policy-push-logs"
            element={<ModulePlaceholderPage title="Lịch sử đẩy chính sách" description="Lịch sử đẩy chính sách giữa tòa nhà và thao tác hoàn tác." />}
          />
          <Route path="audit-logs" element={<AuditLogsPage />} />
          <Route path="fraud-detection" element={<FraudDetectionPage />} />
          <Route path="system-health" element={<SystemHealthPage />} />
          <Route
            path="notifications"
            element={<ModulePlaceholderPage title="Thông báo" description="Mẫu thông báo, giám sát hàng đợi và kênh gửi." />}
          />
          <Route path="profile" element={<AdminProfilePage />} />
          <Route
            path="settings"
            element={<ModulePlaceholderPage title="Cài đặt" description="Cấu hình nền tảng, chính sách truy cập và tùy chọn vận hành." />}
          />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
