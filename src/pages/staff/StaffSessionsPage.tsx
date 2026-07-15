import { useCallback, useEffect, useState } from 'react';
import { Banknote, Wallet, QrCode, CircleDollarSign, RefreshCw, Car, MapPin, Clock, ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useBuildingContext } from '@/hooks/useBuildingContext';
import { useAssignedGates } from '@/hooks/staff/useAssignedGates';
import { LicensePlate } from '@/components/common/LicensePlate';
import { staffApi, type ShiftRevenueSummary, type ParkingSession } from '@/services/staff/staffApi';

const fmtMoney = (n?: number | null) => (n != null ? `${n.toLocaleString('vi-VN')} ₫` : '—');
const fmtTime = (s?: string | null) =>
  s ? new Date(s).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '—';
const fmtDate = (s?: string | null) =>
  s ? new Date(s).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '';

const METHOD_LABELS: Record<string, string> = {
  cash: 'Cash',
  wallet: 'Wallet',
  qr: 'Bank transfer',
  payos: 'Bank transfer',
  card: 'Card',
};

function CheckInHistory({ buildingId }: { buildingId: string }) {
  const [items, setItems] = useState<ParkingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!buildingId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await staffApi.sessions.myCheckIns(buildingId);
      const raw = (res as any)?.data;
      setItems(raw?.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history');
    } finally {
      setLoading(false);
    }
  }, [buildingId]);

  useEffect(() => {
    void refresh();
    const timer = setInterval(() => void refresh(), 30_000);
    return () => clearInterval(timer);
  }, [refresh]);

  return (
    <div className="space-y-5">
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
              <Car className="text-sky-600" size={22} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-sky-500">History Log</p>
              <h2 className="text-lg font-extrabold text-slate-800 leading-tight">Entry History</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Vehicles admitted today {fmtDate(new Date().toISOString())}
              </p>
            </div>
          </div>
          <Button
            onClick={refresh}
            className="gap-2 h-9 rounded-xl border border-sky-100 bg-sky-50 text-sky-700 hover:bg-sky-100/70 font-bold text-xs self-start lg:self-auto"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
          </Button>
        </div>
      </section>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">
          ⚠️ {error}
        </div>
      )}

      {/* Stats Card */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div
          className="relative overflow-hidden rounded-2xl p-5"
          style={{
            background: 'linear-gradient(135deg, rgba(14,165,233,0.1) 0%, rgba(255,255,255,0.7) 100%)',
            border: '1px solid rgba(14,165,233,0.15)',
            boxShadow: '0 4px 16px rgba(14,165,233,0.04)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-sky-400 via-sky-500 to-transparent" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Entries Today</p>
          <p className="mt-2 text-3xl font-black text-sky-600">{loading ? '—' : items.length}</p>
        </div>
      </div>

      {/* Data Container */}
      <div
        className="relative overflow-hidden rounded-3xl p-5 md:p-6"
        style={{
          background: 'rgba(255,255,255,0.72)',
          border: '1px solid rgba(14,165,233,0.14)',
          boxShadow: '0 10px 30px rgba(14,165,233,0.05), inset 0 1px 0 rgba(255,255,255,0.9)',
          backdropFilter: 'blur(20px)',
        }}
      >
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-sky-400 via-sky-500 to-transparent" />
        <div className="mb-4">
          <h3 className="text-base font-extrabold text-slate-800 tracking-tight">Entries Logs</h3>
          <p className="text-xs text-slate-400 mt-0.5">Records of all checked-in vehicles during this shift</p>
        </div>

        {loading ? (
          <p className="text-xs text-slate-400 py-10 text-center">Loading entry records...</p>
        ) : items.length === 0 ? (
          <div className="py-12 text-center border border-dashed border-sky-100 rounded-2xl bg-sky-50/20">
            <Car size={32} className="mx-auto mb-2 text-slate-300 animate-pulse" />
            <p className="text-sm text-slate-400 font-medium">No vehicles admitted in this shift yet.</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {items.map((s) => (
              <motion.div
                key={s._id}
                whileHover={{ y: -3 }}
                className="flex flex-col gap-2 rounded-xl p-3.5"
                style={{
                  background: 'rgba(255,255,255,0.6)',
                  border: '1px solid rgba(14,165,233,0.1)',
                  boxShadow: '0 2px 10px rgba(14,165,233,0.03)',
                }}
              >
                <div className="flex items-center justify-between">
                  <LicensePlate plateNumber={s.plateNumber} />
                  <div className="flex items-center gap-1 text-[11px] text-slate-400 font-semibold">
                    <Clock size={12} />
                    {fmtTime(s.entryTime)}
                  </div>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs border-t border-sky-50 pt-2.5 mt-1 font-semibold text-slate-500">
                  <span className="flex items-center gap-1">
                    <MapPin size={12} className="text-sky-500" />
                    Gate: <strong className="text-slate-700">{s.entryGate?.code ?? '—'}</strong>
                  </span>
                  <span>
                    Floor: <strong className="text-slate-700">{(s.slot as any)?.floor?.name ?? (s.slot as any)?.floor?.code ?? '—'}</strong>
                  </span>
                  <span>
                    Slot: <strong className="text-slate-700">{s.slot?.code ?? '—'}</strong>
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function StaffSessionsPage() {
  const { buildingId } = useBuildingContext();
  const { showCheckOut } = useAssignedGates();
  const [data, setData] = useState<ShiftRevenueSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!buildingId || !showCheckOut) return;
    setLoading(true);
    setError(null);
    try {
      const res = await staffApi.sessions.myShiftRevenue(buildingId);
      setData((res as { data?: ShiftRevenueSummary })?.data ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load shift revenue');
    } finally {
      setLoading(false);
    }
  }, [buildingId, showCheckOut]);

  useEffect(() => {
    if (!showCheckOut) return;
    void refresh();
    const timer = setInterval(() => void refresh(), 30_000);
    return () => clearInterval(timer);
  }, [refresh, showCheckOut]);

  if (!showCheckOut) {
    return <CheckInHistory buildingId={buildingId} />;
  }

  const stats = [
    { label: 'Cash Payment', value: data?.byMethod.cash ?? 0, icon: Banknote, border: 'border-emerald-100', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Wallet Pay', value: data?.byMethod.wallet ?? 0, icon: Wallet, border: 'border-indigo-100', color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Bank QR Code', value: data?.byMethod.online ?? 0, icon: QrCode, border: 'border-sky-100', color: 'text-sky-600', bg: 'bg-sky-50' },
  ];

  return (
    <div className="space-y-5">
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
              <CircleDollarSign className="text-sky-600" size={22} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-sky-500">Revenue</p>
              <h2 className="text-lg font-extrabold text-slate-800 leading-tight">Shift Revenue</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Fees collected on exit — today {fmtDate(data?.date)}
              </p>
            </div>
          </div>
          <Button
            onClick={refresh}
            className="gap-2 h-9 rounded-xl border border-sky-100 bg-sky-50 text-sky-700 hover:bg-sky-100/70 font-bold text-xs self-start lg:self-auto"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
          </Button>
        </div>
      </section>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">
          ⚠️ {error}
        </div>
      )}

      {/* Main KPI Grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div
          className="relative overflow-hidden rounded-2xl p-5"
          style={{
            background: 'linear-gradient(135deg, rgba(14,165,233,0.12) 0%, rgba(255,255,255,0.7) 100%)',
            border: '1px solid rgba(14,165,233,0.16)',
            boxShadow: '0 4px 16px rgba(14,165,233,0.04)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-sky-400 via-sky-500 to-transparent" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Collected Today</p>
          <p className="mt-2 text-3xl font-black text-sky-600">{loading ? '—' : fmtMoney(data?.total)}</p>
        </div>
        <div
          className="relative overflow-hidden rounded-2xl p-5"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.7) 100%)',
            border: '1px solid rgba(14,165,233,0.1)',
            boxShadow: '0 2px 12px rgba(14,165,233,0.03)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-400 via-emerald-500 to-transparent" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Number of Releases</p>
          <p className="mt-2 text-3xl font-black text-slate-700">{loading ? '—' : (data?.count ?? 0)}</p>
        </div>
      </div>

      {/* Payment methods - Credit card styles */}
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={s.label}
              whileHover={{ y: -4, scale: 1.02 }}
              className="relative overflow-hidden rounded-2xl p-4 flex items-center justify-between"
              style={{
                background: 'rgba(255,255,255,0.75)',
                border: '1px solid rgba(14,165,233,0.1)',
                boxShadow: '0 2px 12px rgba(14,165,233,0.03), inset 0 1px 0 rgba(255,255,255,0.9)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{s.label}</p>
                <p className="mt-2 text-xl font-extrabold text-slate-800">{loading ? '—' : fmtMoney(s.value)}</p>
              </div>
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${s.border} ${s.bg}`}>
                <Icon size={16} className={s.color} />
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* History Transactions List */}
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
          <h3 className="text-base font-extrabold text-slate-800 tracking-tight">Collected Transactions</h3>
          <p className="text-xs text-slate-400 mt-0.5">List of checkout invoices processed in this shift</p>
        </div>

        {loading ? (
          <p className="text-xs text-slate-400 py-10 text-center">Loading transactions...</p>
        ) : !data || data.items.length === 0 ? (
          <div className="py-12 text-center border border-dashed border-sky-100 rounded-2xl bg-sky-50/20">
            <CircleDollarSign size={32} className="mx-auto mb-2 text-slate-300" />
            <p className="text-sm text-slate-400 font-medium">No collections in this shift yet.</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {data.items.map((it) => (
              <motion.div
                key={it._id}
                whileHover={{ y: -2 }}
                className="flex items-center justify-between rounded-xl p-3.5"
                style={{
                  background: 'rgba(255,255,255,0.6)',
                  border: '1px solid rgba(14,165,233,0.1)',
                  boxShadow: '0 2px 10px rgba(14,165,233,0.03)',
                }}
              >
                <div className="flex items-center gap-3">
                  <LicensePlate plateNumber={it.plateNumber ?? ''} />
                  <span className="inline-flex items-center gap-1 rounded-lg bg-sky-50 border border-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-700">
                    {METHOD_LABELS[it.method] ?? it.method}
                  </span>
                </div>
                <div className="text-right">
                  <p className="font-mono font-extrabold text-emerald-600 flex items-center gap-0.5 justify-end">
                    <ArrowUpRight size={13} className="text-emerald-500" />
                    {fmtMoney(it.amount)}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5 font-semibold">{fmtTime(it.createdAt)}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
