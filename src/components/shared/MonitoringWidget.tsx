import type { MonitoringMetric } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/shared/StatusBadge';

interface MonitoringWidgetProps {
  metric: MonitoringMetric;
}

export function MonitoringWidget({ metric }: MonitoringWidgetProps) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-3 p-4">
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{metric.label}</p>
          <p className="mt-1 text-xl font-semibold">{metric.value}</p>
          <p className="text-xs text-muted-foreground">{metric.trend}</p>
        </div>
        <StatusBadge status={metric.status} />
      </CardContent>
    </Card>
  );
}
