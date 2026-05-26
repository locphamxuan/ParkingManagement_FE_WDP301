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
    return 'Invalid email or password.';
  }
  if (normalized.includes('account is deactivated')) {
    return 'Account is deactivated. Please contact the administrator.';
  }
  if (normalized.includes('email already registered')) {
    return 'Email already registered.';
  }
  if (normalized.includes('password must be at least 6 characters') || normalized.includes('mật khẩu phải có ít nhất 6 ký tự')) {
    return 'Password must be at least 6 characters long.';
  }
  if (normalized.includes('valid email is required')) {
    return 'Invalid email address.';
  }
  if (normalized.includes('full name is required')) {
    return 'Full name is required.';
  }
  if (normalized.includes('invalid phone number')) {
    return 'Invalid phone number.';
  }
  if (normalized.includes('email không tồn tại') || normalized.includes('email does not exist')) {
    return 'Email address does not exist on our system.';
  }
  if (normalized.includes('mã otp không hợp lệ') || normalized.includes('mã otp không chính xác') || normalized.includes('invalid otp')) {
    return 'Invalid or expired OTP code.';
  }
  if (normalized.includes('mã otp đã hết hạn') || normalized.includes('otp has expired')) {
    return 'OTP code has expired.';
  }
  if (normalized.includes('người dùng không tồn tại') || normalized.includes('user does not exist')) {
    return 'User does not exist.';
  }

  return message || 'Unable to process request, please try again.';
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
            message: 'Logged in successfully.',
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
            throw new Error('Invalid authentication response from server.');
          }

          setNotice({
            message: 'Registered successfully.',
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
        const message = error instanceof Error ? mapAuthErrorMessage(error.message) : 'Unable to process request';
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
