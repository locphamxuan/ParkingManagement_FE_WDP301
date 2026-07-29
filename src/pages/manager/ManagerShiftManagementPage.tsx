import { useState } from 'react';
import { CalendarClock, Users, Calendar } from 'lucide-react';
import { ManagerShiftsPage } from '@/pages/manager/ManagerShiftsPage';
import { ManagerStaffShiftsPage } from '@/pages/manager/ManagerStaffShiftsPage';

type Tab = 'shifts' | 'assign';

const TABS: { value: Tab; label: string; icon: React.ElementType }[] = [
  { value: 'shifts', label: 'Shift Templates', icon: CalendarClock },
  { value: 'assign', label: 'Assign Shifts to Staff', icon: Users },
];

export function ManagerShiftManagementPage() {
  const [tab, setTab] = useState<Tab>('shifts');

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Premium Header Hero Card */}
      <div className="premium-hero-card relative overflow-hidden rounded-3xl border-2 border-blue-100 bg-gradient-to-br from-white via-blue-50/5 to-indigo-50/10 p-6 shadow-md transition-all duration-300">
        {/* Ambient Glows */}
        <div className="absolute -right-16 -top-16 h-36 w-36 rounded-full bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.06),transparent_70%)] pointer-events-none blur-2xl animate-pulse" />
        
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-600 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
            Staff & Shifts
          </div>
          <h1 className="mt-2 text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Calendar size={20} className="text-blue-600 animate-pulse stroke-[2.5]" />
            Shifts &amp; Assignments
          </h1>
          <p className="mt-1 text-xs font-bold text-slate-500">
            Define daily shift templates and schedule staff members to their assigned gates.
          </p>
        </div>
      </div>

      {/* Modern Sub-tabs selector */}
      <div className="flex w-fit gap-1 rounded-xl border border-slate-200/50 bg-slate-100/60 p-1">
        {TABS.map((t) => {
          const Icon = t.icon;
          const isActive = tab === t.value;
          return (
            <button
              key={t.value}
              type="button"
              onClick={() => setTab(t.value)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-black uppercase tracking-wider transition-all duration-200 ${
                isActive
                  ? 'bg-white text-blue-600 shadow-sm border border-slate-200/50 font-bold scale-[1.01]'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-white/40'
              }`}
            >
              <Icon size={13} className={isActive ? 'text-blue-600' : 'text-slate-400'} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content render */}
      <div className="transition-all duration-300">
        {tab === 'shifts' ? <ManagerShiftsPage /> : <ManagerStaffShiftsPage />}
      </div>
    </div>
  );
}
