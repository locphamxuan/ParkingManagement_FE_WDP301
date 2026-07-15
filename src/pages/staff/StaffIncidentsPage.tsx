import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowRight, CheckCircle2, Clock3, Plus, RefreshCw, ShieldAlert, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/common/StatusBadge';
import { useBuildingContext } from '@/hooks/useBuildingContext';
import { extractIncidents, staffApi, type StaffIncident } from '@/services/staff/staffApi';

type IncidentStatus = 'open' | 'investigating' | 'escalated' | 'resolved' | 'closed';

interface IncidentRow {
  id: string;
  type: string;
  building: string;
  severity: 'medium' | 'high' | 'critical';
  status: IncidentStatus;
  timestamp: string;
  note: string;
}

const SEVERITY_LABELS: Record<string, string> = {
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};

const SEVERITY_STYLES: Record<IncidentRow['severity'], { bg: string; border: string; text: string; led: string; glow: string }> = {
  critical: {
    bg: 'bg-rose-50',
    border: 'rgba(244,63,94,0.3)',
    text: 'text-rose-700',
    led: 'bg-rose-500',
    glow: '0 0 10px rgba(244,63,94,0.4)',
  },
  high: {
    bg: 'bg-amber-50',
    border: 'rgba(245,158,11,0.3)',
    text: 'text-amber-700',
    led: 'bg-amber-500',
    glow: '0 0 10px rgba(245,158,11,0.4)',
  },
  medium: {
    bg: 'bg-sky-50',
    border: 'rgba(14,165,233,0.2)',
    text: 'text-sky-700',
    led: 'bg-sky-500',
    glow: 'none',
  },
};

export function StaffIncidentsPage() {
  const { buildingId, building } = useBuildingContext();
  const [query, setQuery] = useState('');
  const [severity, setSeverity] = useState('all');
  const [items, setItems] = useState<IncidentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [incidentType, setIncidentType] = useState('');
  const [incidentTarget, setIncidentTarget] = useState('');
  const [incidentNote, setIncidentNote] = useState('');
  const [incidentMessage, setIncidentMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const mapIncident = (item: StaffIncident, index: number): IncidentRow => ({
    id: item.code || item._id || `INC-${1000 + index}`,
    type: item.type || 'Incident',
    building: item.building?.code || item.building?.name || building?.code || '—',
    severity: item.severity || 'medium',
    status: (item.status as IncidentStatus) || 'open',
    timestamp: item.createdAt
      ? new Date(item.createdAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })
      : '—',
    note: item.note || '—',
  });

  const refresh = useCallback(() => {
    setLoading(true);
    setError(null);
    staffApi.incidents
      .list(buildingId)
      .then((res) => {
        const apiItems = extractIncidents(res.data as StaffIncident[] | { items: StaffIncident[] });
        setItems(apiItems.map(mapIncident));
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load incidents');
        setItems([]);
      })
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildingId]);

  const createIncident = async () => {
    if (!incidentType.trim()) return;
    setIsCreating(true);
    setIncidentMessage(null);
    try {
      await staffApi.incidents.create({
        type: incidentType.trim(),
        target: incidentTarget.trim() || undefined,
        note: incidentNote.trim() || undefined,
        buildingId: buildingId || undefined,
      });
      setIncidentMessage({ type: 'ok', text: 'Incident ticket created successfully.' });
      setIncidentType('');
      setIncidentTarget('');
      setIncidentNote('');
      refresh();
    } catch (err) {
      setIncidentMessage({ type: 'err', text: err instanceof Error ? err.message : 'Failed to create incident' });
    } finally {
      setIsCreating(false);
    }
  };

  useEffect(() => {
    refresh();
  }, [refresh]);

  const filtered = useMemo(
    () =>
      items.filter((item) => {
        const matchQuery = `${item.id} ${item.type} ${item.building} ${item.note}`.toLowerCase().includes(query.toLowerCase());
        const matchSeverity = severity === 'all' || item.severity === severity;
        return matchQuery && matchSeverity;
      }),
    [items, query, severity]
  );

  const counts = useMemo(() => ({
    open: items.filter((i) => i.status === 'open').length,
    escalated: items.filter((i) => i.status === 'escalated').length,
    resolved: items.filter((i) => i.status === 'resolved').length,
  }), [items]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="grid gap-5"
    >
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
              <ShieldAlert className="text-sky-600" size={22} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-sky-500">Security</p>
              <h2 className="text-lg font-extrabold text-slate-800 leading-tight">Incident Management</h2>
              <p className="text-xs text-slate-500 mt-0.5">{building ? `${building.code} · ${building.name}` : 'All buildings'}</p>
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

      {/* Grid: Overview + Quick Report */}
      <section className="grid gap-4 lg:grid-cols-[1.15fr,0.85fr]">
        
        {/* Incident Overview Card */}
        <div
          className="relative overflow-hidden rounded-3xl p-5"
          style={{
            background: 'rgba(255,255,255,0.72)',
            border: '1px solid rgba(14,165,233,0.14)',
            boxShadow: '0 10px 30px rgba(14,165,233,0.05), inset 0 1px 0 rgba(255,255,255,0.9)',
            backdropFilter: 'blur(20px)',
          }}
        >
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-sky-400 via-sky-500 to-transparent" />
          <h3 className="text-sm font-extrabold text-slate-800 tracking-tight mb-4">Incident Overview</h3>
          
          <div className="grid gap-3 md:grid-cols-3">
            {[
              { label: 'Open Ticket', value: counts.open, border: 'border-rose-100', text: 'text-rose-600', bg: 'bg-rose-50' },
              { label: 'Escalated', value: counts.escalated, border: 'border-amber-100', text: 'text-amber-600', bg: 'bg-amber-50' },
              { label: 'Resolved', value: counts.resolved, border: 'border-emerald-100', text: 'text-emerald-600', bg: 'bg-emerald-50' },
            ].map((cnt) => (
              <div
                key={cnt.label}
                className="rounded-2xl p-4 flex flex-col justify-between"
                style={{
                  background: 'rgba(255,255,255,0.5)',
                  border: '1px solid rgba(14,165,233,0.08)',
                  boxShadow: '0 2px 8px rgba(14,165,233,0.02)',
                }}
              >
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{cnt.label}</span>
                <p className="mt-2 text-2xl font-black text-slate-700 leading-none">{cnt.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-2 border-t border-sky-50 pt-4">
            <StatusBadge status="open" />
            <StatusBadge status="investigating" />
            <StatusBadge status="escalated" />
            <StatusBadge status="resolved" />
          </div>
        </div>

        {/* Quick Report Incident Form */}
        <div
          className="relative overflow-hidden rounded-3xl p-5"
          style={{
            background: 'rgba(255,255,255,0.72)',
            border: '1px solid rgba(14,165,233,0.14)',
            boxShadow: '0 10px 30px rgba(14,165,233,0.05), inset 0 1px 0 rgba(255,255,255,0.9)',
            backdropFilter: 'blur(20px)',
          }}
        >
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-rose-400 via-rose-500 to-transparent" />
          <h3 className="text-sm font-extrabold text-slate-800 tracking-tight mb-4">Quick Report</h3>

          <div className="grid gap-3">
            <Input
              value={incidentType}
              onChange={(e) => setIncidentType(e.target.value)}
              placeholder="Incident type: lost ticket, broken barrier, wrong parking..."
              className="h-10 rounded-xl border-sky-100 text-xs bg-white focus:border-sky-500"
            />
            <Input
              value={incidentTarget}
              onChange={(e) => setIncidentTarget(e.target.value)}
              placeholder="Plate / gate / area"
              className="h-10 rounded-xl border-sky-100 text-xs bg-white focus:border-sky-500"
            />
            <Input
              value={incidentNote}
              onChange={(e) => setIncidentNote(e.target.value)}
              placeholder="Initial notes..."
              className="h-10 rounded-xl border-sky-100 text-xs bg-white focus:border-sky-500"
            />
            <Button
              type="button"
              onClick={createIncident}
              disabled={isCreating || !incidentType.trim()}
              className="gap-2 h-10 bg-gradient-to-r from-rose-500 to-amber-500 text-white font-extrabold hover:brightness-110 disabled:opacity-60 rounded-xl shadow-md"
            >
              <Plus size={14} /> Create incident ticket
            </Button>
            {incidentMessage && (
              <motion.p
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                className={`text-xs font-bold text-center mt-1 ${incidentMessage.type === 'ok' ? 'text-emerald-600' : 'text-rose-600'}`}
              >
                {incidentMessage.text}
              </motion.p>
            )}
          </div>
        </div>
      </section>

      {/* Error alert */}
      {!loading && error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-800">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-bold text-rose-900">Unable to load incidents</p>
              <p className="mt-0.5 text-rose-700">{error}</p>
            </div>
            <Button onClick={refresh} className="gap-1.5 h-8 rounded-lg bg-sky-50 border border-sky-100 text-sky-700 text-xs">
              <RefreshCw size={12} /> Retry
            </Button>
          </div>
        </div>
      )}

      {/* Incidents Data List */}
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
          <h3 className="text-base font-extrabold text-slate-800 tracking-tight">Active Incident tickets</h3>
          <p className="text-xs text-slate-400 mt-0.5">Logs of building alerts, errors, and problems</p>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4 border-b border-sky-50 pb-4">
          <div className="relative w-full md:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by ID, type, notes..."
              className="h-10 w-full rounded-xl border border-sky-100 bg-white pl-9 pr-3 text-xs text-slate-700 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-sky-500/20"
            />
          </div>
          <select
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
            className="h-10 rounded-xl border border-sky-100 bg-white px-3 text-xs text-slate-700 outline-none font-bold"
          >
            <option value="all">All severities</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>

        {loading ? (
          <p className="text-xs text-slate-400 py-10 text-center">Loading incident data...</p>
        ) : (
          <div className="grid gap-3">
            {filtered.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-sky-100 bg-sky-50/20 p-8 text-center flex flex-col items-center justify-center">
                <CheckCircle2 size={28} className="text-slate-300 mb-2 animate-bounce" />
                <p className="text-xs text-slate-400 font-medium">All clear. No active incidents found.</p>
              </div>
            ) : (
              filtered.map((incident) => {
                const sevStyle = SEVERITY_STYLES[incident.severity] || SEVERITY_STYLES.medium;
                return (
                  <motion.div
                    key={incident.id}
                    whileHover={{ y: -3 }}
                    className="flex flex-col gap-3 rounded-2xl p-4 lg:flex-row lg:items-center lg:justify-between"
                    style={{
                      background: 'rgba(255,255,255,0.6)',
                      border: '1px solid rgba(14,165,233,0.1)',
                      boxShadow: '0 2px 10px rgba(14,165,233,0.03)',
                    }}
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-mono font-black text-slate-800 text-xs">{incident.id}</p>
                        
                        {/* Glowing LED badge for urgent warning severity */}
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-lg border ${sevStyle.bg} px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide ${sevStyle.text}`}
                          style={{
                            borderColor: sevStyle.border,
                            boxShadow: sevStyle.glow,
                          }}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${sevStyle.led}`} />
                          {SEVERITY_LABELS[incident.severity] ?? incident.severity}
                        </span>

                        <StatusBadge status={incident.status} />
                      </div>
                      <p className="mt-2 text-xs font-bold text-slate-700">{incident.type} · {incident.building}</p>
                      <p className="mt-1 text-xs text-slate-500 font-medium leading-relaxed">{incident.note}</p>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0 self-start lg:self-center">
                      <div className="rounded-xl border border-sky-100 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-500 flex items-center gap-1">
                        <Clock3 size={12} className="text-sky-500" /> {incident.timestamp}
                      </div>
                      <Button variant="secondary" size="sm" className="gap-1 h-8 rounded-lg bg-sky-50 border border-sky-100 text-sky-700 font-bold text-xs hover:bg-sky-100/70">
                        <ArrowRight size={12} /> Details
                      </Button>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Guide notes at the bottom */}
      <section className="grid gap-4 md:grid-cols-3">
        {[
          { label: 'Open', description: 'New incident reported — needs logging and investigating on site.', icon: AlertTriangle, color: '#f43f5e', bg: 'rgba(244,63,94,0.08)', border: 'rgba(244,63,94,0.2)' },
          { label: 'In Progress', description: 'The security crew is active on scene investigating details.', icon: ShieldAlert, color: '#fb923c', bg: 'rgba(251,146,60,0.08)', border: 'rgba(251,146,60,0.2)' },
          { label: 'Resolved', description: 'Issue handled, cleared, and system logs re-checked.', icon: CheckCircle2, color: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)' },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="flex items-start gap-3.5 rounded-2xl p-4"
              style={{
                background: 'rgba(255,255,255,0.7)',
                border: '1px solid rgba(14,165,233,0.1)',
                boxShadow: '0 2px 10px rgba(14,165,233,0.03)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <div
                className="rounded-xl p-2.5 shrink-0 flex items-center justify-center border"
                style={{ background: item.bg, borderColor: item.border, color: item.color }}
              >
                <Icon size={16} />
              </div>
              <div>
                <p className="font-extrabold text-slate-800 text-xs">{item.label}</p>
                <p className="mt-1 text-slate-500 font-semibold text-xs leading-normal">{item.description}</p>
              </div>
            </div>
          );
        })}
      </section>
    </motion.div>
  );
}
