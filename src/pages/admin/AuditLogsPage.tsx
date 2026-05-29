import { useMemo, useState } from "react";
import { DataTable, type DataColumn } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useAdminDataset } from "@/hooks/admin/useAdminDataset";
import type { AuditLog } from "@/types";

// Phân loại action theo danh mục
const ACTION_CATEGORIES: { key: string; label: string; match: string[] }[] = [
  { key: 'all',     label: 'Tất cả',       match: [] },
  { key: 'price',   label: 'Bảng giá',     match: ['PRICE_POLICY', 'PRICING', 'PRICE'] },
  { key: 'package', label: 'Gói đăng ký',  match: ['PACKAGE', 'SUBSCRIPTION'] },
  { key: 'shift',   label: 'Ca làm',       match: ['SHIFT', 'STAFF_SHIFT'] },
  { key: 'wallet',  label: 'Ví / Tiền',    match: ['WALLET', 'TRANSFER', 'TOPUP'] },
  { key: 'policy',  label: 'Chính sách',   match: ['POLICY', 'RESERVATION_POLICY'] },
];

function matchCategory(action: string, category: string): boolean {
  if (category === 'all') return true;
  const cat = ACTION_CATEGORIES.find((c) => c.key === category);
  if (!cat) return true;
  const upper = action.toUpperCase();
  return cat.match.some((m) => upper.includes(m));
}

export function AuditLogsPage() {
  const { data, isLoading, error } = useAdminDataset();
  const [query, setQuery]       = useState("");
  const [severity, setSeverity] = useState("all");
  const [category, setCategory] = useState("all");

  const filtered = useMemo(() => {
    const source = data?.auditLogs ?? [];
    return source.filter((log) => {
      const q = query.trim().toLowerCase();
      const matchQuery =
        log.actor.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        log.target.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q);
      const matchSeverity = severity === "all" || log.severity === severity;
      const matchCat = matchCategory(log.action, category);
      return matchQuery && matchSeverity && matchCat;
    });
  }, [data?.auditLogs, query, severity, category]);

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading audit logs...</div>;
  }

  if (error || !data) {
    return <div className="text-sm text-red-600">{error || "Failed to load audit logs."}</div>;
  }

  const columns: DataColumn<AuditLog>[] = [
    { key: "id",        title: "ID" },
    { key: "actor",     title: "Actor" },
    { key: "action",    title: "Action" },
    { key: "target",    title: "Target" },
    { key: "details",   title: "Details" },
    { key: "timestamp", title: "Timestamp" },
    {
      key: "severity",
      title: "Severity",
      render: (row) => <StatusBadge status={row.severity} />,
    },
  ];

  return (
    <div className="grid gap-4">
      {/* Search */}
      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm theo actor, action, target..."
          className="h-9 flex-1 min-w-48 rounded-md border border-border bg-card px-3 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        {ACTION_CATEGORIES.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setCategory(key)}
            className={`rounded-full border px-3 py-1 text-xs font-bold transition ${
              category === key
                ? 'border-primary bg-primary/15 text-primary'
                : 'border-border bg-muted/30 text-muted-foreground hover:border-primary/30'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Severity filter */}
      <div className="flex flex-wrap gap-2">
        <span className="text-xs text-muted-foreground self-center">Mức độ:</span>
        {['all', 'low', 'medium', 'high', 'critical'].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSeverity(s)}
            className={`rounded-full border px-3 py-1 text-xs font-bold transition capitalize ${
              severity === s
                ? 'border-orange-400/50 bg-orange-500/10 text-orange-400'
                : 'border-border bg-muted/30 text-muted-foreground hover:border-orange-400/30'
            }`}
          >
            {s === 'all' ? 'Tất cả' : s}
          </button>
        ))}
      </div>

      <DataTable title={`Audit logs (${filtered.length})`} rows={filtered} columns={columns} />
    </div>
  );
}
