import { useCallback, useEffect, useState } from 'react';
import { RefreshCw, Car, MapPin, Clock, CircleDollarSign } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useBuildingContext } from '@/hooks/useBuildingContext';
import { useAssignedGates } from '@/hooks/staff/useAssignedGates';
import { LicensePlate } from '@/components/common/LicensePlate';
import { staffApi, type ParkingSession } from '@/services/staff/staffApi';
import styles from '@/styles/modules/StaffSessionsPage.module.css';

const fmtTime = (s?: string | null) =>
  s ? new Date(s).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '—';
const fmtDate = (s?: string | null) =>
  s ? new Date(s).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '';

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
        className={`relative overflow-hidden rounded-2xl p-5 ${styles.headerBanner}`}
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3.5">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${styles.headerIcon}`}>
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
          className={`relative overflow-hidden rounded-2xl p-5 ${styles.statCard}`}
        >
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-sky-400 via-sky-500 to-transparent" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Entries Today</p>
          <p className="mt-2 text-3xl font-black text-sky-600">{loading ? '—' : items.length}</p>
        </div>
      </div>

      {/* Data Container */}
      <div
        className={`relative overflow-hidden rounded-3xl p-5 md:p-6 ${styles.dataContainer}`}
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
                className={`flex flex-col gap-2 rounded-xl p-3.5 ${styles.entryCard}`}
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

function CheckOutHistory({ buildingId }: { buildingId: string }) {
  const [items, setItems] = useState<ParkingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!buildingId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await staffApi.sessions.myCheckouts(buildingId);
      const raw = (res as any)?.data;
      setItems(raw?.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load checkout history');
    } finally {
      setLoading(false);
    }
  }, [buildingId]);

  useEffect(() => {
    void refresh();
    const timer = setInterval(() => void refresh(), 30_000);
    return () => clearInterval(timer);
  }, [refresh]);

  const totalCollected = items.reduce((acc, cur) => acc + (cur.fee || 0), 0);

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <section
        className={`relative overflow-hidden rounded-2xl p-5 ${styles.headerBanner}`}
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3.5">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${styles.headerIcon}`}>
              <CircleDollarSign className="text-sky-600" size={22} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-sky-500">History & Revenue</p>
              <h2 className="text-lg font-extrabold text-slate-800 leading-tight">Check-out History & Shift Revenue</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Vehicles checked out today {fmtDate(new Date().toISOString())}
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

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div
          className={`relative overflow-hidden rounded-2xl p-5 ${styles.statCard}`}
        >
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-400 via-emerald-500 to-transparent" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Check-outs Today</p>
          <p className="mt-2 text-3xl font-black text-emerald-600">{loading ? '—' : items.length}</p>
        </div>

        <div
          className={`relative overflow-hidden rounded-2xl p-5 ${styles.statCard}`}
        >
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-sky-400 via-sky-500 to-transparent" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Shift Total Revenue Collected</p>
          <p className="mt-2 text-3xl font-black text-sky-600">
            {loading ? '—' : `${totalCollected.toLocaleString('vi-VN')} đ`}
          </p>
        </div>
      </div>

      {/* Data Container */}
      <div
        className={`relative overflow-hidden rounded-3xl p-5 md:p-6 ${styles.dataContainer}`}
      >
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-sky-400 via-sky-500 to-transparent" />
        <div className="mb-4">
          <h3 className="text-base font-extrabold text-slate-800 tracking-tight">Check-out Logs</h3>
          <p className="text-xs text-slate-400 mt-0.5">Records of all processed vehicle check-outs today</p>
        </div>

        {loading ? (
          <p className="text-xs text-slate-400 py-10 text-center">Loading check-out records...</p>
        ) : items.length === 0 ? (
          <div className="py-12 text-center border border-dashed border-sky-100 rounded-2xl bg-sky-50/20">
            <Car size={32} className="mx-auto mb-2 text-slate-300 animate-pulse" />
            <p className="text-sm text-slate-400 font-medium">No vehicles checked out today yet.</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {items.map((s) => (
              <motion.div
                key={s._id}
                whileHover={{ y: -3 }}
                className={`flex flex-col gap-2 rounded-xl p-3.5 ${styles.entryCard}`}
              >
                <div className="flex items-center justify-between">
                  <LicensePlate plateNumber={s.plateNumber} />
                  <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 font-mono">
                    {s.fee ? `${s.fee.toLocaleString('vi-VN')} đ` : 'Free'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs border-t border-sky-50 pt-2.5 mt-1 font-semibold text-slate-500">
                  <span className="flex items-center gap-1">
                    <Clock size={12} className="text-sky-500" />
                    Out: <strong className="text-slate-700">{fmtTime(s.exitTime)}</strong>
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin size={12} className="text-sky-500" />
                    Exit Gate: <strong className="text-slate-700">{(s.exitGate as any)?.code ?? '—'}</strong>
                  </span>
                  <span>
                    Method: <strong className="text-slate-700 uppercase font-mono">{s.paymentMethod ?? 'cash'}</strong>
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

  if (!showCheckOut) {
    return <CheckInHistory buildingId={buildingId} />;
  }

  return <CheckOutHistory buildingId={buildingId} />;
}
