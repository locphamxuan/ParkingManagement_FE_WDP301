import { useCallback, useEffect, useState } from 'react';
import { DEFAULT_API_BASE, requestJson } from '../services/pbmsApi';
import {
  clearSession,
  loadApiBase,
  loadSession,
  saveApiBase,
  saveSession,
} from '../services/storage';

export default function useAuthSession({ onMessage } = {}) {
  const [apiBase, setApiBaseState] = useState(() => loadApiBase(DEFAULT_API_BASE));
  const [session, setSession] = useState(() => loadSession());
  const [isLoading, setIsLoading] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  const pushMessage = useCallback(
    (message, type = 'info') => {
      onMessage?.(message, type);
    },
    [onMessage]
  );

  const persistSession = useCallback((nextSession) => {
    setSession(nextSession);
    saveSession(nextSession);
  }, []);

  const updateApiBase = useCallback(
    (nextApiBase) => {
      setApiBaseState(nextApiBase);
      saveApiBase(nextApiBase);
      pushMessage('Đã lưu địa chỉ kết nối.', 'success');
    },
    [pushMessage]
  );

  const refreshProfile = useCallback(async () => {
    if (!session.token) {
      pushMessage('Bạn cần đăng nhập trước.', 'error');
      return null;
    }

    try {
      setIsLoading(true);
      const response = await requestJson({
        apiBase,
        path: '/users/auth/me',
        token: session.token,
      });
      const user = response?.data?.user;

      if (!user) {
        throw new Error('Không đọc được thông tin người dùng');
      }

      const nextSession = { token: session.token, user };
      persistSession(nextSession);
      pushMessage('Đã làm mới hồ sơ cá nhân.', 'success');
      return nextSession;
    } catch (error) {
      clearSession();
      persistSession({ token: '', user: null });
      pushMessage(`Phiên không hợp lệ: ${error.message}`, 'error');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [apiBase, persistSession, pushMessage, session.token]);

  const login = useCallback(
    async (payload) => {
      try {
        setIsLoading(true);
        const response = await requestJson({
          apiBase,
          path: '/users/auth/login',
          method: 'POST',
          body: payload,
        });
        const nextSession = response?.data;

        if (!nextSession?.token || !nextSession?.user) {
          throw new Error('Phản hồi đăng nhập không hợp lệ');
        }

        persistSession(nextSession);
        pushMessage('Đăng nhập thành công.', 'success');
        return nextSession;
      } catch (error) {
        pushMessage(error.message, 'error');
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [apiBase, persistSession, pushMessage]
  );

  const register = useCallback(
    async (payload) => {
      try {
        setIsLoading(true);
        const response = await requestJson({
          apiBase,
          path: '/users/auth/register',
          method: 'POST',
          body: payload,
        });
        const nextSession = response?.data;

        if (!nextSession?.token || !nextSession?.user) {
          throw new Error('Phản hồi đăng ký không hợp lệ');
        }

        persistSession(nextSession);
        pushMessage('Đăng ký thành công.', 'success');
        return nextSession;
      } catch (error) {
        pushMessage(error.message, 'error');
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [apiBase, persistSession, pushMessage]
  );

  const logout = useCallback(() => {
    clearSession();
    persistSession({ token: '', user: null });
    pushMessage('Đã đăng xuất khỏi hệ thống.', 'success');
  }, [persistSession, pushMessage]);

  useEffect(() => {
    const hasToken = Boolean(session.token);

    if (!hasToken) {
      setIsBootstrapping(false);
      return;
    }

    refreshProfile().finally(() => setIsBootstrapping(false));
  }, []);

  return {
    apiBase,
    isBootstrapping,
    isLoading,
    session,
    login,
    logout,
    register,
    refreshProfile,
    updateApiBase,
  };
}