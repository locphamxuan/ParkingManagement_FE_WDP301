import { useMemo, useState } from 'react';
import './AuthPage.css';

const initialForm = {
  fullName: '',
  phone: '',
  email: '',
  password: '',
};

export default function AuthPage({ mode, notice, onModeChange, onBackHome, onSubmit, isLoading }) {
  const [form, setForm] = useState(initialForm);

  const title = useMemo(
    () => (mode === 'login' ? 'Đăng nhập vào PBMS' : 'Tạo tài khoản PBMS'),
    [mode]
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const payload = {
      email: form.email.trim(),
      password: form.password,
      ...(mode === 'register'
        ? {
            fullName: form.fullName.trim(),
            phone: form.phone.trim(),
          }
        : {}),
    };

    try {
      await onSubmit({ mode, payload });
      setForm(initialForm);
    } catch (_error) {
      // Error message is handled by the auth hook and surfaced in the header.
    }
  };

  return (
    <main className="auth-standalone">
      <section className="auth-shell">
        <aside className="auth-promo panel">
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

        <section className="panel auth-panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Tài khoản</p>
              <h2>{title}</h2>
            </div>
            <button className="ghost-button" type="button" onClick={onBackHome}>
              Về trang chủ
            </button>
          </div>

          <div className={`auth-notice ${notice?.type ? `is-${notice.type}` : ''}`}>
            {notice?.message}
          </div>

          <div className="segmented-control" role="tablist" aria-label="Chuyển chế độ xác thực">
            <button
              className={`segmented-item ${mode === 'login' ? 'is-active' : ''}`}
              type="button"
              onClick={() => onModeChange('login')}
            >
              Đăng nhập
            </button>
            <button
              className={`segmented-item ${mode === 'register' ? 'is-active' : ''}`}
              type="button"
              onClick={() => onModeChange('register')}
            >
              Đăng ký
            </button>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {mode === 'register' && (
              <>
                <label className="field">
                  <span>Họ và tên</span>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    placeholder="Nguyễn Văn A"
                    value={form.fullName}
                    onChange={handleChange}
                    required
                  />
                </label>

                <label className="field">
                  <span>Số điện thoại</span>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="0901234567"
                    value={form.phone}
                    onChange={handleChange}
                  />
                </label>
              </>
            )}

            <label className="field">
              <span>Email</span>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="user@pbms.vn"
                value={form.email}
                onChange={handleChange}
                required
              />
            </label>

            <label className="field">
              <span>Mật khẩu</span>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="Ít nhất 6 ký tự"
                value={form.password}
                onChange={handleChange}
                required
              />
            </label>

            <button className="primary-button auth-submit" type="submit" disabled={isLoading}>
              {isLoading ? 'Đang xử lý...' : mode === 'login' ? 'Đăng nhập' : 'Đăng ký'}
            </button>
          </form>
        </section>
      </section>
    </main>
  );
}