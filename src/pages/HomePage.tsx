import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import {
  AlertTriangle,
  BarChart3,
  BellRing,
  CarFront,
  Clock3,
  History,
  MapPinned,
  Ticket,
  Wallet,
  User,
  ChevronDown,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import type { LegacyModule } from '../data/mainFlow';
import { notificationApi } from '@/services/notificationApi';
import { AnimatedParkingMap3D } from '@/components/map/AnimatedParkingMap3D';
import { ModuleCard, moduleIcons } from '@/components/home/ModuleCard';
import { PremiumCTABanner, PremiumFooter } from '@/components/home/HomeFooterSections';
import { HomeHero } from '@/components/home/HomeHero';
import { Logo } from '@/components/layout/Logo';
import back1 from '@/assets/back1.webp';
import { AppBackdrop } from '@/components/layout/AppBackdrop';
import { cn } from '@/utils/cn';

interface HomePageProps {
  modules: LegacyModule[];
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onViewProfile: () => void;
  onViewReservationHistory: () => void;
  onAction: (module: LegacyModule) => void;
  user?: { fullName?: string; email?: string; phone?: string; role?: string; licensePlates?: Array<{ plateNumber: string; vehicleType: 'car' | 'motorcycle' }> } | null;
  onLogout?: () => void;
}

const navigationLinks = [
  { label: 'Home', href: '#top' },
  { label: 'About', href: '#hero-intro' },
  { label: 'Solutions', href: '#giai-phap' },
  { label: 'Services', href: '#dich-vu' },
  { label: 'Contact', href: '#lien-he' },
];


const benefits = [
  {
    icon: Clock3,
    title: 'Real-time Entry/Exit Monitoring',
    description: 'Track vehicle entries/exits, individual slot status, and parking sessions on the operator panel in real time.',
  },
  {
    icon: BarChart3,
    title: 'Transparent Revenue Reporting',
    description: 'Consolidated transactions, shift revenue, and occupancy rates — giving management data to make decisions.',
  },
  {
    icon: CarFront,
    title: 'Reservations, Subscriptions & Wallet',
    description: 'Pre-book spots, buy monthly packages, pay via e-wallet, and look up parking logs — all under a single account.',
  },
];


export default function HomePage({ modules, onOpenAuth, onViewProfile, onViewReservationHistory, onAction, user, onLogout }: HomePageProps) {
  const hasMissingInfo = Boolean(
    user &&
    user.role === 'user' &&
    (!user.phone || user.phone.trim() === '' || !user.licensePlates || user.licensePlates.length === 0)
  );

  const productModules = useMemo(() => modules.filter((m) => m.available && !(m.id === 'auth' && user)), [modules, user]);
  const serviceModules = useMemo(() => modules.filter((m) => !m.available), [modules]);
  const [showPlateBanner, setShowPlateBanner] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Số thông báo chưa đọc — hiện badge trên nút tài khoản (chỉ khi đã đăng nhập là user).
  const [unreadNotif, setUnreadNotif] = useState(0);
  useEffect(() => {
    if (!user || user.role !== 'user') return;
    notificationApi
      .list()
      .then((res) => {
        const d = (res as { data?: { unread?: number } })?.data;
        setUnreadNotif(d?.unread ?? 0);
      })
      .catch(() => undefined);
  }, [user]);


  const heroButtonText = useMemo(() => {
    if (!user) return 'Login Now';
    if (user.role === 'admin') return 'Admin Dashboard';
    if (user.role === 'manager') return 'Manager Dashboard';
    if (user.role === 'staff') return 'Staff Portal';
    return 'Experience Platform';
  }, [user]);

  const onViewWallet = () => {
    const walletModule = modules.find((module) => module.id === 'wallet');
    if (walletModule) onAction(walletModule);
  };

  return (
    <main id="top" className="public-light-theme relative isolate min-h-screen overflow-x-hidden bg-[#f4f7fb] font-sans text-slate-900 selection:bg-cyan-200 selection:text-slate-950">
      <AppBackdrop variant="midnight" />

      {/* Background Neon Glow Spheres — absolute so it scrolls naturally and doesn't overlap the header */}
      <div className="absolute inset-x-0 top-0 h-[100vh] pointer-events-none overflow-hidden -z-10 bg-slate-950" aria-hidden="true">
        {/* Subtle Blurred Background Image */}
        <div 
          className="absolute inset-0 opacity-[0.38] filter blur-[4px] bg-cover pointer-events-none"
          style={{ backgroundImage: `url(${back1})`, backgroundPosition: 'center 80px' }}
        />
        {/* Radial dark gradient overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(13,26,26,0.1)_0%,rgba(13,26,26,0.60)_100%)] pointer-events-none" />
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[55%] rounded-full bg-[radial-gradient(circle_at_center,hsla(180,70%,30%,0.12),transparent_55%)] blur-3xl" />
        <div className="absolute top-[35%] right-[-15%] w-[60%] h-[60%] rounded-full bg-[radial-gradient(circle_at_center,hsla(195,80%,25%,0.08),transparent_55%)] blur-3xl" />
        <div className="absolute bottom-[-10%] left-[20%] w-[50%] h-[50%] rounded-full bg-[radial-gradient(circle_at_center,hsla(170,60%,20%,0.06),transparent_50%)] blur-3xl" />
      </div>


      {/* Cyber Header Navigation */}
      <header className={`sticky top-0 z-40 border-b transition-all duration-300 ${scrolled
        ? 'border-slate-200/80 bg-white/90 py-2.5 shadow-[0_12px_35px_rgba(15,23,42,0.08)] backdrop-blur-xl'
        : 'border-slate-200/60 bg-white/80 py-3.5 backdrop-blur-md'
        }`}>
        {/* Top edge glowing gradient border */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/70 to-transparent" />

        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4">
          <a href="#top" aria-label="PBMS Home" className="group">
            <Logo size={40} tagline="Cloud Management" />
          </a>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Primary navigation">
            {navigationLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="group relative inline-flex min-h-10 items-center rounded-xl px-3 text-xs font-bold text-slate-600 transition-colors duration-200 hover:bg-blue-50 hover:text-blue-700"
              >
                {link.label}
                <span className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-blue-600 to-cyan-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="text-right hidden sm:block group cursor-pointer">
              <span className="text-[9px] uppercase font-mono tracking-widest text-slate-500 font-black block">Support 24/7</span>
              <strong className="text-xs font-black text-slate-700 group-hover:text-cyan-600 transition-colors duration-300">1900 636 447</strong>
            </div>

            {user ? (
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
                      <span className="min-w-0 flex-1 truncate font-extrabold tracking-tight">{user.fullName ?? user.email}</span>
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
                      <DropdownMenu.Item
                        className="flex min-h-11 cursor-pointer items-center justify-between rounded-xl px-3.5 text-xs font-bold text-slate-600 outline-none transition-colors duration-150 hover:bg-blue-50 hover:text-blue-700 focus:bg-blue-50 focus:text-blue-700"
                        onSelect={onViewProfile}
                      >
                        <span className="flex items-center gap-3"><User size={15} /> My Profile</span>
                        {hasMissingInfo && <span className="h-2 w-2 rounded-full bg-rose-500 shadow-[0_0_6px_#f43f5e]" />}
                      </DropdownMenu.Item>
                      <DropdownMenu.Item asChild>
                        <a
                          href="/notifications"
                          className="flex min-h-11 cursor-pointer items-center justify-between rounded-xl px-3.5 text-xs font-bold text-slate-600 outline-none transition-colors duration-150 hover:bg-blue-50 hover:text-blue-700 focus:bg-blue-50 focus:text-blue-700"
                        >
                          <span className="flex items-center gap-3"><BellRing size={15} /> Notifications</span>
                          {unreadNotif > 0 && (
                            <span className="rounded-full bg-rose-500 px-1.5 text-[9px] font-bold text-white">
                              {unreadNotif > 9 ? '9+' : unreadNotif}
                            </span>
                          )}
                        </a>
                      </DropdownMenu.Item>
                      <DropdownMenu.Item
                        className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-3.5 text-xs font-bold text-slate-600 outline-none transition-colors duration-150 hover:bg-blue-50 hover:text-blue-700 focus:bg-blue-50 focus:text-blue-700"
                        onSelect={onViewWallet}
                      >
                        <Wallet size={15} /> E-Wallet
                      </DropdownMenu.Item>
                      <DropdownMenu.Item
                        className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-3.5 text-xs font-bold text-slate-600 outline-none transition-colors duration-150 hover:bg-blue-50 hover:text-blue-700 focus:bg-blue-50 focus:text-blue-700"
                        onSelect={onViewReservationHistory}
                      >
                        <History size={15} /> Booking History
                      </DropdownMenu.Item>
                      <DropdownMenu.Item asChild>
                        <a
                          href="/parking-history"
                          className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-3.5 text-xs font-bold text-slate-600 outline-none transition-colors duration-150 hover:bg-blue-50 hover:text-blue-700 focus:bg-blue-50 focus:text-blue-700"
                        >
                          <MapPinned size={15} /> Parking History
                        </a>
                      </DropdownMenu.Item>
                      <DropdownMenu.Item asChild>
                        <a
                          href="/long-term-subscriptions"
                          className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-3.5 text-xs font-bold text-slate-600 outline-none transition-colors duration-150 hover:bg-blue-50 hover:text-blue-700 focus:bg-blue-50 focus:text-blue-700"
                        >
                          <Ticket size={15} /> Subscriptions
                        </a>
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
                onClick={() => onOpenAuth('login')}
                whileHover={{ scale: 1.05, boxShadow: '0 0 15px rgba(59,130,246,0.45)' }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex min-h-10 items-center rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 text-xs font-black uppercase tracking-wider text-white shadow-[0_8px_22px_rgba(6,182,212,0.22)] transition-all duration-200"
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
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileNavOpen(false)}
                    className="inline-flex min-h-11 items-center rounded-xl border border-transparent px-3 text-xs font-bold text-slate-600 transition-colors hover:bg-blue-50 hover:text-blue-700"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </motion.nav>
          ) : null}
        </AnimatePresence>
      </header>

      {/* Missing License Plate Warning Banner */}
      <AnimatePresence>
        {user && user.role === 'user' && (!user.licensePlates || user.licensePlates.length === 0) && showPlateBanner && (
          <motion.div
            key="plate-banner"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="sticky top-[57px] z-30 w-full"
          >
            <div className="max-w-6xl mx-auto px-4 py-2">
              <div className="flex items-center gap-3 rounded-2xl border border-amber-300 bg-amber-50/95 px-4 py-3 shadow-[0_12px_28px_rgba(180,83,9,0.1)] backdrop-blur-md">
                <div className="flex-shrink-0 rounded-lg bg-amber-100 p-1.5 text-amber-700">
                  <CarFront size={15} />
                </div>
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <AlertTriangle size={14} className="text-amber-700 flex-shrink-0" />
                  <p className="text-[11px] font-semibold leading-relaxed text-amber-900">
                    Your account has no license plate registered — automatic check-in/out is disabled.
                  </p>
                </div>
                <a
                  href="/profile"
                  className="flex-shrink-0 rounded-lg bg-amber-500 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-amber-950 transition-colors duration-200 hover:bg-amber-600 whitespace-nowrap"
                >
                  Update Now
                </a>
                <button
                  type="button"
                  onClick={() => setShowPlateBanner(false)}
                  className="flex-shrink-0 rounded-lg p-1 text-amber-700/70 hover:bg-amber-100 hover:text-amber-900 transition-colors duration-200"
                  aria-label="Close notification"
                >
                  <X size={13} className="stroke-[3]" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════════════
          SPLIT SCREEN HERO — Trái: Text | Phải: Ảnh xe + Hotspots
      ══════════════════════════════════════════════════════════════════ */}
      <HomeHero user={user} heroButtonText={heroButtonText} />

            {/* ═══ LIVE 3D PARKING MAP SHOWCASE ═══ */}
      <section id="ban-do-3d" className="py-20 relative z-10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-8">
            <span className="text-[10px] font-black uppercase tracking-widest text-orange-400 font-mono">Live Digital Twin</span>
            <h2 className="text-2xl md:text-3xl font-black mt-2 text-white">
              Parking map <span className="bg-gradient-to-r from-orange-400 via-amber-400 to-cyan-400 bg-clip-text text-transparent">in real-time 3D</span>
            </h2>
            <p className="mt-3 text-sm text-slate-400 font-semibold leading-relaxed max-w-2xl mx-auto">
              A real-time simulation of vehicles entering/parking/exiting with automatic gates, EV charging stations and per-slot status — a visual overview of the PBMS system.
            </p>
          </div>
          <div className="public-dark-visual max-w-3xl mx-auto">
            <AnimatedParkingMap3D />
          </div>
        </div>
      </section>

      {/* ═══ BENEFITS SECTION ═══ */}
      <section id="giai-phap" className="py-20 relative z-10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="glass-premium glow-border-pulse p-8 rounded-3xl relative overflow-hidden shadow-2xl">
            <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.06),transparent_70%)] pointer-events-none blur-2xl" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-mono">PBMS SYSTEM</span>
            <h2 className="text-2xl md:text-3xl font-black mt-2 text-white">Comprehensive Parking Operation Solution</h2>
            <p className="mt-3 text-sm text-slate-400 font-semibold leading-relaxed max-w-3xl">
              PBMS digitizes the entire parking operations workflow — from entry/exit checkpoints and floor layout management to pre-booking reservations and subscriptions. Designed for building managers and end-users.
            </p>
            <div className="mt-6 grid md:grid-cols-3 gap-4">
              {benefits.map((benefit) => {
                const Icon = benefit.icon;
                return (
                  <div key={benefit.title} className="flex gap-4 p-4 rounded-2xl border border-white/5 bg-slate-950/40 hover:border-white/20 transition-all duration-300">
                    <div className="p-2 h-fit rounded-lg bg-white/10 text-white"><Icon size={16} /></div>
                    <div>
                      <h4 className="text-xs font-black text-white">{benefit.title}</h4>
                      <p className="text-[11px] text-slate-400 mt-1 font-semibold leading-relaxed">{benefit.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Core Solutions Modules */}
      <section id="dich-vu" className="py-20 relative z-10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-mono">Core Modules</span>
              <h2 className="text-2xl md:text-3xl font-black mt-2 text-white">Platform Capabilities</h2>
              <p className="text-sm text-slate-400 font-semibold mt-2">Role-based modules serving the right operator or user at the right time.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {productModules.map((module, index) => (
              <ModuleCard
                key={module.id}
                module={module}
                index={index}
                onViewProfile={onViewProfile}
                onAction={onAction}
                colorTheme={module.id === 'profile' || module.id === 'packages' ? 'cyan' : 'orange'}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Services Roadmap Section — only when there's an actual upcoming feature to show */}
      {serviceModules.length > 0 && (
      <section id="lo-trinh" className="py-20 relative z-10 bg-slate-950/40">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center max-w-xl mx-auto mb-12">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-mono">Development Roadmap</span>
            <h2 className="text-2xl md:text-3xl font-black mt-2 text-cyan-400">Upcoming Features</h2>
            <p className="text-sm text-slate-400 font-semibold mt-2">Features currently in development to expand capabilities and enhance convenience.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {serviceModules.map((module, index) => {
              const Icon = moduleIcons[module.id] || Ticket;
              return (
                <motion.article
                  key={module.id}
                  initial={{ opacity: 0, scale: 0.98 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: index * 0.1 }}
                  className="p-5 rounded-2xl border border-white/5 bg-slate-900/20 backdrop-blur-md flex flex-col justify-between min-h-[140px] hover:border-white/20 hover:shadow-[0_0_20px_rgba(255,255,255,0.06)] transition-all duration-300"
                >
                  <div className="flex gap-4">
                    <div className="p-3 h-fit rounded-xl bg-white/10 border border-white/15 text-white">
                      <Icon size={22} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-black text-sm text-white tracking-tight">{module.title}</h3>
                        <span className="text-[8px] font-black uppercase font-mono tracking-wider border border-white/25 bg-white/15 text-white px-1.5 py-0.5 rounded">NEXT PHASE</span>
                      </div>
                      <p className="mt-2 text-xs text-slate-400 leading-relaxed font-semibold">{module.description}</p>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        </div>
      </section>
      )}

      {/* Premium CTA Banner */}
      <PremiumCTABanner user={user} onViewProfile={onViewProfile} />

      {/* Premium Cyber Footer */}
      <PremiumFooter user={user} onViewProfile={onViewProfile} navigationLinks={navigationLinks} />
    </main>
  );
}

