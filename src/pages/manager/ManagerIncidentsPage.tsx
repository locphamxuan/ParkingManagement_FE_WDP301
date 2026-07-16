import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
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
  resolved: 'Resolved',
  closed: 'Closed',
};

const STATUS_COLORS = {
  open: 'bg-slate-100 text-slate-700',
  investigating: 'bg-blue-50 text-blue-700 border-blue-100',
  escalated: 'bg-amber-50 text-amber-700 border-amber-100',
  resolved: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  closed: 'bg-slate-200 text-slate-600',
};

const INCIDENT_TYPE_LABELS: Record<string, string> = {
  slot_occupied: 'Slot Occupied',
  slot_blocked: 'Slot Blocked',
  vehicle_damaged: 'Vehicle Damaged',
  facility_issue: 'Facility Issue',
  wrong_scan: 'Wrong Plate Scan',
  payment_dispute: 'Payment Dispute',
  lost_ticket: 'Lost Ticket/QR',
  security: 'Security Concern',
  other: 'Other/General',
};

export function ManagerIncidentsPage() {
  const { buildingId } = useBuildingContext();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Resolution Form State
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [status, setStatus] = useState('resolved');
  const [resolutionNote, setResolutionNote] = useState('');
  const [penalizeViolator, setPenalizeViolator] = useState(false);
  const [violatorPlate, setViolatorPlate] = useState('');
  const [penaltyFee, setPenaltyFee] = useState('50000');
  const [paymentMethod, setPaymentMethod] = useState('cash');
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
    setStatus(inc.status === 'open' || inc.status === 'investigating' ? 'resolved' : inc.status);
    setResolutionNote(inc.resolutionNote || '');
    setViolatorPlate(inc.violatorPlate || '');
    setPenalizeViolator(false);
    setMessage(null);
  };

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIncident) return;
    setSaving(true);
    setMessage(null);
    try {
      const payload: any = {
        status,
        resolutionNote: resolutionNote.trim(),
        violatorPlate: violatorPlate.trim(),
      };

      if (penalizeViolator) {
        payload.action = 'penalize_violator';
        payload.penaltyFee = Number(penaltyFee);
        payload.paymentMethod = paymentMethod;
      }

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

  const filtered = incidents.filter((inc) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      inc.code.toLowerCase().includes(q) ||
      (inc.reportedBy?.fullName || '').toLowerCase().includes(q) ||
      (inc.target || '').toLowerCase().includes(q) ||
      (inc.note || '').toLowerCase().includes(q)
    );
  });

  const isOccupiedType = selectedIncident?.type === 'slot_occupied';

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
                        <p className="text-[9px] text-slate-400 font-normal">{fmtTime(inc.createdAt)}</p>
                      </td>
                      <td className="py-3 text-slate-800 font-bold text-xs">
                        <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-black uppercase ${SEVERITY_COLORS[inc.severity] || 'bg-slate-100'}`}>
                          {INCIDENT_TYPE_LABELS[inc.type] || inc.type}
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
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${STATUS_COLORS[inc.status] || 'bg-slate-100'}`}>
                          {STATUS_LABELS[inc.status] || inc.status}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg overflow-y-auto max-h-[90vh] rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-black text-slate-800 tracking-tight">Resolve Incident {selectedIncident.code}</h3>
            <p className="text-xs font-semibold text-slate-400 mt-0.5">Reporter: {selectedIncident.reportedBy?.fullName}</p>

            {message && (
              <div className={`mt-4 p-3 rounded-xl border text-xs font-bold ${message.type === 'ok' ? 'bg-emerald-50 border-emerald-250 text-emerald-800' : 'bg-rose-50 border-rose-250 text-rose-800'}`}>
                {message.text}
              </div>
            )}

            <form onSubmit={handleResolve} className="mt-4 space-y-4">
              <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 space-y-2 text-xs">
                <div>
                  <span className="text-slate-450 font-bold block uppercase tracking-wider text-[9px] mb-1">Customer Description</span>
                  <p className="text-slate-800 font-semibold italic bg-white p-2.5 rounded-xl border border-slate-100">{selectedIncident.note || '(No descriptive note provided)'}</p>
                </div>
                {selectedIncident.target && (
                  <div className="flex justify-between pt-1">
                    <span className="text-slate-550 font-semibold">Incident Target (Plate/Zone)</span>
                    <span className="font-extrabold font-mono text-slate-800">{selectedIncident.target}</span>
                  </div>
                )}
                {selectedIncident.slot && typeof selectedIncident.slot === 'object' && (
                  <div className="flex justify-between">
                    <span className="text-slate-550 font-semibold">Related Slot</span>
                    <span className="font-extrabold text-blue-600">Slot {selectedIncident.slot.code}</span>
                  </div>
                )}
              </div>

              {/* Status Select */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-450 block">Incident Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-800 outline-none focus:border-blue-500"
                >
                  <option value="investigating">Investigating</option>
                  <option value="escalated">Escalated</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              {/* Resolution Note */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-450 block">Resolution Note</label>
                <textarea
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  placeholder="Describe details of the resolution/investigation..."
                  className="w-full min-h-[80px] p-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>

              {/* Penalize Violator (for occupied slot) */}
              {isOccupiedType && (
                <div className="rounded-2xl border border-rose-100 bg-rose-50/30 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="penalize"
                      checked={penalizeViolator}
                      onChange={(e) => setPenalizeViolator(e.target.checked)}
                      className="h-4 w-4 rounded border-rose-300 text-rose-600 focus:ring-rose-500"
                    />
                    <label htmlFor="penalize" className="text-xs font-black text-rose-800 select-none">
                      Penalize Offending Vehicle (Force Checkout)
                    </label>
                  </div>

                  {penalizeViolator && (
                    <div className="grid gap-3 pt-1">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[9px] font-black uppercase tracking-wider text-rose-600 block mb-1">Violator Plate</label>
                          <Input
                            placeholder="E.g. 59G2-038.80"
                            value={violatorPlate}
                            onChange={(e) => setViolatorPlate(e.target.value)}
                            className="h-9 rounded-lg border-rose-200 bg-white text-xs font-bold text-slate-800"
                            required={penalizeViolator}
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-black uppercase tracking-wider text-rose-600 block mb-1">Fine Amount (VND)</label>
                          <Input
                            type="number"
                            placeholder="E.g. 50000"
                            value={penaltyFee}
                            onChange={(e) => setPenaltyFee(e.target.value)}
                            className="h-9 rounded-lg border-rose-200 bg-white text-xs font-bold text-slate-800"
                            required={penalizeViolator}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[9px] font-black uppercase tracking-wider text-rose-600 block mb-1">Payment Method</label>
                        <select
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="h-9 w-full rounded-lg border border-rose-200 bg-white px-2 text-xs font-bold text-slate-800 outline-none"
                        >
                          <option value="cash">Cash (Staff collects cash)</option>
                          <option value="wallet">Wallet (Deduct from user wallet)</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2.5">
                <Button
                  type="button"
                  onClick={() => setSelectedIncident(null)}
                  variant="outline"
                  className="h-10 px-5 rounded-xl border-slate-200 bg-white text-slate-600 text-xs font-bold hover:bg-slate-50"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="h-10 px-5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-650 text-white font-extrabold text-xs uppercase tracking-wider shadow-sm"
                >
                  {saving ? <Loader2 size={12} className="animate-spin" /> : 'Apply Resolution'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
