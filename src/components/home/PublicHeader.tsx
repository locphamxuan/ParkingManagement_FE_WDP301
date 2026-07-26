import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BellRing, ChevronDown, LogOut, MapPinned, Menu, Ticket, User, Wallet, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { notificationApi } from '@/services/notificationApi';
import { navigationLinks } from './homeNavigation.constants';
import { Logo } from '@/components/layout/Logo';

// Header dùng chung cho mọi trang public (Home/About/Services/Contact) —
// tự lấy session qua useAuth để các trang không phải truyền prop lặp lại.
export function PublicHeader() {
  const navigate = useNavigate();
  const { session, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [unreadNotif, setUnreadNotif] = useState(0);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const isUserRole = session?.role === 'user';
  const hasMissingInfo = Boolean(
    session && isUserRole && (!session.phone || session.phone.trim() === '' || !session.licensePlates || session.licensePlates.length === 0),
  );

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!isUserRole) return;
    notificationApi
      .list()
      .then((res) => {
        const d = (res as { data?: { unread?: number } })?.data;
        setUnreadNotif(d?.unread ?? 0);
      })
      .catch(() => undefined);
  }, [isUserRole]);

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
    <header
      className={`sticky top-0 z-40 border-b transition-all duration-300 ${
        scrolled
          ? 'border-slate-200/80 bg-white/90 py-2.5 shadow-[0_12px_35px_rgba(15,23,42,0.08)] backdrop-blur-xl'
          : 'border-slate-200/60 bg-white/80 py-3.5 backdrop-blur-md'
      }`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/70 to-transparent" />

      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4">
        <Link to="/" aria-label="PBMS Home">
          <Logo size={40} tagline="Cloud Management" />
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary navigation">
          {navigationLinks.map((link) => (
            <NavLink
              key={link.href}
              to={link.href}
              end={link.href === '/'}
              className={({ isActive }) =>
                `group relative inline-flex min-h-10 items-center rounded-xl px-3 text-xs font-bold transition-colors duration-200 ${isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-blue-50 hover:text-blue-700'}`
              }
            >
              {({ isActive }) => (
                <>
                  {link.label}
                  <span
                    className={`absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-blue-600 to-cyan-500 transition-transform duration-300 origin-left ${
                      isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                    }`}
                  />
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-4">
          <div className="text-right hidden sm:block group cursor-pointer">
            <span className="text-[9px] uppercase font-mono tracking-widest text-slate-500 font-black block">Support 24/7</span>
            <strong className="text-xs font-black text-slate-700 group-hover:text-cyan-600 transition-colors duration-300">1900 636 447</strong>
          </div>

          {session ? (
            <div className="relative animate-fadeIn" ref={menuRef}>
              <button
                type="button"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((v) => !v)}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-slate-900/80 backdrop-blur-sm border border-white/5 hover:border-cyan-500/30 text-white transition-all duration-300 shadow-lg hover:shadow-cyan-500/5"
              >
                <div className="w-5 h-5 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                  <User size={10} className="text-cyan-400" />
                </div>
                <span className="text-xs font-extrabold tracking-tight">{session.displayName ?? session.email}</span>
                <ChevronDown size={12} className="text-slate-400 transition-transform duration-300" style={{ transform: menuOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
              </button>

              {unreadNotif > 0 && (
                <span className="absolute -top-1 -left-1 z-30 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[8px] font-black text-white shadow-[0_0_8px_rgba(244,63,94,0.6)]">
                  {unreadNotif > 9 ? '9+' : unreadNotif}
                </span>
              )}

              {hasMissingInfo && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 z-30 pointer-events-none">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-600 text-[8px] font-mono font-black text-white items-center justify-center animate-bounce shadow-[0_0_8px_rgba(225,29,72,0.6)]">
                    1
                  </span>
                </span>
              )}

              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    className="absolute right-0 mt-2 w-52 bg-slate-950/95 border border-white/10 rounded-2xl shadow-2xl py-2 backdrop-blur-xl z-50 overflow-hidden"
                  >
                    <Link
                      to="/profile"
                      className="w-full text-left px-4 py-2 text-xs font-semibold hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-between"
                      onClick={() => setMenuOpen(false)}
                    >
                      <span className="flex items-center"><User size={12} className="inline-block mr-2" /> My Profile</span>
                      {hasMissingInfo && <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-pulse shadow-[0_0_6px_#f43f5e]" />}
                    </Link>
                    <Link
                      to="/notifications"
                      onClick={() => setMenuOpen(false)}
                      className="w-full text-left px-4 py-2 text-xs font-semibold hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-between"
                    >
                      <span className="flex items-center"><BellRing size={12} className="mr-2" /> Notifications</span>
                      {unreadNotif > 0 && (
                        <span className="rounded-full bg-rose-500 px-1.5 text-[9px] font-bold text-white">{unreadNotif > 9 ? '9+' : unreadNotif}</span>
                      )}
                    </Link>
                    <Link
                      to="/wallet"
                      onClick={() => setMenuOpen(false)}
                      className="w-full text-left px-4 py-2 text-xs font-semibold hover:bg-slate-800 text-slate-300 hover:text-white flex items-center"
                    >
                      <Wallet size={12} className="inline-block mr-2" /> E-Wallet
                    </Link>
                    <Link
                      to="/parking-history"
                      className="w-full text-left px-4 py-2 text-xs font-semibold hover:bg-slate-800 text-slate-300 hover:text-white flex items-center"
                      onClick={() => setMenuOpen(false)}
                    >
                      <MapPinned size={12} className="inline-block mr-2" /> Parking History
                    </Link>
                    <Link
                      to="/long-term-subscriptions"
                      className="w-full text-left px-4 py-2 text-xs font-semibold hover:bg-slate-800 text-slate-300 hover:text-white flex items-center"
                      onClick={() => setMenuOpen(false)}
                    >
                      <Ticket size={12} className="inline-block mr-2" /> Subscriptions
                    </Link>
                    <button
                      className="w-full text-left px-4 py-2 text-xs font-semibold hover:bg-slate-800 text-rose-400 hover:text-rose-300 border-t border-white/5 mt-1"
                      onClick={onLogout}
                    >
                      <LogOut size={12} className="inline-block mr-2" /> Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <motion.button
              onClick={() => navigate('/auth/login')}
              whileHover={{ scale: 1.05, boxShadow: '0 0 15px rgba(59,130,246,0.45)' }}
              whileTap={{ scale: 0.95 }}
                className="inline-flex min-h-10 items-center rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 text-xs font-black uppercase tracking-wider text-white shadow-[0_8px_22px_rgba(6,182,212,0.22)] transition-transform duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
              >
                Login
              </motion.button>
            )}

          <button
            type="button"
            aria-label={mobileNavOpen ? 'Close navigation' : 'Open navigation'}
            aria-expanded={mobileNavOpen}
            onClick={() => setMobileNavOpen((value) => !value)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition-colors hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 md:hidden"
          >
            {mobileNavOpen ? <X size={17} /> : <Menu size={17} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileNavOpen ? (
          <motion.nav
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-slate-200 bg-white/96 shadow-xl backdrop-blur-xl md:hidden"
            aria-label="Mobile navigation"
          >
            <div className="mx-auto grid max-w-7xl grid-cols-2 gap-1.5 px-4 py-3">
              {navigationLinks.map((link) => (
                <NavLink
                  key={link.href}
                  to={link.href}
                  end={link.href === '/'}
                  onClick={() => setMobileNavOpen(false)}
                  className={({ isActive }) =>
                    `inline-flex min-h-11 items-center rounded-xl px-3 text-xs font-bold transition-colors ${
                      isActive
                        ? 'border border-blue-200 bg-blue-50 text-blue-700'
                        : 'border border-transparent text-slate-600 hover:bg-blue-50 hover:text-blue-700'
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </div>
          </motion.nav>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
