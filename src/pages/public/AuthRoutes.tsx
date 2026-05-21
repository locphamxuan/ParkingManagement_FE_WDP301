import { useCallback, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import AuthPage from '@/pages/AuthPage';
import { requestJson } from '@/services/pbmsApi';
import { loadSession, saveSession } from '@/services/storage';

interface AuthApiResponse {
  success: boolean;
  message?: string;
  data?: {
    token?: string;
    user?: Record<string, unknown>;
  };
}

function mapAuthErrorMessage(message: string): string {
  const normalized = message.trim().toLowerCase();

  if (normalized.includes('invalid email or password')) {
    return 'Email hoặc mật khẩu không đúng.';
  }
  if (normalized.includes('account is deactivated')) {
    return 'Tài khoản đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên.';
  }
  if (normalized.includes('email already registered')) {
    return 'Email đã được đăng ký.';
  }
  if (normalized.includes('password must be at least 6 characters')) {
    return 'Mật khẩu phải có ít nhất 6 ký tự.';
  }
  if (normalized.includes('valid email is required')) {
    return 'Email không hợp lệ.';
  }
  if (normalized.includes('full name is required')) {
    return 'Vui lòng nhập họ và tên.';
  }
  if (normalized.includes('invalid phone number')) {
    return 'Số điện thoại không hợp lệ.';
  }

  return message || 'Không thể xử lý yêu cầu, vui lòng thử lại.';
}

function usePublicAuthFlow(initialMode: 'login' | 'register') {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [notice, setNotice] = useState<{ message?: string; type?: string }>({});
  const [isLoading, setLoading] = useState(false);

  const onModeChange = useCallback((m: 'login' | 'register') => setMode(m), []);

  const onBackHome = useCallback(
    () => navigate("/", { replace: true }),
    [navigate],
  );

  const onSubmit = useCallback(
    async ({
      mode: m,
      payload,
    }: {
      mode: 'login' | 'register';
      payload: Record<string, string>;
    }) => {
      try {
        setLoading(true);
        const path = m === 'login' ? '/users/auth/login' : '/users/auth/register';
        const response = await requestJson<AuthApiResponse>({
          path,
          method: 'POST',
          body: payload,
        });

        const token = response?.data?.token;
        const user = response?.data?.user;

        if (!token || !user) {
          throw new Error('Phản hồi xác thực không hợp lệ từ máy chủ.');
        }

        saveSession({ token, user });

        setNotice({
          message: m === 'login' ? 'Đăng nhập thành công.' : 'Đăng ký thành công.',
          type: 'success',
        });
        navigate('/', { replace: true });
      } catch (error) {
        const message = error instanceof Error ? mapAuthErrorMessage(error.message) : 'Không thể xử lý yêu cầu';
        setNotice({ message, type: 'error' });
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [navigate],
  );

  return { mode, notice, onModeChange, onBackHome, onSubmit, isLoading };
}

export function PublicLoginRoute() {
  const session = loadSession();
  if (session.token) {
    return <Navigate to="/" replace />;
  }
  const flow = usePublicAuthFlow('login');
  return <AuthPage {...flow} />;
}

export function PublicRegisterRoute() {
  const flow = usePublicAuthFlow('register');
  return <AuthPage {...flow} />;
}

export default PublicLoginRoute;
