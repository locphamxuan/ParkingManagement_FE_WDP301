import { NavLink } from 'react-router-dom';
import {
  Building2,
  ChevronLeft,
  FileSearch,
  Fingerprint,
  LayoutDashboard,
  TrendingUp,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const modules = [
  { to: '', label: 'Overview', icon: LayoutDashboard },
  { to: 'buildings', label: 'Buildings', icon: Building2 },
  { to: 'users', label: 'Users', icon: Users },
  { to: 'revenue-analytics', label: 'Revenue', icon: TrendingUp },
  { to: 'audit-logs', label: 'Audit Logs', icon: FileSearch },
] as const;

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  return (
    <aside
      className={cn(
        'sticky top-0 hidden h-screen border-r border-sky-100 bg-white p-4 shadow-[4px_0_30px_rgba(14,165,233,0.015)] lg:block transition-all duration-350 ease-in-out shrink-0',
        collapsed ? 'w-[84px]' : 'w-[264px]'
      )}
    >
      <div className="mb-6 flex items-center justify-between rounded-2xl border border-sky-100 bg-sky-50/50 p-3 shadow-sm">
        {!collapsed ? (
          <div className="pl-1">
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-sky-600">Environment</p>
            <p className="text-xs font-extrabold text-slate-800">ADMIN PORTAL</p>
          </div>
        ) : (
          <Fingerprint className="text-sky-500 h-5 w-5 mx-auto animate-pulse" />
        )}
        <Button size="sm" variant="ghost" onClick={onToggle} className="h-7 w-7 rounded-lg p-0 hover:bg-sky-100/50 text-slate-400 hover:text-sky-600">
          <ChevronLeft className={cn('h-3.5 w-3.5 transition-all duration-300', collapsed && 'rotate-180')} />
        </Button>
      </div>

      <nav className="space-y-1.5 overflow-y-auto max-h-[calc(100vh-100px)] pr-1">
        {modules.map((module) => {
          const Icon = module.icon;
          return (
            <NavLink
              key={module.label}
              to={module.to}
              end={module.to === ''}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3.5 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all duration-300',
                  isActive
                    ? 'bg-sky-500 text-white shadow-md shadow-sky-500/10 scale-[1.02]'
                    : 'text-slate-500 hover:bg-sky-50/50 hover:text-sky-600'
                )
              }
            >
              <Icon size={15} className="shrink-0" />
              {!collapsed ? <span className="tracking-wide">{module.label}</span> : null}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
