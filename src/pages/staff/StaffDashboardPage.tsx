import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CalendarClock,
  Car,
  CheckCircle2,
  Circle,
  Clock,
  DoorOpen,
  Gauge,
  ScanLine,
  ShieldAlert,
  Ticket,
} from 'lucide-react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import { StatusBadge } from '@/components/common/StatusBadge';
import { useBuildingContext } from '@/hooks/useBuildingContext';
import {
  staffApi,
  extractShifts,
  type MyShift,
  type ParkingSession,
  type StaffIncident,
  type StaffReservation,
} from '@/services/staff/staffApi';

/* ─── helpers ─── */
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}
function fmtDateFull() {
  return new Date().toLocaleDateString('vi-VN', {
    weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric',
  });
}
function formatSlotLocation(session: ParkingSession): string {
  const floor    = session.slot?.floor?.name || session.slot?.floor?.code || null;
  const slotCode = session.slot?.code || null;
  if (!floor && !slotCode) return 'Location —';
  if (!floor) return `Slot ${slotCode}`;
  if (!slotCode) return `Floor ${floor}`;
  return `${floor} · Slot ${slotCode}`;
}

/* ─── Skeleton ─── */
function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-slate-200/70 ${className}`} />;
}

/* ─── 3D Tilt Action Card ─── */
interface TiltCardProps {
  to: string;
  title: string;
  subtitle: string;
  gradFrom: string;
  gradTo: string;
  border: string;
  shadow: string;
  iconStyle: React.CSSProperties;
  arrowColor: string;
  icon: React.ElementType;
}

function TiltActionCard({ to, title, subtitle, gradFrom, gradTo, border, shadow, iconStyle, arrowColor, icon: Icon }: TiltCardProps) {
  const ref = useRef<HTMLAnchorElement>(null);
  const mx  = useMotionValue(0);
  const my  = useMotionValue(0);
  const sx  = useSpring(mx, { stiffness: 200, damping: 20 });
  const sy  = useSpring(my, { stiffness: 200, damping: 20 });
  const rx  = useTransform(sy, [-0.5, 0.5], [5, -5]);
  const ry  = useTransform(sx, [-0.5, 0.5], [-5, 5]);

  return (
    <motion.a
      ref={ref}
      href={to}
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 900,
        background: `linear-gradient(135deg, ${gradFrom}, ${gradTo})`,
        border,
      }}
      whileHover={{ y: -6, boxShadow: shadow }}
      transition={{ type: 'spring', stiffness: 280, damping: 22 }}
      onMouseMove={e => {
        const r = ref.current?.getBoundingClientRect();
        if (!r) return;
        mx.set((e.clientX - r.left) / r.width - 0.5);
        my.set((e.clientY - r.top) / r.height - 0.5);
      }}
      onMouseLeave={() => { mx.set(0); my.set(0); }}
      className="group relative block overflow-hidden rounded-2xl p-5 cursor-pointer"
    >
      {/* Shimmer */}
      <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: 'linear-gradient(108deg, transparent 36%, rgba(255,255,255,0.35) 50%, transparent 64%)' }} />

      <div className="relative z-10 flex items-center gap-4">
        <span className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-xl" style={iconStyle}>
          <Icon size={23} />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] font-extrabold text-slate-800 tracking-tight">{title}</h3>
          <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
        </div>
        <ArrowRight size={18} style={{ color: arrowColor, flexShrink: 0 }}
          className="transition-all duration-300 group-hover:translate-x-1.5 group-hover:scale-110" />
      </div>
    </motion.a>
  );
}

/* ─── Stat Card ─── */
interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ElementType;
  topLine: string;
  iconBg: string;
  iconColor: string;
  valueColor: string;
  loading?: boolean;
  delay?: number;
}

function StatCard({ label, value, icon: Icon, topLine, iconBg, iconColor, valueColor, loading, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -5, scale: 1.025 }}
      className="relative overflow-hidden rounded-2xl p-4"
      style={{
        background: 'rgba(255,255,255,0.75)',
        border: '1px solid rgba(14,165,233,0.1)',
        boxShadow: '0 2px 16px rgba(14,165,233,0.05), inset 0 1px 0 rgba(255,255,255,0.9)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Top colour line */}
      <div className="absolute top-0 left-4 right-4 h-0.5 rounded-full" style={{ background: topLine }} />

      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
        <span className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: iconBg }}>
          <Icon size={14} style={{ color: iconColor }} />
        </span>
      </div>

      {loading ? (
        <Skeleton className="mt-3 h-10 w-14" />
      ) : (
        <p className="mt-2 text-4xl font-black tabular-nums leading-none" style={{ color: valueColor }}>
          {value}
        </p>
      )}
    </motion.div>
  );
}

import { LicensePlate } from '@/components/common/LicensePlate';

/* ─── License Plate Box ─── */
function PlateBox({ session }: { session: ParkingSession }) {
  const isMotor = session.vehicleType?.name?.toLowerCase().includes('xe máy') ||
    session.vehicleType?.name?.toLowerCase().includes('motor') ||
    session.vehicleType?.name?.toLowerCase().includes('motorbike');

  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.015 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      className="flex items-center gap-3 rounded-xl p-3"
      style={{
        background: 'rgba(255,255,255,0.6)',
        border: '1px solid rgba(14,165,233,0.1)',
        boxShadow: '0 1px 8px rgba(14,165,233,0.05)',
      }}
    >
      <LicensePlate plateNumber={session.plateNumber} />

      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {isMotor ? '— Motorcycle' : '— Car'}
        </p>
        <p className="truncate text-xs font-semibold text-slate-700">{formatSlotLocation(session)}</p>
        <p className="text-[11px] text-slate-400">In at {fmtTime(session.entryTime)}</p>
      </div>
    </motion.div>
  );
}

/* ─── Glass Section ─── */
function GlassCard({ children, accentLine, className = '' }: { children: React.ReactNode; accentLine: string; className?: string }) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-5 ${className}`}
      style={{
        background: 'rgba(255,255,255,0.72)',
        border: '1px solid rgba(14,165,233,0.1)',
        boxShadow: '0 4px 24px rgba(14,165,233,0.06), inset 0 1px 0 rgba(255,255,255,0.9)',
        backdropFilter: 'blur(14px)',
      }}
    >
      <div className="absolute top-0 left-0 right-0 h-0.5 rounded-full" style={{ background: accentLine }} />
      {children}
    </div>
  );
}

/* ─── Main Page ─── */
export function StaffDashboardPage() {
  const { building } = useBuildingContext();
  const [shifts, setShifts]             = useState<MyShift[]>([]);
  const [sessions, setSessions]         = useState<ParkingSession[]>([]);
  const [incidents, setIncidents]       = useState<StaffIncident[]>([]);
  const [reservations, setReservations] = useState<StaffReservation[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);

  useEffect(() => {
    const buildingId = building?._id;
    Promise.all([
      staffApi.myShifts(),
      staffApi.getActiveSessions({ building: buildingId, populate: 'slot.floor,vehicleType,entryGate,exitGate' }),
      staffApi.incidents.list(buildingId),
    ])
      .then(([shiftRes, sessionRes, incidentRes]) => {
        setShifts(extractShifts(shiftRes as Parameters<typeof extractShifts>[0]));
        const rawS = (sessionRes as { data?: { items?: ParkingSession[] } | ParkingSession[] })?.data;
        setSessions(Array.isArray(rawS) ? rawS : (rawS as { items?: ParkingSession[] })?.items ?? []);
        const rawI = (incidentRes as { data?: { items?: StaffIncident[] } | StaffIncident[] })?.data;
        setIncidents(Array.isArray(rawI) ? rawI : (rawI as { items?: StaffIncident[] })?.items ?? []);
        setReservations([]);
        setError(null);
      })
      .catch(e => setError(e instanceof Error ? e.message : 'Failed to load data'))
      .finally(() => setLoading(false));
  }, [building]);

  const todayShifts = useMemo(() => {
    const now = new Date();
    return shifts.filter(s => {
      const d = new Date(s.workDate);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
    });
  }, [shifts]);

  const activeSessions = useMemo(() => sessions.filter(s => s.status === 'active'), [sessions]);
  const openIncidents  = useMemo(() => incidents.filter(i => ['open','investigating','escalated'].includes(i.status ?? '')), [incidents]);
  const pendingRes     = useMemo(() => reservations.filter(r => r.status === 'confirmed'), [reservations]);

  const assignedGates = useMemo(() => {
    const src = todayShifts.length > 0 ? todayShifts : shifts.slice(0, 1);
    const map = new Map<string, NonNullable<MyShift['gate']>>();
    src.forEach(s => { if (s.gate?._id) map.set(s.gate._id, s.gate); });
    return Array.from(map.values());
  }, [todayShifts, shifts]);

  const dirText = (d: 'in' | 'out' | 'both') => d === 'in' ? 'Entry' : d === 'out' ? 'Exit' : 'Two-way';

  const showIn    = assignedGates.some(g => g.direction === 'in'  || g.direction === 'both') || assignedGates.length === 0;
  const showOut   = assignedGates.some(g => g.direction === 'out' || g.direction === 'both') || assignedGates.length === 0;
  const taskCount = (showIn ? 1 : 0) + (showOut ? 1 : 0);

  const stats: StatCardProps[] = [
    {
      label: 'Shifts today',          value: todayShifts.length,    icon: CalendarClock, loading,
      topLine:    'linear-gradient(90deg, transparent, #0ea5e9, transparent)',
      iconBg:     'rgba(14,165,233,0.1)',  iconColor: '#0ea5e9',
      valueColor: '#0284c7', delay: 0,
    },
    {
      label: 'Parked vehicles',       value: activeSessions.length, icon: Gauge,         loading,
      topLine:    'linear-gradient(90deg, transparent, #10b981, transparent)',
      iconBg:     'rgba(16,185,129,0.1)', iconColor: '#10b981',
      valueColor: '#059669', delay: 0.06,
    },
    {
      label: 'Open incidents',        value: openIncidents.length,  icon: ShieldAlert,   loading,
      topLine:    openIncidents.length > 0
        ? 'linear-gradient(90deg, transparent, #f43f5e, transparent)'
        : 'linear-gradient(90deg, transparent, #cbd5e1, transparent)',
      iconBg:     openIncidents.length > 0 ? 'rgba(244,63,94,0.1)' : 'rgba(203,213,225,0.3)',
      iconColor:  openIncidents.length > 0 ? '#f43f5e' : '#94a3b8',
      valueColor: openIncidents.length > 0 ? '#e11d48' : '#94a3b8',
      delay: 0.18,
    },
  ];

  if (!loading && !building) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="max-w-sm rounded-2xl p-8 text-center"
          style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', boxShadow: '0 4px 20px rgba(245,158,11,0.06)' }}>
          <Building2 size={36} className="mx-auto mb-3 text-amber-500" />
          <p className="text-base font-bold text-amber-700">No building selected</p>
          <p className="mt-1 text-sm text-slate-500">Please select a building from the left menu.</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-4"
    >
      {/* ── ROW 1: Building Banner ── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.04, duration: 0.36 }}
        className="relative overflow-hidden rounded-2xl p-5"
        style={{
          background: 'linear-gradient(135deg, rgba(224,242,254,0.9) 0%, rgba(255,255,255,0.85) 50%, rgba(219,234,254,0.7) 100%)',
          border: '1px solid rgba(14,165,233,0.18)',
          boxShadow: '0 4px 24px rgba(14,165,233,0.08), inset 0 1px 0 rgba(255,255,255,0.9)',
          backdropFilter: 'blur(12px)',
        }}
      >
        {/* Corner glow */}
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(14,165,233,0.12) 0%, transparent 70%)', filter: 'blur(16px)' }} />

        <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            {/* Icon with sky gradient */}
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
              style={{
                background: 'linear-gradient(135deg, #e0f2fe, #bae6fd)',
                border: '1px solid rgba(14,165,233,0.22)',
                boxShadow: '0 4px 12px rgba(14,165,233,0.12)',
              }}>
              <Building2 size={22} className="text-sky-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-sky-500">Operations Staff</p>
              <h1 className="text-xl font-extrabold leading-tight text-slate-800 tracking-tight">
                {building ? building.name : <Skeleton className="h-6 w-44 inline-block" />}
              </h1>
              <p className="mt-0.5 text-xs text-slate-400">{fmtDateFull()}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!loading && (
              assignedGates.length > 0
                ? assignedGates.map(g => (
                    <span key={g._id} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold"
                      style={{ background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.18)', color: '#0284c7' }}>
                      <DoorOpen size={12} /> Gate {g.code}{g.name ? ` · ${g.name}` : ''} · {dirText(g.direction)}
                    </span>
                  ))
                : (
                  <span className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold"
                    style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(203,213,225,0.6)', color: '#64748b' }}>
                    <DoorOpen size={12} /> No gate assigned
                  </span>
                )
            )}
            {building?.operatingHours && (
              <span className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold"
                style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(203,213,225,0.6)', color: '#475569' }}>
                <Clock size={12} /> {building.operatingHours.open} – {building.operatingHours.close}
              </span>
            )}
            {/* Active badge — emerald with ping */}
            <span className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold"
              style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', color: '#059669' }}>
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              Active
            </span>
          </div>
        </div>
      </motion.div>

      {/* ── ROW 2: Action Cards (3D Tilt) ── */}
      {!loading && (
        <div className={`grid gap-4 ${taskCount === 2 ? 'sm:grid-cols-2' : 'grid-cols-1'}`}>
          {showIn && (
            <TiltActionCard
              to="/staff/operations"
              title="Vehicle check-in"
              subtitle="Scan plate / QR for entering vehicles"
              gradFrom="rgba(236,253,245,0.95)"
              gradTo="rgba(209,250,229,0.8)"
              border="1px solid rgba(16,185,129,0.2)"
              shadow="0 16px 40px rgba(16,185,129,0.15), 0 0 0 1px rgba(16,185,129,0.18)"
              iconStyle={{
                background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(5,150,105,0.1))',
                border: '1px solid rgba(16,185,129,0.25)',
                color: '#059669',
                boxShadow: '0 4px 12px rgba(16,185,129,0.1)',
              }}
              arrowColor="#059669"
              icon={ScanLine}
            />
          )}
          {showOut && (
            <TiltActionCard
              to="/staff/checkout"
              title="Check-out xe ra"
              subtitle="Scan → compare photos → collect fee & release"
              gradFrom="rgba(255,247,237,0.95)"
              gradTo="rgba(254,243,199,0.8)"
              border="1px solid rgba(245,158,11,0.2)"
              shadow="0 16px 40px rgba(245,158,11,0.15), 0 0 0 1px rgba(245,158,11,0.18)"
              iconStyle={{
                background: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(217,119,6,0.1))',
                border: '1px solid rgba(245,158,11,0.25)',
                color: '#d97706',
                boxShadow: '0 4px 12px rgba(245,158,11,0.1)',
              }}
              arrowColor="#d97706"
              icon={ScanLine}
            />
          )}
        </div>
      )}

      {/* ── ROW 3: Stat Grid ── */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {stats.map(s => <StatCard key={s.label} {...s} />)}
      </div>

      {/* Error/incident banners */}
      {error && (
        <div className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold"
          style={{ background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.18)', color: '#e11d48' }}>
          <AlertTriangle size={16} className="shrink-0" /> {error}
        </div>
      )}
      {!loading && openIncidents.length > 0 && (
        <Link to="/staff/incidents"
          className="flex items-center gap-3 rounded-2xl px-4 py-3 transition-all hover:shadow-md"
          style={{ background: 'rgba(244,63,94,0.05)', border: '1px solid rgba(244,63,94,0.16)', boxShadow: '0 2px 8px rgba(244,63,94,0.05)' }}>
          <ShieldAlert size={16} className="shrink-0" style={{ color: '#f43f5e' }} />
          <p className="flex-1 text-sm" style={{ color: '#be123c' }}>
            <strong>{openIncidents.length} open incidents</strong> — tap to view and handle.
          </p>
          <ArrowRight size={16} style={{ color: '#f43f5e' }} />
        </Link>
      )}

      {/* ── ROW 4: Parked Vehicles + Shifts ── */}
      <div className="grid items-start gap-4 xl:grid-cols-3">

        {/* Parked vehicles — 2/3 */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.36 }}
          className="xl:col-span-2"
        >
          <GlassCard accentLine="linear-gradient(90deg, transparent, #10b981, transparent)">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg"
                  style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
                  <Car size={14} className="text-emerald-600" />
                </div>
                <h2 className="text-sm font-bold text-slate-800">Parked vehicles</h2>
                <span className="rounded-md px-2 py-0.5 text-[11px] font-bold"
                  style={{ background: 'rgba(14,165,233,0.07)', color: '#64748b', border: '1px solid rgba(14,165,233,0.1)' }}>
                  {loading ? '…' : activeSessions.length}
                </span>
              </div>
              <Link to="/staff/parked"
                className="inline-flex items-center gap-1 text-xs font-semibold transition-colors text-emerald-600 hover:text-emerald-700">
                View all <ArrowRight size={12} />
              </Link>
            </div>

            {loading ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <Skeleton className="h-16 w-full rounded-xl" />
                <Skeleton className="h-16 w-full rounded-xl" />
              </div>
            ) : activeSessions.length === 0 ? (
              <div className="flex flex-col items-center gap-2 rounded-xl py-8 text-center"
                style={{ background: 'rgba(241,245,249,0.6)', border: '1px dashed rgba(203,213,225,0.8)' }}>
                <CheckCircle2 size={28} className="text-slate-300" />
                <p className="text-sm text-slate-400">No vehicles parked</p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {activeSessions.slice(0, 6).map(s => <PlateBox key={s._id} session={s} />)}
              </div>
            )}

            {!loading && activeSessions.length > 6 && (
              <p className="mt-3 text-center text-xs font-semibold text-slate-400">
                +{activeSessions.length - 6} more
              </p>
            )}
          </GlassCard>
        </motion.div>

        {/* Shifts today — 1/3 */}
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.24, duration: 0.36 }}
        >
          <GlassCard accentLine="linear-gradient(90deg, transparent, #0ea5e9, transparent)">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg"
                  style={{ background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.2)' }}>
                  <CalendarClock size={14} className="text-sky-600" />
                </div>
                <h2 className="text-sm font-bold text-slate-800">Shifts today</h2>
              </div>
              <span className="rounded-md px-2 py-0.5 text-[11px] font-bold"
                style={{ background: 'rgba(14,165,233,0.07)', color: '#64748b', border: '1px solid rgba(14,165,233,0.1)' }}>
                {loading ? '…' : todayShifts.length}
              </span>
            </div>

            {loading ? (
              <Skeleton className="h-24 w-full rounded-xl" />
            ) : todayShifts.length === 0 ? (
              <div className="flex flex-col items-center gap-2 rounded-xl py-8 text-center"
                style={{ background: 'rgba(241,245,249,0.6)', border: '1px dashed rgba(203,213,225,0.8)' }}>
                <Circle size={28} className="text-slate-300" />
                <p className="text-sm text-slate-400">No shifts today</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todayShifts.map(s => (
                  <motion.div
                    key={s._id}
                    whileHover={{ x: 3 }}
                    className="relative overflow-hidden rounded-xl p-3.5"
                    style={{
                      background: 'rgba(255,255,255,0.7)',
                      border: '1px solid rgba(14,165,233,0.1)',
                      boxShadow: '0 2px 8px rgba(14,165,233,0.04)',
                    }}
                  >
                    {/* Left accent bar — sky gradient */}
                    <div className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full"
                      style={{ background: 'linear-gradient(180deg, #0ea5e9, #0284c7)', boxShadow: '0 0 6px rgba(14,165,233,0.4)' }} />
                    <div className="pl-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-extrabold text-slate-800 tracking-tight">
                          {s.shift.code} — {s.shift.name}
                        </p>
                        <StatusBadge status={s.status} />
                      </div>
                      <p className="mt-1 font-mono text-sm font-bold text-sky-600">
                        {s.shift.startTime} – {s.shift.endTime}
                      </p>
                      {s.gate ? (
                        <p className="mt-2 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                          style={{ background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.18)', color: '#0284c7' }}>
                          <DoorOpen size={10} />
                          Gate {s.gate.code}{s.gate.name ? ` · ${s.gate.name}` : ''} · {dirText(s.gate.direction)}
                        </p>
                      ) : (
                        <p className="mt-2 text-[10px] font-semibold uppercase tracking-wide italic text-slate-400">No gate assigned</p>
                      )}
                      {s.note && <p className="mt-1 truncate text-[11px] italic text-slate-400">Note: {s.note}</p>}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </GlassCard>
        </motion.div>
      </div>
    </motion.div>
  );
}
