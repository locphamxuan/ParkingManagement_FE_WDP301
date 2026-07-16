import { useEffect, useState } from 'react';
import {
  Clock,
  Car,
  Bike,
  Search,
  Eye,
  Loader2,
  RefreshCw,
  ImageIcon,
} from 'lucide-react';
import { useBuildingContext } from '@/hooks/useBuildingContext';
import { managerApi, type ActiveSession } from '@/services/manager/managerApi';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });

export function ManagerActiveSessionsPage() {
  const { buildingId } = useBuildingContext();
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Detail Modal State
  const [selectedSession, setSelectedSession] = useState<ActiveSession | null>(null);

  const fetchActiveSessions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await managerApi.sessions.listActive(buildingId);
      setSessions(res.data.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load active sessions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveSessions();
  }, [buildingId]);

  const filtered = sessions.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      s.plateNumber.toLowerCase().includes(q) ||
      (s.vehicleBrand || '').toLowerCase().includes(q) ||
      (typeof s.slot === 'object' && s.slot?.code.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto md:mx-0">
      {/* Premium Header */}
      <div
        className="relative overflow-hidden rounded-3xl border border-blue-100/80 p-6 shadow-md"
        style={{
          background: 'linear-gradient(135deg, rgba(224,242,254,0.6) 0%, rgba(255,255,255,0.8) 50%, rgba(219,234,254,0.4) 100%)',
          backdropFilter: 'blur(16px)',
        }}
      >
        <div className="absolute -right-16 -top-16 h-36 w-36 rounded-full bg-[radial-gradient(circle_at_center,rgba(14,165,233,0.08),transparent_70%)] pointer-events-none blur-2xl" />
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-blue-600 text-[9px] font-black uppercase tracking-widest text-white shadow-sm font-mono">
              Live Operations
            </div>
            <h1 className="mt-2 text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Clock size={20} className="text-blue-600 stroke-[2.5]" />
              Active Parked Sessions
            </h1>
            <p className="mt-1 text-xs font-bold text-slate-500">
              Monitor currently parked vehicles, assigned slots, and entry logs inside the building.
            </p>
          </div>
          <Button
            onClick={fetchActiveSessions}
            disabled={loading}
            variant="outline"
            className="self-start sm:self-center h-10 px-4 rounded-xl border-slate-200/80 bg-white/70 hover:bg-white text-slate-700 font-extrabold text-xs shadow-sm flex items-center gap-1.5"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            Refresh list
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl border border-rose-200 bg-rose-50 text-xs font-bold text-rose-800">
          {error}
        </div>
      )}

      {/* Filter and Table Card */}
      <Card
        style={{
          background: 'rgba(255, 255, 255, 0.45)',
          border: '1px solid rgba(226, 232, 240, 0.8)',
          boxShadow: '0 4px 30px rgba(0, 0, 0, 0.015)',
          backdropFilter: 'blur(8px)',
        }}
        className="rounded-3xl overflow-hidden"
      >
        <CardContent className="p-6 space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <Input
              placeholder="Search plate, slot, or brand..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 rounded-xl border-slate-200 bg-white/70 focus:bg-white text-slate-800 text-xs font-semibold focus:ring-blue-500/20"
            />
          </div>

          {loading ? (
            <div className="flex h-[200px] items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-10 text-center">No active parking sessions found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-400">
                    <th className="py-2 text-left">Plate Number</th>
                    <th className="py-2 text-left">Vehicle Type</th>
                    <th className="py-2 text-left">Assigned Slot</th>
                    <th className="py-2 text-left">Entry Time</th>
                    <th className="py-2 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s) => (
                    <tr key={s._id} className="border-b border-slate-100/50 last:border-0 hover:bg-slate-50/20 transition-colors">
                      <td className="py-3 font-semibold text-slate-800">
                        {s.plateNumber}
                        {s.vehicleBrand && (
                          <p className="text-[10px] text-slate-400 font-medium">{s.vehicleBrand}</p>
                        )}
                      </td>
                      <td className="py-3 text-slate-655 font-bold text-xs">
                        <span className="inline-flex items-center gap-1">
                          {String(s.vehicleType).toLowerCase().includes('car') ? (
                            <Car size={13} className="text-blue-500" />
                          ) : (
                            <Bike size={13} className="text-sky-500" />
                          )}
                          {typeof s.vehicleType === 'object' ? s.vehicleType.name : s.vehicleType}
                        </span>
                      </td>
                      <td className="py-3 text-slate-800 font-extrabold text-xs">
                        {s.slot && typeof s.slot === 'object' ? (
                          <span className="inline-flex items-center rounded-lg bg-blue-50 border border-blue-100 px-2.5 py-1 text-blue-700 font-black">
                            {s.slot.code} {s.slot.floor && `· Floor ${s.slot.floor.name || s.slot.floor.code}`}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">No slot</span>
                        )}
                      </td>
                      <td className="py-3 text-slate-500 text-xs font-medium font-mono">
                        {fmtTime(s.entryTime)}
                      </td>
                      <td className="py-3 text-center">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedSession(s)}
                          className="h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-blue-600 hover:border-blue-200 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 mx-auto shadow-sm"
                        >
                          <Eye size={12} />
                          Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      {selectedSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-black text-slate-800 tracking-tight">Active Session Details</h3>
            <p className="text-xs font-semibold text-slate-400 mt-0.5">Plate: {selectedSession.plateNumber}</p>

            <div className="mt-5 space-y-4">
              {/* Photo comparisons if available */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Plate Photo</span>
                  <div className="aspect-[4/3] rounded-2xl border border-slate-100 bg-slate-50 flex items-center justify-center overflow-hidden shadow-inner">
                    {selectedSession.plateImage ? (
                      <img src={selectedSession.plateImage} alt="Plate" className="h-full w-full object-cover" />
                    ) : (
                      <ImageIcon size={20} className="text-slate-350" />
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Portrait Photo</span>
                  <div className="aspect-[4/3] rounded-2xl border border-slate-100 bg-slate-50 flex items-center justify-center overflow-hidden shadow-inner">
                    {selectedSession.portraitImage ? (
                      <img src={selectedSession.portraitImage} alt="Portrait" className="h-full w-full object-cover" />
                    ) : (
                      <ImageIcon size={20} className="text-slate-350" />
                    )}
                  </div>
                </div>
              </div>

              {/* Text metadata */}
              <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Building</span>
                  <span className="font-extrabold text-slate-800">
                    {typeof selectedSession.building === 'object' ? selectedSession.building.name : 'Current Building'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Vehicle Brand</span>
                  <span className="font-extrabold text-slate-800">{selectedSession.vehicleBrand || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Checked In At</span>
                  <span className="font-bold text-slate-700 font-mono">{fmtTime(selectedSession.entryTime)}</span>
                </div>
                {selectedSession.slot && typeof selectedSession.slot === 'object' && (
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Assigned Slot</span>
                    <span className="font-black text-blue-600">
                      Slot {selectedSession.slot.code} (Floor {selectedSession.slot.floor?.name || selectedSession.slot.floor?.code})
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Button
                onClick={() => setSelectedSession(null)}
                className="h-10 px-5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-black text-xs uppercase tracking-wider"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
