import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import HomePage from '@/pages/HomePage';
import { mainFlowModules } from '@/data/mainFlow';
import { loadSession, clearSession } from '@/services/storage';

export function HomeRoute() {
  const navigate = useNavigate();
  // read persisted session (if any)
  const session = loadSession();
  const user = session?.user ?? null;

  const onOpenAuth = useCallback((mode: 'login' | 'register' = 'login') => {
    window.location.href = `/auth/${mode}`;
  }, []);

  const onViewProfile = useCallback(() => {
    if (!user) {
      return onOpenAuth('login');
    }

    navigate('/profile', { replace: false });
  }, [navigate, onOpenAuth, user]);

  const onAction = useCallback(
    (module: any) => {
      if (module.id === 'auth') return onOpenAuth('login');
      if (module.id === 'profile') return onViewProfile();
      // fallback: no-op
      return undefined;
    },
    [onOpenAuth, onViewProfile]
  );

  const onLogout = useCallback(() => {
    clearSession();
    // stay on home and ensure header re-renders (navigate to same path)
    navigate('/', { replace: true });
  }, [navigate]);

  return (
    <HomePage
      modules={mainFlowModules}
      onOpenAuth={onOpenAuth}
      onViewProfile={onViewProfile}
      onAction={onAction}
      user={user as { fullName?: string; email?: string; phone?: string; role?: string } | null}
      onLogout={onLogout}
    />
  );
}

export default HomeRoute;
