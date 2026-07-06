import { NavLink } from 'react-router-dom';
import {
  Building2,
  ChevronLeft,
  Fingerprint,
  LayoutDashboard,
  TrendingUp,
  Users,
  FileSearch,
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
        'sticky top-0 hidden h-screen border-r border-slate-200/80 bg-gradient-to-b from-slate-50 to-slate-100/50 p-4 lg:block transition-all duration-300 ease-in-out shrink-0',
        collapsed ? 'w-[84px]' : 'w-[260px]'
      )}
    >
      {/* Brand Identity Header with Divider */}
      <div className={cn(
        "flex items-center justify-between mb-6 pb-4 border-b border-slate-200/50",
        collapsed ? "px-1 flex-col gap-3" : "px-2"
      )}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-650 flex items-center justify-center text-white shadow-md shadow-blue-500/15 shrink-0">
            <Fingerprint size={18} className="animate-pulse" />
          </div>
          {!collapsed && (
            <div>
              <span className="font-extrabold text-xs text-slate-800 tracking-tight block leading-tight">Parking Building</span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider bg-blue-50 text-blue-600 border border-blue-100 mt-1">
                Management System
              </span>
            </div>
          )}
        </div>
        <Button 
          size="sm" 
          variant="ghost" 
          onClick={onToggle} 
          className="h-7 w-7 rounded-lg p-0 hover:bg-slate-200/60 text-slate-400 hover:text-slate-655 shrink-0"
        >
          <ChevronLeft className={cn('h-3.5 w-3.5 transition-all duration-300', collapsed && 'rotate-180')} />
        </Button>
      </div>

      {/* Navigation Links */}
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
                  'flex items-center gap-3 py-2.5 transition-all duration-200 text-xs font-bold rounded-xl relative group',
                  isActive
                    ? 'bg-blue-500/10 text-blue-600 pl-4 scale-[1.01]'
                    : 'text-slate-500 hover:bg-slate-200/50 hover:text-blue-600 pl-4 hover:translate-x-0.5'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon 
                    size={16} 
                    className={cn(
                      "shrink-0 transition-transform duration-200 group-hover:scale-110", 
                      isActive ? "text-blue-600" : "text-slate-400 group-hover:text-blue-600"
                    )} 
                  />
                  {!collapsed ? (
                    <span className={cn('tracking-wide transition-all duration-200', isActive ? 'text-blue-600 font-extrabold' : 'text-slate-600 font-bold group-hover:text-blue-600')}>
                      {module.label}
                    </span>
                  ) : null}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
