import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Building2,
  ChevronDown,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  ShieldAlert,
  Ticket,
  User,
  Wallet,
  X,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { UserNotificationBell } from '@/components/layout/UserNotificationBell';
import { Logo } from '@/components/layout/Logo';
import { AppBackdrop } from '@/components/layout/AppBackdrop';

const userNavLinks = [
  { to: '/user-dashboard', label: 'Dashboard', icon: LayoutDashboard, requiresAuth: true },
  { to: '/buildings', label: 'Buildings', icon: Building2, requiresAuth: false },
  { to: '/packages/buy', label: 'Buy Package', icon: Package, requiresAuth: true },
  { to: '/long-term-subscriptions', label: 'My Packages', icon: Ticket, requiresAuth: true },
  { to: '/wallet', label: 'Wallet', icon: Wallet, requiresAuth: true },
  { to: '/parking-history', label: 'History', icon: History, requiresAuth: true },
  { to: '/report-incident', label: 'Report Issue', icon: ShieldAlert, requiresAuth: true },
];

// Layout chung cho toàn bộ trang phía user — navbar + nền thống nhất để các
// trang không phải tự dựng header/back-button riêng lẻ như trước.
export function UserLayout() {
  const navigate = useNavigate();
  const { session, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const visibleLinks = userNavLinks.filter((link) => !link.requiresAuth || Boolean(session));

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const onLogout = () => {
    setMenuOpen(false);
    logout();
    navigate('/', { replace: true });
  };

  return (
    <div className="user-theme relative isolate min-h-screen overflow-x-hidden bg-[#06101f] font-sans text-slate-100 selection:bg-cyan-400 selection:text-slate-950">
      <AppBackdrop variant="midnight" />
      {/* Nền ambient sáng trắng xanh dương thống nhất cho mọi trang user */}
      <div className="pointer-events-none fixed inset-0 -z-10 hidden overflow-hidden" aria-hidden="true">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(37,99,235,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(37,99,235,0.02)_1px,transparent_1px)] bg-[size:44px_44px] opacity-70" />
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle_at_center,rgba(14,165,233,0.06),transparent_55%)] blur-3xl" />
        <div className="absolute bottom-[-20%] right-[-15%] w-[55%] h-[55%] rounded-full bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.05),transparent_55%)] blur-3xl" />
      </div>

      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#06101f]/82 shadow-[0_12px_35px_rgba(0,0,0,0.18)] backdrop-blur-xl">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/70 to-transparent" />
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/" aria-label="PBMS Home" className="shrink-0">
            <Logo size={36} tagline="My Parking Space" />
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {visibleLinks.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[11px] font-bold transition-all duration-200 ${
                      isActive
                        ? 'border border-cyan-400/20 bg-cyan-400/10 text-cyan-200 shadow-sm'
                        : 'border border-transparent text-slate-400 hover:bg-white/[0.06] hover:text-white'
                    }`
                  }
                >
                  <Icon size={13} />
                  {link.label}
                </NavLink>
              );
            })}
          </nav>

          <div className="flex items-center gap-2.5">
            {session ? (
              <>
                <UserNotificationBell />
                <div className="relative" ref={menuRef}>
                  <button
                    type="button"
                    aria-expanded={menuOpen}
                    onClick={() => setMenuOpen((v) => !v)}
                    className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-2.5 text-white transition-all duration-200 hover:border-cyan-400/30 hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                  >
                    <div className="w-5 h-5 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                      <User size={10} className="text-cyan-400" />
                    </div>
                    <span className="hidden md:inline text-xs font-extrabold tracking-tight max-w-[140px] truncate">
                      {session.displayName ?? session.email}
                    </span>
                    <ChevronDown size={12} className="text-slate-400 transition-transform duration-300" style={{ transform: menuOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                  </button>
                  <AnimatePresence>
                    {menuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        className="absolute right-0 mt-2 w-48 bg-slate-950/95 border border-white/10 rounded-2xl shadow-2xl py-2 backdrop-blur-xl z-50 overflow-hidden"
                      >
                        <Link
                          to="/profile"
                          onClick={() => setMenuOpen(false)}
                          className="w-full text-left px-4 py-2 text-xs font-semibold hover:bg-slate-800 text-slate-300 hover:text-white flex items-center"
                        >
                          <User size={12} className="mr-2" /> My Profile
                        </Link>
                        <button
                          className="w-full text-left px-4 py-2 text-xs font-semibold hover:bg-slate-800 text-rose-400 hover:text-rose-300 border-t border-white/5 mt-1 flex items-center"
                          onClick={onLogout}
                        >
                          <LogOut size={12} className="mr-2" /> Logout
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <Link
                to="/auth/login"
                className="inline-flex min-h-10 items-center rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 text-xs font-black uppercase tracking-wider text-white shadow-[0_8px_22px_rgba(6,182,212,0.22)] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
              >
                Login
              </Link>
            )}

            <button
              type="button"
              aria-label="Toggle navigation"
              onClick={() => setMobileNavOpen((v) => !v)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] text-slate-300 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 lg:hidden"
            >
              {mobileNavOpen ? <X size={16} /> : <Menu size={16} />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mobileNavOpen && (
            <motion.nav
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden border-t border-white/10 bg-[#071326]/96 backdrop-blur-xl lg:hidden"
            >
              <div className="max-w-6xl mx-auto px-4 py-3 grid grid-cols-2 gap-1.5">
                {visibleLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      onClick={() => setMobileNavOpen(false)}
                      className={({ isActive }) =>
                        `inline-flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold transition-all ${
                          isActive ? 'bg-cyan-500/10 border border-cyan-500/25 text-cyan-300' : 'border border-transparent text-slate-400 hover:text-white hover:bg-white/5'
                        }`
                      }
                    >
                      <Icon size={14} />
                      {link.label}
                    </NavLink>
                  );
                })}
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </header>

      <main className="relative z-10">
        <Outlet />
      </main>
    </div>
  );
}
