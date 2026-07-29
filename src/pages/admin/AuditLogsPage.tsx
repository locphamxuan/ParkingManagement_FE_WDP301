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
  reservation_policies: 'Reservation policies',
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
      <section
        className="relative overflow-hidden rounded-3xl p-7 text-white shadow-2xl"
        style={{
          background: 'linear-gradient(135deg, #0052D4 0%, #1a6fe8 30%, #4364F7 65%, #2979ff 100%)',
          boxShadow: '0 20px 60px -12px rgba(0,82,212,0.55), 0 8px 24px -6px rgba(0,0,0,0.15)',
        }}
      >
        <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />
        <div
          className="absolute -right-14 -top-14 h-64 w-64 rounded-full pointer-events-none animate-pulse"
          style={{ background: 'radial-gradient(circle at center, rgba(99,179,237,0.25) 0%, transparent 70%)', filter: 'blur(22px)' }}
        />
        <div
          className="absolute -left-8 -bottom-8 h-44 w-44 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle at center, rgba(255,255,255,0.1) 0%, transparent 70%)', filter: 'blur(18px)' }}
        />
        <div className="absolute inset-0 pointer-events-none rounded-3xl overflow-hidden" aria-hidden="true">
          <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'repeating-linear-gradient(60deg, transparent, transparent 40px, rgba(255,255,255,0.9) 40px, rgba(255,255,255,0.9) 41px)' }} />
        </div>
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-[0.18em] text-blue-100 font-mono shadow-sm mb-2.5"
              style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.22)', backdropFilter: 'blur(8px)' }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-300 shadow-[0_0_6px_rgba(103,232,249,0.9)]" />
              System audit trail
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.25)' }}>
              Activity &amp; Audit Logs
            </h1>
            <p className="mt-2 text-[0.72rem] font-semibold text-blue-100/85 leading-relaxed max-w-lg">
              Full chronological record of system-wide admin actions, filtered by module, actor and severity.
            </p>
          </div>
          <div
            className="inline-flex items-center gap-2.5 rounded-2xl px-4 py-3 text-xs font-black text-white uppercase font-mono shadow-md shrink-0"
            style={{
              background: 'rgba(255,255,255,0.13)',
              border: '1px solid rgba(255,255,255,0.22)',
              backdropFilter: 'blur(12px)',
            }}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
            Live logs
          </div>
        </div>
      </section>

      {/* Severity Analytics Stat Cards — 3D elevated */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Total logs',
            value: stats.total,
            icon: <Activity size={20} />,
            accent: { bg: 'rgba(0,147,233,0.08)', border: 'rgba(0,147,233,0.22)', icon: 'rgba(0,147,233,0.12)', iconColor: '#0073b7', top: 'linear-gradient(90deg, transparent, #0093E9, transparent)' },
          },
          {
            label: 'Low severity',
            value: stats.lowCount,
            icon: <ShieldCheck size={20} />,
            accent: { bg: 'rgba(16,185,129,0.06)', border: 'rgba(16,185,129,0.2)', icon: 'rgba(16,185,129,0.12)', iconColor: '#059669', top: 'linear-gradient(90deg, transparent, #10b981, transparent)' },
          },
          {
            label: 'Medium severity',
            value: stats.mediumCount,
            icon: <Info size={20} />,
            accent: { bg: 'rgba(245,158,11,0.06)', border: 'rgba(245,158,11,0.2)', icon: 'rgba(245,158,11,0.12)', iconColor: '#d97706', top: 'linear-gradient(90deg, transparent, #f59e0b, transparent)' },
          },
          {
            label: 'Critical severity',
            value: stats.criticalCount,
            icon: <ShieldAlert size={20} />,
            accent: { bg: 'rgba(239,68,68,0.06)', border: 'rgba(239,68,68,0.2)', icon: 'rgba(239,68,68,0.12)', iconColor: '#dc2626', top: 'linear-gradient(90deg, transparent, #ef4444, transparent)' },
          },
        ].map((card) => (
          <div
            key={card.label}
            className="relative overflow-hidden rounded-2xl bg-white p-4 flex items-center gap-4 transition-all duration-300 group cursor-default"
            style={{
              border: `1px solid ${card.accent.border}`,
              background: card.accent.bg,
              boxShadow: '0 2px 8px rgba(0,0,0,0.04), 0 8px 24px -6px rgba(0,0,0,0.06)',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 16px rgba(0,0,0,0.06), 0 16px 40px -8px ${card.accent.border}`;
              (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px) scale(1.005)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.04), 0 8px 24px -6px rgba(0,0,0,0.06)';
              (e.currentTarget as HTMLElement).style.transform = 'none';
            }}
          >
            <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: card.accent.top }} />
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110"
              style={{ background: card.accent.icon, color: card.accent.iconColor }}
            >
              {card.icon}
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.14em]" style={{ color: '#94a3b8' }}>
                {card.label}
              </p>
              <p className="text-2xl font-black text-slate-800 mt-0.5 leading-none">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Category Tab Pills */}
      <div
        className="flex flex-wrap gap-2 p-2.5 rounded-2xl"
        style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(226,232,240,0.7)', backdropFilter: 'blur(12px)' }}
      >
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
              className="inline-flex min-h-9 items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all duration-200"
              style={{
                background: isActive
                  ? 'linear-gradient(135deg, rgba(0,147,233,0.12), rgba(0,198,255,0.08))'
                  : 'rgba(255,255,255,0.8)',
                border: isActive
                  ? '1px solid rgba(0,147,233,0.3)'
                  : '1px solid rgba(226,232,240,0.8)',
                color: isActive ? '#0073b7' : '#64748b',
                boxShadow: isActive ? '0 0 12px rgba(0,147,233,0.12), inset 0 1px 0 rgba(255,255,255,0.5)' : 'none',
              }}
            >
              <FileText size={11} style={{ color: isActive ? '#0093E9' : '#94a3b8' }} />
              <span>{targetLabel(g.key)}</span>
              <span
                className="rounded-md px-1.5 py-0.5 text-[9px] font-black font-mono"
                style={{
                  background: isActive ? 'rgba(0,147,233,0.18)' : 'rgba(100,116,139,0.1)',
                  color: isActive ? '#0073b7' : '#64748b',
                }}
              >
                {g.items.length}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search + Severity Filter Bar */}
      <div
        className="flex flex-col md:flex-row items-center gap-3 w-full rounded-2xl p-3"
        style={{ background: 'rgba(255,255,255,0.75)', border: '1px solid rgba(226,232,240,0.7)', backdropFilter: 'blur(16px)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
      >
        <div className="relative flex-1 w-full">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2"
            size={15}
            style={{ color: '#0093E9' }}
          />
          <Input
            value={query}
            onChange={(e) => {
              setPage(1);
              setQuery(e.target.value);
            }}
            placeholder="Search by actor, details or location..."
            className="h-11 w-full rounded-xl pl-10 text-xs font-semibold"
            style={{ background: '#f8fafc', border: '1px solid rgba(226,232,240,0.9)' }}
          />
        </div>
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

      {/* Pagination — clean bottom-right */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl p-3.5" style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(226,232,240,0.7)', backdropFilter: 'blur(12px)' }}>
        <span className="text-xs font-bold" style={{ color: '#94a3b8' }}>
          {filtered.length > 0
            ? `Showing ${(safePage - 1) * PAGE_SIZE + 1}\u2013${Math.min(safePage * PAGE_SIZE, filtered.length)} of ${filtered.length} events`
            : 'No matching events'}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={safePage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="h-9 px-4 rounded-xl text-xs font-bold transition-all duration-200 disabled:opacity-40 disabled:pointer-events-none"
            style={{ background: '#fff', border: '1px solid rgba(226,232,240,0.9)', color: '#475569', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#f8fafc'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '#fff'; }}
          >
            Prev
          </button>
          <span
            className="h-9 px-4 flex items-center rounded-xl text-xs font-mono font-bold"
            style={{ background: '#f8fafc', border: '1px solid rgba(226,232,240,0.9)', color: '#64748b' }}
          >
            Trang {safePage} / {maxPage}
          </span>
          <button
            type="button"
            disabled={safePage >= maxPage}
            onClick={() => setPage((p) => Math.min(maxPage, p + 1))}
            className="h-9 px-4 rounded-xl text-xs font-bold transition-all duration-200 disabled:opacity-40 disabled:pointer-events-none"
            style={{ background: '#fff', border: '1px solid rgba(226,232,240,0.9)', color: '#475569', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#f8fafc'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '#fff'; }}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
