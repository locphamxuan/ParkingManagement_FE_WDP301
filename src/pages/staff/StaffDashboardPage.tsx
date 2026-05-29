import { useEffect, useMemo, useState } from 'react';
import {
  CalendarClock,
  Gauge,
  ShieldAlert,
  Ticket,
  Clock,
  Building2,
  Car,
  DoorOpen,
  AlertTriangle,
  CheckCircle2,
  Circle,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { StatusBadge } from '@/components/shared/StatusBadge';
import {
  staffApi,
  extractShifts,
  type MyShift,
  type ParkingSession,
  type StaffIncident,
} from '@/services/staff/staffApi';
import { useBuildingContext } from '@/hooks/useBuildingContext';

const todayStr = () => new Date().toISOString().slice(0, 10);

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function fmtDateFull() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

// ── Skeleton placeholder ───────────────────────────────────────────────────────
function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-white/10 ${className}`} />;
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ElementType;
  accent: string;   // tailwind border-color class
  bg: string;       // tailwind bg class
  loading?: boolean;
}

function StatCard({ label, value, icon: Icon, accent, bg, loading }: StatCardProps) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border ${accent} ${bg} p-5`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{label}</p>
          {loading ? (
            <Skeleton className="mt-2 h-9 w-14" />
          ) : (
            <p className="mt-1 text-4xl font-black tabular-nums text-white">{value}</p>
          )}
        </div>
        <div className={`rounded-xl border ${accent} bg-white/5 p-2.5`}>
          <Icon size={18} className="text-slate-300" />
        </div>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export function StaffDashboardPage() {
  const { building } = useBuildingContext();
  const [dashboard, setDashboard] = useState<any>(null);
  const [shifts, setShifts] = useState<MyShift[]>([]);
  const [sessions, setSessions] = useState<ParkingSession[]>([]);
  const [incidents, setIncidents] = useState<StaffIncident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const d = todayStr();
    const buildingId = building?._id;
    Promise.all([
      staffApi.getDashboard(),
      staffApi.getMyShifts({ from: d, to: d }),
      staffApi.getActiveSessions(),
      staffApi.incidents.list(buildingId),
    ])
      .then(([dashboardRes, shiftRes, sessionRes, incidentRes]) => {
        setDashboard((dashboardRes as any)?.data ?? dashboardRes);
        setShifts(extractShifts(shiftRes as any));
        setSessions(
          ((sessionRes as any)?.data?.items ?? (sessionRes as any)?.data ?? []) as ParkingSession[],
        );
        const incidentItems =
          (incidentRes as any)?.data?.items ?? (incidentRes as any)?.data ?? [];
        setIncidents(incidentItems as StaffIncident[]);
        setError(null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [building]);

  const activeSessions = useMemo(() => sessions.filter((s) => s.status === 'active'), [sessions]);
  const pendingSessions = useMemo(
    () => sessions.filter((s) => s.paymentStatus === 'pending'),
    [sessions],
  );
  const openIncidents = useMemo(
    () => incidents.filter((i) => ['open', 'investigating', 'escalated'].includes(i.status ?? '')),
    [incidents],
  );

  const stats: StatCardProps[] = [
    {
      label: "Today's Shifts",
      value: shifts.length,
      icon: CalendarClock,
      accent: 'border-orange-500/30',
      bg: 'bg-orange-500/5',
      loading,
    },
    {
      label: 'Active Sessions',
      value: activeSessions.length,
      icon: Gauge,
      accent: 'border-emerald-500/30',
      bg: 'bg-emerald-500/5',
      loading,
    },
    {
      label: 'Awaiting Payment',
      value: pendingSessions.length,
      icon: Ticket,
      accent: 'border-amber-500/30',
      bg: 'bg-amber-500/5',
      loading,
    },
    {
      label: 'Open Incidents',
      value: openIncidents.length,
      icon: ShieldAlert,
      accent: openIncidents.length > 0 ? 'border-rose-500/50' : 'border-slate-700',
      bg: openIncidents.length > 0 ? 'bg-rose-500/5' : 'bg-white/5',
      loading,
    },
  ];

  // ── No building warning ───────────────────────────────────────────────────────
  if (!loading && !building) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="max-w-sm rounded-2xl border border-amber-500/30 bg-amber-500/10 p-8 text-center">
          <Building2 size={36} className="mx-auto mb-3 text-amber-400" />
          <p className="text-base font-bold text-amber-300">No building selected</p>
          <p className="mt-1 text-sm text-slate-400">
            Please select a building from the left menu to begin your shift.
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* ── Hero ──────────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-white/8 bg-gradient-to-br from-slate-900 to-slate-900/80 p-6">
        {/* Subtle glow */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-orange-500/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-32 w-32 rounded-full bg-amber-500/8 blur-2xl" />

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-orange-500/25 bg-orange-500/10">
              <Building2 size={22} className="text-orange-400" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                Staff Portal
              </p>
              <h1 className="mt-0.5 text-2xl font-bold text-white">
                {building ? building.name : <Skeleton className="h-7 w-48" />}
              </h1>
              <p className="mt-1 text-sm text-slate-400">{fmtDateFull()}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {building?.operatingHours && (
              <div className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-400">
                <Clock size={12} />
                {building.operatingHours.open} – {building.operatingHours.close}
              </div>
            )}
            <StatusBadge status={building?.status ?? 'active'} />
          </div>
        </div>
      </div>

      {/* ── Stats ─────────────────────────────────────────────────────────────── */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* ── Error banner ──────────────────────────────────────────────────────── */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3">
          <AlertTriangle size={16} className="shrink-0 text-rose-400" />
          <p className="text-sm text-rose-300">{error}</p>
        </div>
      )}

      {/* ── Open incidents banner ──────────────────────────────────────────────── */}
      {!loading && openIncidents.length > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-500/8 px-4 py-3">
          <ShieldAlert size={16} className="mt-0.5 shrink-0 text-rose-400" />
          <div>
            <p className="text-sm font-semibold text-rose-300">
              {openIncidents.length} open incident{openIncidents.length > 1 ? 's' : ''}
            </p>
            <p className="text-xs text-slate-400">
              Go to Incidents to view details and resolve them.
            </p>
          </div>
        </div>
      )}

      {/* ── Main content grid ──────────────────────────────────────────────────── */}
      <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">

        {/* Shifts */}
        <div className="rounded-2xl border border-white/8 bg-slate-900/60 p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarClock size={16} className="text-orange-400" />
              <h2 className="text-sm font-bold text-white">Today's Shifts</h2>
            </div>
            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] font-semibold text-slate-400">
              {loading ? '…' : shifts.length}
            </span>
          </div>

          <div className="space-y-2">
            {loading ? (
              <>
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </>
            ) : shifts.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <Circle size={28} className="text-slate-700" />
                <p className="text-sm text-slate-500">No shifts scheduled today</p>
              </div>
            ) : (
              shifts.map((s) => (
                <div
                  key={s._id}
                  className="flex items-center gap-4 rounded-xl border border-white/6 bg-white/3 px-4 py-3"
                >
                  {/* Time block */}
                  <div className="w-20 shrink-0 text-center">
                    <p className="text-[11px] font-black tabular-nums text-orange-400">
                      {s.shift.startTime}
                    </p>
                    <div className="mx-auto my-0.5 h-3 w-px bg-slate-700" />
                    <p className="text-[11px] font-black tabular-nums text-slate-500">
                      {s.shift.endTime}
                    </p>
                  </div>

                  {/* Divider */}
                  <div className="h-10 w-px shrink-0 bg-white/8" />

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-white">
                      {s.shift.code} — {s.shift.name}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-slate-500">{s.building.name}</p>
                    {s.note ? (
                      <p className="mt-0.5 truncate text-[11px] italic text-slate-600">{s.note}</p>
                    ) : null}
                  </div>

                  <StatusBadge status={s.status} />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Active sessions */}
        <div className="rounded-2xl border border-white/8 bg-slate-900/60 p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Car size={16} className="text-emerald-400" />
              <h2 className="text-sm font-bold text-white">Active Parking Sessions</h2>
            </div>
            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] font-semibold text-slate-400">
              {loading ? '…' : activeSessions.length}
            </span>
          </div>

          <div className="space-y-2">
            {loading ? (
              <>
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </>
            ) : activeSessions.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <CheckCircle2 size={28} className="text-slate-700" />
                <p className="text-sm text-slate-500">No active sessions</p>
              </div>
            ) : (
              activeSessions.slice(0, 5).map((session) => (
                <div
                  key={session._id}
                  className="flex items-center gap-3 rounded-xl border border-white/6 bg-white/3 px-4 py-3"
                >
                  {/* Plate */}
                  <div className="flex h-9 min-w-[72px] items-center justify-center rounded-lg border border-amber-500/25 bg-amber-500/8 px-2">
                    <span className="text-xs font-black tracking-wide text-amber-300 font-mono">
                      {session.plateNumber}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs text-slate-400">
                      <DoorOpen size={11} className="mr-1 inline-block" />
                      {session.entryGate?.name ?? '—'}
                      {session.vehicleType
                        ? ` · ${session.vehicleType.name}`
                        : ''}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      Entry {fmtTime(session.checkIn)}
                    </p>
                  </div>

                  <StatusBadge status={session.paymentStatus} />
                </div>
              ))
            )}

            {!loading && activeSessions.length > 5 && (
              <p className="pt-1 text-center text-xs text-slate-500">
                +{activeSessions.length - 5} more sessions
              </p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
