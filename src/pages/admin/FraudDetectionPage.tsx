import { DataTable, type DataColumn } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { AnalyticsCard } from "@/components/shared/AnalyticsCard";
import { useAdminDataset } from "@/hooks/admin/useAdminDataset";
import type { FraudAlert } from "@/types";

const fraudKpis = [
  { label: "Open fraud cases", value: "9", delta: "2 critical" },
  { label: "Duplicate plate alerts", value: "3", delta: "+1 today" },
  { label: "Unusual payments", value: "4", delta: "Needs review" },
  { label: "Suspicious sessions", value: "12", delta: "Flagged patterns" },
];

export function FraudDetectionPage() {
  const { data, isLoading, error } = useAdminDataset();

  if (isLoading) {
    return (
      <div className="text-sm text-muted-foreground">
        Loading fraud alerts...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-sm text-red-600">
        {error || "Failed to load fraud alerts."}
      </div>
    );
  }

  const columns: DataColumn<FraudAlert>[] = [
    { key: "id", title: "Alert ID" },
    { key: "type", title: "Type" },
    { key: "building", title: "Building" },
    { key: "timestamp", title: "Timestamp" },
    { key: "note", title: "Note" },
    {
      key: "severity",
      title: "Severity",
      render: (row) => <StatusBadge status={row.severity} />,
    },
  ];

  return (
    <div className="grid gap-5">
      <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {fraudKpis.map((item, index) => (
          <AnalyticsCard
            key={item.label}
            label={item.label}
            value={item.value}
            delta={item.delta}
            index={index}
          />
        ))}
      </section>
      <DataTable
        title="Suspicious activity feed"
        rows={data.fraudAlerts}
        columns={columns}
      />
    </div>
  );
}
