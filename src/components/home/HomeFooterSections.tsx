import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Building2, Mail, PhoneCall } from 'lucide-react';
import footerBg from '@/assets/footer.jpg';
import { TiltCard } from './TiltCard';
import { BackToTopButton } from './BackToTopButton';
import { showToast } from '@/components/common/ToastNotification';
import styles from '@/styles/modules/HomeFooterSections.module.css';

interface PremiumCTABannerProps {
  user: any;
  onViewProfile: () => void;
}

export function PremiumCTABanner({ user, onViewProfile }: PremiumCTABannerProps) {
  return (
    <section className="py-20 relative z-10 overflow-hidden bg-slate-950">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-cyan-500/8 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4">
        <TiltCard className="group p-8 md:p-12 border border-white/5 hover:border-white/10 shadow-2xl bg-black relative">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none rounded-3xl" />

          <div className="relative flex flex-col md:flex-row items-center justify-between gap-8 z-20">
            <div className="text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-black uppercase tracking-wider font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                Start a New Experience
              </div>
              <h2 className="text-2xl md:text-3xl font-black mt-4 text-white tracking-tight leading-tight">
                Deploy an end-to-end <br className="hidden md:inline" />
                <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-cyan-400 bg-clip-text text-transparent">intelligent parking lot</span>
              </h2>
              <p className="text-xs text-slate-400 mt-2 max-w-md leading-relaxed font-semibold">
                Optimal management, long-term subscriptions, and real-time monitoring. Maximize the value of your building's parking lot.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto shrink-0 justify-center">
              <motion.a
                whileHover={{ scale: 1.03, boxShadow: '0 0 25px rgba(6,182,212,0.4)' }}
                whileTap={{ scale: 0.98 }}
                href="/auth/register"
                className="px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-black text-xs uppercase tracking-wider text-center shadow-[0_0_20px_rgba(6,182,212,0.2)] transition-all duration-200"
              >
                Create Account
              </motion.a>

              {user ? (
                <motion.button
                  whileHover={{ scale: 1.03, borderColor: 'rgba(6,182,212,0.4)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onViewProfile}
                  className="px-8 py-4 rounded-xl bg-slate-950/80 border border-white/10 text-white font-bold text-xs uppercase tracking-wider transition-all duration-200 text-center backdrop-blur-sm"
                >
                  View Your Profile
                </motion.button>
              ) : (
                <motion.a
                  whileHover={{ scale: 1.03, borderColor: 'rgba(6,182,212,0.4)' }}
                  whileTap={{ scale: 0.98 }}
                  href="/auth/login"
                  className="px-8 py-4 rounded-xl bg-slate-950/80 border border-white/10 text-white font-bold text-xs uppercase tracking-wider transition-all duration-200 inline-flex items-center justify-center backdrop-blur-sm"
                >
                  Portal Login
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

export function PremiumFooter({ user, onViewProfile, navigationLinks }: PremiumFooterProps) {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      showToast('Please enter a valid email address.', 'error');
      return;
    }
    setSubscribed(true);
    setTimeout(() => {
      setSubscribed(false);
      setEmail('');
    }, 3000);
  }

  return (
    <>
      <footer id="lien-he" className="relative z-10 overflow-hidden bg-slate-950 py-16 md:py-20">
        <div
          className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-20 saturate-[0.7]"
          style={{ backgroundImage: `url(${footerBg})` }}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-slate-50/20 via-slate-100/45 to-slate-200/70" />
        <div className="pointer-events-none absolute bottom-0 left-1/4 h-[400px] w-[600px] rounded-full bg-cyan-500/5 blur-[140px]" />

        <div className="mx-auto max-w-6xl px-4">
          <TiltCard className="group relative border border-white/5 shadow-2xl">
            <div className="pointer-events-none absolute inset-0 rounded-[23px] bg-[linear-gradient(to_right,rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:32px_32px]" />

          <div className={`relative z-20 grid md:grid-cols-3 gap-10 lg:gap-16 pb-12 ${styles.preserve3d}`}>
            {/* Col 1: Platform Info */}
            <div className={`space-y-6 ${styles.layerZ30}`}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                  <span className="text-white font-black text-base font-mono">P</span>
                </div>
                <div>
                  <p className="text-sm font-black text-white tracking-wider font-mono leading-none">PBMS PLATFORM</p>
                  <span className="text-[9px] text-slate-500 font-mono tracking-widest uppercase">Cloud Management</span>
                </div>
              </div>

              <p className="text-xs leading-relaxed text-slate-400 font-medium">
                Leading intelligent parking lot management system for buildings and large enterprise organizations in Vietnam.
              </p>

              <div className="inline-flex items-center gap-2.5 px-3 py-2 rounded-xl bg-emerald-500/5 border border-emerald-500/10 backdrop-blur-sm shadow-[0_0_15px_rgba(16,185,129,0.05)]">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[10px] font-bold text-emerald-400 font-mono uppercase tracking-wider">
                  All systems operational
                </span>
              </div>

            </div>

            {/* Col 2: Navigation Links */}
            <div className={`space-y-6 ${styles.layerZ30p}`}>
              <h4 className="font-black text-white text-xs uppercase tracking-wider font-mono border-l-2 border-cyan-500 pl-3">
                Quick Links
              </h4>
              <nav className="flex flex-col gap-3">
                {navigationLinks.map((link) => (
                  <motion.a
                    key={link.href}
                    href={link.href}
                    whileHover={{ x: 6, color: '#22d3ee' }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 transition-colors"
                  >
                    <span className="w-1 h-1 rounded-full bg-white/20 group-hover:bg-cyan-500 transition-colors" />
                    {link.label}
                  </motion.a>
                ))}
              </nav>
            </div>

            {/* Col 3: Portal & Newsletter */}
            <div className={`space-y-6 ${styles.layerZ35p}`}>
              <h4 className="font-black text-white text-xs uppercase tracking-wider font-mono border-l-2 border-cyan-500 pl-3">
                Portal Access
              </h4>

              <div className="flex flex-wrap gap-2.5">
                <motion.a
                  whileHover={{ scale: 1.03, backgroundColor: '#06b6d4', color: '#020617', boxShadow: '0 0 15px rgba(6,182,212,0.3)' }}
                  whileTap={{ scale: 0.98 }}
                  href="/auth/login"
                className="inline-flex min-h-11 items-center px-4 py-2.5 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-xl text-xs font-black uppercase transition-all"
                >
                  Login
                </motion.a>

                <motion.a
                  whileHover={{ scale: 1.03, borderColor: 'rgba(255,255,255,0.25)', backgroundColor: 'rgba(255,255,255,0.02)' }}
                  whileTap={{ scale: 0.98 }}
                  href="/auth/register"
                className="inline-flex min-h-11 items-center px-4 py-2.5 bg-slate-900 border border-white/5 text-slate-300 rounded-xl text-xs font-bold uppercase transition-all"
                >
                  Register
                </motion.a>

                {user ? (
                  <motion.button
                    whileHover={{ scale: 1.03, borderColor: 'rgba(255,255,255,0.25)', backgroundColor: 'rgba(255,255,255,0.02)' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onViewProfile}
                    className="inline-flex min-h-11 items-center px-4 py-2.5 bg-slate-900 border border-white/5 text-slate-300 rounded-xl text-xs font-bold uppercase transition-all"
                  >
                    Profile
                  </motion.button>
                ) : null}
              </div>

              <div className="pt-2">
                <label
                  htmlFor="footer-newsletter-email"
                  className="mb-2 block text-[10px] font-black uppercase tracking-wider text-white font-mono"
                >
                  Subscribe to Newsletter
                </label>
                <form onSubmit={handleSubscribe} noValidate className="relative flex items-center">
                  <input
                    id="footer-newsletter-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Your email..."
                    className="min-h-[52px] w-full rounded-xl border border-white/5 bg-slate-900/60 px-4 py-3 pr-16 text-xs text-white placeholder-slate-500 transition-all focus:border-cyan-500/40 focus:outline-none"
                    required
                  />
                  <button
                    type="submit"
                    aria-label="Subscribe to newsletter"
                    className="absolute right-1 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 text-white transition-all hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2"
                  >
                    <ArrowRight size={14} strokeWidth={2.5} aria-hidden="true" />
                  </button>
                </form>
                <AnimatePresence>
                  {subscribed && (
                    <motion.p
                      role="status"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-[10px] text-emerald-400 font-bold mt-1.5 font-mono"
                    >
                      ✓ Successfully subscribed to newsletter!
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          <div className={`border-t border-white/10 pt-7 ${styles.layerZ25}`}>
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-xl text-center lg:text-left">
                <p className="text-xs font-black text-slate-200">
                  © {new Date().getFullYear()} PBMS Parking Management System
                </p>
                <p className="mt-1.5 text-[11px] font-medium leading-relaxed text-slate-500">
                  Secure access, transparent operations, and dependable support for every parking journey.
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-center lg:justify-end">
                {[
                  { icon: Building2, label: 'PBMS Platform', href: '/' },
                  { icon: Mail, label: 'support@pbms.com', href: 'mailto:support@pbms.com' },
                  { icon: PhoneCall, label: '1900 636 447', href: 'tel:1900636447' },
                ].map((contact) => {
                  const Icon = contact.icon;
                  return (
                    <motion.a
                      key={contact.label}
                      href={contact.href}
                      whileHover={{ y: -2, borderColor: 'rgba(6,182,212,0.28)' }}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white/85 px-3.5 text-[11px] font-bold text-slate-600 shadow-sm transition-colors hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-700"
                    >
                      <Icon size={14} aria-hidden="true" />
                      <span>{contact.label}</span>
                    </motion.a>
                  );
                })}
              </div>
            </div>
          </div>
          </TiltCard>
        </div>
        <BackToTopButton />
      </footer>
    </>
  );
}
