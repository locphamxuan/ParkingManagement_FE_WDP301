import ModuleGrid from '../components/modules/ModuleGrid';
import './DashboardPage.css';

export default function DashboardPage({ user, onLogout, onRefresh, modules, onAction }) {
  const displayName = user?.fullName || user?.email || 'người dùng';

  return (
    <main className="workspace dashboard-view">
      <section className="panel dashboard-hero">
        <div>
          <p className="eyebrow">Phiên làm việc</p>
          <h2>Xin chào, {displayName}!</h2>
          <p className="hero-text">
            Đây là bảng điều khiển của bạn trong PBMS. Tại đây có thể xem hồ sơ cá nhân và đi tới các chức năng chính của hệ thống.
          </p>
        </div>

        <div className="session-actions">
          <button className="ghost-button" type="button" onClick={onRefresh}>
            Làm mới hồ sơ
          </button>
          <button className="primary-button danger" type="button" onClick={onLogout}>
            Đăng xuất
          </button>
        </div>
      </section>

      <section className="dashboard-grid">
        <article className="panel summary-card">
          <div className="card-header">
            <div>
              <p className="eyebrow">Hồ sơ người dùng</p>
              <h3>{displayName}</h3>
            </div>
            <span className="role-badge">{user?.role || 'user'}</span>
          </div>

          <dl className="profile-list">
            <div>
              <dt>Email</dt>
              <dd>{user?.email || '-'}</dd>
            </div>
            <div>
              <dt>Số điện thoại</dt>
              <dd>{user?.phone || '-'}</dd>
            </div>
            <div>
              <dt>Trạng thái</dt>
              <dd>{user?.isActive ? 'Đang hoạt động' : 'Bị khóa'}</dd>
            </div>
            <div>
              <dt>Đăng nhập gần nhất</dt>
              <dd>{formatDate(user?.lastLoginAt)}</dd>
            </div>
          </dl>
        </article>

        <article className="panel roadmap-card">
          <p className="eyebrow">Lộ trình</p>
          <div className="roadmap-list">
            <div>
              <strong>Quản lý bãi</strong>
              <span>Buildings, floors, slots, reservations</span>
            </div>
            <div>
              <strong>Vận hành</strong>
              <span>Check-in, check-out, shift revenues</span>
            </div>
            <div>
              <strong>Tài chính</strong>
              <span>Wallet, payments, subscriptions</span>
            </div>
          </div>
        </article>
      </section>

      <section className="panel module-panel dashboard-module-panel">
        <div className="panel-head">
          <div>
            <p className="eyebrow">Chức năng chính</p>
            <h2>Bảng điều khiển</h2>
          </div>
        </div>

        <ModuleGrid modules={modules} compact onAction={onAction} />
      </section>
    </main>
  );
}

function formatDate(value) {
  if (!value) return '-';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}