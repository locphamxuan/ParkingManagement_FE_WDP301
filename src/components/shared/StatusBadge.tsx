import { Badge } from '@/components/ui/badge';

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const normalized = status.toLowerCase();

  if (['active', 'ok', 'success', 'online', 'low'].includes(normalized)) {
    return <Badge variant="success">{status}</Badge>;
  }
  if (['warning', 'pending', 'review', 'maintenance', 'medium'].includes(normalized)) {
    return <Badge variant="warning">{status}</Badge>;
  }
  if (['critical', 'danger', 'blocked', 'offline', 'high'].includes(normalized)) {
    return <Badge variant="danger">{status}</Badge>;
  }

  return <Badge variant="muted">{status}</Badge>;
}
