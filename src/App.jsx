import { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate, useLocation, useMatch, useNavigate } from 'react-router-dom';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import HomePage from './pages/HomePage';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import { mainFlowModules } from './data/mainFlow';
import useAuthSession from './hooks/useAuthSession';

export default function App() {
  const [notice, setNotice] = useState({
    message: 'Chọn một chức năng để bắt đầu.',
    type: 'info',
  });

  const navigate = useNavigate();
  const location = useLocation();
  const authRouteMatch = useMatch('/auth/:mode');

  const pushNotice = useCallback((message, type = 'info') => {
    setNotice({ message, type });
  }, []);

  const auth = useAuthSession({ onMessage: pushNotice });

  const isAuthenticated = Boolean(auth.session?.token);
  const isAuthRoute = Boolean(authRouteMatch);
  const authMode = authRouteMatch?.params?.mode === 'register' ? 'register' : 'login';

  const currentView = useMemo(() => {
    if (isAuthRoute) return 'auth';
    if (location.pathname === '/dashboard') return 'dashboard';
    return 'home';
  }, [isAuthRoute, location.pathname]);

  useEffect(() => {
    if (!isAuthRoute && location.pathname === '/dashboard' && !isAuthenticated) {
      navigate('/', { replace: true });
      pushNotice('Bạn cần đăng nhập trước để vào bảng điều khiển.', 'error');
      return;
    }

    if (isAuthRoute && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, isAuthRoute, location.pathname, navigate, pushNotice]);

  const navigateToHome = useCallback(() => {
    navigate('/');
    pushNotice('Đang ở trang chủ.');
  }, [navigate, pushNotice]);

  const openAuth = useCallback((mode = 'login') => {
    navigate(`/auth/${mode}`);
    pushNotice(mode === 'login' ? 'Mở form đăng nhập.' : 'Mở form đăng ký.');
  }, [navigate, pushNotice]);

  const openDashboard = useCallback(() => {
    if (!isAuthenticated) {
      pushNotice('Bạn cần đăng nhập trước.', 'error');
      openAuth('login');
      return;
    }

    navigate('/dashboard');
  }, [isAuthenticated, navigate, openAuth, pushNotice]);

  const handleGlobalAction = useCallback(
    (module) => {
      if (module.id === 'auth') {
        openAuth('login');
        return;
      }

      if (module.id === 'profile') {
        openDashboard();
        return;
      }

      pushNotice(`Chức năng ${module.title} đang được hoàn thiện.`, 'error');
    },
    [openAuth, openDashboard, pushNotice]
  );

  const handleLogout = useCallback(() => {
    auth.logout();
    navigate('/');
    pushNotice('Đã đăng xuất khỏi hệ thống.', 'success');
  }, [auth, navigate, pushNotice]);

  const handleAuthSubmit = useCallback(
    async ({ mode, payload }) => {
      const session =
        mode === 'login'
          ? await auth.login(payload)
          : await auth.register(payload);

      navigate('/dashboard');
      return session;
    },
    [auth, navigate]
  );

  const headerActions = useMemo(
    () => {
      const actions = [{ key: 'home', label: 'Trang chủ', onClick: navigateToHome }];

      if (isAuthenticated) {
        actions.push({ key: 'logout', label: 'Đăng xuất', onClick: handleLogout });
        return actions;
      }

      actions.push(
        { key: 'login', label: 'Đăng nhập', onClick: () => openAuth('login') },
        { key: 'register', label: 'Đăng ký', onClick: () => openAuth('register') }
      );

      return actions;
    },
    [handleLogout, isAuthenticated, navigateToHome, openAuth]
  );

  if (isAuthRoute) {
    return (
      <AuthPage
        mode={authMode}
        notice={notice}
        onModeChange={openAuth}
        onBackHome={navigateToHome}
        onSubmit={handleAuthSubmit}
        isLoading={auth.isLoading}
      />
    );
  }

  return (
    <div className="app-shell">
      <Header
        currentView={currentView}
        session={auth.session}
        notice={notice}
        modules={mainFlowModules}
        actions={headerActions}
        onModuleAction={handleGlobalAction}
      />

      {currentView === 'home' && (
        <HomePage
          modules={mainFlowModules}
          onOpenAuth={openAuth}
          onOpenDashboard={openDashboard}
          onAction={handleGlobalAction}
        />
      )}

      {currentView === 'dashboard' && (
        <DashboardPage
          user={auth.session?.user}
          onLogout={handleLogout}
          onRefresh={auth.refreshProfile}
          modules={mainFlowModules}
          onAction={handleGlobalAction}
        />
      )}

      {!['/', '/dashboard'].includes(location.pathname) && <Navigate to="/" replace />}

      <Footer />
    </div>
  );
}