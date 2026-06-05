import { Navigate, Route, Routes } from "react-router-dom";
import { ScrollToTop } from "@/components/shared/ScrollToTop";
import { AdminLayout } from "@/layouts/AdminLayout";
import { DashboardOverviewPage } from "@/pages/admin/DashboardOverviewPage";
import { BuildingsPage } from "@/pages/admin/BuildingsPage";
import { UsersPage } from "@/pages/admin/UsersPage";
import { RevenueAnalyticsPage } from "@/pages/admin/RevenueAnalyticsPage";
import { AuditLogsPage } from "@/pages/admin/AuditLogsPage";
import { SystemWalletPage } from "@/pages/admin/SystemWalletPage";
import { ModulePlaceholderPage } from "@/pages/admin/ModulePlaceholderPage";
import { HomeRoute } from "@/pages/public/HomeRoute";
import ProfilePage from "@/pages/public/ProfilePage";
import ReservationsPage from "@/pages/public/ReservationsPage";
import {
  PublicLoginRoute,
  PublicRegisterRoute,
  PublicResetPasswordRoute,
} from "@/pages/public/AuthRoutes";
import { ProtectedRoute } from "@/routes/ProtectedRoute";
import { ManagerLayout } from "@/layouts/ManagerLayout";
import { ManagerBuildingsPage } from "@/pages/manager/ManagerBuildingsPage";
import { ManagerDashboardPage } from "@/pages/manager/ManagerDashboardPage";
import { ManagerWalletPage } from "@/pages/manager/ManagerWalletPage";
import { ManagerFeedbackPage } from "@/pages/manager/ManagerFeedbackPage";
import { ManagerProfilePage } from "@/pages/manager/ManagerProfilePage";
import { ManagerProtectedRoute } from "@/routes/ManagerProtectedRoute";
import { ManagerVehicleTypesPage } from "@/pages/manager/ManagerVehicleTypesPage";
import { ManagerFloorsGatesPage } from "@/pages/manager/ManagerFloorsGatesPage";
import { ManagerSlotsPage } from "@/pages/manager/ManagerSlotsPage";
import { ManagerPricingPage } from "@/pages/manager/ManagerPricingPage";
import { ManagerReservationPolicyPage } from "@/pages/manager/ManagerReservationPolicyPage";
import { ManagerPackagesPage } from "@/pages/manager/ManagerPackagesPage";
import { ManagerShiftsPage } from "@/pages/manager/ManagerShiftsPage";
import { ManagerStaffPage } from "@/pages/manager/ManagerStaffPage";
import { StaffLayout } from "@/layouts/StaffLayout";
import { StaffDashboardPage } from "@/pages/staff/StaffDashboardPage";
import { StaffShiftsPage } from "@/pages/staff/StaffShiftsPage";
import { StaffSessionsPage } from "@/pages/staff/StaffSessionsPage";
import { StaffOperationsPage } from "@/pages/staff/StaffOperationsPage";
import { StaffIncidentsPage } from "@/pages/staff/StaffIncidentsPage";
import { StaffReservationsPage } from "@/pages/staff/StaffReservationsPage";

export function AppRouter() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<HomeRoute />} />
        <Route path="/dashboard" element={<Navigate to="/" replace />} />
        <Route path="/auth/login" element={<PublicLoginRoute />} />
        <Route path="/auth/register" element={<PublicRegisterRoute />} />
        <Route
          path="/auth/reset-password"
          element={<PublicResetPasswordRoute />}
        />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/reservations" element={<ReservationsPage />} />

        <Route
          path="/manager/login"
          element={<Navigate to="/auth/login" replace />}
        />
        <Route
          path="/manager"
          element={<Navigate to="/manager/dashboard" replace />}
        />
        <Route element={<ManagerProtectedRoute />}>
          <Route path="/manager" element={<ManagerLayout />}>
            <Route index element={<ManagerDashboardPage />} />
            <Route path="dashboard" element={<ManagerDashboardPage />} />
            <Route path="buildings" element={<ManagerBuildingsPage />} />
            <Route path="vehicle-types" element={<ManagerVehicleTypesPage />} />
            <Route path="feedbacks" element={<ManagerFeedbackPage />} />
            <Route path="profile" element={<ManagerProfilePage />} />
            <Route path="floors" element={<ManagerFloorsGatesPage />} />
            <Route path="slots" element={<ManagerSlotsPage />} />
            <Route path="price-policies" element={<ManagerPricingPage />} />
            <Route
              path="reservation-policy"
              element={<ManagerReservationPolicyPage />}
            />
            <Route path="packages" element={<ManagerPackagesPage />} />
            <Route path="shifts" element={<ManagerShiftsPage />} />
            <Route path="staff"  element={<ManagerStaffPage />} />
            <Route path="wallet" element={<ManagerWalletPage />} />
          </Route>
        </Route>

        <Route
          path="/admin/login"
          element={<Navigate to="/auth/login" replace />}
        />
        <Route path="/admin" element={<Navigate to="/auth/login" replace />} />
        <Route path="/admin/direct" element={<AdminLayout />} />

        <Route
          path="/staff/login"
          element={<Navigate to="/auth/login" replace />}
        />

        <Route element={<ProtectedRoute role="staff" />}>
          <Route path="/staff" element={<StaffLayout />}>
            <Route index element={<StaffDashboardPage />} />
            <Route path="dashboard" element={<StaffDashboardPage />} />
            <Route path="operations" element={<StaffOperationsPage />} />
            <Route path="reservations" element={<StaffReservationsPage />} />
            <Route path="my-shifts" element={<StaffShiftsPage />} />
            <Route path="sessions" element={<StaffSessionsPage />} />
            <Route path="incidents" element={<StaffIncidentsPage />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute role="admin" />}>
          <Route path="/admin/dashboard" element={<AdminLayout />}>
            <Route index element={<DashboardOverviewPage />} />
            <Route path="buildings" element={<BuildingsPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route
              path="revenue-analytics"
              element={<RevenueAnalyticsPage />}
            />
            <Route path="system-wallet" element={<SystemWalletPage />} />
            <Route path="audit-logs" element={<AuditLogsPage />} />
            <Route
              path="system-health"
              element={<Navigate to="/admin/dashboard" replace />}
            />
            <Route
              path="notifications"
              element={
                <ModulePlaceholderPage
                  title="Notifications"
                  description="Notification templates, queue monitoring, and delivery channels."
                />
              }
            />
            {/* Admins do not have a profile page — redirect to dashboard. */}
            <Route path="profile" element={<Navigate to="/admin/dashboard" replace />} />
            <Route
              path="settings"
              element={
                <ModulePlaceholderPage
                  title="Settings"
                  description="Platform configuration, access policies, and operational preferences."
                />
              }
            />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
