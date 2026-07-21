import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarCheck2, CheckCircle2, RefreshCcw, XCircle, Search, Calendar, BadgeAlert } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { DataTable, type DataColumn } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { useBuildingContext } from '@/hooks/useBuildingContext';
import { staffApi, type StaffReservation } from '@/services/staff/staffApi';
import { LicensePlate } from '@/components/common/LicensePlate';

const fmtTime = (v?: string | null) =>
  v ? new Date(v).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : '—';

const fmtMoney = (n?: number | null) =>
  n != null ? `${n.toLocaleString('vi-VN')} ₫` : '—';

const STATUS_LABELS: Record<StaffReservation['status'], string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  checked_in: 'Checked in',
  completed: 'Completed',
  cancelled: 'Cancelled',
  expired: 'Expired',
};

export function StaffReservationsPage() {
  const { buildingId, building } = useBuildingContext();

  const [items, setItems] = useState<StaffReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    const q: Record<string, string | undefined> = {};
    if (buildingId) q.buildingId = buildingId;
    staffApi
      .listReservations(q)
      .then((res) => {
        const rows = (res as { data?: { items?: StaffReservation[] } })?.data?.items ?? [];
        setItems(Array.isArray(rows) ? rows : []);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load reservations'))
      .finally(() => setLoading(false));
  }, [buildingId]);

  const handleCheckIn = useCallback(async (code: string, id: string) => {
    setActionLoading((prev) => ({ ...prev, [id]: true }));
    setActionError(null);
    try {
      await (staffApi as any).reservations.checkIn(code);
      load();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Check-in failed');
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: false }));
    }
  }, [load]);

  const handleExpire = useCallback(async (id: string) => {
    setActionLoading((prev) => ({ ...prev, [id]: true }));
    setActionError(null);
    try {
      await (staffApi as any).reservations.expire(id);
      load();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: false }));
    }
  }, [load]);

  useEffect(() => {
    load();
    const timer = setInterval(load, 15_000);
    return () => clearInterval(timer);
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((r) =>
      [r.code ?? '', r.plateNumber ?? '', r.user?.fullName ?? '', r.user?.email ?? '']
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }, [items, query]);

  const columns: DataColumn<StaffReservation>[] = [
    {
      key: 'code',
      title: 'Reservation code',
      render: (row) => <span className="font-mono text-xs font-black text-sky-600 tracking-wide">{row.code ?? '—'}</span>,
    },
    {
      key: 'user',
      title: 'Customer',
      render: (row) =>
        row.user ? (
          <div>
            <p className="font-bold text-slate-750 text-xs">{row.user.fullName ?? '—'}</p>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">{row.user.email ?? ''}</p>
          </div>
        ) : (
          <span className="text-slate-400 text-xs">—</span>
        ),
    },
    {
      key: 'plateNumber',
      title: 'Plate',
      render: (row) => row.plateNumber ? (
        <LicensePlate plateNumber={row.plateNumber} />
      ) : (
        <span className="text-slate-400">—</span>
      ),
    },
    {
      key: 'vehicleType',
      title: 'Vehicle type',
      render: (row) => (
        <span className="text-xs font-semibold text-slate-500">
          {row.vehicleType ? `${row.vehicleType.name}` : '—'}
        </span>
      ),
    },
    {
      key: 'slot',
      title: 'Floor / Slot',
      render: (row) => {
        const floor = (row.slot as { floor?: { code?: string; name?: string } } | null)?.floor;
        const floorLabel = floor?.code ?? floor?.name ?? null;
        const slotCode = row.slot?.code ?? null;
        return (
          <div className="flex items-center gap-1.5 flex-wrap">
            {floorLabel ? (
              <span className="rounded-lg border border-sky-100 bg-sky-50 px-2.5 py-0.5 text-[10px] font-bold text-sky-700 shadow-sm">
                Floor {floorLabel}
              </span>
            ) : null}
            {slotCode ? (
              <span className="rounded-lg border border-emerald-100 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 shadow-sm">
                Slot {slotCode}
              </span>
            ) : (
              !floorLabel && <span className="text-slate-400 text-xs">—</span>
            )}
          </div>
        );
      },
    },
    {
      key: 'startTime',
      title: 'Entry time',
      render: (row) => <span className="text-xs font-medium text-slate-500">{fmtTime(row.startTime)}</span>,
    },
    {
      key: 'fee',
      title: 'Deposit',
      render: (row) => (
        <span className="font-extrabold text-sky-600 text-xs">
          {fmtMoney(row.amountPaid ?? row.fee)}
        </span>
      ),
    },
    {
      key: 'status',
      title: 'Status',
      render: (row) => (
        <div className="flex flex-col gap-0.5">
          <StatusBadge status={row.status} />
          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">{STATUS_LABELS[row.status] ?? row.status}</span>
        </div>
      ),
    },
    {
      key: '_id',
      title: 'Actions',
      render: (row) => {
        const busy = actionLoading[row._id];
        if (row.status === 'confirmed') {
          return (
            <Button
              variant="secondary"
              size="sm"
              disabled={busy}
              onClick={() => row.code && handleCheckIn(row.code, row._id)}
              className="gap-1.5 text-xs h-7 px-2.5 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-700 hover:bg-emerald-100/70 font-bold"
            >
              <CheckCircle2 size={12} />
              {busy ? '...' : 'Check-in'}
            </Button>
          );
        }
        if (row.status === 'expired' || row.status === 'pending') {
          return (
            <Button
              variant="ghost"
              size="sm"
              disabled={busy}
              onClick={() => handleExpire(row._id)}
              className="gap-1.5 text-xs h-7 px-2.5 rounded-lg text-rose-500 hover:bg-rose-50 border border-rose-100/30 font-bold"
            >
              <XCircle size={12} />
              {busy ? '...' : 'Expire'}
            </Button>
          );
        }
        return <span className="text-xs text-slate-400">—</span>;
      },
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="grid gap-5"
    >
      {actionError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">
          ⚠️ {actionError}
        </div>
      )}

      {/* Header Banner */}
      <section
        className="relative overflow-hidden rounded-2xl p-5"
        style={{
          background: 'linear-gradient(135deg, rgba(224,242,254,0.7) 0%, rgba(255,255,255,0.75) 50%, rgba(219,234,254,0.5) 100%)',
          border: '1px solid rgba(14,165,233,0.18)',
          boxShadow: '0 4px 24px rgba(14,165,233,0.06), inset 0 1px 0 rgba(255,255,255,0.9)',
          backdropFilter: 'blur(16px)',
        }}
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
              style={{
                background: 'linear-gradient(135deg, #e0f2fe, #bae6fd)',
                border: '1px solid rgba(14,165,233,0.22)',
                boxShadow: '0 4px 12px rgba(14,165,233,0.12)',
              }}>
              <CalendarCheck2 className="text-sky-600" size={22} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-sky-500">Reservations</p>
              <h2 className="text-lg font-extrabold text-slate-800 leading-tight">Reservation List</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {building ? `${building.code} · ${building.name}` : 'All buildings'}
              </p>
            </div>
          </div>
          <Button
            onClick={load}
            className="gap-2 h-9 rounded-xl border border-sky-100 bg-sky-50 text-sky-700 hover:bg-sky-100/70 font-bold text-xs self-start lg:self-auto"
          >
            <RefreshCcw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
          </Button>
        </div>
      </section>

      {/* Quick Stats Grid */}
      <section className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Total Reservations', value: items.length, icon: Calendar, border: 'border-sky-100', text: 'text-sky-600', bg: 'bg-sky-50' },
          { label: 'Confirmed', value: items.filter((i) => i.status === 'confirmed').length, icon: CheckCircle2, border: 'border-emerald-100', text: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Checked in', value: items.filter((i) => i.status === 'checked_in').length, icon: CalendarCheck2, border: 'border-indigo-100', text: 'text-indigo-600', bg: 'bg-indigo-50' },
        ].map((m) => (
          <div
            key={m.label}
            className="relative overflow-hidden rounded-2xl p-4 flex items-center justify-between"
            style={{
              background: 'rgba(255,255,255,0.7)',
              border: '1px solid rgba(14,165,233,0.1)',
              boxShadow: '0 2px 12px rgba(14,165,233,0.03)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{m.label}</p>
              <p className={`mt-2 text-2xl font-black ${m.text}`}>{loading ? '–' : m.value}</p>
            </div>
            <span className={`flex h-10 w-10 items-center justify-center rounded-xl border ${m.border} ${m.bg}`}>
              <m.icon size={18} className={m.text} />
            </span>
          </div>
        ))}
      </section>

      {/* Filter and Search */}
      <div
        className="rounded-2xl p-3.5"
        style={{
          background: 'rgba(255,255,255,0.6)',
          border: '1px solid rgba(14,165,233,0.1)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by reservation code, license plate, customer name, email..."
            className="h-10 w-full rounded-xl border border-sky-100 bg-white pl-9 pr-3 text-xs text-slate-700 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
          />
        </div>
      </div>

      {/* Data Table Wrapper */}
      <div
        className="relative overflow-hidden rounded-3xl p-5 md:p-6"
        style={{
          background: 'rgba(255,255,255,0.72)',
          border: '1px solid rgba(14,165,233,0.14)',
          boxShadow: '0 10px 30px rgba(14,165,233,0.05), inset 0 1px 0 rgba(255,255,255,0.9)',
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* Top border line */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-sky-400 via-sky-500 to-transparent" />

        <div className="mb-4">
          <h3 className="text-base font-extrabold text-slate-800 tracking-tight">Reservations</h3>
          <p className="text-xs text-slate-400 mt-0.5">Manage booked parking slots</p>
        </div>

        {loading ? (
          <p className="text-xs text-slate-400 py-10 text-center">Loading reservation data...</p>
        ) : error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700">
            <p>{error}</p>
            <Button onClick={load} className="mt-3 gap-2 text-xs rounded-lg bg-sky-50 border border-sky-100 text-sky-700">
              <RefreshCcw size={13} /> Retry
            </Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center border border-dashed border-sky-100 rounded-2xl bg-sky-50/20 flex flex-col items-center justify-center">
            {/* Elegant empty placeholder state */}
            <div className="h-16 w-16 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center mb-3">
              <BadgeAlert size={26} className="text-sky-500" />
            </div>
            <h4 className="text-sm font-bold text-slate-700">No Reservations Found</h4>
            <p className="text-xs text-slate-400 mt-1">There are no reservation records matches the query.</p>
          </div>
        ) : (
          <DataTable
            title={`Reservations (${filtered.length})`}
            rows={filtered}
            columns={columns}
          />
        )}
      </div>
    </motion.div>
  );
}
