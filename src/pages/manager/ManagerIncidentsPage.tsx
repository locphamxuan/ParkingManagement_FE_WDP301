import { useEffect, useState } from 'react';
import {
  Eye,
  Loader2,
  RefreshCw,
  Search,
  ShieldAlert,
} from 'lucide-react';
import { useBuildingContext } from '@/hooks/useBuildingContext';
import { managerApi, type Incident } from '@/services/manager/managerApi';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ResolveIncidentModal, type ResolveIncidentPayload } from '@/components/manager/incidents/ResolveIncidentModal';

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });

const SEVERITY_COLORS = {
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  high: 'bg-orange-50 text-orange-700 border-orange-200',
  critical: 'bg-rose-50 text-rose-700 border-rose-200',
};

const STATUS_LABELS = {
  open: 'Open',
  investigating: 'Investigating',
  escalated: 'Escalated',
  penalty_pending: 'Penalty Pending',
  resolved: 'Resolved',
  closed: 'Closed',
};

const STATUS_COLORS = {
  open: 'bg-slate-100 text-slate-700',
  investigating: 'bg-blue-50 text-blue-700 border-blue-100',
  escalated: 'bg-amber-50 text-amber-700 border-amber-100',
  penalty_pending: 'bg-rose-50 text-rose-700 border-rose-100',
  resolved: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  closed: 'bg-slate-200 text-slate-600',
};

const INCIDENT_TYPE_LABELS: Record<string, string> = {
  // Parking violations
  wrong_spot:          '🚫 Wrong spot / wrong row',
  wrong_vehicle_type:  '🚌 Wrong vehicle type (car/moto)',
  slot_occupied:       "🔒 Occupying another customer's slot",
  overstay:            '⏰ Overstaying limit (overstay)',
  // Facility / infrastructure
  facility_issue:      '🔧 Damaged parking equipment',
  gate_violation:      '🚪 Gate violation / skipped check-in/out',
  // Identification
  wrong_scan:          '📸 Plate mismatch / forged',
  plate_mismatch:      '🪪 Registered plate mismatch',
  // General incidents
  vehicle_damaged:     '🚗 Vehicle damaged on premises',
  payment_dispute:     '💳 Parking fee payment dispute',
  security:            '🛡️ Security concern',
  other:               '📋 Other / Unclassified',
};

export function ManagerIncidentsPage() {
  const { buildingId } = useBuildingContext();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Resolution Form State
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const fetchIncidents = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await managerApi.incidents.list(buildingId);
      setIncidents(res.data.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load incidents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, [buildingId]);

  const handleOpenResolve = (inc: Incident) => {
    setSelectedIncident(inc);
    setMessage(null);
  };

  const handleResolve = async (payload: ResolveIncidentPayload) => {
    if (!selectedIncident) return;
    setSaving(true);
    setMessage(null);
    try {
      await managerApi.incidents.resolve(buildingId, selectedIncident._id, payload);
      setMessage({ type: 'ok', text: 'Incident resolved successfully.' });
      fetchIncidents();
      setTimeout(() => setSelectedIncident(null), 1000);
    } catch (err) {
      setMessage({ type: 'err', text: err instanceof Error ? err.message : 'Resolve failed' });
    } finally {
      setSaving(false);
    }
  };

  const filtered = incidents
    .filter((inc) => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        (inc.code || '').toLowerCase().includes(q) ||
        (inc.reportedBy?.fullName || '').toLowerCase().includes(q) ||
        (inc.target || '').toLowerCase().includes(q) ||
        (inc.note || '').toLowerCase().includes(q)
      );
    })
    // Escalated (unregistered violator plate) and penalty_pending (awaiting checkout collection) need manager attention first.
    .sort((a, b) => {
      const weight = (s?: string) => (s === 'escalated' ? -2 : s === 'penalty_pending' ? -1 : 0);
      return weight(a.status) - weight(b.status);
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
              Shift Oversight
            </div>
            <h1 className="mt-2 text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <ShieldAlert size={20} className="text-blue-600 stroke-[2.5]" />
              User Incidents
            </h1>
            <p className="mt-1 text-xs font-bold text-slate-500">
              Manage and resolve complaints or issues reported by parking customers.
            </p>
          </div>
          <Button
            onClick={fetchIncidents}
            disabled={loading}
            variant="outline"
            className="self-start sm:self-center h-10 px-4 rounded-xl border-slate-200/80 bg-white/70 hover:bg-white text-slate-700 font-extrabold text-xs shadow-sm flex items-center gap-1.5"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            Refresh
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
              placeholder="Search code, reporter, target..."
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
            <p className="text-xs text-slate-500 italic py-10 text-center">No reported incidents found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-400">
                    <th className="py-2 text-left">Code</th>
                    <th className="py-2 text-left">Incident Type</th>
                    <th className="py-2 text-left">Reporter</th>
                    <th className="py-2 text-left">Target Info</th>
                    <th className="py-2 text-center">Status</th>
                    <th className="py-2 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((inc) => (
                    <tr key={inc._id} className="border-b border-slate-100/50 last:border-0 hover:bg-slate-50/20 transition-colors">
                      <td className="py-3 font-mono font-bold text-slate-800">
                        {inc.code}
                        <p className="text-[9px] text-slate-400 font-normal">{fmtTime(inc.createdAt || '')}</p>
                      </td>
                      <td className="py-3 text-slate-800 font-bold text-xs">
                        <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-black uppercase ${inc.severity ? SEVERITY_COLORS[inc.severity] : 'bg-slate-100'}`}>
                          {(inc.type && INCIDENT_TYPE_LABELS[inc.type]) || inc.type || 'Incident'}
                        </span>
                      </td>
                      <td className="py-3 text-slate-700 font-semibold text-xs">
                        {inc.reportedBy?.fullName}
                        <p className="text-[10px] text-slate-400 font-normal">{inc.reportedBy?.email}</p>
                      </td>
                      <td className="py-3 text-slate-600 text-xs font-medium">
                        {inc.target ? (
                          <span className="font-mono bg-slate-100/80 px-1.5 py-0.5 rounded text-[10px] font-bold">{inc.target}</span>
                        ) : (
                          <span className="text-slate-400 italic">No target plate/zone</span>
                        )}
                        {inc.note && <p className="text-[10px] text-slate-450 mt-1 truncate max-w-xs">{inc.note}</p>}
                      </td>
                      <td className="py-3 text-center">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${inc.status ? (STATUS_COLORS as Record<string, string>)[inc.status] : 'bg-slate-100'}`}>
                          {inc.status ? ((STATUS_LABELS as Record<string, string>)[inc.status] || inc.status) : '—'}
                        </span>
                      </td>
                      <td className="py-3 text-center">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleOpenResolve(inc)}
                          className="h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-blue-600 hover:border-blue-200 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 mx-auto shadow-sm"
                        >
                          <Eye size={12} />
                          Review
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

      {/* Resolution Dialog */}
      {selectedIncident && (
        <ResolveIncidentModal
          role="manager"
          buildingId={buildingId}
          incident={selectedIncident}
          saving={saving}
          message={message}
          onClose={() => setSelectedIncident(null)}
          onSubmit={handleResolve}
        />
      )}
    </div>
  );
}
