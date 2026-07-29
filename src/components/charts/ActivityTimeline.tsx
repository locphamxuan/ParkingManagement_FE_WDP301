import type { LiveActivityItem } from '@/services/admin/types';

interface ActivityTimelineProps {
  title: string;
  items: LiveActivityItem[];
}

const actionLabels: Record<string, string> = {
  ASSIGN_STAFF_SHIFT: 'Staff shift assigned',
  UPDATE_STAFF_SHIFT: 'Staff shift updated',
  CREATE_RESERVATION: 'Reservation created',
  UPDATE_RESERVATION: 'Reservation updated',
  CANCEL_RESERVATION: 'Reservation cancelled',
  CHECK_IN: 'Vehicle checked in',
  CHECK_OUT: 'Vehicle checked out',
  TOP_UP: 'Wallet topped up',
  BLOCK_USER: 'Account locked',
  UNBLOCK_USER: 'Account restored',
  CREATE_BUILDING: 'Building created',
  UPDATE_BUILDING: 'Building updated',
};

export function ActivityTimeline({ title, items }: ActivityTimelineProps) {
  const latest = items.slice(0, 4);

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-base font-extrabold text-slate-900">{title}</h3>
          <p className="mt-1 text-xs text-slate-500">Most recent actions across the platform</p>
        </div>
        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700">Live</span>
      </div>
      {latest.length ? (
        <div className="space-y-2.5">
          {latest.map((item, index) => {
            const action = item.action || '';
            const label = actionLabels[action] || action.replace(/_/g, ' ') || 'System activity';
            return (
              <div key={item.id || index} className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-3">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-600" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-slate-800">{label}</p>
                  <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">{item.details}</p>
                </div>
                <time className="shrink-0 text-[11px] font-medium text-slate-400">{item.timestamp}</time>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-slate-200 py-8 text-center text-sm text-slate-500">No recent activity.</p>
      )}
    </section>
  );
}
