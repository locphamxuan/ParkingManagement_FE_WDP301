import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCcw, CalendarCheck2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, type DataColumn } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useBuildingContext } from '@/hooks/useBuildingContext';
import { staffApi, type StaffReservation } from '@/services/staff/staffApi';

type FilterTab = 'all';

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All' },
];

// A successfully-placed reservation is shown as either "active" or "cancelled".
const isCancelledStatus = (s: StaffReservation['status']) => s === 'cancelled' || s === 'expired';
const displayStatus = (s: StaffReservation['status']) => (isCancelledStatus(s) ? 'cancelled' : 'active');

const fmtTime = (v?: string | null) =>
  v ? new Date(v).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' }) : '—';

export function StaffReservationsPage() {
  const { buildingId, building } = useBuildingContext();

  const [items, setItems]           = useState<StaffReservation[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [tab, setTab]               = useState<FilterTab>('all');
  const [query, setQuery]           = useState('');

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    const q: Record<string, string | undefined> = {};
    if (buildingId) q.buildingId = buildingId;
    staffApi
      .listReservations(q)
      .then((res) => {
        const rows = (res as any)?.data?.items ?? [];
        setItems(Array.isArray(rows) ? rows : []);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load reservations'))
      .finally(() => setLoading(false));
  }, [buildingId]);

  useEffect(() => {
    load();
    const timer = setInterval(load, 15_000);
    return () => clearInterval(timer);
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((r) => {
      const hay = [
        r.code ?? '',
        r.plateNumber ?? '',
        r.user?.fullName ?? '',
        r.user?.email ?? '',
      ].join(' ').toLowerCase();
      return hay.includes(q);
    });
  }, [items, query]);

  const columns: DataColumn<StaffReservation>[] = [
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
      key: 'vehicleType',
      title: 'Vehicle',
      render: (row) => (
        <span className="text-xs text-slate-300">
          {row.vehicleType ? `${row.vehicleType.code} — ${row.vehicleType.name}` : '—'}
        </span>
      ),
    },
    {
      key: 'slot',
      title: 'Floor / Slot',
      render: (row) => {
        const floor = (row.slot as any)?.floor;
        const floorLabel = floor?.code ?? floor?.name ?? null;
        const slotCode = row.slot?.code ?? null;
        return (
          <div className="text-xs">
            {floorLabel && (
              <p className="text-slate-400">Floor: <span className="font-bold text-white">{floorLabel}</span></p>
            )}
            <span className="rounded bg-white/5 px-2 py-0.5 font-bold text-white">
              {slotCode ?? '—'}
            </span>
          </div>
        );
      },
    },
    {
      key: 'startTime',
      title: 'Start Time',
      render: (row) => <span className="text-xs text-slate-300">{fmtTime(row.startTime)}</span>,
    },
    {
      key: 'fee',
      title: 'Amount Paid',
      render: (row) => (
        <span className="font-semibold text-emerald-300">
          {`${Number((row as any).amountPaid ?? 0).toLocaleString('en-US')} ₫`}
        </span>
      ),
    },
    {
      key: 'status',
      title: 'Status',
      render: (row) => <StatusBadge status={displayStatus(row.status)} />,
    },
  ];

  return (
    <div className="grid gap-6">
      {/* Header */}
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 shadow-sm">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <CalendarCheck2 size={22} className="text-orange-300" />
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-orange-300">
                Reservations
              </p>
              <h2 className="mt-0.5 text-xl font-semibold text-white">Reservation List</h2>
              <p className="mt-0.5 text-sm text-slate-300">
                {building ? `${building.code} · ${building.name}` : 'All buildings'}
              </p>
            </div>
          </div>
          <Button
            variant="secondary"
            onClick={load}
            className="gap-2 self-start rounded-xl border border-white/10 bg-white/5 text-white hover:bg-white/10 lg:self-auto"
          >
            <RefreshCcw size={14} /> Refresh
          </Button>
        </div>
      </section>

      {/* Filters */}
      <Card className="border-white/10 bg-white/5">
        <CardContent className="p-4 grid gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by code, plate, name, email..."
            className="h-9 w-full rounded-md border border-border bg-card px-3 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <div className="flex gap-2">
            {FILTER_TABS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={`rounded-full border px-4 py-1 text-xs font-bold transition ${
                  tab === key
                    ? 'border-orange-400/50 bg-orange-500/15 text-orange-300'
                    : 'border-border bg-muted/30 text-muted-foreground hover:border-orange-400/30'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle className="text-white">
            Reservations{filtered.length > 0 ? ` (${filtered.length})` : ''}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-slate-400">Loading...</p>
          ) : error ? (
            <p className="text-sm text-rose-300">{error}</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-slate-400">No reservations found.</p>
          ) : (
            <DataTable
              title={`Reservations (${filtered.length})`}
              rows={filtered}
              columns={columns}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
