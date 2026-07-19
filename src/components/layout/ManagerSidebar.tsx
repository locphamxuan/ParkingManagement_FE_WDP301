import { NavLink } from 'react-router-dom';
import {
  Building2,
  ChevronLeft,
  ClipboardList,
  ClipboardCheck,
  Flag,
  LayoutDashboard,
  LayoutGrid,
  MapPin,
  Package,
  SlidersHorizontal,
  Square,
  Truck,
  User,
  Users,
  Clock,
  Wallet,
  Fingerprint,
  MessageSquare,
  ShieldAlert,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';

interface ManagerSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  /** 'drawer' = render bên trong MobileNavDrawer (< lg) — bỏ sticky/hidden, full width. */
  variant?: 'desktop' | 'drawer';
  /** Gọi khi bấm 1 link (để drawer tự đóng). */
  onNavigate?: () => void;
}

const groupedModules = [
  {
    category: 'Dashboard',
    items: [
      { to: '', label: 'Overview', icon: LayoutDashboard },
      { to: 'active-sessions', label: 'Active Sessions', icon: Clock },
    ],
  },
  {
    category: 'Structure',
    items: [
      { to: 'buildings', label: 'Building', icon: Building2 },
      { to: 'floors', label: 'Floor', icon: ClipboardList },
      { to: 'gates', label: 'Gate', icon: Flag },
      { to: 'zones', label: 'Zones', icon: LayoutGrid },
      { to: 'slots', label: 'Parking slots', icon: Square },
      { to: 'vehicle-types', label: 'Vehicle type', icon: Truck },
    ],
  },
  {
    category: 'Policies & Services',
    items: [
      { to: 'operating-hours', label: 'Operating hours', icon: Clock },
      { to: 'price-policies', label: 'Price', icon: SlidersHorizontal },
      { to: 'refund-policy', label: 'Refund Policy', icon: MapPin },
      { to: 'packages', label: 'Package', icon: Package },
      { to: 'subscriptions', label: 'Customer packages', icon: Fingerprint },
    ],
  },
  {
    category: 'Staff & Reviews',
    items: [
      { to: 'shifts', label: 'Shifts & Assignments', icon: Users },
      { to: 'staff', label: 'Staff', icon: User },
      { to: 'incidents', label: 'User Incidents', icon: ShieldAlert },
      { to: 'reviews', label: 'Reviews', icon: MessageSquare },
    ],
  },
  {
    category: 'Finance',
    items: [
      { to: 'wallet', label: 'Building wallet', icon: Wallet },
    ],
  },
];

export function ManagerSidebar({ collapsed, onToggle, variant = 'desktop', onNavigate }: ManagerSidebarProps) {
  const isDrawer = variant === 'drawer';
  return (
    <aside
      className={cn(
        'border-slate-200/80 bg-gradient-to-b from-slate-50 to-slate-100/50 p-4 transition-all duration-350 ease-in-out shrink-0',
        isDrawer
          ? 'block h-full w-full'
          : cn(
              'sticky top-0 hidden h-screen border-r shadow-[4px_0_30px_rgba(37,99,235,0.015)] lg:block',
              collapsed ? 'w-[84px]' : 'w-[264px]',
            ),
      )}
    >
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
              <span className="font-extrabold text-xs text-slate-800 tracking-tight block leading-tight">Operations System</span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider bg-blue-50 text-blue-600 border border-blue-100 mt-1">
                MANAGER PORTAL
              </span>
            </div>
          )}
        </div>
        {!isDrawer && (
          <Button size="sm" variant="ghost" onClick={onToggle} className="h-7 w-7 rounded-lg p-0 hover:bg-slate-200/60 text-slate-400 hover:text-slate-655 shrink-0">
            <ChevronLeft className={cn('h-3.5 w-3.5 transition-all duration-300', collapsed && 'rotate-180')} />
          </Button>
        )}
      </div>

      <nav className="space-y-4 overflow-y-auto max-h-[calc(100vh-100px)] pr-1 custom-scrollbar">
        {groupedModules.map((group, gIdx) => (
          <div key={group.category} className="space-y-1">
            {!collapsed ? (
              <p className="px-3.5 text-[8px] font-black uppercase tracking-[0.2em] text-slate-400 mt-3 first:mt-0">
                {group.category}
              </p>
            ) : gIdx > 0 ? (
              <div className="my-2 border-t border-slate-200/50 mx-2" />
            ) : null}
            {group.items.map((module) => {
              const Icon = module.icon;
              return (
                <NavLink
                  key={module.label}
                  to={module.to}
                  end={module.to === ''}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3.5 rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all duration-300 relative group',
                      isActive
                        ? 'bg-blue-500/10 text-blue-650 scale-[1.01] pl-4'
                        : 'text-slate-500 hover:bg-slate-200/50 hover:text-blue-600 pl-4 hover:translate-x-0.5',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon 
                        size={15} 
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
          </div>
        ))}
      </nav>
    </aside>
  );
}
