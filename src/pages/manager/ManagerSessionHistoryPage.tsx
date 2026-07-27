import { useCallback, useEffect, useState } from 'react';
import { History, Search, RefreshCcw, Car, MapPin, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useBuildingContext } from '@/hooks/useBuildingContext';
import { managerApi, type ParkingSession } from '@/services/manager/managerApi';
import { LicensePlate } from '@/components/common/LicensePlate';

const fmtTime = (value?: string | null) =>
  value ? new Date(value).toLocaleString('vi-VN') : '—';

const fmtMoney = (n?: number | null) =>
  n != null ? `${n.toLocaleString('vi-VN')} đ` : '0 đ';

const fmtDuration = (from?: string | null, to?: string | null) => {
  if (!from) return '—';
  const endTime = to ? new Date(to).getTime() : Date.now();
  const mins = Math.max(0, Math.floor((endTime - new Date(from).getTime()) / 60000));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

export function ManagerSessionHistoryPage() {
  const { buildingId } = useBuildingContext();
  const [sessions, setSessions] = useState<ParkingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!buildingId) return;
    setLoading(true);
    setError(null);
    try {
      const q: Record<string, string> = { page: String(page), limit: '20' };
      if (statusFilter !== 'all') q.status = statusFilter;
      if (searchTerm.trim()) q.plate = searchTerm.trim();

      const res = await managerApi.sessions.listHistory(buildingId, q);
      const data = (res as any)?.data;
      setSessions(data?.items ?? []);
      setTotalPages(data?.pagination?.totalPages ?? 1);
      setTotalCount(data?.pagination?.total ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history');
    } finally {
      setLoading(false);
    }
  }, [buildingId, page, statusFilter, searchTerm]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-sky-100 bg-gradient-to-br from-white via-sky-50/10 to-indigo-50/20 p-6 shadow-md">
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-sky-600 text-[9px] font-black uppercase tracking-widest text-white shadow-sm font-mono">
              Operations & Logs
            </div>
            <h1 className="mt-2 text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <History size={20} className="text-sky-600 stroke-[2.5]" />
              Vehicle Session History
            </h1>
            <p className="mt-1 text-xs font-bold text-slate-500">
              Complete records of all checked-in and checked-out vehicles in this building.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={refresh}
            className="h-11 px-5 rounded-xl border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-black text-xs uppercase tracking-wider shadow-sm transition-all duration-200"
          >
            <RefreshCcw size={13} className={`mr-1.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
          <Input
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            placeholder="Search by license plate..."
            className="pl-10 h-10 rounded-xl border-slate-200 text-xs font-semibold"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
            <Filter size={14} /> Status:
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none"
          >
            <option value="all">All statuses ({totalCount})</option>
            <option value="active">🟢 Active (Parked)</option>
            <option value="completed">🏁 Completed (Checked out)</option>
            <option value="cancelled">❌ Cancelled</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-800">
          ⚠️ {error}
        </div>
      )}

      {/* Data Table */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm overflow-hidden">
        {loading ? (
          <p className="text-xs text-slate-400 py-16 text-center">Loading session records...</p>
        ) : sessions.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
            <Car size={36} className="mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-bold text-slate-500">No session records found.</p>
            <p className="text-xs text-slate-400 mt-1">Try adjusting your search query or status filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  <th className="pb-3 pl-2">Vehicle / Plate</th>
                  <th className="pb-3">Slot / Floor</th>
                  <th className="pb-3">Entry Time</th>
                  <th className="pb-3">Exit Time</th>
                  <th className="pb-3">Duration</th>
                  <th className="pb-3">Fee & Method</th>
                  <th className="pb-3 text-right pr-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {sessions.map((s) => (
                  <tr key={s._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 pl-2">
                      <div className="flex items-center gap-2">
                        <LicensePlate plateNumber={s.plateNumber} />
                        {s.vehicleBrand && (
                          <span className="text-[10px] text-slate-400 font-mono">({s.vehicleBrand})</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5">
                      <div className="flex items-center gap-1">
                        <MapPin size={12} className="text-sky-500" />
                        <span>{s.slot?.code ?? '—'}</span>
                        <span className="text-slate-400 text-[10px]">
                          ({(s.slot as any)?.floor?.name ?? (s.slot as any)?.floor?.code ?? '—'})
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 text-slate-600">{fmtTime(s.entryTime)}</td>
                    <td className="py-3.5 text-slate-600">{fmtTime(s.exitTime)}</td>
                    <td className="py-3.5 font-mono font-bold text-slate-800">
                      {fmtDuration(s.entryTime, s.exitTime)}
                    </td>
                    <td className="py-3.5">
                      <div className="font-bold text-emerald-600">{fmtMoney(s.fee)}</div>
                      <div className="text-[10px] uppercase font-mono text-slate-400">{s.paymentMethod ?? '—'}</div>
                    </td>
                    <td className="py-3.5 text-right pr-2">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          s.status === 'completed'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : s.status === 'active'
                            ? 'bg-sky-50 text-sky-700 border border-sky-200 animate-pulse'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-4 text-xs font-bold text-slate-500">
            <span>Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="h-8 px-3 rounded-lg text-xs"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="h-8 px-3 rounded-lg text-xs"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
