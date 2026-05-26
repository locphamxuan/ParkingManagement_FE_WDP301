import { useCallback, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import AuthPage from '@/pages/AuthPage';
import { requestJson } from '@/services/pbmsApi';
import { useAuth } from '@/hooks/useAuth';

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
  if (normalized.includes('password must be at least 6 characters') || normalized.includes('mật khẩu phải có ít nhất 6 ký tự')) {
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
  if (normalized.includes('email không tồn tại')) {
    return 'Email không tồn tại trên hệ thống.';
  }
  if (normalized.includes('mã otp không hợp lệ') || normalized.includes('mã otp không chính xác')) {
    return 'Mã OTP không chính xác hoặc đã hết hạn.';
  }
  if (normalized.includes('mã otp đã hết hạn')) {
    return 'Mã OTP đã hết hạn.';
  }
  if (normalized.includes('người dùng không tồn tại')) {
    return 'Người dùng không tồn tại.';
  }

  return message || 'Không thể xử lý yêu cầu, vui lòng thử lại.';
}

export type AuthMode = 'login' | 'register' | 'forgot_email' | 'forgot_reset';

function usePublicAuthFlow(initialMode: AuthMode) {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [notice, setNotice] = useState<{ message?: string; type?: string }>({});
  const [isLoading, setLoading] = useState(false);

  const onModeChange = useCallback((m: AuthMode) => setMode(m), []);

  const onBackHome = useCallback(
    () => navigate("/", { replace: true }),
    [navigate],
  );

  const { login } = useAuth();

  const onSubmit = useCallback(
    async ({
      mode: m,
      payload,
    }: {
      mode: AuthMode;
      payload: Record<string, string>;
    }) => {
      try {
        setLoading(true);

        if (m === 'login') {
          const session = await login(payload.email, payload.password);

          setNotice({
            message: 'Đăng nhập thành công.',
            type: 'success',
          });

          if (session.role === 'admin') {
            navigate('/admin/dashboard', { replace: true });
          } else if (session.role === 'manager') {
            navigate('/manager/dashboard', { replace: true });
          } else if (session.role === 'staff') {
            navigate('/staff', { replace: true });
          } else {
            navigate('/', { replace: true });
          }
        } else if (m === 'register') {
          const path = '/users/auth/register';
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

          setNotice({
            message: 'Đăng ký thành công.',
            type: 'success',
          });
          navigate('/', { replace: true });
        } else if (m === 'forgot_email') {
          const path = '/users/auth/forgot-password';
          await requestJson({
            path,
            method: 'POST',
            body: { email: payload.email },
          });
        } else if (m === 'forgot_reset') {
          const path = '/users/auth/reset-password';
          await requestJson({
            path,
            method: 'POST',
            body: {
              token: payload.token,
              newPassword: payload.newPassword,
            },
          });
        }
      } catch (error) {
        const message = error instanceof Error ? mapAuthErrorMessage(error.message) : 'Không thể xử lý yêu cầu';
        setNotice({ message, type: 'error' });
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [login, navigate],
  );

  return { mode, notice, onModeChange, onBackHome, onSubmit, isLoading };
}

export function PublicLoginRoute() {
  const { token, user } = useAuth();
  const flow = usePublicAuthFlow('login');

  if (token && user) {
    const redirectPath = user.role === 'admin' ? '/admin/dashboard' : user.role === 'manager' ? '/manager/dashboard' : user.role === 'staff' ? '/staff' : '/';
    return <Navigate to={redirectPath} replace />;
  }

  return <AuthPage {...flow} />;
}

export function PublicRegisterRoute() {
  const flow = usePublicAuthFlow('register');
  return <AuthPage {...flow} />;
}

export function PublicResetPasswordRoute() {
  const flow = usePublicAuthFlow('forgot_reset');
  return <AuthPage {...flow} />;
}

export default PublicLoginRoute;
