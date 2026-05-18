import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-col about">
          <h4>Ve chung toi</h4>
          <p>He thong quan ly bai do xe - quan ly dat cho, thanh toan va kiem soat truy cap de dang.</p>
        </div>

        <div className="footer-col links">
          <h4>Lien ket nhanh</h4>
          <ul>
            <li><Link to="/">Trang chu</Link></li>
            <li><Link to="/auth/login">Dang nhap</Link></li>
            <li><Link to="/auth/register">Dang ky</Link></li>
            <li><Link to="/dashboard">Ho so cua toi</Link></li>
          </ul>
        </div>

        <div className="footer-col contact">
          <h4>Lien he</h4>
          <p>Email: <a href="mailto:support@example.com">support@example.com</a></p>
          <p>Hotline: <a href="tel:+84900000000">0900 000 000</a></p>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="container">
          <small>{`(c) ${new Date().getFullYear()} PBMS. Bao luu moi quyen.`}</small>
        </div>
      </div>
    </footer>
  );
}
