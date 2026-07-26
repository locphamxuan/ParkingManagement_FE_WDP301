import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BellRing, ChevronDown, LogOut, MapPinned, Menu, Ticket, User, Wallet, X } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { notificationApi } from '@/services/notificationApi';
import { navigationLinks } from './homeNavigation.constants';
import { Logo } from '@/components/layout/Logo';
import { cn } from '@/utils/cn';

// Header dùng chung cho mọi trang public (Home/About/Services/Contact) —
// tự lấy session qua useAuth để các trang không phải truyền prop lặp lại.
export function PublicHeader() {
  const navigate = useNavigate();
  const { session, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [unreadNotif, setUnreadNotif] = useState(0);

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

  const onLogout = () => {
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
            <div className="relative animate-fadeIn">
              <DropdownMenu.Root open={menuOpen} onOpenChange={setMenuOpen}>
                <DropdownMenu.Trigger asChild>
                  <button
                    type="button"
                    className="group inline-flex h-11 max-w-[220px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-800 shadow-sm transition-[border-color,background-color,box-shadow] duration-200 hover:border-blue-300 hover:bg-blue-50/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-cyan-200 bg-cyan-50">
                      <User size={13} className="text-cyan-700" />
                    </span>
                    <span className="min-w-0 flex-1 truncate font-extrabold tracking-tight">
                      {session.displayName ?? session.email}
                    </span>
                    <ChevronDown
                      size={13}
                      className={cn('shrink-0 text-slate-400 transition-transform duration-200', menuOpen && 'rotate-180')}
                    />
                  </button>
                </DropdownMenu.Trigger>

                <DropdownMenu.Portal>
                  <DropdownMenu.Content
                    align="end"
                    sideOffset={8}
                    collisionPadding={12}
                    className="z-50 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 text-slate-900 shadow-[0_20px_48px_rgba(15,23,42,0.16)] outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
                  >
                    <DropdownMenu.Item asChild>
                      <Link
                        to="/profile"
                        className="flex min-h-11 cursor-pointer items-center justify-between rounded-xl px-3.5 text-xs font-bold text-slate-600 outline-none transition-colors duration-150 hover:bg-blue-50 hover:text-blue-700 focus:bg-blue-50 focus:text-blue-700"
                      >
                        <span className="flex items-center gap-3"><User size={15} /> My Profile</span>
                        {hasMissingInfo && <span className="h-2 w-2 rounded-full bg-rose-500 shadow-[0_0_6px_#f43f5e]" />}
                      </Link>
                    </DropdownMenu.Item>
                    <DropdownMenu.Item asChild>
                      <Link
                        to="/notifications"
                        className="flex min-h-11 cursor-pointer items-center justify-between rounded-xl px-3.5 text-xs font-bold text-slate-600 outline-none transition-colors duration-150 hover:bg-blue-50 hover:text-blue-700 focus:bg-blue-50 focus:text-blue-700"
                      >
                        <span className="flex items-center gap-3"><BellRing size={15} /> Notifications</span>
                        {unreadNotif > 0 && (
                          <span className="rounded-full bg-rose-500 px-1.5 text-[9px] font-bold text-white">{unreadNotif > 9 ? '9+' : unreadNotif}</span>
                        )}
                      </Link>
                    </DropdownMenu.Item>
                    <DropdownMenu.Item asChild>
                      <Link
                        to="/wallet"
                        className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-3.5 text-xs font-bold text-slate-600 outline-none transition-colors duration-150 hover:bg-blue-50 hover:text-blue-700 focus:bg-blue-50 focus:text-blue-700"
                      >
                        <Wallet size={15} /> E-Wallet
                      </Link>
                    </DropdownMenu.Item>
                    <DropdownMenu.Item asChild>
                      <Link
                        to="/parking-history"
                        className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-3.5 text-xs font-bold text-slate-600 outline-none transition-colors duration-150 hover:bg-blue-50 hover:text-blue-700 focus:bg-blue-50 focus:text-blue-700"
                      >
                        <MapPinned size={15} /> Parking History
                      </Link>
                    </DropdownMenu.Item>
                    <DropdownMenu.Item asChild>
                      <Link
                        to="/long-term-subscriptions"
                        className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-3.5 text-xs font-bold text-slate-600 outline-none transition-colors duration-150 hover:bg-blue-50 hover:text-blue-700 focus:bg-blue-50 focus:text-blue-700"
                      >
                        <Ticket size={15} /> Subscriptions
                      </Link>
                    </DropdownMenu.Item>
                    <DropdownMenu.Separator className="my-1 h-px bg-slate-100" />
                    <DropdownMenu.Item
                      className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-3.5 text-xs font-bold text-rose-500 outline-none transition-colors duration-150 hover:bg-rose-50 hover:text-rose-700 focus:bg-rose-50 focus:text-rose-700"
                      onSelect={onLogout}
                    >
                      <LogOut size={15} /> Logout
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>

              {unreadNotif > 0 && (
                <span className="absolute -left-1 -top-1 z-30 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[8px] font-black text-white shadow-[0_0_8px_rgba(244,63,94,0.6)]">
                  {unreadNotif > 9 ? '9+' : unreadNotif}
                </span>
              )}

              {hasMissingInfo && (
                <span className="pointer-events-none absolute -right-1 -top-1 z-30 flex h-4 w-4">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
                  <span className="relative inline-flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 font-mono text-[8px] font-black text-white shadow-[0_0_8px_rgba(225,29,72,0.6)]">
                    1
                  </span>
                </span>
              )}
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
