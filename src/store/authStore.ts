import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { loginWithBackend, type AuthSession } from '@/services/authService';
import { saveSession, clearSession, loadSession } from '@/services/storage';
import { AUTH_STORAGE_KEY } from '@/utils/constants';

interface AuthState {
  session: AuthSession | null;
  isAuthenticating: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<AuthSession>;
  logout: () => void;
  updateProfile: (profile: { fullName: string; phone: string; licensePlates: Array<{ plateNumber: string; vehicleType: 'car' | 'motorcycle' }> }) => void;
}

function mapLegacySession(): AuthSession | null {
  const legacy = loadSession();
  if (!legacy.token || !legacy.user) {
    return null;
  }

  const user = legacy.user as Record<string, unknown>;
  const email = String(user.email ?? '');

  // ĐỒNG BỘ: Kiểm tra ghi đè từ localStorage dùng chung để luôn tải dữ liệu mới nhất
  const locallyUpdated = JSON.parse(localStorage.getItem('pbms.locallyUpdatedUsers') || '{}');
  // Case-insensitive lookup
  const matchingKey = Object.keys(locallyUpdated).find(
    (key) => key.trim().toLowerCase() === email.trim().toLowerCase()
  );
  const localData = matchingKey ? locallyUpdated[matchingKey] : null;

  const finalName = localData?.fullName || String(user.fullName ?? user.displayName ?? '');
  const finalPhone = localData?.phone || String(user.phone ?? '');
  const rawPlates = localData?.licensePlates
    || (Array.isArray(user.licensePlates) ? user.licensePlates : []);

  return {
    token: legacy.token,
    userId: String(user._id ?? user.id ?? ''),
    role: (user.role as AuthSession['role']) ?? 'user',
    email,
    displayName: finalName,
    assignedBuildingIds: Array.isArray(user.assignedBuildings)
      ? user.assignedBuildings.map((item) => String(typeof item === 'string' ? item : (item as { _id?: string })._id ?? '')).filter(Boolean)
      : [],
    phone: finalPhone,
    licensePlates: (rawPlates as unknown[])
      .map((item) => {
        if (!item) return null;
        if (typeof item === 'string') {
          const plate = item.toUpperCase().trim();
          return plate ? { plateNumber: plate, vehicleType: 'car' as const } : null;
        }
        if (typeof item === 'object') {
          const p = item as Record<string, unknown>;
          const plate = String(p.plateNumber ?? '').toUpperCase().trim();
          return plate
            ? {
                plateNumber: plate,
                vehicleType: p.vehicleType === 'motorcycle' ? ('motorcycle' as const) : ('car' as const),
              }
            : null;
        }
        return null;
      })
      .filter((p): p is { plateNumber: string; vehicleType: 'car' | 'motorcycle' } => Boolean(p && p.plateNumber)),
  };
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      session: mapLegacySession(),
      isAuthenticating: false,
      error: null,
      async login(email, password) {
        set({ isAuthenticating: true, error: null });
        try {
          let session = await loginWithBackend({ email, password });

          // Đồng bộ: Merge thông tin đã lưu cục bộ vào session mới đăng nhập
          const locallyUpdated = JSON.parse(localStorage.getItem('pbms.locallyUpdatedUsers') || '{}');
          const matchingKey = Object.keys(locallyUpdated).find(
            (key) => key.trim().toLowerCase() === email.trim().toLowerCase()
          );
          const localData = matchingKey ? locallyUpdated[matchingKey] : null;

          if (localData) {
            // Merge local profile data on top of fresh backend session
            const localPlates: Array<{ plateNumber: string; vehicleType: 'car' | 'motorcycle' }> =
              (localData.licensePlates || []).map((p: any) => ({
                plateNumber: String(p?.plateNumber || p || '').toUpperCase().trim(),
                vehicleType: p?.vehicleType === 'motorcycle' ? ('motorcycle' as const) : ('car' as const),
              })).filter((p: any) => p.plateNumber);

            // Merge uniquely: prefer local type info, include backend plates too
            const mergedPlates = [...localPlates];
            (session.licensePlates || []).forEach((p) => {
              if (!mergedPlates.some((lp) => lp.plateNumber === p.plateNumber.toUpperCase())) {
                mergedPlates.push(p);
              }
            });

            session = {
              ...session,
              displayName: localData.fullName || session.displayName,
              phone: localData.phone || session.phone,
              licensePlates: mergedPlates,
            };
          }

          set({ session, isAuthenticating: false, error: null });
          saveSession({
            token: session.token,
            user: {
              _id: session.userId,
              email: session.email,
              fullName: session.displayName,
              role: session.role,
              assignedBuildings: session.assignedBuildingIds,
              phone: session.phone,
              licensePlates: session.licensePlates,
            },
          });
          return session;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Login failed';
          set({ error: message, isAuthenticating: false });
          throw error;
        }
      },
      logout() {
        clearSession();
        set({ session: null, error: null });
      },
      updateProfile(profile) {
        set((state) => {
          if (!state.session) return {};
          const updatedSession: AuthSession = {
            ...state.session,
            displayName: profile.fullName,
            phone: profile.phone,
            licensePlates: profile.licensePlates,
          };
          saveSession({
            token: updatedSession.token,
            user: {
              _id: updatedSession.userId,
              email: updatedSession.email,
              fullName: updatedSession.displayName,
              role: updatedSession.role,
              assignedBuildings: updatedSession.assignedBuildingIds,
              phone: updatedSession.phone,
              licensePlates: updatedSession.licensePlates,
            },
          });

          // Save profile details to simulated global user registry
          const locallyUpdated = JSON.parse(localStorage.getItem('pbms.locallyUpdatedUsers') || '{}');
          const data = {
            fullName: profile.fullName,
            phone: profile.phone,
            licensePlates: profile.licensePlates,
          };
          locallyUpdated[updatedSession.email] = data;
          locallyUpdated[updatedSession.email.trim().toLowerCase()] = data;
          localStorage.setItem('pbms.locallyUpdatedUsers', JSON.stringify(locallyUpdated));

          return { session: updatedSession };
        });
      },
    }),
    {
      name: AUTH_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ session: state.session }),
    }
  )
);
