import { useEffect, useMemo, useState } from 'react';
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
import { motion } from 'framer-motion';
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

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function fmtDateFull() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-slate-200 ${className}`} />;
}

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ElementType;
  accent: string;
  loading?: boolean;
}

function StatCard({ label, value, icon: Icon, accent, loading }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-sky-100 bg-white p-4">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${accent}`}>
          <Icon size={15} />
        </span>
      </div>
      {loading ? (
        <Skeleton className="mt-2 h-8 w-12" />
      ) : (
        <p className="mt-1.5 text-3xl font-bold tabular-nums text-slate-800">{value}</p>
      )}
    </div>
  );
}

function formatSlotLocation(session: ParkingSession): string {
  const floor = session.slot?.floor?.name || session.slot?.floor?.code || null;
  const slotCode = session.slot?.code || null;

  if (!floor && !slotCode) return 'Location —';
  if (!floor) return `Slot ${slotCode}`;
  if (!slotCode) return `Floor ${floor}`;
  return `Floor ${floor} • Slot ${slotCode}`;
}

export function StaffDashboardPage() {
  const { building } = useBuildingContext();
  const [shifts, setShifts] = useState<MyShift[]>([]);
  const [sessions, setSessions] = useState<ParkingSession[]>([]);
  const [incidents, setIncidents] = useState<StaffIncident[]>([]);
  const [reservations, setReservations] = useState<StaffReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const buildingId = building?._id;
    Promise.all([
      staffApi.myShifts(),
      staffApi.getActiveSessions({ populate: 'slot.floor,vehicleType,entryGate,exitGate' }),
      staffApi.incidents.list(buildingId),
      staffApi.listReservations(buildingId ? { buildingId, status: 'confirmed' } : {}),
    ])
      .then(([shiftRes, sessionRes, incidentRes, resRes]) => {
        setShifts(extractShifts(shiftRes as Parameters<typeof extractShifts>[0]));

        const rawSessions =
          (sessionRes as { data?: { items?: ParkingSession[] } | ParkingSession[] })?.data;
        setSessions(
          Array.isArray(rawSessions)
            ? rawSessions
            : (rawSessions as { items?: ParkingSession[] })?.items ?? [],
        );

        const rawInc =
          (incidentRes as { data?: { items?: StaffIncident[] } | StaffIncident[] })?.data;
        setIncidents(
          Array.isArray(rawInc) ? rawInc : (rawInc as { items?: StaffIncident[] })?.items ?? [],
        );

        const rawRes = (resRes as { data?: { items?: StaffReservation[] } })?.data?.items ?? [];
        setReservations(Array.isArray(rawRes) ? rawRes : []);

        setError(null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load data'))
      .finally(() => setLoading(false));
  }, [building]);

  const todayShifts = useMemo(() => {
    const now = new Date();
    const sameDay = (iso: string) => {
      const d = new Date(iso);
      return (
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate()
      );
    };
    return shifts.filter((s) => sameDay(s.workDate));
  }, [shifts]);

  const activeSessions = useMemo(() => sessions.filter((s) => s.status === 'active'), [sessions]);
  const openIncidents = useMemo(
    () => incidents.filter((i) => ['open', 'investigating', 'escalated'].includes(i.status ?? '')),
    [incidents],
  );
  const pendingReservations = useMemo(
    () => reservations.filter((r) => r.status === 'confirmed'),
    [reservations],
  );

  const assignedGates = useMemo(() => {
    const pickFrom = todayShifts.length > 0 ? todayShifts : shifts.slice(0, 1);
    const map = new Map<string, NonNullable<MyShift['gate']>>();
    pickFrom.forEach((s) => {
      if (s.gate?._id) map.set(s.gate._id, s.gate);
    });
    return Array.from(map.values());
  }, [todayShifts, shifts]);

  const directionText = (d: 'in' | 'out' | 'both') =>
    d === 'in' ? 'Entry gate' : d === 'out' ? 'Exit gate' : 'Two-way';

  const showCheckIn = assignedGates.some((g) => g.direction === 'in' || g.direction === 'both') || assignedGates.length === 0;
  const showCheckOut = assignedGates.some((g) => g.direction === 'out' || g.direction === 'both') || assignedGates.length === 0;
  const taskCount = (showCheckIn ? 1 : 0) + (showCheckOut ? 1 : 0);

  const stats = [
    {
      label: 'Today\'s shift',
      value: todayShifts.length,
      icon: CalendarClock,
      accent: 'border-teal-500/20 bg-teal-500/10',
      bg: 'bg-teal-500/10',
      glowColor: 'from-teal-500/20 to-transparent',
      loading,
    },
    {
      label: 'Parked',
      value: activeSessions.length,
      icon: Gauge,
      accent: 'border-emerald-500/20 bg-emerald-500/10',
      bg: 'bg-emerald-500/10',
      glowColor: 'from-emerald-500/20 to-transparent',
      loading,
    },
    {
      label: 'Reservation',
      value: pendingReservations.length,
      icon: Ticket,
      accent: 'border-amber-500/20 bg-amber-500/10',
      bg: 'bg-amber-500/10',
      glowColor: 'from-amber-500/20 to-transparent',
      loading,
    },
    {
      label: 'Open incidents',
      value: openIncidents.length,
      icon: ShieldAlert,
      accent: openIncidents.length > 0
        ? 'border border-rose-500/30 bg-rose-500/10 text-rose-600'
        : 'border border-sky-100 bg-sky-50/40 text-slate-400',
      loading,
    },
  ];

  if (!loading && !building) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="max-w-sm rounded-2xl border border-amber-500/30 bg-amber-500/10 p-8 text-center">
          <Building2 size={36} className="mx-auto mb-3 text-amber-600" />
          <p className="text-base font-extrabold text-amber-700">No building selected</p>
          <p className="mt-1 text-sm text-slate-400 font-medium">Please select a building from the left menu to start your shift.</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-5"
    >
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl border border-sky-100 bg-white p-6 backdrop-blur-md shadow-sm">
        {/* Glow accents */}
        <div className="absolute top-0 left-0 w-60 h-60 bg-[radial-gradient(circle_at_center,rgba(20,184,166,0.06),transparent_65%)] pointer-events-none blur-2xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-40 h-40 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.04),transparent_65%)] pointer-events-none blur-2xl" />

        <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-teal-500/20 bg-teal-500/10 shadow-[0_0_12px_rgba(20,184,166,0.15)]">
              <Building2 size={20} className="text-teal-600" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 font-mono">Operations staff</p>
              <h1 className="mt-1 text-2xl font-black text-slate-800 tracking-tight leading-none">
                {building ? building.name : <Skeleton className="h-7 w-48" />}
              </h1>
              <p className="mt-1.5 text-xs font-semibold text-slate-400">{fmtDateFull()}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {!loading && (
              assignedGates.length > 0 ? (
                assignedGates.map((g) => (
                  <div
                    key={g._id}
                    className="flex items-center gap-1.5 rounded-xl border border-teal-500/20 bg-teal-500/10 px-3.5 py-2 text-xs font-black uppercase tracking-wider text-teal-600 shadow-[0_0_10px_rgba(20,184,166,0.08)]"
                  >
                    <DoorOpen size={13} />
                    Gate {g.code}{g.name ? ` · ${g.name}` : ''} · {directionText(g.direction)}
                  </div>
                ))
              ) : (
                <div className="flex items-center gap-1.5 rounded-xl border border-sky-100 bg-sky-50/40 px-3.5 py-2 text-xs font-black uppercase tracking-wider text-slate-400">
                  <DoorOpen size={13} />No gate assigned</div>
              )
            )}
            {building?.operatingHours && (
              <div className="flex items-center gap-1.5 rounded-xl border border-sky-100 bg-sky-50/40 px-3.5 py-2 text-xs font-black uppercase tracking-wider text-slate-400 font-mono">
                <Clock size={12} />
                {building.operatingHours.open} – {building.operatingHours.close}
              </div>
            )}
            <StatusBadge status={building?.status ?? 'active'} />
          </div>
        </div>
      </div>

      {/* Main actions */}
      {!loading && (
        <div className={`grid gap-3 ${taskCount === 2 ? 'sm:grid-cols-2' : 'grid-cols-1'}`}>
          {showCheckIn && (
            <Link
              to="/staff/operations"
              className="group relative overflow-hidden flex items-center gap-4 rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.06] p-5 transition-colors hover:bg-emerald-500/10"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-emerald-500/5 to-transparent blur-xl pointer-events-none" />

              <div className="flex items-center gap-4 relative z-10">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 shadow-[0_0_10px_rgba(16,185,129,0.1)] group-hover:scale-105 transition-all duration-300">
                  <ScanLine size={20} className="text-emerald-600" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 font-mono">
                    {assignedGates.length > 0 ? 'Assigned entry gate' : 'Tasks'}
                  </p>
                  <h3 className="mt-0.5 text-base font-extrabold text-slate-800 tracking-tight">Check in vehicle</h3>
                  <p className="text-xs text-slate-400 mt-0.5 font-medium">Scan plate / QR to admit a vehicle</p>
                </div>
              </div>
              <ArrowRight size={18} className="shrink-0 ml-auto text-emerald-600 transition-transform group-hover:translate-x-1" />
            </Link>
          )}
          {showCheckOut && (
            <Link
              to="/staff/checkout"
              className="group relative overflow-hidden flex items-center gap-4 rounded-2xl border border-sky-200 bg-sky-50/40 p-5 transition-colors hover:bg-sky-50"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-sky-500/5 to-transparent blur-xl pointer-events-none" />

              <div className="flex items-center gap-4 relative z-10">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-sky-200 bg-sky-50 shadow-[0_0_10px_rgba(249,115,22,0.1)] group-hover:scale-105 transition-all duration-300">
                  <ScanLine size={20} className="text-sky-600" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-600 font-mono">
                    {assignedGates.length > 0 ? 'Assigned exit gate' : 'Tasks'}
                  </p>
                  <h3 className="mt-0.5 text-base font-extrabold text-slate-800 tracking-tight">Check out vehicle</h3>
                  <p className="text-xs text-slate-400 mt-0.5 font-medium">Scan plate / QR → verify photo → charge &amp; release</p>
                </div>
              </div>
              <ArrowRight size={18} className="shrink-0 ml-auto text-sky-600 transition-transform group-hover:translate-x-1" />
            </Link>
          )}
          <Link
            to="/staff/parked"
            className="group relative overflow-hidden rounded-3xl border border-sky-100 bg-white p-5 transition-all duration-300 hover:border-sky-200 hover:bg-sky-50/50 hover:shadow-[0_8px_30px_rgba(255,255,255,0.05)] hover:scale-[1.02]"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-white/5 to-transparent blur-xl pointer-events-none" />

            <div className="flex items-center gap-4 relative z-10">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-sky-100 bg-sky-50/40 group-hover:scale-105 transition-all duration-300">
                <Car size={20} className="text-slate-600" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 font-mono">Monitoring</p>
                <h3 className="mt-0.5 text-base font-extrabold text-slate-800 tracking-tight">Parked vehicles</h3>
                <p className="text-xs text-slate-400 mt-0.5 font-medium">View parked vehicles (read-only)</p>
              </div>
            </div>
          </Link>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* Banners */}
      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-600">
          <AlertTriangle size={16} className="shrink-0" /> {error}
        </div>
      )}
      {!loading && openIncidents.length > 0 && (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/8 px-4 py-3.5 shadow-[0_0_15px_rgba(244,63,94,0.08)]">
          <ShieldAlert size={16} className="mt-0.5 shrink-0 text-rose-600" />
          <div>
            <p className="text-sm font-extrabold text-rose-700">
              {openIncidents.length} open incident{openIncidents.length > 1 ? 's' : ''}
            </p>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">Go to the Incidents tab to view details and handle them promptly.</p>
          </div>
        </div>
      )}

      {/* Main grid */}
      <div className="grid gap-6 xl:grid-cols-2">
        {/* Today's shifts */}
        <div className="rounded-3xl border border-sky-100 bg-white p-6 backdrop-blur-md shadow-sm relative overflow-hidden">
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-[radial-gradient(circle_at_center,rgba(20,184,166,0.03),transparent_60%)] pointer-events-none blur-2xl" />

          <div className="mb-5 flex items-center justify-between relative z-10">
            <div className="flex items-center gap-2">
              <CalendarClock size={16} className="text-teal-600" />
              <h2 className="text-sm font-bold text-slate-800 tracking-tight">Today's shift</h2>
            </div>
            <span className="rounded-md border border-sky-100 bg-sky-50/40 px-2 py-0.5 text-[11px] font-bold text-slate-400 font-mono">
              {loading ? '…' : todayShifts.length}
            </span>
          </div>

          <div className="space-y-3 relative z-10">
            {loading ? (
              <>
                <Skeleton className="h-16 w-full rounded-2xl" />
                <Skeleton className="h-16 w-full rounded-2xl" />
              </>
            ) : todayShifts.length === 0 ? (
              <div className="flex flex-col items-center gap-2.5 py-12 text-center border border-dashed border-sky-100 rounded-2xl bg-sky-50/20">
                <Circle size={28} className="text-slate-300 opacity-60" />
                <p className="text-sm text-slate-500 font-medium">No shifts today</p>
              </div>
            ) : (
              todayShifts.map((s) => (
                <div
                  key={s._id}
                  className="flex items-center gap-4 rounded-2xl border border-sky-100 bg-sky-50/30 px-4 py-3.5 transition-all duration-300 hover:border-teal-500/10 hover:bg-sky-50/50"
                >
                  <div className="w-20 shrink-0 text-center">
                    <p className="text-[11px] font-black tabular-nums text-teal-600 font-mono">
                      {s.shift.startTime}
                    </p>
                    <div className="mx-auto my-1.5 h-3.5 w-px bg-slate-200" />
                    <p className="text-[11px] font-black tabular-nums text-slate-500 font-mono">
                      {s.shift.endTime}
                    </p>
                  </div>
                  <div className="h-11 w-px shrink-0 bg-slate-200" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-800">
                      {s.shift.code} — {s.shift.name}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-slate-400 font-medium">{s.building.name}</p>
                    {s.gate ? (
                      <p className="mt-1.5 inline-flex items-center gap-1 rounded-md border border-teal-500/20 bg-teal-500/10 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-teal-600 font-mono">
                        <DoorOpen size={10} />
                        Gate {s.gate.code}
                        {s.gate.name ? ` · ${s.gate.name}` : ''}
                        {' · '}
                        {s.gate.direction === 'in' ? 'Entry gate' : s.gate.direction === 'out' ? 'Exit gate' : 'Two-way'}
                      </p>
                    ) : (
                      <p className="mt-1.5 text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono italic">No gate assigned</p>
                    )}
                    {s.note && (
                      <p className="mt-1 truncate text-[11px] text-slate-500 italic">Note: {s.note}</p>
                    )}
                  </div>
                  <StatusBadge status={s.status} />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Parked vehicles */}
        <div className="rounded-3xl border border-sky-100 bg-white p-6 backdrop-blur-md shadow-sm relative overflow-hidden">
          <div className="absolute bottom-0 right-0 w-48 h-48 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.03),transparent_60%)] pointer-events-none blur-2xl" />

          <div className="mb-5 flex items-center justify-between relative z-10">
            <div className="flex items-center gap-2">
              <Car size={16} className="text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-800 tracking-tight">Parked vehicles</h2>
            </div>
            <span className="rounded-md border border-sky-100 bg-sky-50/40 px-2 py-0.5 text-[11px] font-bold text-slate-400 font-mono">
              {loading ? '…' : activeSessions.length}
            </span>
          </div>

          <div className="space-y-3 relative z-10">
            {loading ? (
              <>
                <Skeleton className="h-16 w-full rounded-2xl" />
                <Skeleton className="h-16 w-full rounded-2xl" />
              </>
            ) : activeSessions.length === 0 ? (
              <div className="flex flex-col items-center gap-2.5 py-12 text-center border border-dashed border-sky-100 rounded-2xl bg-sky-50/20">
                <CheckCircle2 size={28} className="text-slate-300 opacity-60" />
                <p className="text-sm text-slate-500 font-medium">No vehicles parked</p>
              </div>
            ) : (
              activeSessions.slice(0, 5).map((session) => (
                <div
                  key={session._id}
                  className="flex items-center gap-3 rounded-2xl border border-sky-100 bg-sky-50/30 px-4 py-3.5 transition-all duration-300 hover:border-emerald-500/10 hover:bg-sky-50/50"
                >
                  <div className="flex h-9 min-w-[90px] items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/5 px-2.5 shadow-[0_0_10px_rgba(245,158,11,0.05)]">
                    <span className="font-mono text-xs font-black tracking-widest text-amber-700">
                      {session.plateNumber}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs text-slate-400">
                      {session.entryGate?.name ?? session.entryGate?.code ?? '—'}
                      {session.vehicleType ? ` · ${session.vehicleType.name}` : ''}
                    </p>
                    <p className="mt-1.5 text-xs font-bold text-sky-600">
                      {formatSlotLocation(session)}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-500 font-mono">
                      At {fmtTime(session.entryTime)}
                    </p>
                  </div>
                  <StatusBadge status={session.status} />
                </div>
              ))
            )}
            {!loading && activeSessions.length > 5 && (
              <p className="mt-3 text-center text-xs font-semibold text-slate-500">
                +{activeSessions.length - 5} more vehicles
              </p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
