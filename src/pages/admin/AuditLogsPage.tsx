import { useMemo, useState } from 'react';
import {
  Search,
  ShieldAlert,
  FileText,
  Info,
  ShieldCheck,
  Activity,
} from 'lucide-react';
import { DataTable, type DataColumn } from '@/components/common/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CustomSelect } from '@/components/ui/select';
import { useAdminDataset } from '@/hooks/admin/useAdminDataset';
import type { AuditLog } from '@/types';

const TARGET_LABELS: Record<string, string> = {
  users: 'Users',
  buildings: 'Buildings',
  floors: 'Floors',
  gates: 'Gates',
  parking_slots: 'Parking slots',
  vehicle_types: 'Vehicle types',
  price_policies: 'Price policies',
  long_term_packages: 'Long-term packages',
  // Collection giữ tên cũ, nội dung hiện tại là % hoàn tiền khi huỷ gói dài hạn.
  reservation_policies: 'Package refund policy',
  shifts: 'Shifts',
  staff_shifts: 'Staff shifts',
  feedbacks: 'Feedback',
  revenue_distributions: 'Revenue distributions',
  subscription_packages: 'Subscription packages',
  subscriptions: 'Subscriptions',
  wallets: 'Wallets',
  transactions: 'Transactions',
  parking_sessions: 'Parking sessions'
};

const targetLabel = (target: string) => TARGET_LABELS[target] ?? target;

const ACTION_VERBS: Record<string, string> = {
  CREATE: 'Create',
  UPDATE: 'Update',
  DELETE: 'Delete',
  ASSIGN: 'Assign',
  REVOKE: 'Revoke',
  GRANT: 'Grant',
  RESPOND: 'Respond',
  DISTRIBUTE: 'Distribute',
  LOGIN: 'Login',
  LOGOUT: 'Logout',
};

const friendlyDetails = (log: AuditLog) => {
  const verbKey = Object.keys(ACTION_VERBS).find((v) => log.action.startsWith(v));
  if (!verbKey) return log.details;
  return `${ACTION_VERBS[verbKey]} ${targetLabel(log.target).toLowerCase()}`;
};

const PAGE_SIZE = 8;

export function AuditLogsPage() {
  const { data, isLoading, error } = useAdminDataset();
  const [query, setQuery] = useState('');
  const [severity, setSeverity] = useState('all');
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const logs = useMemo(() => data?.auditLogs ?? [], [data?.auditLogs]);

  const groups = useMemo(() => {
    const map = new Map<string, AuditLog[]>();
    for (const log of logs) {
      const key = log.target || 'other';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(log);
    }
    return Array.from(map.entries())
      .map(([key, items]) => ({ key, items }))
      .sort((a, b) => targetLabel(a.key).localeCompare(targetLabel(b.key), 'vi'));
  }, [logs]);

  const currentTab = activeTab && groups.some((g) => g.key === activeTab)
    ? activeTab
    : groups[0]?.key ?? null;

  const filtered = useMemo(() => {
    const source = groups.find((g) => g.key === currentTab)?.items ?? [];
    return source.filter((log) => {
      const q = query.trim().toLowerCase();
      const matchQuery =
        log.actor.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        log.target.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q) ||
        (log.building?.toLowerCase().includes(q) ?? false);
      const matchSeverity = severity === 'all' || log.severity.toLowerCase() === severity.toLowerCase();
      return matchQuery && matchSeverity;
    });
  }, [groups, currentTab, query, severity]);

  const maxPage = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, maxPage);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const stats = useMemo(() => {
    const total = logs.length;
    const lowCount = logs.filter((l) => l.severity.toLowerCase() === 'low').length;
    const mediumCount = logs.filter((l) => l.severity.toLowerCase() === 'medium').length;
    const criticalCount = logs.filter((l) => {
      const s = l.severity.toLowerCase();
      return s === 'high' || s === 'critical';
    }).length;
    return { total, lowCount, mediumCount, criticalCount };
  }, [logs]);

  if (isLoading) {
    return <div className="text-sm font-bold text-slate-500 p-8">Loading activity logs...</div>;
  }

  if (error || !data) {
    return <div className="text-sm text-rose-600 p-8">{error || 'Failed to load logs.'}</div>;
  }

  const columns: DataColumn<AuditLog>[] = [
    {
      key: 'actor',
      title: 'Actor',
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-slate-500/10 border border-slate-200/50 text-slate-600 flex items-center justify-center font-bold text-[10px] uppercase shrink-0">
            {row.actor.slice(0, 2)}
          </div>
          <span className="text-xs font-bold text-slate-700">{row.actor}</span>
        </div>
      ),
    },
    {
      key: 'details',
      title: 'Log details',
      render: (row) => {
        const desc = friendlyDetails(row);
        const hasScope = !!row.building;
        return (
          <div className="max-w-[320px] md:max-w-[420px] whitespace-normal">
            <span className="font-extrabold text-slate-800 text-xs leading-relaxed block">{desc}</span>
            <span className={`inline-flex items-center mt-1 px-1.5 py-0.5 rounded text-[9px] font-bold font-mono tracking-wider ${
              hasScope ? 'bg-blue-500/10 border border-blue-500/15 text-blue-600' : 'bg-slate-100 border border-slate-200/50 text-slate-400'
            }`}>
              {hasScope ? `Building: ${row.building}` : 'System-wide'}
            </span>
          </div>
        );
      },
    },
    {
      key: 'timestamp',
      title: 'Time',
      render: (row) => {
        const parts = row.timestamp.split(' ');
        const time = parts[0] || '';
        const date = parts[1] || '';
        return (
          <div className="font-mono text-xs">
            <span className="font-bold text-slate-700 block">{time}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5 font-semibold">{date}</span>
          </div>
        );
      },
    },
    {
      key: 'severity',
      title: 'Severity',
      render: (row) => {
        const getSeverityStyle = (sev: string) => {
          const s = sev.toLowerCase();
          if (s === 'low') return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600';
          if (s === 'medium') return 'bg-amber-500/10 border-amber-500/20 text-amber-600';
          if (s === 'high') return 'bg-orange-500/10 border-orange-500/20 text-orange-600';
          return 'bg-rose-500/10 border-rose-500/20 text-rose-600';
        };
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider border ${getSeverityStyle(row.severity)}`}>
            {row.severity}
          </span>
        );
      },
    },
  ];

  if (groups.length === 0) {
    return (
      <div className="rounded-3xl glass-premium border border-sky-100/80 p-12 text-center text-slate-500 italic">
        No activity logs yet.
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Premium Hero Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-indigo-400/20 bg-gradient-to-br from-slate-800 via-indigo-900 to-blue-900 p-7 text-white shadow-xl">

        <div className="absolute -right-10 -top-10 h-56 w-56 rounded-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.12),transparent_70%)] pointer-events-none blur-xl animate-pulse" />
        <div className="absolute -left-6 -bottom-6 h-36 w-36 rounded-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.06),transparent_70%)] pointer-events-none blur-xl" />
        <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/10 border border-white/20 text-[9px] font-black uppercase tracking-widest text-white font-mono shadow-sm mb-3">
              System audit trail
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]">
              Activity &amp; Audit Logs
            </h1>
            <p className="mt-2 text-xs font-semibold text-blue-100/80 leading-relaxed">
              Full chronological record of system-wide admin actions, filtered by module, actor and severity.
            </p>
          </div>
          <div className="inline-flex items-center gap-2.5 rounded-full bg-white/10 border border-white/20 px-4 py-2.5 text-xs font-black text-white uppercase font-mono shadow-md backdrop-blur-md shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
            <span>Live logs</span>
          </div>
        </div>
      </section>

      {/* Analytics Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total logs */}
        <div className="relative overflow-hidden rounded-2xl border border-sky-100/60 bg-white/40 p-4 shadow-sm flex items-center gap-4 group hover:border-blue-500/20 transition-all duration-300">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500/10 via-blue-500/30 to-indigo-500/10" />

          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold shrink-0">
            <Activity size={18} />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total logs</p>
            <p className="text-lg font-black text-slate-800 mt-0.5">{stats.total}</p>
          </div>
        </div>

        {/* Low severity count */}
        <div className="relative overflow-hidden rounded-2xl border border-emerald-100/60 bg-white/40 p-4 shadow-sm flex items-center gap-4 group hover:border-emerald-500/20 transition-all duration-300">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-500/10 via-emerald-500/30 to-teal-500/10" />
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold shrink-0">
            <ShieldCheck size={18} />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Low severity</p>
            <p className="text-lg font-black text-slate-800 mt-0.5">{stats.lowCount}</p>
          </div>
        </div>

        {/* Medium severity count */}
        <div className="relative overflow-hidden rounded-2xl border border-amber-100/60 bg-white/40 p-4 shadow-sm flex items-center gap-4 group hover:border-amber-500/20 transition-all duration-300">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-500/10 via-amber-500/30 to-orange-500/10" />
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold shrink-0">
            <Info size={18} />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Medium severity</p>
            <p className="text-lg font-black text-slate-800 mt-0.5">{stats.mediumCount}</p>
          </div>
        </div>

        {/* Critical severity count */}
        <div className="relative overflow-hidden rounded-2xl border border-rose-100/60 bg-white/40 p-4 shadow-sm flex items-center gap-4 group hover:border-rose-500/20 transition-all duration-300">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-rose-500/10 via-rose-500/30 to-red-500/10" />
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center font-bold shrink-0">
            <ShieldAlert size={18} />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Critical severity</p>
            <p className="text-lg font-black text-slate-800 mt-0.5">{stats.criticalCount}</p>
          </div>
        </div>
      </div>

      {/* Target Category Tabs */}
      <div className="flex flex-wrap gap-2 bg-white/20 p-2.5 rounded-2xl border border-sky-100/30 backdrop-blur-md">
        {groups.map((g) => {
          const isActive = g.key === currentTab;
          return (
            <button
              key={g.key}
              type="button"
              onClick={() => {
                setActiveTab(g.key);
                setPage(1);
              }}
              className={`inline-flex min-h-11 items-center gap-2 rounded-xl border px-4 py-2 text-xs font-bold transition-all duration-200 ${
                isActive
                  ? 'border-blue-500/30 bg-blue-500/10 text-blue-600 shadow-[0_0_12px_rgba(59,130,246,0.08)]'
                  : 'border-sky-100/60 bg-white/60 text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <FileText size={12} className={isActive ? 'text-blue-600' : 'text-slate-400'} />
              <span>{targetLabel(g.key)}</span>
              <span
                className={`rounded-lg px-2 py-0.5 text-[9px] font-black font-mono border ${
                  isActive 
                    ? 'bg-blue-500/20 border-blue-500/30 text-blue-600' 
                    : 'bg-slate-100 border-slate-200/50 text-slate-400'
                }`}
              >
                {g.items.length}
              </span>
            </button>
          );
        })}
      </div>

      {/* Control Actions Row (Search, filter) grouped together beautifully */}
      <div className="flex flex-col md:flex-row items-center gap-3 w-full rounded-2xl border border-sky-100/60 bg-white/45 p-3 shadow-sm backdrop-blur-md">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <Input
            value={query}
            onChange={(e) => {
              setPage(1);
              setQuery(e.target.value);
            }}
            placeholder="Search by actor, details or location..."
            className="h-11 w-full rounded-xl border-sky-100 bg-white/90 pl-9 text-xs font-semibold focus-visible:ring-blue-500"
          />
        </div>

        {/* Severity Filter Dropdown */}
        <CustomSelect
          className="h-11 w-full md:w-48 shrink-0"
          value={severity}
          onChange={(val) => {
            setPage(1);
            setSeverity(val);
          }}
          options={[
            { value: 'all', label: 'All severities' },
            { value: 'low', label: 'Low' },
            { value: 'medium', label: 'Medium' },
            { value: 'high', label: 'High' },
            { value: 'critical', label: 'Critical' },
          ]}
        />
      </div>

      {/* Log list DataTable */}
      <DataTable
        title={`Activity logs: ${currentTab ? targetLabel(currentTab) : ''}`}
        rows={pageRows}
        columns={columns}
      />

      {/* Glassmorphic Pagination controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/20 p-3 rounded-2xl border border-sky-100/30 backdrop-blur-md">
        <span className="text-xs font-bold text-slate-400">
          {filtered.length > 0
            ? `Showing ${(safePage - 1) * PAGE_SIZE + 1} – ${Math.min(safePage * PAGE_SIZE, filtered.length)} of ${filtered.length} events`
            : 'No matching events'}
        </span>
        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            disabled={safePage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="bg-white/80 hover:bg-slate-100 text-slate-700 font-bold border border-sky-100 rounded-xl px-4 py-2 text-xs shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all h-auto disabled:opacity-50 disabled:pointer-events-none"
          >
            Prev
          </Button>
          <span className="text-xs font-mono font-bold text-slate-500 px-3 py-1.5 rounded-lg bg-slate-50 border border-sky-100/50">
            Page {safePage} / {maxPage}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={safePage >= maxPage}
            onClick={() => setPage((p) => Math.min(maxPage, p + 1))}
            className="bg-white/80 hover:bg-slate-100 text-slate-700 font-bold border border-sky-100 rounded-xl px-4 py-2 text-xs shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all h-auto disabled:opacity-50 disabled:pointer-events-none"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
