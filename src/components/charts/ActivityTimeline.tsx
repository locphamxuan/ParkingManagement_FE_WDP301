import type { LiveActivityItem } from '@/services/admin/types';

interface ActivityTimelineProps {
  title: string;
  items: LiveActivityItem[];
  onSelect?: (item: LiveActivityItem) => void;
}

const actionLabels: Record<string, string> = {
  ASSIGN_STAFF_SHIFT: 'Staff shift assigned',
  UPDATE_STAFF_SHIFT: 'Staff shift updated',
  // Audit action lịch sử (đặt chỗ theo giờ đã bỏ) — giữ nhãn để dòng log CŨ không
  // hiện mã thô; BE không còn ghi 3 action này.
  CREATE_RESERVATION: 'Legacy booking created',
  UPDATE_RESERVATION: 'Legacy booking updated',
  CANCEL_RESERVATION: 'Legacy booking cancelled',
  CHECK_IN: 'Vehicle checked in',
  CHECK_OUT: 'Vehicle checked out',
  TOP_UP: 'Wallet topped up',
  BLOCK_USER: 'Account locked',
  UNBLOCK_USER: 'Account restored',
  CREATE_BUILDING: 'Building created',
  UPDATE_BUILDING: 'Building updated',
};

const getActionTag = (action: string) => {
  const normalized = action.toUpperCase();
  if (normalized.includes('DELETE')) return { label: 'DELETE', className: 'bg-rose-50 text-rose-700 ring-rose-100' };
  if (normalized.includes('CANCEL')) return { label: 'CANCEL', className: 'bg-amber-50 text-amber-700 ring-amber-100' };
  if (normalized.includes('UPDATE')) return { label: 'UPDATE', className: 'bg-blue-50 text-blue-700 ring-blue-100' };
  if (normalized.includes('CREATE')) return { label: 'CREATE', className: 'bg-emerald-50 text-emerald-700 ring-emerald-100' };
  return { label: 'ACTIVITY', className: 'bg-slate-100 text-slate-600 ring-slate-200' };
};

export function ActivityTimeline({ title, items, onSelect }: ActivityTimelineProps) {
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
            const tag = getActionTag(action);
            return (
              <button
                key={item.id || index}
                type="button"
                onClick={() => onSelect?.(item)}
                disabled={!onSelect}
                className="flex w-full items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-100 hover:bg-white hover:shadow-[0_10px_20px_-16px_rgba(0,147,233,0.5)] disabled:cursor-default disabled:hover:translate-y-0 disabled:hover:border-slate-100 disabled:hover:bg-slate-50/70 disabled:hover:shadow-none"
              >
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-600" />
                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-black tracking-wide ring-1 ${tag.className}`}>{tag.label}</span>
                    <p className="truncate text-xs font-bold text-slate-800">{label}</p>
                  </div>
                  <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">{item.details}</p>
                </div>
                <time className="shrink-0 text-[11px] font-medium text-slate-400">{item.timestamp}</time>
              </button>
            );
          })}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-slate-200 py-8 text-center text-sm text-slate-500">No recent activity.</p>
      )}
    </section>
  );
}
