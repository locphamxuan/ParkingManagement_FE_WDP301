import { motion } from 'framer-motion';
import {
  ArrowRight,
  CarFront,
  CheckCircle2,
  CircleParking,
  Radio,
  ScanLine,
  ShieldCheck,
  WalletCards,
} from 'lucide-react';
import carGarage from '@/assets/white_car_garage.png';

const heroHighlights = [
  { value: '24/7', label: 'Live operations' },
  { value: '99%', label: 'Slot accuracy' },
  { value: '≤3s', label: 'Gate response' },
];

const liveSignals = [
  { icon: ScanLine, label: 'Plate recognition', value: 'Online' },
  { icon: CircleParking, label: 'Available spaces', value: '148' },
  { icon: WalletCards, label: 'Cashless payment', value: 'Ready' },
];

interface HomeHeroProps {
  user?: {
    fullName?: string;
    email?: string;
    phone?: string;
    role?: string;
    licensePlates?: Array<{ plateNumber: string; vehicleType: 'car' | 'motorcycle' }>;
  } | null;
  heroButtonText: string;
}

function getWorkspacePath(role?: string) {
  if (role === 'admin') return '/admin/dashboard';
  if (role === 'manager') return '/manager/dashboard';
  if (role === 'staff') return '/staff';
  return '/user-dashboard';
}

/**
 * Public hero: a calm, high-contrast product statement paired with a single
 * depth-rich operational visual. Decorative layers never intercept input.
 */
export function HomeHero({ user, heroButtonText }: HomeHeroProps) {
  return (
    <section
      id="hero-intro"
      className="relative isolate flex min-h-[calc(100svh-72px)] items-center overflow-hidden px-4 py-14 sm:px-6 lg:py-20"
    >
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_17%_18%,rgba(37,99,235,0.18),transparent_26%),linear-gradient(135deg,rgba(5,13,25,0.35),rgba(5,13,25,0.88))]"
        aria-hidden="true"
      />

      <div className="mx-auto grid w-full max-w-7xl items-center gap-14 lg:grid-cols-[1.02fr_0.98fr] lg:gap-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 max-w-2xl"
        >
          <div className="mb-6 inline-flex min-h-8 items-center gap-2 rounded-lg border border-cyan-300/20 bg-cyan-300/[0.07] px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-200">
            <Radio size={12} className="text-cyan-300" />
            Smart parking operations
          </div>

          <h1 className="text-balance text-4xl font-black leading-[1.05] tracking-[-0.045em] text-white sm:text-5xl lg:text-[4.2rem]">
            One clear view of your{' '}
            <span className="bg-gradient-to-r from-blue-300 via-cyan-200 to-cyan-400 bg-clip-text text-transparent">
              entire parking operation.
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-base font-medium leading-7 text-slate-300 sm:text-lg">
            PBMS connects entry gates, parking spaces, subscriptions, payments, and live reporting in
            one reliable workspace—built for faster decisions and smoother arrivals.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <motion.a
              href={user ? getWorkspacePath(user.role) : '/auth/login'}
              whileHover={{ y: -2 }}
              whileTap={{ y: 0 }}
              className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-6 text-sm font-extrabold text-white shadow-[0_14px_32px_rgba(6,182,212,0.24)] transition-shadow hover:shadow-[0_18px_40px_rgba(6,182,212,0.32)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
            >
              {heroButtonText}
              <ArrowRight size={16} />
            </motion.a>
            {!user ? (
              <a
                href="/auth/register"
                className="inline-flex min-h-12 items-center rounded-xl border border-white/14 bg-white/[0.055] px-6 text-sm font-bold text-slate-200 backdrop-blur-md transition-colors hover:border-cyan-300/30 hover:bg-white/[0.09] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
              >
                Create an account
              </a>
            ) : null}
          </div>

          <div className="mt-10 grid max-w-lg grid-cols-3 border-y border-white/10 py-5">
            {heroHighlights.map((item, index) => (
              <div
                key={item.label}
                className={index === 0 ? '' : 'border-l border-white/10 pl-5 sm:pl-7'}
              >
                <strong className="block font-mono text-xl font-black text-white sm:text-2xl">
                  {item.value}
                </strong>
                <span className="mt-1 block text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                  {item.label}
                </span>
              </div>
            ))}
          </div>

          <p className="mt-5 flex items-center gap-2 text-xs font-semibold text-slate-400">
            <ShieldCheck size={15} className="text-emerald-400" />
            Secure access, auditable transactions, and role-based workflows.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 30, rotateY: -6 }}
          animate={{ opacity: 1, x: 0, rotateY: 0 }}
          transition={{ duration: 0.8, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
          className="public-dark-visual depth-card relative mx-auto w-full max-w-[590px] [perspective:1200px]"
        >
          <div className="relative aspect-[4/4.4] overflow-hidden rounded-[28px] border border-white/15 bg-[#0b1b31] shadow-[0_34px_90px_rgba(0,0,0,0.38)]">
            <img
              src={carGarage}
              alt="A vehicle in a modern, digitally managed parking facility"
              className="absolute inset-0 h-full w-full object-cover object-center"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#050d19] via-[#050d19]/12 to-[#06101f]/15" />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-blue-950/30 via-transparent to-cyan-950/10" />

            <div className="absolute left-5 right-5 top-5 flex items-center justify-between gap-3">
              <div className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-white/15 bg-[#071326]/78 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-white backdrop-blur-xl">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                Live facility
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-[#071326]/78 text-cyan-300 backdrop-blur-xl">
                <CarFront size={18} />
              </div>
            </div>

            <div className="absolute bottom-5 left-5 right-5 rounded-2xl border border-white/12 bg-[#071326]/88 p-3.5 shadow-2xl backdrop-blur-xl">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-500">
                    Facility status
                  </p>
                  <p className="mt-0.5 text-sm font-extrabold text-white">Central Parking Hub</p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-400/10 px-2.5 py-1 text-[10px] font-bold text-emerald-300">
                  <CheckCircle2 size={11} />
                  Healthy
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {liveSignals.map((signal) => {
                  const Icon = signal.icon;
                  return (
                    <div
                      key={signal.label}
                      className="rounded-xl border border-white/[0.08] bg-white/[0.045] p-2.5"
                    >
                      <Icon size={14} className="text-cyan-300" />
                      <p className="mt-2 truncate text-[9px] font-semibold text-slate-500">{signal.label}</p>
                      <p className="mt-0.5 text-xs font-extrabold text-white">{signal.value}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div
              className="pointer-events-none absolute bottom-[26%] left-[12%] right-[12%] h-[22%] origin-bottom opacity-45 [transform:perspective(500px)_rotateX(62deg)]"
              aria-hidden="true"
            >
              <div className="h-full w-full bg-[linear-gradient(rgba(34,211,238,0.35)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.35)_1px,transparent_1px)] bg-[size:28px_28px] [mask-image:linear-gradient(to_top,black,transparent)]" />
            </div>
          </div>

          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -left-4 top-[30%] hidden rounded-2xl border border-white/12 bg-[#0a1a30]/92 p-3 shadow-2xl backdrop-blur-xl sm:block"
          >
            <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-500">Gate A1</p>
            <p className="mt-1 flex items-center gap-2 text-xs font-extrabold text-white">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.7)]" />
              Entry clear
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
