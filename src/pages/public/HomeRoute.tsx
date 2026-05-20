import { useCallback, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import '@/styles/landing.css';

// ---- Data ----

const mainFlowModules = [
  { id: 'auth', title: 'Đăng nhập / Đăng ký', description: 'Vào hệ thống bằng tài khoản cá nhân hoặc tạo tài khoản mới.', actionLabel: 'Mở form', available: true },
  { id: 'profile', title: 'Hồ sơ cá nhân', description: 'Xem thông tin tài khoản và trạng thái đăng nhập.', actionLabel: 'Xem ngay', available: true },
  { id: 'wallet', title: 'Ví tiền', description: 'Xem số dư và lịch sử giao dịch trong tương lai.', actionLabel: 'Sắp ra mắt', available: false },
  { id: 'buildings', title: 'Bãi đỗ / Tòa nhà', description: 'Danh sách bãi đang hoạt động, tầng và chỗ đỗ xe.', actionLabel: 'Sắp ra mắt', available: false },
  { id: 'reservations', title: 'Đặt chỗ trước', description: 'Đặt trước chỗ đỗ theo nhu cầu của khách hàng.', actionLabel: 'Sắp ra mắt', available: false },
  { id: 'sessions', title: 'Phiên gửi xe', description: 'Theo dõi xe vào, xe ra và lịch sử gửi xe.', actionLabel: 'Sắp ra mắt', available: false },
  { id: 'payments', title: 'Thanh toán', description: 'Thanh toán phí gửi xe và các gói dịch vụ.', actionLabel: 'Sắp ra mắt', available: false },
  { id: 'notifications', title: 'Thông báo', description: 'Nhận thông báo và nhắc việc từ hệ thống.', actionLabel: 'Sắp ra mắt', available: false },
];

const productModules = mainFlowModules.slice(0, 4);
const serviceModules = mainFlowModules.slice(4);

type NoticeType = 'info' | 'success' | 'error';
interface Notice { message: string; type: NoticeType }

// ---- Sub-components ----

function BrandMark() {
  return (
    <div className="brand-mark" aria-hidden>
      <span /><span /><span />
    </div>
  );
}

interface HeaderProps {
  notice: Notice;
  userLabel: string;
  currentView: string;
  onHome: () => void;
  onLogin: () => void;
  onRegister: () => void;
  onLogout: () => void;
  onModuleAction: (mod: typeof mainFlowModules[number]) => void;
  isAuthenticated: boolean;
}

function SiteHeader({ notice, userLabel, currentView, onHome, onLogin, onRegister, onLogout, onModuleAction, isAuthenticated }: HeaderProps) {
  const viewLabel =
    currentView === 'auth' ? 'Tài khoản' : 'Trang chủ';

  return (
    <header className="topbar">
      <div className="topbar-main">
        <div className="brand-lockup">
          <BrandMark />
          <div>
            <p className="eyebrow" style={{ color: 'var(--muted)' }}>Parking Building Management System</p>
            <h1>PBMS Control Hub</h1>
          </div>
        </div>

        <div className="topbar-meta">
          <div className="status-chip contact">Hỗ trợ 24/7</div>
          <div className="status-chip soft">{userLabel}</div>
          <div className="status-chip soft">{viewLabel}</div>
        </div>

        <nav className="topbar-actions">
          <button className={`nav-button ${currentView === 'home' ? 'is-active' : ''}`} onClick={onHome} type="button">
            Trang chủ
          </button>
          {isAuthenticated ? (
            <button className="nav-button" onClick={onLogout} type="button">
              Đăng xuất
            </button>
          ) : (
            <>
              <button className={`nav-button ${currentView === 'auth' ? 'is-active' : ''}`} onClick={onLogin} type="button">
                Đăng nhập
              </button>
              <button className="nav-button" onClick={onRegister} type="button">
                Đăng ký
              </button>
            </>
          )}
        </nav>
      </div>

      <div className="topbar-workflows">
        <div className="workflow-label">Nghiệp vụ chính</div>
        <nav className="workflow-nav">
          {mainFlowModules.map((mod) => (
            <button
              key={mod.id}
              className={`workflow-chip ${mod.available ? '' : 'muted'}`}
              type="button"
              onClick={() => onModuleAction(mod)}
            >
              {mod.title}
            </button>
          ))}
        </nav>
      </div>

      <div className={`topbar-notice ${notice.type !== 'info' ? `is-${notice.type}` : ''}`}>
        {notice.message}
      </div>
    </header>
  );
}

interface ModuleGridProps {
  modules: typeof mainFlowModules;
  onAction: (mod: typeof mainFlowModules[number]) => void;
}

function ModuleGrid({ modules, onAction }: ModuleGridProps) {
  return (
    <div className="module-grid">
      {modules.map((mod) => (
        <article className={`module-card ${mod.available ? 'available' : 'locked'}`} key={mod.id}>
          <div className="module-card-head">
            <div>
              <p className="module-kicker">{mod.available ? 'Sẵn sàng' : 'Sắp ra mắt'}</p>
              <h3>{mod.title}</h3>
            </div>
            <span className="module-badge">{mod.available ? 'Mở ngay' : 'Chờ thêm'}</span>
          </div>
          <p>{mod.description}</p>
          <button className="module-button" type="button" onClick={() => onAction(mod)}>
            {mod.actionLabel}
          </button>
        </article>
      ))}
    </div>
  );
}

function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-container footer-grid">
        <div className="footer-col">
          <h4>Về chúng tôi</h4>
          <p>Hệ thống quản lý bãi đỗ xe — quản lý đặt chỗ, thanh toán và kiểm soát truy cập một cách dễ dàng.</p>
        </div>
        <div className="footer-col">
          <h4>Liên kết nhanh</h4>
          <ul>
            <li><Link to="/">Trang chủ</Link></li>
            <li><Link to="/auth/login">Đăng nhập</Link></li>
            <li><Link to="/auth/register">Đăng ký</Link></li>
          </ul>
        </div>
        <div className="footer-col">
          <h4>Liên hệ</h4>
          <p>Email: <a href="mailto:support@pbms.vn">support@pbms.vn</a></p>
          <p>Hotline: <a href="tel:+84900000000">0900 000 000</a></p>
        </div>
      </div>
      <div className="footer-bottom">
        <div className="footer-container">
          <small>© {new Date().getFullYear()} PBMS. Bảo lưu mọi quyền.</small>
        </div>
      </div>
    </footer>
  );
}

// ---- Main component ----

const roleHome: Record<string, string> = {
  admin: '/admin/dashboard',
  manager: '/manager',
  staff: '/staff',
};

export function HomeRoute() {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();

  if (isAuthenticated && user && roleHome[user.role]) {
    return <Navigate to={roleHome[user.role]} replace />;
  }

  const [notice, setNotice] = useState<Notice>({
    message: 'Chọn một chức năng để bắt đầu.',
    type: 'info',
  });

  const push = useCallback((message: string, type: NoticeType = 'info') => {
    setNotice({ message, type });
  }, []);

  const userLabel = useMemo(() => {
    if (!isAuthenticated || !user) return 'Chưa đăng nhập';
    return `Xin chào, ${user.fullName || user.email}`;
  }, [isAuthenticated, user]);

  const goHome = useCallback(() => {
    navigate('/');
    push('Đang ở trang chủ.');
  }, [navigate, push]);

  const goLogin = useCallback(() => {
    navigate('/auth/login');
    push('Mở form đăng nhập.');
  }, [navigate, push]);

  const goRegister = useCallback(() => {
    navigate('/auth/register');
    push('Mở form đăng ký.');
  }, [navigate, push]);

  const doLogout = useCallback(() => {
    logout();
    navigate('/');
    push('Đã đăng xuất khỏi hệ thống.', 'success');
  }, [logout, navigate, push]);

  const handleModuleAction = useCallback(
    (mod: typeof mainFlowModules[number]) => {
      if (mod.id === 'auth') { goLogin(); return; }
      if (mod.id === 'profile') {
        if (!isAuthenticated) {
          push('Bạn cần đăng nhập trước.', 'error');
          goLogin();
        } else {
          navigate('/dashboard');
        }
        return;
      }
      push(`Chức năng ${mod.title} đang được hoàn thiện.`, 'error');
    },
    [isAuthenticated, goLogin, navigate, push]
  );

  return (
    <div>
      <div className="app-shell">
        <SiteHeader
          notice={notice}
          userLabel={userLabel}
          currentView="home"
          onHome={goHome}
          onLogin={goLogin}
          onRegister={goRegister}
          onLogout={doLogout}
          onModuleAction={handleModuleAction}
          isAuthenticated={isAuthenticated}
        />

        <main className="workspace home-view">
          {/* Hero */}
          <section className="hero-banner">
            <div className="hero-overlay" />
            <div className="hero-copy">
              <p className="eyebrow">Giải pháp giữ xe thông minh</p>
              <h2>Hệ thống quản lý bãi đỗ xe hiện đại cho tòa nhà, doanh nghiệp và khu dân cư.</h2>
              <p className="hero-text">
                PBMS hỗ trợ quản lý ra vào, kiểm soát phiên gửi xe, theo dõi doanh thu và chăm sóc khách hàng trên một nền tảng duy nhất.
              </p>
              <div className="hero-actions">
                <button className="primary-button" type="button" onClick={goLogin}>
                  Đăng nhập ngay
                </button>
                <button className="ghost-button hero-ghost" type="button" onClick={goRegister}>
                  Đăng ký tài khoản
                </button>
              </div>
            </div>
          </section>

          {/* Product modules */}
          <section className="landing-section panel module-panel">
            <div className="section-head">
              <div>
                <p className="eyebrow">Sản phẩm chính</p>
                <h2>Nghiệp vụ trọng tâm</h2>
              </div>
            </div>
            <ModuleGrid modules={productModules} onAction={handleModuleAction} />
          </section>

          {/* Service modules */}
          <section className="landing-section panel module-panel">
            <div className="section-head">
              <div>
                <p className="eyebrow">Dịch vụ gia tăng</p>
                <h2>Mở rộng theo nhu cầu</h2>
              </div>
            </div>
            <ModuleGrid modules={serviceModules} onAction={handleModuleAction} />
          </section>

          {/* Why */}
          <section className="why-section panel">
            <h2>Vì sao chọn PBMS</h2>
            <div className="why-grid">
              <article>
                <h3>Dễ triển khai</h3>
                <p>Thiết kế giao diện rõ ràng, thao tác nhanh cho cả quản lý và nhân viên vận hành.</p>
              </article>
              <article>
                <h3>Bảo mật và ổn định</h3>
                <p>Cơ chế xác thực người dùng giúp kiểm soát truy cập và theo dõi thông tin tài khoản an toàn.</p>
              </article>
              <article>
                <h3>Sẵn sàng mở rộng</h3>
                <p>Các khối nghiệp vụ được tách riêng để nâng cấp dần theo roadmap của hệ thống.</p>
              </article>
            </div>
          </section>
        </main>
      </div>

      <SiteFooter />
    </div>
  );
}
