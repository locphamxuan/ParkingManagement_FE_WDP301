import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export function StaffProtectedRoute() {
  const { user } = useAuth();

  if (user?.role !== 'staff') {
    return <Navigate to="/auth/login" replace />;
  }

  return <Outlet />;
}
