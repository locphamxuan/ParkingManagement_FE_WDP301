import { useEffect, useRef, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowRight,
  BarChart3,
  BellRing,
  Building2,
  CalendarClock,
  CarFront,
  CheckCircle2,
  Clock3,
  CreditCard,
  Mail,
  MapPinned,
  PhoneCall,
  ScanLine,
  ShieldCheck,
  Ticket,
  Wallet,
  User,
  ChevronDown,
  LogOut,
} from 'lucide-react';
import parkingHero from '@/assets/parking-hero.svg';
import type { LegacyModule } from '../data/mainFlow';

interface HomePageProps {
  modules: LegacyModule[];
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onViewProfile: () => void;
  onAction: (module: LegacyModule) => void;
  user?: { fullName?: string; email?: string; phone?: string; role?: string } | null;
  onLogout?: () => void;
}

const navigationLinks = [
  { label: 'Trang chủ', href: '#top' },
  { label: 'Giới thiệu', href: '#gioi-thieu' },
  { label: 'Giải pháp', href: '#giai-phap' },
  { label: 'Dịch vụ', href: '#dich-vu' },
  { label: 'Liên hệ', href: '#lien-he' },
];

const moduleIcons: Record<string, LucideIcon> = {
  auth: ShieldCheck,
  profile: CheckCircle2,
  wallet: Wallet,
  buildings: Building2,
  reservations: CalendarClock,
  sessions: ScanLine,
  payments: CreditCard,
  notifications: BellRing,
};

const heroHighlights = [
  { value: '24/7', label: 'Giám sát và hỗ trợ vận hành liên tục' },
  { value: '01', label: 'Nền tảng thống nhất cho cư dân và ban quản lý' },
  { value: '99.9%', label: 'Quy trình check-in, check-out rõ ràng' },
];

const benefits = [
  {
    icon: Clock3,
    title: 'Kiểm soát ra vào theo thời gian thực',
    description: 'Theo dõi lượt xe, trạng thái bãi và phiên gửi ngay trên một màn hình vận hành trực quan.',
  },
  {
    icon: BarChart3,
    title: 'Báo cáo doanh thu rõ ràng',
    description: 'Tập trung số liệu giao dịch, doanh thu và hiệu suất khai thác để quản lý dễ ra quyết định hơn.',
  },
  {
    icon: CarFront,
    title: 'Trải nghiệm thân thiện cho người dùng',
    description: 'Đăng nhập, theo dõi thông tin và mở rộng tính năng đặt chỗ, thanh toán, thông báo theo lộ trình.',
  },
];

export default function HomePage({ modules, onOpenAuth, onViewProfile, onAction, user, onLogout }: HomePageProps) {
  const productModules = modules.slice(0, 4);
  const serviceModules = modules.slice(4);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  return (
    <main id="top" className="min-h-screen bg-white">
      <header className="border-b bg-white sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <a href="#top" aria-label="PBMS Trang chủ" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-b from-orange-100 to-orange-50 grid place-items-center">
              <span className="w-2 h-2 bg-orange-400 rounded-full" />
            </div>
            <div>
              <strong className="block text-lg">PBMS Parking</strong>
              <span className="text-sm text-gray-500">Cloud Parking Platform</span>
            </div>
          </a>

          <nav className="hidden md:flex gap-4">
            {navigationLinks.map((link) => (
              <a key={link.href} href={link.href} className="text-sm text-gray-600">{link.label}</a>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-500">
              <div>Hỗ trợ 24/7</div>
              <strong className="block">1900 636 447</strong>
            </div>
            {user ? (
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  aria-expanded={menuOpen}
                  onClick={() => setMenuOpen((v) => !v)}
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border"
                >
                  <User size={16} />
                  <span className="text-sm">{user.fullName ?? user.email}</span>
                  <ChevronDown size={14} />
                </button>

                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-44 bg-white border rounded-lg shadow-lg py-2">
                    <button className="w-full text-left px-3 py-2 text-sm" onClick={() => { setMenuOpen(false); onViewProfile(); }}>Hồ sơ của tôi</button>
                    <button className="w-full text-left px-3 py-2 text-sm" onClick={onLogout}><LogOut size={14} className="inline-block mr-2"/>Đăng xuất</button>
                  </div>
                )}
              </div>
            ) : (
              <button onClick={() => onOpenAuth('login')} className="px-3 py-1 rounded-md bg-white border">Đăng nhập</button>
            )}
          </div>
        </div>
      </header>

      <section className="bg-gradient-to-b from-white to-gray-50 py-12">
        <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-2 gap-8 items-start">
          <div>
            <p className="uppercase text-sm text-orange-500 font-bold">Giải pháp giữ xe thông minh</p>
            <h1 className="text-3xl font-extrabold mt-3">Hệ thống quản lý bãi đỗ xe hiện đại cho tòa nhà.</h1>
            <p className="mt-4 text-gray-600">PBMS hỗ trợ quản lý ra vào, kiểm soát phiên gửi xe, theo dõi doanh thu và chăm sóc khách hàng trên một nền tảng duy nhất.</p>

            <div className="mt-6 flex gap-3">
              <button className="px-4 py-2 bg-orange-600 text-white rounded-md" onClick={() => onOpenAuth('login')}>Đăng nhập ngay</button>
              <button className="px-4 py-2 bg-white border rounded-md" onClick={() => onOpenAuth('register')}>Đăng ký tài khoản</button>
              {user ? <button className="px-4 py-2 bg-white border rounded-md" onClick={onViewProfile}>Xem hồ sơ</button> : null}
            </div>
          </div>

          <aside className="relative overflow-hidden rounded-[2rem] border border-orange-100 bg-white shadow-sm">
            <img src={parkingHero} alt="Parking hero illustration" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/90" />
            <div className="absolute inset-x-6 bottom-6 grid gap-3 md:grid-cols-2">
              {heroHighlights.map((item) => (
                <article key={item.label} className="rounded-3xl border border-white/70 bg-white/85 p-4 backdrop-blur-sm shadow-sm">
                  <strong className="block text-lg text-slate-900">{item.value}</strong>
                  <span className="text-sm text-slate-500">{item.label}</span>
                </article>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <section id="gioi-thieu" className="py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div>
            <p className="text-sm text-orange-500 uppercase">Giới thiệu</p>
            <h2 className="text-2xl font-semibold mt-2">Phong cách landing page doanh nghiệp cho hệ thống giữ xe thông minh.</h2>
            <p className="mt-3 text-gray-600">Giao diện mới tập trung vào cảm giác tin cậy, hiện đại và gần với các website giới thiệu giải pháp giữ xe chuyên nghiệp.</p>
            <div className="mt-6 grid md:grid-cols-3 gap-4">
              {benefits.map((benefit) => {
                const Icon = benefit.icon;
                return (
                  <article key={benefit.title} className="p-4 border rounded-lg">
                    <div className="text-orange-500"><Icon size={22} /></div>
                    <h3 className="mt-2 font-semibold">{benefit.title}</h3>
                    <p className="text-sm text-gray-600">{benefit.description}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section id="giai-phap" className="py-12 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="mb-6">
            <p className="text-sm text-orange-500 uppercase">Sản phẩm chính</p>
            <h2 className="text-2xl font-semibold mt-2">Giải pháp trọng tâm</h2>
            <p className="text-gray-600 mt-2">Các khối nghiệp vụ sẵn sàng hoặc đang mở rộng được trình bày lại theo dạng thẻ dịch vụ.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {productModules.map((module) => {
              const Icon = moduleIcons[module.id] || CarFront;
              return (
                <article key={module.id} className={`p-4 rounded-lg border ${module.available ? 'bg-white' : 'bg-gray-50'}`}>
                  <div className="flex items-center gap-3">
                    <div className="text-orange-500"><Icon size={28} /></div>
                    <div>
                      <h3 className="font-semibold">{module.title}</h3>
                      <p className="text-sm text-gray-500">{module.available ? 'Sẵn sàng triển khai' : 'Đang mở rộng'}</p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-gray-600">{module.description}</p>
                  <div className="mt-4">
                    <button
                      className={`px-3 py-2 rounded-md ${module.available ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-400'}`}
                      onClick={() => { if (module.id === 'profile') return onViewProfile(); onAction(module); }}
                      disabled={!module.available}
                    >
                      {module.available ? module.actionLabel : 'Sắp ra mắt'} <ArrowRight size={16} className="inline-block ml-2" />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="dich-vu" className="py-12 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="mb-6">
            <p className="text-sm text-orange-500 uppercase">Dịch vụ gia tăng</p>
            <h2 className="text-2xl font-semibold mt-2">Mở rộng theo nhu cầu vận hành</h2>
            <p className="text-gray-600 mt-2">Phần nền tối mô phỏng khu đỗ xe giúp trang giống reference hơn.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {serviceModules.map((module) => {
              const Icon = moduleIcons[module.id] || Ticket;
              return (
                <article key={module.id} className="p-4 rounded-lg border bg-white">
                  <div className="flex items-center gap-3">
                    <div className="text-orange-500"><Icon size={28} /></div>
                    <div>
                      <h3 className="font-semibold">{module.title}</h3>
                      <p className="text-sm text-gray-500">Theo roadmap</p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-gray-600">{module.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-12 bg-white">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-orange-500 uppercase">Sẵn sàng bắt đầu</p>
            <h2 className="text-2xl font-semibold mt-1">Triển khai trải nghiệm giữ xe chỉn chu hơn cho trang user.</h2>
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-orange-600 text-white rounded-md" onClick={() => onOpenAuth('register')}>Tạo tài khoản</button>
            <button className="px-4 py-2 bg-white border rounded-md" onClick={() => { if (user) { onViewProfile(); } else { onOpenAuth('login'); } }}>{user ? 'Xem hồ sơ' : 'Đăng nhập'}</button>
          </div>
        </div>
      </section>

      <footer id="lien-he" className="bg-gradient-to-r from-orange-500 to-orange-400 text-white py-10">
        <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm font-bold">PBMS PARKING</p>
            <h3 className="mt-2">Hệ thống quản lý bãi đỗ xe dành cho tòa nhà và doanh nghiệp.</h3>
            <p className="mt-2 text-sm">Giao diện landing page được làm theo hướng website giới thiệu giải pháp giữ xe.</p>
          </div>

          <div>
            <h4 className="font-semibold">Liên kết nhanh</h4>
            <nav className="mt-2 flex flex-col gap-2">
              {navigationLinks.map((link) => (
                <a key={link.href} href={link.href} className="text-sm">{link.label}</a>
              ))}
            </nav>
          </div>

          <div>
            <h4 className="font-semibold">Tài khoản</h4>
            <div className="mt-2 flex flex-col gap-2">
              <button onClick={() => onOpenAuth('login')} className="text-sm">Đăng nhập</button>
              <button onClick={() => onOpenAuth('register')} className="text-sm">Đăng ký</button>
              {user ? <button onClick={onViewProfile} className="text-sm">Xem hồ sơ</button> : null}
            </div>
          </div>
        </div>
        <div className="mt-6 border-t border-white/20 pt-4 text-center">
          <small>© {new Date().getFullYear()} PBMS Parking. Thiết kế lại landing page theo phong cách website giới thiệu.</small>
        </div>
      </footer>
    </main>
  );
}
