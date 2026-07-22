import { useCallback, useEffect, useState } from 'react';
import { CalendarClock, Calendar, Clock, DoorOpen, BadgeAlert, Sparkles, Filter, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { staffApi, extractShifts, type MyShift } from '@/services/staff/staffApi';
import styles from './StaffShiftsPage.module.css';

export function StaffShiftsPage() {
  const [items, setItems] = useState<MyShift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const refresh = useCallback(() => {
    setLoading(true);
    staffApi
      .myShifts({ from: from || undefined, to: to || undefined })
      .then((res) => {
        setItems(extractShifts(res));
        setError(null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Load failed'))
      .finally(() => setLoading(false));
  }, [from, to]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const directionText = (d?: 'in' | 'out' | 'both') =>
    d === 'in' ? 'Entry gate' : d === 'out' ? 'Exit gate' : 'Two-way';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-5"
    >
      {/* Header Banner */}
      <section
        className={`relative overflow-hidden rounded-2xl p-5 ${styles.headerBanner}`}
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3.5">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${styles.headerIcon}`}>
              <CalendarClock className="text-sky-600" size={22} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-sky-500">Schedules</p>
              <h2 className="text-lg font-extrabold text-slate-800 leading-tight">My Shift Timeline</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Track your active assignments and dates
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

      {/* Date Filter Panel */}
      <div
        className={`rounded-2xl p-4 flex flex-wrap items-end gap-4 ${styles.filterPanel}`}
      >
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wide mr-2 mb-2 sm:mb-0">
          <Filter size={14} className="text-sky-500" />
          <span>Filters</span>
        </div>
        <div className="grid gap-1 flex-1 min-w-[140px]">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">From date</label>
          <input
            type="date"
            className="h-9 w-full rounded-xl border border-sky-100 bg-white px-3 text-xs text-slate-700 outline-none focus:ring-2 focus:ring-sky-500/20"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </div>
        <div className="grid gap-1 flex-1 min-w-[140px]">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">To date</label>
          <input
            type="date"
            className="h-9 w-full rounded-xl border border-sky-100 bg-white px-3 text-xs text-slate-700 outline-none focus:ring-2 focus:ring-sky-500/20"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>
        {(from || to) && (
          <Button
            variant="ghost"
            onClick={() => { setFrom(''); setTo(''); }}
            className="h-9 px-3 rounded-xl border border-rose-100 hover:bg-rose-50 text-rose-500 font-bold text-xs"
          >
            Reset
          </Button>
        )}
      </div>

      {/* Shift Timeline Section */}
      <div
        className={`relative overflow-hidden rounded-3xl p-5 md:p-6 ${styles.dataContainer}`}
      >
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-sky-400 via-sky-500 to-transparent" />

        <div className="mb-6">
          <h3 className="text-base font-extrabold text-slate-800 tracking-tight">Timeline Shifts</h3>
          <p className="text-xs text-slate-400 mt-0.5">Chronological log of shift duties assigned to you</p>
        </div>

        {loading ? (
          <p className="text-xs text-slate-400 py-10 text-center">Loading shift assignments...</p>
        ) : error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700">
            ⚠️ {error}
          </div>
        ) : items.length === 0 ? (
          <div className="py-12 text-center border border-dashed border-sky-100 rounded-2xl bg-sky-50/20 flex flex-col items-center justify-center">
            <div className="h-14 w-14 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center mb-3">
              <BadgeAlert size={24} className="text-sky-500" />
            </div>
            <h4 className="text-sm font-bold text-slate-700">No shifts scheduled</h4>
            <p className="text-xs text-slate-400 mt-1">There are no shifts matches the specified date range.</p>
          </div>
        ) : (
          <div className="relative border-l border-sky-150 pl-5 ml-2.5 space-y-6">
            <AnimatePresence>
              {items.map((s, idx) => {
                const workDate = new Date(s.workDate).toLocaleDateString('vi-VN', {
                  weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric'
                });
                return (
                  <motion.div
                    key={s._id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05, duration: 0.35 }}
                    className="relative"
                  >
                    {/* Circle Node */}
                    <span
                      className="absolute -left-[30px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full border-2 bg-white"
                      style={{
                        borderColor: s.status === 'active' ? '#0ea5e9' : s.status === 'completed' ? '#10b981' : '#94a3b8',
                      }}
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{
                          background: s.status === 'active' ? '#0ea5e9' : s.status === 'completed' ? '#10b981' : '#94a3b8',
                        }}
                      />
                    </span>

                    {/* Shift ID-Card style panel */}
                    <div
                      className={`relative overflow-hidden rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-all duration-200 hover:shadow-md ${styles.shiftCard}`}
                    >
                      <div className="flex items-start gap-3.5">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-sky-100 bg-sky-50">
                          <Sparkles size={16} className="text-sky-600" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-sky-500">
                            {workDate}
                          </p>
                          <h4 className="text-sm font-extrabold text-slate-800 tracking-tight">
                            {s.shift.code} — {s.shift.name}
                          </h4>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold text-slate-500">
                            <span className="flex items-center gap-1">
                              <Clock size={12} className="text-slate-400" />
                              <strong className="text-sky-600 font-bold">{s.shift.startTime} – {s.shift.endTime}</strong>
                            </span>
                            <span>
                              Building: <strong className="text-slate-700">{s.building.name}</strong>
                            </span>
                          </div>
                          {s.gate && (
                            <div className="inline-flex items-center gap-1.5 rounded-lg bg-sky-50 border border-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-700 mt-2">
                              <DoorOpen size={11} />
                              Gate {s.gate.code} · {directionText(s.gate.direction)}
                            </div>
                          )}
                          {s.note && (
                            <p className="text-[11px] italic text-slate-400 mt-1">Note: {s.note}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center self-start sm:self-center gap-2">
                        <StatusBadge status={s.status} />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
}
