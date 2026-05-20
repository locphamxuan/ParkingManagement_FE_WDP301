import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { api, ApiError, setStoredToken } from '@/services/apiClient';

export type UserRole = 'admin' | 'manager' | 'staff' | 'user';

export interface AuthUser {
  _id: string;
  email: string;
  fullName: string;
  role: UserRole;
  phone?: string;
  avatar?: string | null;
  isActive?: boolean;
  assignedBuildings?: string[];
}

interface LoginResponse {
  data: {
    token: string;
    user: AuthUser;
  };
}

export interface RegisterPayload {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  role?: UserRole;
  buildingName?: string;
  buildingAddress?: string;
}

interface MeResponse {
  data: { user: AuthUser };
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticating: boolean;
  error: string | null;
  login: (email: string, password: string, expectedRole?: UserRole) => Promise<AuthUser>;
  register: (payload: RegisterPayload) => Promise<AuthUser>;
  refresh: () => Promise<AuthUser | null>;
  logout: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticating: false,
      error: null,
      async register(payload) {
        set({ isAuthenticating: true, error: null });
        try {
          const res = await api.post<LoginResponse>('/users/auth/register', payload);
          const { token, user } = res.data;
          setStoredToken(token);
          set({ token, user, isAuthenticating: false });
          return user;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Đăng ký thất bại';
          set({ error: message, isAuthenticating: false });
          throw error;
        }
      },
      async login(email, password, expectedRole) {
        set({ isAuthenticating: true, error: null });
        try {
          const res = await api.post<LoginResponse>('/users/auth/login', { email, password });
          const { token, user } = res.data;
          if (expectedRole && user.role !== expectedRole) {
            throw new ApiError(`Tài khoản này không thuộc vai trò ${expectedRole}.`, 403, null);
          }
          setStoredToken(token);
          set({ token, user, isAuthenticating: false });
          return user;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Đăng nhập thất bại';
          set({ error: message, isAuthenticating: false });
          throw error;
        }
      },
      async refresh() {
        const token = get().token;
        if (!token) return null;
        try {
          const res = await api.get<MeResponse>('/users/auth/me');
          set({ user: res.data.user });
          return res.data.user;
        } catch {
          setStoredToken(null);
          set({ user: null, token: null });
          return null;
        }
      },
      logout() {
        setStoredToken(null);
        set({ user: null, token: null, error: null });
      },
      clearError() {
        set({ error: null });
      },
    }),
    {
      name: 'pbms.auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ token: state.token, user: state.user }),
      onRehydrateStorage: () => (state) => {
        if (state?.token) setStoredToken(state.token);
      },
    }
  )
);
