import ModuleGrid from '../components/modules/ModuleGrid';
import './HomePage.css';

export default function HomePage({ modules, onOpenAuth, onOpenDashboard, onAction }) {
  const productModules = modules.slice(0, 4);
  const serviceModules = modules.slice(4);

  return (
    <main className="workspace home-view">
      <section className="hero-banner">
        <div className="hero-overlay" />
        <div className="hero-copy">
          <p className="eyebrow">Giải pháp giữ xe thông minh</p>
          <h2>Hệ thống quản lý bãi đỗ xe hiện đại cho tòa nhà, doanh nghiệp và khu dân cư.</h2>
          <p className="hero-text">
            PBMS hỗ trợ quản lý ra vào, kiểm soát phiên gửi xe, theo dõi doanh thu và chăm sóc khách hàng trên một nền tảng duy nhất.
          </p>

          <div className="hero-actions">
            <button className="primary-button" type="button" onClick={() => onOpenAuth('login')}>
              Đăng nhập ngay
            </button>
            <button className="ghost-button hero-ghost" type="button" onClick={() => onOpenAuth('register')}>
              Đăng ký tài khoản
            </button>
            <button className="ghost-button hero-ghost" type="button" onClick={onOpenDashboard}>
              Xem hồ sơ
            </button>
          </div>
        </div>
      </section>

      <section className="landing-section panel module-panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">Sản phẩm chính</p>
            <h2>Nghiệp vụ trọng tâm</h2>
          </div>
        </div>

        <ModuleGrid modules={productModules} onAction={onAction} />
      </section>

      <section className="landing-section panel module-panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">Dịch vụ gia tăng</p>
            <h2>Mở rộng theo nhu cầu</h2>
          </div>
        </div>

        <ModuleGrid modules={serviceModules} onAction={onAction} />
      </section>

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
  );
}