import { useCallback, useEffect, useMemo, useState } from 'react';
import { DollarSign, Filter, Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { DataTable, type DataColumn } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useBuildingContext } from '@/hooks/useBuildingContext';
import { staffApi, type ParkingSession, type StaffReservation } from '@/services/staff/staffApi';

type PaymentEntry =
  | { kind: 'session'; data: ParkingSession }
  | { kind: 'reservation'; data: StaffReservation };

const fmtCurrency = (n: number | null | undefined) =>
  n != null ? `${n.toLocaleString('en-US')} ₫` : '—';

const fmtTime = (s: string | null | undefined) =>
  s ? new Date(s).toLocaleString('en-US') : '—';

export function StaffSessionsPage() {
  const { building, buildingId } = useBuildingContext();
  const [sessions, setSessions] = useState<ParkingSession[]>([]);
  const [reservations, setReservations] = useState<StaffReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<'all' | 'session' | 'reservation'>('all');
  const [query, setQuery] = useState('');

  const refresh = useCallback(() => {
    setLoading(true);
    const q: Record<string, string | undefined> = {};
    if (buildingId) q.buildingId = buildingId;
    Promise.all([
      staffApi.getActiveSessions(),
      staffApi.listReservations(q),
    ])
      .then(([sessRes, resRes]) => {
        const sessRows = (sessRes as any)?.data?.items ?? (sessRes as any)?.data ?? [];
        const resRows = (resRes as any)?.data?.items ?? [];
        setSessions(Array.isArray(sessRows) ? sessRows : []);
        setReservations(Array.isArray(resRows) ? resRows : []);
        setError(null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [buildingId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Only show paid sessions and completed/checked-in reservations
  const paidSessions = useMemo(
    () => sessions.filter((s) => s.paymentStatus === 'paid'),
    [sessions],
  );
  const completedReservations = useMemo(
    () => reservations.filter((r) => ['checked_in', 'completed'].includes(r.status)),
    [reservations],
  );

  const summary = useMemo(
    () => [
      { label: 'Paid Sessions', value: paidSessions.length },
      { label: 'Completed Reservations', value: completedReservations.length },
      {
        label: 'Total Revenue',
        value: fmtCurrency(
          paidSessions.reduce((sum, s) => sum + (s.fee ?? 0), 0) +
            completedReservations.reduce((sum, r) => sum + (r.fee ?? 0), 0),
        ),
      },
    ],
    [paidSessions, completedReservations],
  );

  const sessionColumns: DataColumn<ParkingSession>[] = [
    { key: 'plateNumber', title: 'Plate' },
    {
      key: 'vehicleType',
      title: 'Vehicle',
      render: (row) =>
        row.vehicleType ? `${row.vehicleType.name} (${row.vehicleType.code})` : '—',
    },
    {
      key: 'floor',
      title: 'Floor',
      render: (row) => (row as any).slot?.floor?.name ?? '—',
    },
    {
      key: 'slot',
      title: 'Slot',
      render: (row) => (row as any).slot?.code ?? '—',
    },
    { key: 'entryGate', title: 'Gate', render: (row) => row.entryGate?.name ?? '—' },
    { key: 'checkIn', title: 'Entry', render: (row) => fmtTime(row.checkIn) },
    { key: 'checkOut', title: 'Exit', render: (row) => fmtTime(row.checkOut) },
    { key: 'fee', title: 'Amount', render: (row) => fmtCurrency(row.fee) },
    {
      key: 'paymentMethod',
      title: 'Method',
      render: (row) => row.paymentMethod?.toUpperCase() ?? '—',
    },
    {
      key: 'paymentStatus',
      title: 'Payment',
      render: (row) => <StatusBadge status={row.paymentStatus} />,
    },
  ];

  const reservationColumns: DataColumn<StaffReservation>[] = [
    {
      key: 'code',
      title: 'Code',
      render: (row) => (
        <span className="font-mono text-xs font-bold text-orange-300">{row.code ?? '—'}</span>
      ),
    },
    {
      key: 'user',
      title: 'Customer',
      render: (row) =>
        row.user ? (
          <div>
            <p className="font-semibold text-white">{row.user.fullName ?? '—'}</p>
            <p className="text-xs text-slate-400">{row.user.email ?? ''}</p>
          </div>
        ) : (
          <span className="text-slate-500">—</span>
        ),
    },
    {
      key: 'plateNumber',
      title: 'Plate',
      render: (row) => (
        <span className="font-mono font-semibold text-white">{row.plateNumber ?? '—'}</span>
      ),
    },
    {
      key: 'slot',
      title: 'Slot',
      render: (row) => (
        <span className="rounded bg-white/5 px-2 py-0.5 text-xs font-bold text-white">
          {row.slot?.code ?? '—'}
        </span>
      ),
    },
    { key: 'startTime', title: 'Start', render: (row) => fmtTime(row.startTime) },
    { key: 'fee', title: 'Amount', render: (row) => fmtCurrency(row.fee) },
    {
      key: 'status',
      title: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
  ];

  const lowerQuery = query.trim().toLowerCase();

  const filteredSessions = useMemo(
    () =>
      paidSessions.filter((s) => {
        if (!lowerQuery) return true;
        return `${s.plateNumber} ${s.entryGate?.name ?? ''} ${s.vehicleType?.name ?? ''}`
          .toLowerCase()
          .includes(lowerQuery);
      }),
    [paidSessions, lowerQuery],
  );

  const filteredReservations = useMemo(
    () =>
      completedReservations.filter((r) => {
        if (!lowerQuery) return true;
        return [r.code ?? '', r.plateNumber ?? '', r.user?.fullName ?? '', r.user?.email ?? '']
          .join(' ')
          .toLowerCase()
          .includes(lowerQuery);
      }),
    [completedReservations, lowerQuery],
  );

  return (
    <div className="grid gap-6">
      {/* Header */}
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-950 via-slate-950 to-emerald-950/40 p-6 shadow-[0_22px_54px_rgba(15,23,42,0.45)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(16,185,129,0.14),transparent_22%),radial-gradient(circle_at_82%_14%,rgba(34,211,238,0.10),transparent_18%)]" />
        <div className="relative z-10 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-emerald-300">
              <DollarSign size={12} /> Payment Tracking
            </div>
            <h2 className="mt-3 text-3xl font-semibold text-white">
              {building ? building.name : 'Payment Tracking'}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              Track all successful payments — direct parking sessions and advance reservations.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge status="paid" />
            <StatusBadge status="completed" />
          </div>
        </div>
      </section>

      {/* Summary cards */}
      <section className="grid gap-3 md:grid-cols-3">
        {summary.map((card) => (
          <Card key={card.label} className="border-white/10 bg-white/5">
            <CardContent className="p-5">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                {card.label}
              </p>
              <p className="mt-2 text-3xl font-semibold text-white">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* Search and type filter */}
      <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by plate, gate, name..."
            className="h-11 w-full rounded-xl border border-white/10 bg-slate-950/50 pl-9 pr-3 text-sm text-white outline-none placeholder:text-slate-500"
          />
        </div>
        <div className="flex gap-2">
          {(
            [
              { key: 'all', label: 'All' },
              { key: 'session', label: 'Direct Parking' },
              { key: 'reservation', label: 'Reservations' },
            ] as const
          ).map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTypeFilter(key)}
              className={`rounded-full border px-4 py-1 text-xs font-bold transition ${
                typeFilter === key
                  ? 'border-emerald-400/50 bg-emerald-500/15 text-emerald-300'
                  : 'border-white/10 bg-white/5 text-slate-400 hover:border-emerald-400/30'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-slate-400">
          Loading...
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 p-6 text-sm text-rose-200">
          {error}
        </div>
      ) : (
        <div className="space-y-5">
          {/* Direct parking sessions */}
          {(typeFilter === 'all' || typeFilter === 'session') && (
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-emerald-300">
                <Filter size={12} /> Direct Parking Payments ({filteredSessions.length})
              </div>
              {filteredSessions.length === 0 ? (
                <Card className="border-white/10 bg-white/5">
                  <CardContent className="p-6 text-sm text-slate-400">
                    No paid direct parking sessions.
                  </CardContent>
                </Card>
              ) : (
                <DataTable
                  title={`Paid Sessions (${filteredSessions.length})`}
                  rows={filteredSessions}
                  columns={sessionColumns}
                />
              )}
            </div>
          )}

          {/* Reservation payments */}
          {(typeFilter === 'all' || typeFilter === 'reservation') && (
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-orange-400/20 bg-orange-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-orange-300">
                <Filter size={12} /> Reservation Payments ({filteredReservations.length})
              </div>
              {filteredReservations.length === 0 ? (
                <Card className="border-white/10 bg-white/5">
                  <CardContent className="p-6 text-sm text-slate-400">
                    No completed reservation payments.
                  </CardContent>
                </Card>
              ) : (
                <DataTable
                  title={`Reservations (${filteredReservations.length})`}
                  rows={filteredReservations}
                  columns={reservationColumns}
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
