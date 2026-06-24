import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { LiveActivityItem } from '@/services/admin/types';

interface ActivityTimelineProps {
  title: string;
  items: LiveActivityItem[];
}

export function ActivityTimeline({ title, items }: ActivityTimelineProps) {
  return (
    <Card className="border-0 bg-transparent shadow-none p-0">
      <CardHeader className="p-0 pb-4">
        <CardTitle className="text-sm font-black uppercase tracking-wider text-slate-300 font-mono">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative border-l border-slate-800 ml-3 pl-6 space-y-5 py-2">
          {items.map((item) => {
            const isDanger = item.action.includes('BLOCK') || item.action.includes('CANCEL') || item.action.includes('REJECT');
            const isSuccess = item.action.includes('CHECK_IN') || item.action.includes('CHECK_OUT') || item.action.includes('TOP_UP');
            const isWarning = item.action.includes('UPDATE');
            
            const badgeColorClass = isDanger 
              ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
              : isSuccess 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                : isWarning 
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  : 'bg-blue-500/10 text-blue-400 border-blue-500/20';

            const dotColorClass = isDanger 
              ? 'bg-rose-500 shadow-[0_0_8px_#f43f5e]' 
              : isSuccess 
                ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]'
                : isWarning 
                  ? 'bg-amber-500 shadow-[0_0_8px_#f59e0b]'
                  : 'bg-blue-500 shadow-[0_0_8px_#3b82f6]';

            const translations: Record<string, string> = {
              ASSIGN_STAFF_SHIFT: 'Assign Staff Shift',
              UPDATE_STAFF_SHIFT: 'Update Staff Shift',
              CREATE_RESERVATION: 'Create Reservation',
              UPDATE_RESERVATION: 'Update Reservation',
              CANCEL_RESERVATION: 'Cancel Reservation',
              CHECK_IN: 'Vehicle Check-in',
              CHECK_OUT: 'Vehicle Check-out',
              TOP_UP: 'Top Up Wallet',
              BLOCK_USER: 'Block User',
              UNBLOCK_USER: 'Unblock User',
              CREATE_BUILDING: 'Create Building',
              UPDATE_BUILDING: 'Update Building',
              ADD_LICENSE_PLATE: 'Add License Plate',
              REMOVE_LICENSE_PLATE: 'Remove License Plate',
            };
            const friendlyAction = translations[item.action] || item.action.replace(/_/g, ' ');

            return (
              <div key={item.id} className="relative group">
                <span className={`absolute -left-[30px] top-1.5 h-2 w-2 rounded-full transition-transform duration-300 group-hover:scale-125 ${dotColorClass}`} />
                
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between gap-4">
                    <span className={`px-2 py-0.5 rounded border text-[9px] font-black uppercase tracking-wider font-mono ${badgeColorClass}`}>
                      {friendlyAction}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 font-bold">
                      {item.timestamp}
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-slate-200 leading-relaxed mt-0.5">
                    {item.details}
                  </p>

                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                    <span>Actor:</span>
                    <span className="text-slate-400 font-mono lowercase truncate max-w-[200px]" title={item.actor}>
                      {item.actor}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
