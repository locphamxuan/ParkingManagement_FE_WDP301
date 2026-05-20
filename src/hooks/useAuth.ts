import { useAuthStore, type UserRole } from '@/store/authStore';

export function useAuth() {
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const login = useAuthStore((state) => state.login);
  const register = useAuthStore((state) => state.register);
  const logout = useAuthStore((state) => state.logout);
  const refresh = useAuthStore((state) => state.refresh);
  const clearError = useAuthStore((state) => state.clearError);
  const isAuthenticating = useAuthStore((state) => state.isAuthenticating);
  const error = useAuthStore((state) => state.error);

  const isAuthenticated = Boolean(token && user);
  const hasRole = (role: UserRole) => isAuthenticated && user?.role === role;

  return {
    user,
    token,
    login,
    register,
    logout,
    refresh,
    clearError,
    isAuthenticating,
    error,
    isAuthenticated,
    isAdmin: hasRole('admin'),
    isManager: hasRole('manager'),
  };
}
