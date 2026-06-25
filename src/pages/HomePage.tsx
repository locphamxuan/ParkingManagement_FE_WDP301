import { useEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform, useScroll, animate } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BellRing,
  Building2,
  CalendarClock,
  CarFront,
  CheckCircle2,
  Clock3,
  CreditCard,
  History,
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
  X,
} from 'lucide-react';
import type { LegacyModule } from '../data/mainFlow';
import { AnimatedParkingMap3D } from '@/components/map/AnimatedParkingMap3D';
import { notificationApi } from '@/services/notificationApi';

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
  { label: 'About', href: '#gioi-thieu' },
  { label: 'Solutions', href: '#giai-phap' },
  { label: 'Services', href: '#dich-vu' },
  { label: 'Contact', href: '#lien-he' },
];

const moduleIcons: Record<string, LucideIcon> = {
  auth: ShieldCheck,
  profile: CheckCircle2,
  wallet: Wallet,
  buildings: Building2,
  packages: Ticket,
  reservations: CalendarClock,
  sessions: ScanLine,
  payments: CreditCard,
  notifications: BellRing,
};

const heroHighlights = [
  { value: '24/7', label: 'Continuous monitoring and operational support' },
  { value: '01', label: 'A unified platform for residents and management' },
  { value: '99.9%', label: 'Clear check-in and check-out process' },
];

const benefits = [
  {
    icon: Clock3,
    title: 'Real-time access control',
    description: 'Track vehicle flow, lot status and sessions on a single visual operations screen.',
  },
  {
    icon: BarChart3,
    title: 'Clear revenue reports',
    description: 'Centralize transaction, revenue and utilization metrics so managers can decide more easily.',
  },
  {
    icon: CarFront,
    title: 'A friendly user experience',
    description: 'Sign in, track information and expand booking, payment and notification features over time.',
  },
];

// Interactive 3D Parking Building Component with Parallax Tilt Effect


function ModuleCard({ 
  module, 
  index, 
  onViewProfile, 
  onAction 
}: { 
  module: any; 
  index: number; 
  onViewProfile: () => void; 
  onAction: (module: any) => void; 
}) {
  const [isHovered, setIsHovered] = useState(false);
  const Icon = moduleIcons[module.id] || CarFront;

  // Generate unique particles for each card instance on hover
  const particles = useMemo(() => {
    return Array.from({ length: 22 }).map((_, i) => {
      const type = ['star', 'diamond', 'circle'][Math.floor(Math.random() * 3)];
      return {
        id: i,
        type,
        size: type === 'star' ? Math.random() * 6 + 3.5 : Math.random() * 3.5 + 1.5,
        delay: Math.random() * 1.5,
        duration: Math.random() * 1.6 + 1.4, // 1.4s to 3.0s
        startX: Math.random() * 90 + 5, // 5% to 95%
        drift: Math.random() * 40 - 20, // -20% to 20% drift
        color: [
          '#ffd700', // Gold
          '#f97316', // Orange
          '#fbbf24', // Amber
          '#ffffff', // Diamond White
          '#ffb700', // Metallic Gold
          '#f43f5e', // Rose Gold/Rose Red
        ][Math.floor(Math.random() * 6)],
      };
    });
  }, []);

  return (
    <motion.article
      key={module.id}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={module.available ? { 
        scale: 1.03, 
        y: -4, 
        boxShadow: '0 15px 35px rgba(249, 115, 22, 0.25), 0 0 25px rgba(168, 85, 247, 0.15), inset 0 0 15px rgba(249, 115, 22, 0.15)',
      } : { scale: 1.01 }}
      className={`rounded-2xl p-[1px] relative overflow-hidden transition-all duration-300 ${
        module.available
          ? isHovered 
            ? 'shadow-[0_0_25px_rgba(249,115,22,0.15)]'
            : 'bg-white/10'
          : 'bg-white/5 opacity-75'
      }`}
    >
      {/* The moving gradient border layer (only visible on hover for available modules) */}
      {module.available && (
        <motion.div
          animate={{
            backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
          }}
          transition={{
            duration: isHovered ? 4 : 8, // Slower, elegant loop when idle; faster on hover
            repeat: Infinity,
            ease: "linear"
          }}
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(270deg, #f97316, #fbbf24, #a78bfa, #ec4899, #f43f5e, #f97316)',
            backgroundSize: '400% 400%',
            opacity: 1, // Always fully visible
            borderRadius: '16px',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Main Inner Card Content */}
      <div className={`p-5 rounded-[15px] backdrop-blur-md flex flex-col justify-between h-[228px] w-full relative z-10 overflow-hidden ${
        module.available
          ? 'bg-gradient-to-b from-slate-900/90 to-slate-950/95'
          : 'bg-slate-900/10'
      }`}>
        {/* Luxurious Ambient Background Glow */}
        <div
          className={`absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(249,115,22,0.18),rgba(168,85,247,0.08),transparent_65%)] pointer-events-none transition-opacity duration-500 ${
            isHovered && module.available ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Premium Diagonal Sheen sweep reflection */}
        <motion.div
          initial={{ x: '-100%', y: '-100%', rotate: -35 }}
          animate={isHovered && module.available ? { x: '200%', y: '200%' } : { x: '-100%', y: '-100%' }}
          transition={{
            duration: 1.8,
            repeat: Infinity,
            repeatDelay: 2.5,
            ease: "easeInOut"
          }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '250%',
            background: 'linear-gradient(115deg, transparent 35%, rgba(255, 215, 0, 0.08) 45%, rgba(255, 255, 255, 0.25) 50%, rgba(249, 115, 22, 0.1) 55%, transparent 65%)',
            pointerEvents: 'none',
            zIndex: 5,
          }}
        />

        {/* Glittering Sparkles Falling Effect */}
        {isHovered && module.available && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[15px] z-10">
            {particles.map((p) => {
              const clipPath = p.type === 'star'
                ? 'polygon(50% 0%, 63% 37%, 100% 50%, 63% 63%, 50% 100%, 37% 63%, 0% 50%, 37% 37%)'
                : p.type === 'diamond'
                  ? 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)'
                  : undefined;
              return (
                <motion.div
                  key={p.id}
                  initial={{ 
                    opacity: 0, 
                    x: `${p.startX}%`, 
                    y: -10, 
                    scale: 0,
                    rotate: 0 
                  }}
                  animate={{ 
                    opacity: [0, 1, 0.7, 1, 0.4, 0], 
                    x: [`${p.startX}%`, `${p.startX + p.drift / 2}%`, `${p.startX + p.drift}%`],
                    y: 240, 
                    scale: [0, 1.4, 0.8, 1.3, 0.6, 0],
                    rotate: [0, 180, 360, 540, 720]
                  }}
                  transition={{ 
                    duration: p.duration, 
                    repeat: Infinity, 
                    delay: p.delay,
                    ease: "linear"
                  }}
                  style={{
                    position: 'absolute',
                    width: p.size,
                    height: p.size,
                    backgroundColor: p.color,
                    borderRadius: p.type === 'circle' ? '50%' : undefined,
                    clipPath,
                    filter: `drop-shadow(0 0 3px ${p.color})`,
                    boxShadow: p.type === 'circle' ? `0 0 6px ${p.color}` : undefined,
                  }}
                />
              );
            })}
          </div>
        )}

        <div className="relative z-20">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-lg transition-all duration-300 ${
              module.available 
                ? isHovered
                  ? 'bg-orange-500/20 text-orange-300 shadow-[0_0_15px_rgba(249,115,22,0.3)] scale-110'
                  : 'bg-orange-500/10 text-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.1)]' 
                : 'bg-slate-800 text-slate-500'
            }`}>
              <Icon size={20} className="transition-transform duration-300" />
            </div>
            <div>
              <h3 className="font-black text-xs text-white tracking-tight uppercase">{module.title}</h3>
              <span className={`text-[8px] font-black uppercase tracking-wider font-mono px-2 py-0.5 rounded ${module.available ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-500'
                }`}>
                {module.available ? 'AVAILABLE' : 'ROADMAPPED'}
              </span>
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-400 leading-relaxed font-semibold">{module.description}</p>
        </div>

        <div className="mt-4 relative z-20">
          <motion.button
            whileHover={module.available ? { scale: 1.02, boxShadow: '0 0 15px rgba(249,115,22,0.3)' } : {}}
            whileTap={module.available ? { scale: 0.98 } : {}}
            className={`w-full py-2.5 px-4 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors duration-200 ${module.available
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 hover:shadow-[0_0_15px_rgba(249,115,22,0.2)] border-0'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5'
              }`}
            onClick={() => { if (module.id === 'profile') return onViewProfile(); onAction(module); }}
            disabled={!module.available}
          >
            {module.available ? module.actionLabel : 'Sắp ra mắt'} <ArrowRight size={12} />
          </motion.button>
        </div>
      </div>
    </motion.article>
  );
}


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
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Unread notification count — shows a badge on the account button (only when signed in as a user).
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

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const smoothScroll = useSpring(scrollYProgress, {
    stiffness: 50,
    damping: 15,
    restDelta: 0.001
  });

  // Stage 1 (Hero: 0% to 25%): Default isometric overview
  // Stage 2 (Features: 25% to 60%): 180deg rotation (Z: -45 -> 135) + zoom details
  // Stage 3 (Solutions: 60% to 100%): Down shift and shrink (scale: 0.85)
  const rotateZ = useTransform(smoothScroll, [0, 0.25, 0.60, 1.0], [-45, -45, 135, -45]);
  const rotateX = useTransform(smoothScroll, [0, 0.25, 0.60, 1.0], [55, 55, 48, 55]);
  const scale = useTransform(smoothScroll, [0, 0.25, 0.60, 1.0], [1.0, 1.0, 1.45, 0.85]);
  const x = useTransform(smoothScroll, [0, 0.25, 0.60, 1.0], [0, 0, -40, 60]);
  const y = useTransform(smoothScroll, [0, 0.25, 0.60, 1.0], [0, 0, 20, -50]);

  const heroButtonText = useMemo(() => {
    if (!user) return 'Sign in now';
    if (user.role === 'admin') return 'Admin dashboard';
    if (user.role === 'manager') return 'Manager dashboard';
    if (user.role === 'staff') return 'Staff shift portal';
    return 'Service experience';
  }, [user]);

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

  const onViewWallet = () => {
    const walletModule = modules.find((module) => module.id === 'wallet');
    if (walletModule) onAction(walletModule);
  };

  return (
    <main id="top" className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-orange-500 selection:text-white relative">

      {/* Background Neon Glow Spheres — fixed so they never cause scroll issues */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10" aria-hidden="true">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[55%] rounded-full bg-[radial-gradient(circle_at_center,hsla(24,95%,53%,0.08),transparent_55%)] blur-3xl" />
        <div className="absolute top-[35%] right-[-15%] w-[60%] h-[60%] rounded-full bg-[radial-gradient(circle_at_center,hsla(263,90%,51%,0.07),transparent_55%)] blur-3xl" />
        <div className="absolute bottom-[-10%] left-[20%] w-[50%] h-[50%] rounded-full bg-[radial-gradient(circle_at_center,hsla(142,76%,45%,0.04),transparent_50%)] blur-3xl" />
      </div>


      {/* Cyber Header Navigation */}
      <header className="border-b border-white/5 bg-slate-950/60 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <a href="#top" aria-label="PBMS Home" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 grid place-items-center shadow-[0_0_15px_rgba(249,115,22,0.3)] transition-all group-hover:scale-105 group-hover:shadow-[0_0_20px_rgba(249,115,22,0.5)]">
              <span className="w-2.5 h-2.5 bg-slate-950 rounded-full" />
            </div>
            <div>
              <strong className="block text-lg font-black tracking-tight bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">PBMS Parking</strong>
              <span className="text-[10px] uppercase font-mono tracking-widest text-slate-500 font-extrabold">Cloud Management</span>
            </div>
          </a>

          <nav className="hidden md:flex gap-6">
            {navigationLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-semibold text-slate-400 hover:text-orange-400 transition-colors duration-200"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-5">
            <div className="text-right hidden sm:block">
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 font-bold block">24/7 Support</span>
              <strong className="text-xs font-black text-slate-300">1900 636 447</strong>
            </div>

            {user ? (
              <div className="relative animate-fadeIn" ref={menuRef}>
                <button
                  type="button"
                  aria-expanded={menuOpen}
                  onClick={() => setMenuOpen((v) => !v)}
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-slate-900 border border-white/10 hover:border-orange-500/30 text-white transition-all shadow-md"
                >
                  <User size={14} className="text-orange-400" />
                  <span className="text-xs font-bold">{user.fullName ?? user.email}</span>
                  <ChevronDown size={12} className="text-slate-400" />
                </button>

                {unreadNotif > 0 && (
                  <span className="absolute -top-1 -left-1 z-30 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[8px] font-black text-white shadow-[0_0_8px_rgba(244,63,94,0.6)]">
                    {unreadNotif > 9 ? '9+' : unreadNotif}
                  </span>
                )}

                {hasMissingInfo && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 z-30 pointer-events-none">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-600 text-[8px] font-mono font-black text-white items-center justify-center animate-bounce shadow-[0_0_8px_rgba(225,29,72,0.6)]">
                      1
                    </span>
                  </span>
                )}

                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute right-0 mt-2 w-48 bg-slate-900/95 border border-white/10 rounded-xl shadow-2xl py-2 backdrop-blur-md z-50"
                  >
                    <button
                      className="w-full text-left px-4 py-2 text-xs font-semibold hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-between"
                      onClick={() => { setMenuOpen(false); onViewProfile(); }}
                    >
                      <span>My profile</span>
                      {hasMissingInfo && (
                        <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-pulse shadow-[0_0_6px_#f43f5e]" />
                      )}
                    </button>
                    <a
                      href="/notifications"
                      onClick={() => setMenuOpen(false)}
                      className="w-full text-left px-4 py-2 text-xs font-semibold hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-between"
                    >
                      <span className="flex items-center"><BellRing size={12} className="mr-2" />Notifications</span>
                      {unreadNotif > 0 && (
                        <span className="rounded-full bg-rose-500 px-1.5 text-[9px] font-bold text-white">
                          {unreadNotif > 9 ? '9+' : unreadNotif}
                        </span>
                      )}
                    </a>
                    <button
                      className="w-full text-left px-4 py-2 text-xs font-semibold hover:bg-slate-800 text-slate-300 hover:text-white"
                      onClick={() => { setMenuOpen(false); onViewWallet(); }}
                    >
                      <Wallet size={12} className="inline-block mr-2" /> Wallet
                    </button>
                    <button
                      className="w-full text-left px-4 py-2 text-xs font-semibold hover:bg-slate-800 text-slate-300 hover:text-white"
                      onClick={() => { setMenuOpen(false); onViewReservationHistory(); }}
                    >
                      <History size={12} className="inline-block mr-2" />Reservation history</button>
                    <a
                      href="/parking-history"
                      className="w-full text-left px-4 py-2 text-xs font-semibold hover:bg-slate-800 text-slate-300 hover:text-white flex items-center"
                      onClick={() => setMenuOpen(false)}
                    >
                      <MapPinned size={12} className="inline-block mr-2" />Parking history</a>
                    <button className="w-full text-left px-4 py-2 text-xs font-semibold hover:bg-slate-800 text-rose-400 hover:text-rose-300 border-t border-white/5 mt-1" onClick={onLogout}>
                      <LogOut size={12} className="inline-block mr-2" />Log out</button>
                  </motion.div>
                )}
              </div>
            ) : (
              <motion.button
                onClick={() => onOpenAuth('login')}
                whileHover={{ scale: 1.05, boxShadow: '0 0 15px rgba(249,115,22,0.45)' }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider transition-all duration-300"
              >Sign in</motion.button>
            )}

          </div>
        </div>
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
              <div className="flex items-center gap-3 rounded-2xl border border-amber-500/25 bg-amber-500/10 backdrop-blur-md px-4 py-2.5 shadow-lg">
                <div className="flex-shrink-0 p-1.5 rounded-lg bg-amber-500/15 text-amber-400">
                  <CarFront size={15} />
                </div>
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <AlertTriangle size={12} className="text-amber-400 flex-shrink-0" />
                  <p className="text-[11px] font-semibold text-amber-200/90 truncate">The account has no plate — the system cannot auto check-in/out for you.</p>
                </div>
                <a
                  href="/profile"
                  className="flex-shrink-0 px-3 py-1 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-300 font-black text-[10px] uppercase tracking-wider hover:bg-amber-500/30 transition-all duration-200 whitespace-nowrap"
                >
                  Update now
                </a>
                <button
                  type="button"
                  onClick={() => setShowPlateBanner(false)}
                  className="flex-shrink-0 p-1 rounded-lg text-amber-500/50 hover:text-amber-300 hover:bg-amber-500/10 transition-all duration-200"
                  aria-label="Dismiss notification"
                >
                  <X size={13} className="stroke-[3]" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scroll-Driven Presentation Deck Section */}
      <div ref={containerRef} className="relative w-full max-w-6xl mx-auto px-4 relative z-20">
        <div className="grid md:grid-cols-2 gap-12 items-start relative">

          {/* LEFT STORY STORY DECK COLUMN */}
          <div className="space-y-32 py-12 md:py-20 relative z-20">

            {/* Story Deck Item 1: Hero Intro */}
            <motion.section
              id="hero-intro"
              className="min-h-[70vh] flex flex-col justify-center animate-fadeIn"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 mb-4 w-fit animate-pulse">
                <span className="w-2 h-2 rounded-full bg-orange-500" />
                <span className="text-[10px] font-black uppercase tracking-wider text-orange-400 font-mono">Future Management Platform</span>
              </div>

              <h1 className="text-4xl md:text-5xl font-black leading-[1.12] tracking-tight text-white">Control platform<br />
                <span className="bg-gradient-to-r from-orange-400 via-amber-400 to-purple-400 bg-clip-text text-transparent">Smart parking lot</span>
              </h1>
              <p className="mt-5 text-sm text-slate-400 leading-relaxed max-w-lg font-semibold">
                PBMS redefines building operations. Real-time access monitoring, payment automation, smart occupancy tracking and an outstanding visual 3D solution.
              </p>
              <div className="mt-8 flex flex-wrap gap-4 items-center">
                {user ? (
                  <>
                    <motion.a
                      href={
                        user.role === 'admin'
                          ? '/admin/dashboard'
                          : user.role === 'manager'
                            ? '/manager/dashboard'
                            : user.role === 'staff'
                              ? '/staff'
                              : '/'
                      }
                      whileHover={{ scale: 1.05, boxShadow: '0 0 25px rgba(249,115,22,0.45)' }}
                      whileTap={{ scale: 0.95 }}
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider transition-all duration-300 inline-flex items-center gap-2"
                    >
                      {heroButtonText} <ArrowRight size={14} />
                    </motion.a>
                    <motion.button
                      onClick={onViewProfile}
                      whileHover={{ scale: 1.05, borderColor: 'rgba(249,115,22,0.3)' }}
                      whileTap={{ scale: 0.95 }}
                      className="px-6 py-3 rounded-xl bg-slate-900 border border-white/10 text-white font-bold text-xs uppercase tracking-wider transition-all duration-300 hover:bg-slate-900/60 inline-flex items-center"
                    >View profile</motion.button>
                  </>
                ) : (
                  <>
                    <motion.a
                      href="/auth/login"
                      whileHover={{ scale: 1.05, boxShadow: '0 0 25px rgba(249,115,22,0.45)' }}
                      whileTap={{ scale: 0.95 }}
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider transition-all duration-300 inline-flex items-center gap-2"
                    >Sign in now<ArrowRight size={14} />
                    </motion.a>
                    <motion.a
                      href="/auth/register"
                      whileHover={{ scale: 1.05, borderColor: 'rgba(249,115,22,0.3)' }}
                      whileTap={{ scale: 0.95 }}
                      className="px-6 py-3 rounded-xl bg-slate-900 border border-white/10 text-white font-bold text-xs uppercase tracking-wider transition-all duration-300 hover:bg-slate-900/60 inline-flex items-center"
                    >Sign up</motion.a>
                  </>
                )}
              </div>
            </motion.section>

            {/* Story Deck Item 2: Intro & floor & slot management */}
            <motion.section
              id="gioi-thieu"
              className="min-h-[70vh] flex flex-col justify-center scroll-mt-24"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
            >
              <div className="glass-premium glow-border-pulse p-8 rounded-3xl relative overflow-hidden shadow-2xl">
                <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.12),transparent_70%)] pointer-events-none blur-2xl" />
                <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400 font-mono">Outstanding Features</span>
                <h2 className="text-2xl md:text-3xl font-black mt-2 text-white">Smart floor & slot management</h2>
                <p className="mt-3 text-sm text-slate-400 font-semibold leading-relaxed">
                  A real-time 3D mapping system. Precisely monitor each slot per floor, visually display Available/Full status and route vehicles intelligently.
                </p>
                <div className="mt-6 grid gap-4">
                  {benefits.map((benefit) => {
                    const Icon = benefit.icon;
                    return (
                      <div key={benefit.title} className="flex gap-4 p-4 rounded-2xl border border-white/5 bg-slate-950/40 hover:border-cyan-500/20 transition-all duration-300">
                        <div className="p-2 h-fit rounded-lg bg-cyan-500/10 text-cyan-400"><Icon size={16} /></div>
                        <div>
                          <h4 className="text-xs font-black text-white">{benefit.title}</h4>
                          <p className="text-[11px] text-slate-400 mt-1 font-semibold leading-relaxed">{benefit.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.section>

            {/* Story Deck Item 3: Check-in/Check-out & control gate */}
            <motion.section
              id="check-in-gate"
              className="min-h-[70vh] flex flex-col justify-center scroll-mt-24"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
            >
              <div className="glass-premium glow-border-pulse p-8 rounded-3xl relative overflow-hidden shadow-2xl">
                <div className="absolute -left-12 -bottom-12 h-36 w-36 rounded-full bg-[radial-gradient(circle_at_center,rgba(249,115,22,0.1),transparent_70%)] pointer-events-none blur-2xl" />
                <span className="text-[10px] font-black uppercase tracking-widest text-orange-400 font-mono">Check-In Automation</span>
                <h2 className="text-2xl md:text-3xl font-black mt-2 text-white">Automated 24/7 access control</h2>
                <p className="mt-3 text-sm text-slate-400 font-semibold leading-relaxed">
                  Plate recognition, smart RFID scanning and fully automated gate barriers. Cut check-in/out time to under 2 seconds and minimize congestion.
                </p>

                {/* Floating highlight block */}
                <div className="mt-6 p-5 rounded-2xl border border-orange-500/20 bg-orange-500/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                    <span className="text-xs font-black text-orange-400 font-mono">RFID & PLATE RECOGNITION OK</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-black">GATEWAY ACTIVE</span>
                </div>
              </div>
            </motion.section>

          </div>

          {/* RIGHT VIEWPORT VIEW DECK COLUMN (STICKY) */}
          <div className="sticky top-24 hidden md:flex h-[calc(100vh-140px)] w-full items-center justify-center overflow-visible z-10">
            <div className="relative w-full max-w-[480px] preserve-3d">
              {/* Glowing Ambient Background ring */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(249,115,22,0.05),transparent_70%)] pointer-events-none blur-3xl z-0" />

              <AnimatedParkingMap3D
                rotateX={isMobile ? undefined : rotateX}
                rotateZ={isMobile ? undefined : rotateZ}
                scale={isMobile ? undefined : scale}
                x={isMobile ? undefined : x}
                y={isMobile ? undefined : y}
              />

              {/* Floating highlight status badges overlay around the model — stacked on the left side to prevent bottom overlapping */}
              <div className="absolute -left-28 md:-left-36 lg:-left-44 top-[10%] flex flex-col gap-4 max-w-[140px] pointer-events-none z-20">
                {heroHighlights.slice(0, 1).map((item, idx) => (
                  <motion.article
                    key={item.label}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + idx * 0.1 }}
                    className="rounded-2xl border border-white/5 bg-slate-950/80 p-3 backdrop-blur-md shadow-2xl"
                  >
                    <strong className="block text-lg font-black text-white font-mono bg-gradient-to-r from-orange-400 to-amber-300 bg-clip-text text-transparent">{item.value}</strong>
                    <span className="text-[9px] font-bold text-slate-400 mt-0.5 leading-relaxed block">{item.label}</span>
                  </motion.article>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Core Solutions Modules */}
      <section id="giai-phap" className="py-20 relative z-10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-orange-400 font-mono">System Features</span>
              <h2 className="text-2xl md:text-3xl font-black mt-2 text-white">Core solution modules</h2>
              <p className="text-sm text-slate-400 font-semibold mt-2">Multi-zone data sync with flexible role-based permissions per user flow.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {productModules.map((module, index) => {
              const Icon = moduleIcons[module.id] || CarFront;
              return (
                <motion.article
                  key={module.id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.08 }}
                  whileHover={module.available ? { 
                    scale: 1.03, 
                    y: -4, 
                    boxShadow: '0 0 25px rgba(249, 115, 22, 0.15)',
                    borderColor: 'rgba(249, 115, 22, 0.35)' 
                  } : { scale: 1.01 }}
                  className={`p-5 rounded-2xl border backdrop-blur-md flex flex-col justify-between h-[230px] transition-all duration-300 ${
                    module.available
                      ? 'border-white/5 bg-slate-900/40'
                      : 'border-white/5 bg-slate-900/10 opacity-75'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-lg ${module.available ? 'bg-orange-500/10 text-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.1)]' : 'bg-slate-800 text-slate-500'}`}>
                        <Icon size={20} />
                      </div>
                      <div>
                        <h3 className="font-black text-xs text-white tracking-tight uppercase">{module.title}</h3>
                        <span className={`text-[8px] font-black uppercase tracking-wider font-mono px-2 py-0.5 rounded ${module.available ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-500'
                          }`}>
                          {module.available ? 'AVAILABLE' : 'ROADMAPPED'}
                        </span>
                      </div>
                    </div>
                    <p className="mt-3 text-xs text-slate-400 leading-relaxed font-semibold">{module.description}</p>
                  </div>

                  <div className="mt-4">
                    <motion.button
                      whileHover={module.available ? { scale: 1.02, boxShadow: '0 0 15px rgba(249,115,22,0.3)' } : {}}
                      whileTap={module.available ? { scale: 0.98 } : {}}
                      className={`w-full py-2.5 px-4 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-1.5 ${module.available
                          ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 hover:shadow-[0_0_15px_rgba(249,115,22,0.2)] border-0'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5'
                        }`}
                      onClick={() => { if (module.id === 'profile') return onViewProfile(); onAction(module); }}
                      disabled={!module.available}
                    >
                      {module.available ? module.actionLabel : 'Coming soon'} <ArrowRight size={12} />
                    </motion.button>
                  </div>
                </motion.article>
              );
            })}

            {productModules.map((module, index) => (
              <ModuleCard
                key={module.id}
                module={module}
                index={index}
                onViewProfile={onViewProfile}
                onAction={onAction}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Services Roadmap Section */}
      <section id="dich-vu" className="py-20 relative z-10 bg-slate-950/40">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center max-w-xl mx-auto mb-12">
            <span className="text-[10px] font-black uppercase tracking-widest text-purple-400 font-mono">Value-Added Services</span>
            <h2 className="text-2xl md:text-3xl font-black mt-2 text-white">Scale along your operational roadmap</h2>
            <p className="text-sm text-slate-400 font-semibold mt-2">Fully supports future growth in traffic and parking management scale.</p>
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
                  className="p-5 rounded-2xl border border-white/5 bg-slate-900/20 backdrop-blur-md flex flex-col justify-between min-h-[140px] hover:border-purple-500/20 hover:shadow-[0_0_20px_rgba(168,85,247,0.06)] transition-all duration-300"
                >
                  <div className="flex gap-4">
                    <div className="p-3 h-fit rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                      <Icon size={22} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-black text-sm text-white tracking-tight">{module.title}</h3>
                        <span className="text-[8px] font-black uppercase font-mono tracking-wider bg-purple-500/10 text-purple-300 px-1.5 py-0.5 rounded">NEXT PHASE</span>
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

      {/* Premium CTA Banner */}
      <PremiumCTABanner user={user} onViewProfile={onViewProfile} />

      {/* Premium Cyber Footer */}
      <PremiumFooter user={user} onViewProfile={onViewProfile} navigationLinks={navigationLinks} />
    </main>
  );
}

// ==========================================
// PREMIUM FOOTER & CTA BANNER COMPONENTS WITH 3D TILT
// ==========================================

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
}

function TiltCard({ children, className = '', glowColor = 'rgba(249,115,22,0.12)' }: TiltCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);

  const rotateX = useSpring(useTransform(y, [0, 1], [8, -8]), { stiffness: 200, damping: 25 });
  const rotateY = useSpring(useTransform(x, [0, 1], [-8, 8]), { stiffness: 200, damping: 25 });

  // Shine reflection position
  const shineX = useTransform(x, [0, 1], ['-30%', '130%']);
  const shineY = useTransform(y, [0, 1], ['-30%', '130%']);

  // Cursor glow background
  const glowX = useMotionValue(0);
  const glowY = useMotionValue(0);

  // Auto floating 3D animation when not hovered
  useEffect(() => {
    if (isHovered) return;

    // We animate x and y around the center (0.5, 0.5) in a smooth oscillation loop
    const controlsX = animate(x, [0.35, 0.65, 0.35], {
      duration: 6,
      repeat: Infinity,
      repeatType: "reverse",
      ease: "easeInOut"
    });

    const controlsY = animate(y, [0.65, 0.35, 0.65], {
      duration: 7,
      repeat: Infinity,
      repeatType: "reverse",
      ease: "easeInOut"
    });

    return () => {
      controlsX.stop();
      controlsY.stop();
    };
  }, [isHovered, x, y]);
  
  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    setIsHovered(true);
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    x.set(mouseX / width);
    y.set(mouseY / height);

    glowX.set(mouseX);
    glowY.set(mouseY);
  }

  function handleMouseLeave() {
    setIsHovered(false);
    x.set(0.5);
    y.set(0.5);
  }

  const borderBg = useTransform(
    [glowX, glowY],
    ([gx, gy]) => `radial-gradient(280px circle at ${gx}px ${gy}px, rgba(249,115,22,0.35), transparent 70%)`
  );

  return (
    <motion.div
      onMouseEnter={() => setIsHovered(true)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
      }}
      className={`relative p-[1px] rounded-3xl overflow-hidden transition-all duration-300 ${className}`}
    >
      {/* Cursor-following border glow background */}
      <motion.div
        className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: borderBg,
        }}
      />
      
      {/* Card Content body */}
      <div 
        className="h-full w-full rounded-[23px] bg-slate-950/85 backdrop-blur-xl p-8 md:p-12 relative overflow-hidden"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Interactive cursor center glow */}
        <motion.div
          className="pointer-events-none absolute -inset-px opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[23px]"
          style={{
            background: useTransform(
              [glowX, glowY],
              ([gx, gy]) => `radial-gradient(350px circle at ${gx}px ${gy}px, ${glowColor}, transparent 80%)`
            ),
          }}
        />

        {/* Shine overlay */}
        <motion.div
          className="pointer-events-none absolute w-[150%] h-[150%] -left-1/4 -top-1/4 opacity-0 group-hover:opacity-20 transition-opacity duration-300 mix-blend-overlay bg-[radial-gradient(circle,rgba(255,255,255,0.45)_0%,transparent_60%)]"
          style={{
            x: shineX,
            y: shineY,
          }}
        />

        <div style={{ transform: 'translateZ(20px)', transformStyle: 'preserve-3d' }} className="relative z-10 h-full w-full">
          {children}
        </div>
      </div>
    </motion.div>
  );
}

interface PremiumCTABannerProps {
  user: any;
  onViewProfile: () => void;
}

function PremiumCTABanner({ user, onViewProfile }: PremiumCTABannerProps) {
  return (
    <section className="py-20 relative z-10 overflow-hidden bg-slate-950">
      {/* Background glow effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-orange-500/10 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="max-w-6xl mx-auto px-4">
        <TiltCard className="group p-8 md:p-12 border border-white/10 hover:border-orange-500/30 shadow-2xl shadow-orange-950/10 bg-slate-900/40 relative">
          {/* Subtle tech grid background inside */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none rounded-3xl" />
          
          <div className="relative flex flex-col md:flex-row items-center justify-between gap-8 z-20">
            <div className="text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] font-black uppercase tracking-wider font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                Bắt Đầu Trải Nghiệm Mới
              </div>
              <h2 className="text-2xl md:text-3xl font-black mt-4 text-white tracking-tight leading-tight">
                Triển khai bãi đỗ xe <br className="hidden md:inline" />
                <span className="bg-gradient-to-r from-orange-400 via-amber-400 to-orange-500 bg-clip-text text-transparent">thông minh toàn diện</span>
              </h2>
              <p className="text-xs text-slate-400 mt-2 max-w-md leading-relaxed font-semibold">
                Quản lý tối ưu, đặt chỗ tức thì và giám sát thời gian thực. Nâng tầm giá trị cho bãi đỗ xe của tòa nhà bạn.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto shrink-0 justify-center">
              <motion.a
                whileHover={{ scale: 1.03, boxShadow: '0 0 25px rgba(249,115,22,0.4)' }}
                whileTap={{ scale: 0.98 }}
                href="/auth/register"
                className="px-8 py-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider text-center transition-all duration-200"
              >
                Tạo tài khoản
              </motion.a>
              
              {user ? (
                <motion.button
                  whileHover={{ scale: 1.03, borderColor: 'rgba(249,115,22,0.4)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onViewProfile}
                  className="px-8 py-4 rounded-xl bg-slate-950/80 border border-white/10 text-white font-bold text-xs uppercase tracking-wider transition-all duration-200 text-center backdrop-blur-sm"
                >
                  Xem hồ sơ của bạn
                </motion.button>
              ) : (
                <motion.a
                  whileHover={{ scale: 1.03, borderColor: 'rgba(249,115,22,0.4)' }}
                  whileTap={{ scale: 0.98 }}
                  href="/auth/login"
                  className="px-8 py-4 rounded-xl bg-slate-950/80 border border-white/10 text-white font-bold text-xs uppercase tracking-wider transition-all duration-200 inline-flex items-center justify-center backdrop-blur-sm"
                >
                  Đăng nhập cổng
                </motion.a>
              )}
            </div>
          </div>
        </TiltCard>
      </div>
    </section>
  );
}

interface PremiumFooterProps {
  user: any;
  onViewProfile: () => void;
  navigationLinks: Array<{ href: string; label: string }>;
}

function PremiumFooter({ user, onViewProfile, navigationLinks }: PremiumFooterProps) {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setSubscribed(true);
    setTimeout(() => {
      setSubscribed(false);
      setEmail('');
    }, 3000);
  }

  return (
    <footer id="lien-he" className="bg-slate-950 py-20 relative z-10 overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute bottom-0 left-1/4 w-[600px] h-[400px] bg-orange-500/5 rounded-full blur-[140px] pointer-events-none" />
      
      <div className="max-w-6xl mx-auto px-4">
        <TiltCard className="group border border-white/5 shadow-2xl relative">
          {/* Subtle tech grid background inside */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none rounded-[23px]" />
          
          <div className="relative z-20 grid md:grid-cols-3 gap-10 lg:gap-16 pb-12" style={{ transformStyle: 'preserve-3d' }}>
            {/* Col 1: Platform Info */}
            <div className="space-y-6" style={{ transform: 'translateZ(30px)' }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-[0_0_15px_rgba(249,115,22,0.3)]">
                  <span className="text-slate-950 font-black text-base font-mono">P</span>
                </div>
                <div>
                  <p className="text-sm font-black text-white tracking-wider font-mono leading-none">PBMS PLATFORM</p>
                  <span className="text-[9px] text-slate-500 font-mono tracking-widest uppercase">Cloud Management</span>
                </div>
              </div>

              <p className="text-xs leading-relaxed text-slate-400 font-medium">
                Hệ thống quản lý bãi đỗ xe thông minh hàng đầu dành cho các tòa nhà và tổ chức doanh nghiệp lớn tại Việt Nam.
              </p>

              {/* Realtime Status Monitor */}
              <div className="inline-flex items-center gap-2.5 px-3 py-2 rounded-xl bg-emerald-500/5 border border-emerald-500/10 backdrop-blur-sm shadow-[0_0_15px_rgba(16,185,129,0.05)]">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[10px] font-bold text-emerald-400 font-mono uppercase tracking-wider">
                  Mọi hệ thống đang hoạt động ổn định
                </span>
              </div>

              <div className="text-[10px] text-slate-500 font-mono space-y-1">
                <p>Phiên bản UI V2.5.0 - Cyberpunk Glassmorphism</p>
                <p>Hệ thống tự động đồng bộ thời gian thực</p>
              </div>
            </div>

            {/* Col 2: Navigation Links */}
            <div className="space-y-6" style={{ transform: 'translateZ(30px)', transformStyle: 'preserve-3d' }}>
              <h4 className="font-black text-white text-xs uppercase tracking-wider font-mono border-l-2 border-orange-500 pl-3">
                Liên kết nhanh
              </h4>
              <nav className="flex flex-col gap-3">
                {navigationLinks.map((link) => (
                  <motion.a
                    key={link.href}
                    href={link.href}
                    whileHover={{ x: 6, color: '#f97316' }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 transition-colors"
                  >
                    <span className="w-1 h-1 rounded-full bg-white/20 group-hover:bg-orange-500 transition-colors" />
                    {link.label}
                  </motion.a>
                ))}
              </nav>
            </div>

            {/* Col 3: Portal & Newsletter */}
            <div className="space-y-6" style={{ transform: 'translateZ(35px)', transformStyle: 'preserve-3d' }}>
              <h4 className="font-black text-white text-xs uppercase tracking-wider font-mono border-l-2 border-orange-500 pl-3">
                Truy cập hệ thống
              </h4>
              
              <div className="flex flex-wrap gap-2.5">
                <motion.a
                  whileHover={{ scale: 1.03, backgroundColor: '#f97316', color: '#020617', boxShadow: '0 0 15px rgba(249,115,22,0.3)' }}
                  whileTap={{ scale: 0.98 }}
                  href="/auth/login"
                  className="px-4 py-2.5 bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-xl text-xs font-black uppercase transition-all"
                >
                  Đăng nhập
                </motion.a>
                
                <motion.a
                  whileHover={{ scale: 1.03, borderColor: 'rgba(255,255,255,0.25)', backgroundColor: 'rgba(255,255,255,0.02)' }}
                  whileTap={{ scale: 0.98 }}
                  href="/auth/register"
                  className="px-4 py-2.5 bg-slate-900 border border-white/5 text-slate-300 rounded-xl text-xs font-bold uppercase transition-all"
                >
                  Đăng ký thành viên
                </motion.a>

                {user ? (
                  <motion.button
                    whileHover={{ scale: 1.03, borderColor: 'rgba(255,255,255,0.25)', backgroundColor: 'rgba(255,255,255,0.02)' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onViewProfile}
                    className="px-4 py-2.5 bg-slate-900 border border-white/5 text-slate-300 rounded-xl text-xs font-bold uppercase transition-all"
                  >
                    Hồ sơ
                  </motion.button>
                ) : null}
              </div>

              <div className="pt-2">
                <p className="text-[10px] font-black text-white uppercase tracking-wider font-mono mb-2">Đăng ký nhận tin tức</p>
                <form onSubmit={handleSubscribe} className="relative flex items-center">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email của bạn..."
                    className="w-full px-4 py-3 bg-slate-900/60 border border-white/5 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/35 transition-all"
                    required
                  />
                  <button
                    type="submit"
                    className="absolute right-1.5 p-2 bg-orange-500 text-slate-950 hover:bg-orange-400 rounded-lg transition-colors flex items-center justify-center"
                  >
                    <ArrowRight size={14} strokeWidth={2.5} />
                  </button>
                </form>
                <AnimatePresence>
                  {subscribed && (
                    <motion.p
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-[10px] text-emerald-400 font-bold mt-1.5 font-mono"
                    >
                      ✓ Đã đăng ký bản tin thành công!
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Bottom footer bar */}
          <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6" style={{ transform: 'translateZ(25px)' }}>
            <small className="text-[10px] font-bold text-slate-500 font-mono tracking-tight">
              © {new Date().getFullYear()} PBMS PARKING. THIẾT KẾ GIAO DIỆN PREMIUM DƯỚI GIAO THỨC TẬP TRUNG.
            </small>

            {/* Social Links */}
            <div className="flex items-center gap-3">
              {[
                { icon: Building2, label: 'Website', href: '#' },
                { icon: Mail, label: 'Contact', href: 'mailto:support@pbms.com' },
                { icon: PhoneCall, label: 'Hotline', href: 'tel:1900636447' }
              ].map((social, index) => {
                const Icon = social.icon;
                return (
                  <motion.a
                    key={index}
                    href={social.href}
                    whileHover={{ scale: 1.1, y: -2, backgroundColor: 'rgba(249,115,22,0.1)', color: '#f97316', borderColor: 'rgba(249,115,22,0.2)' }}
                    className="w-8 h-8 rounded-xl bg-slate-900/60 border border-white/5 flex items-center justify-center text-slate-500 hover:text-orange-400 transition-colors"
                    title={social.label}
                  >
                    <Icon size={14} />
                  </motion.a>
                );
              })}
            </div>
          </div>
        </TiltCard>
      </div>
    </footer>
  );
}
