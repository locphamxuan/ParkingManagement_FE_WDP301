import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import type { UserRole } from '@/store/authStore';
import '@/styles/landing.css';

type LoginRole = Extract<UserRole, 'user' | 'manager' | 'staff' | 'admin'>;
type RegisterRole = Extract<UserRole, 'manager' | 'staff'>;

const loginRoleOptions: { value: LoginRole; label: string; desc: string }[] = [
  { value: 'user', label: 'Người dùng', desc: 'Đặt chỗ, xem lịch sử gửi xe' },
  { value: 'manager', label: 'Quản lý', desc: 'Vận hành tòa nhà được giao' },
  { value: 'staff', label: 'Nhân viên', desc: 'Thực hiện ca trực, thu phí' },
  { value: 'admin', label: 'Quản trị', desc: 'Toàn quyền hệ thống' },
];

const registerRoleOptions: { value: RegisterRole; label: string; desc: string }[] = [
  { value: 'manager', label: 'Quản lý', desc: 'Quản lý vận hành tòa nhà' },
  { value: 'staff', label: 'Nhân viên', desc: 'Nhân viên ca trực, thu phí' },
];

const redirectFor: Record<LoginRole, string> = {
  user: '/',
  manager: '/manager',
  staff: '/staff',
  admin: '/admin/dashboard',
};

const initialForm = {
  fullName: '',
  phone: '',
  email: '',
  password: '',
  buildingName: '',
  buildingAddress: '',
};

interface AuthPageProps {
  mode: 'login' | 'register';
}

function AuthPage({ mode }: AuthPageProps) {
  const navigate = useNavigate();
  const { login, register, isAuthenticating, error, clearError } = useAuth();

  const [form, setForm] = useState(initialForm);
  const [loginRole, setLoginRole] = useState<LoginRole>('user');
  const [registerRole, setRegisterRole] = useState<RegisterRole>('manager');
  const [notice, setNotice] = useState<{ message: string; type: 'info' | 'success' | 'error' }>({
    message: mode === 'login' ? 'Chọn vai trò, sau đó nhập tài khoản được cấp.' : 'Điền thông tin để tạo tài khoản mới.',
    type: 'info',
  });

  useEffect(() => {
    clearError();
  }, [loginRole, registerRole, mode, clearError]);

  useEffect(() => {
    if (error) setNotice({ message: error, type: 'error' });
  }, [error]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (mode === 'login') {
      try {
        const loggedIn = await login(form.email.trim(), form.password, loginRole);
        navigate(redirectFor[loggedIn.role as LoginRole] ?? '/', { replace: true });
      } catch {
        /* handled via hook */
      }
    } else {
      if (registerRole === 'manager' && !form.buildingName.trim()) {
        setNotice({ message: 'Vui lòng nhập tên tòa nhà.', type: 'error' });
        return;
      }
      try {
        const registered = await register({
          fullName: form.fullName.trim(),
          phone: form.phone.trim() || undefined,
          email: form.email.trim(),
          password: form.password,
          role: registerRole,
          buildingName: form.buildingName.trim() || undefined,
          buildingAddress: form.buildingAddress.trim() || undefined,
        });
        navigate(redirectFor[registered.role as LoginRole] ?? '/', { replace: true });
      } catch {
        /* handled via hook */
      }
    }
  };

  const switchMode = (next: 'login' | 'register') => {
    clearError();
    setForm(initialForm);
    setNotice({ message: next === 'login' ? 'Chọn vai trò, sau đó nhập tài khoản.' : 'Điền thông tin để tạo tài khoản mới.', type: 'info' });
    navigate(`/auth/${next}`);
  };

  const title = mode === 'login' ? 'Đăng nhập vào PBMS' : 'Tạo tài khoản PBMS';
  const isManager = mode === 'register' && registerRole === 'manager';

  return (
    <main className="auth-standalone">
      <div className="auth-shell">
        {/* Promo panel */}
        <aside className="auth-promo">
          <p className="eyebrow">PBMS Account</p>
          <h2>Đăng nhập nhanh để bắt đầu sử dụng hệ thống giữ xe.</h2>
          <p className="hero-text">
            Bạn có thể đăng nhập để theo dõi thông tin cá nhân, hoặc tạo tài khoản mới chỉ trong vài bước đơn giản.
          </p>

          <div className="auth-promo-points">
            <article>
              <strong>Dễ sử dụng</strong>
              <span>Giao diện rõ ràng, thao tác nhanh ngay cả khi mới dùng lần đầu.</span>
            </article>
            <article>
              <strong>Tiết kiệm thời gian</strong>
              <span>Đăng nhập một lần để truy cập nhanh các chức năng cần thiết.</span>
            </article>
            <article>
              <strong>An tâm sử dụng</strong>
              <span>Thông tin tài khoản được bảo vệ và kiểm soát chặt chẽ trong hệ thống.</span>
            </article>
          </div>
        </aside>

        {/* Auth panel */}
        <section className="auth-panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Tài khoản</p>
              <h2>{title}</h2>
            </div>
            <button className="ghost-button" type="button" onClick={() => navigate('/')}>
              Về trang chủ
            </button>
          </div>

          <div className={`auth-notice ${notice.type !== 'info' ? `is-${notice.type}` : ''}`}>
            {notice.message}
          </div>

          {/* Login / Register tabs */}
          <div className="segmented-control" role="tablist">
            <button
              className={`segmented-item ${mode === 'login' ? 'is-active' : ''}`}
              type="button"
              onClick={() => switchMode('login')}
            >
              Đăng nhập
            </button>
            <button
              className={`segmented-item ${mode === 'register' ? 'is-active' : ''}`}
              type="button"
              onClick={() => switchMode('register')}
            >
              Đăng ký
            </button>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {/* Role selector */}
            {mode === 'login' && (
              <div>
                <p className="auth-role-label">Chọn vai trò</p>
                <div className="auth-role-tabs">
                  {loginRoleOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      className={`auth-role-tab ${loginRole === opt.value ? 'is-active' : ''}`}
                      onClick={() => setLoginRole(opt.value)}
                      title={opt.desc}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {mode === 'register' && (
              <div>
                <p className="auth-role-label">Vai trò đăng ký</p>
                <div className="auth-role-tabs">
                  {registerRoleOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      className={`auth-role-tab ${registerRole === opt.value ? 'is-active' : ''}`}
                      onClick={() => setRegisterRole(opt.value)}
                      title={opt.desc}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Register common fields */}
            {mode === 'register' && (
              <>
                <label className="auth-field">
                  <span>Họ và tên</span>
                  <input
                    className="auth-input"
                    name="fullName"
                    type="text"
                    placeholder="Nguyễn Văn A"
                    value={form.fullName}
                    onChange={handleChange}
                    required
                  />
                </label>
                <label className="auth-field">
                  <span>Số điện thoại</span>
                  <input
                    className="auth-input"
                    name="phone"
                    type="tel"
                    placeholder="0901234567"
                    value={form.phone}
                    onChange={handleChange}
                  />
                </label>
              </>
            )}

            <label className="auth-field">
              <span>Email</span>
              <input
                className="auth-input"
                name="email"
                type="email"
                placeholder={
                  mode === 'login'
                    ? loginRole === 'admin' ? 'admin@gmail.com'
                      : loginRole === 'staff' ? 'staff@gmail.com'
                      : loginRole === 'manager' ? 'manager@gmail.com'
                      : 'user@gmail.com'
                    : 'user@gmail.com'
                }
                value={form.email}
                onChange={handleChange}
                required
                autoComplete="email"
              />
            </label>

            <label className="auth-field">
              <span>Mật khẩu</span>
              <input
                className="auth-input"
                name="password"
                type="password"
                placeholder="Ít nhất 6 ký tự"
                value={form.password}
                onChange={handleChange}
                required
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
            </label>

            {/* Manager building fields */}
            {isManager && (
              <>
                <label className="auth-field">
                  <span>Tên tòa nhà</span>
                  <input
                    className="auth-input"
                    name="buildingName"
                    type="text"
                    placeholder="VD: Cao Ốc Pearl Plaza"
                    value={form.buildingName}
                    onChange={handleChange}
                    required
                  />
                </label>
                <label className="auth-field">
                  <span>Địa chỉ tòa nhà</span>
                  <input
                    className="auth-input"
                    name="buildingAddress"
                    type="text"
                    placeholder="VD: 561A Điện Biên Phủ, Hải Phòng"
                    value={form.buildingAddress}
                    onChange={handleChange}
                  />
                </label>
              </>
            )}

            <button className="primary-button auth-submit" type="submit" disabled={isAuthenticating}>
              {isAuthenticating
                ? 'Đang xử lý...'
                : mode === 'login'
                  ? `Đăng nhập — ${loginRoleOptions.find((r) => r.value === loginRole)?.label}`
                  : `Đăng ký — ${registerRoleOptions.find((r) => r.value === registerRole)?.label}`}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}

export function PublicLoginRoute() {
  return <AuthPage mode="login" />;
}

export function PublicRegisterRoute() {
  return <AuthPage mode="register" />;
}
