import './Header.css';

export default function Header({ currentView, session, notice, actions, modules, onModuleAction }) {
  const activeLabel =
    currentView === 'dashboard' ? 'Bảng điều khiển' : currentView === 'auth' ? 'Tài khoản' : 'Trang chủ';

  return (
    <header className="topbar">
      <div className="topbar-main">
        <div className="brand-lockup">
          <div className="brand-mark" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <div>
            <p className="eyebrow">Parking Building Management System</p>
            <h1>PBMS Control Hub</h1>
          </div>
        </div>

        <div className="topbar-meta">
          <div className="status-chip contact">Hỗ trợ 24/7</div>
          <div className="status-chip soft">
            {session?.token ? `Xin chào, ${session.user?.fullName || session.user?.email || 'người dùng'}` : 'Chưa đăng nhập'}
          </div>
          <div className="status-chip soft">{activeLabel}</div>
        </div>

        <nav className="topbar-actions auth-actions" aria-label="Điều hướng tài khoản">
          {actions.map((action) => (
            <button
              key={action.key}
              className={`nav-button ${currentView === action.key || (currentView === 'auth' && action.key === 'login') ? 'is-active' : ''}`}
              type="button"
              onClick={action.onClick}
            >
              {action.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="topbar-workflows">
        <div className="workflow-label">Nghiệp vụ chính</div>
        <nav className="workflow-nav" aria-label="Chức năng nghiệp vụ">
          {modules.map((module) => (
            <button
              key={module.id}
              className={`workflow-chip ${module.available ? '' : 'muted'}`}
              type="button"
              onClick={() => onModuleAction(module)}
            >
              {module.title}
            </button>
          ))}
        </nav>
      </div>

      <div className={`notice ${notice?.type ? `is-${notice.type}` : ''}`} aria-live="polite">
        {notice?.message}
      </div>
    </header>
  );
}