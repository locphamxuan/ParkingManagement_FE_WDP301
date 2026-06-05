import { useMemo, useState } from "react";
import { DataTable, type DataColumn } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useAdminDataset } from "@/hooks/admin/useAdminDataset";
import type { AuditLog } from "@/types";

// Category tabs. `match` lists keywords matched against the action (case-insensitive).
// `all` shows everything; `other` is a catch-all for actions matching no other tab.
const CATEGORY_TABS: { key: string; label: string; match: string[] }[] = [
  { key: "all", label: "All", match: [] },
  { key: "infrastructure", label: "Infrastructure", match: ["FLOOR", "GATE", "SLOT", "VEHICLE_TYPE", "BUILDING"] },
  { key: "price", label: "Pricing", match: ["PRICE_POLICY", "PRICING", "PRICE"] },
  { key: "package", label: "Packages", match: ["PACKAGE", "SUBSCRIPTION"] },
  { key: "shift", label: "Shifts", match: ["SHIFT", "STAFF_SHIFT"] },
  { key: "wallet", label: "Wallet & Money", match: ["WALLET", "TRANSFER", "TOPUP", "PAYMENT", "REVENUE"] },
  { key: "policy", label: "Policies", match: ["POLICY", "RESERVATION_POLICY"] },
  { key: "account", label: "Accounts", match: ["USER", "MANAGER", "STAFF", "LOGIN", "AUTH", "ROLE"] },
  { key: "other", label: "Other", match: [] },
];

// All keywords that belong to a named (non-all/other) tab — used to detect "other".
const NAMED_KEYWORDS = CATEGORY_TABS.filter((c) => c.key !== "all" && c.key !== "other").flatMap(
  (c) => c.match,
);

function matchCategory(action: string, category: string): boolean {
  if (category === "all") return true;
  const upper = action.toUpperCase();
  if (category === "other") return !NAMED_KEYWORDS.some((m) => upper.includes(m));
  const cat = CATEGORY_TABS.find((c) => c.key === category);
  if (!cat) return true;
  return cat.match.some((m) => upper.includes(m));
}

const SEVERITIES = ["all", "low", "medium", "high", "critical"] as const;

export function AuditLogsPage() {
  const { data, isLoading, error } = useAdminDataset();
  const [query, setQuery] = useState("");
  const [severity, setSeverity] = useState<string>("all");
  const [category, setCategory] = useState("all");

  const allLogs = useMemo(() => data?.auditLogs ?? [], [data?.auditLogs]);

  // Count per tab (respects the current search + severity, ignores the active tab).
  const tabCounts = useMemo(() => {
    const base = allLogs.filter((log) => {
      const q = query.trim().toLowerCase();
      const matchQuery =
        !q ||
        log.actor.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        log.target.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q);
      const matchSeverity = severity === "all" || log.severity === severity;
      return matchQuery && matchSeverity;
    });
    const counts: Record<string, number> = {};
    for (const tab of CATEGORY_TABS) {
      counts[tab.key] = base.filter((l) => matchCategory(l.action, tab.key)).length;
    }
    return counts;
  }, [allLogs, query, severity]);

  const filtered = useMemo(() => {
    return allLogs.filter((log) => {
      const q = query.trim().toLowerCase();
      const matchQuery =
        !q ||
        log.actor.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        log.target.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q);
      const matchSeverity = severity === "all" || log.severity === severity;
      const matchCat = matchCategory(log.action, category);
      return matchQuery && matchSeverity && matchCat;
    });
  }, [allLogs, query, severity, category]);

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading audit logs...</div>;
  }

  if (error || !data) {
    return <div className="text-sm text-red-600">{error || "Failed to load audit logs."}</div>;
  }

  const columns: DataColumn<AuditLog>[] = [
    { key: "actor", title: "Actor" },
    { key: "action", title: "Action" },
    { key: "target", title: "Target" },
    { key: "details", title: "Details" },
    { key: "timestamp", title: "Timestamp" },
    {
      key: "severity",
      title: "Severity",
      render: (row) => <StatusBadge status={row.severity} />,
    },
  ];

  const activeTab = CATEGORY_TABS.find((t) => t.key === category);

  return (
    <div className="grid gap-4">
      {/* Category tabs */}
      <div className="flex flex-wrap items-center gap-1 border-b border-border">
        {CATEGORY_TABS.map(({ key, label }) => {
          const active = category === key;
          const count = tabCounts[key] ?? 0;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setCategory(key)}
              className={`relative flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition ${
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  active ? "bg-primary/15 text-primary" : "bg-muted/50 text-muted-foreground"
                }`}
              >
                {count}
              </span>
              {active ? (
                <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary" />
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Secondary filters: search + severity */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by actor, action, target, details..."
          className="h-9 flex-1 min-w-48 rounded-md border border-border bg-card px-3 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Severity:</span>
          {SEVERITIES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSeverity(s)}
              className={`rounded-full border px-3 py-1 text-xs font-bold capitalize transition ${
                severity === s
                  ? "border-orange-400/50 bg-orange-500/10 text-orange-400"
                  : "border-border bg-muted/30 text-muted-foreground hover:border-orange-400/30"
              }`}
            >
              {s === "all" ? "All" : s}
            </button>
          ))}
        </div>
      </div>

      <DataTable
        title={`${activeTab?.label ?? "All"} — ${filtered.length} log${filtered.length === 1 ? "" : "s"}`}
        rows={filtered}
        columns={columns}
      />
    </div>
  );
}
