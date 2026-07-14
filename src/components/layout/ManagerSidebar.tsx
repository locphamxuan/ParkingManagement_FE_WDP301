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
      { to: 'reservation-policy', label: 'Reservation', icon: MapPin },
      { to: 'packages', label: 'Package', icon: Package },
      { to: 'subscriptions', label: 'Customer packages', icon: Fingerprint },
    ],
  },
  {
    category: 'Staff & Reviews',
    items: [
      { to: 'shifts', label: 'Shifts & Assignments', icon: Users },
      { to: 'shift-reports', label: 'Shift reports', icon: ClipboardCheck },
      { to: 'staff', label: 'Staff', icon: User },
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
        'border-sky-100 bg-white p-4 transition-all duration-350 ease-in-out shrink-0',
        isDrawer
          ? 'block h-full w-full'
          : cn(
              'sticky top-0 hidden h-screen border-r shadow-[4px_0_30px_rgba(14,165,233,0.015)] lg:block',
              collapsed ? 'w-[84px]' : 'w-[264px]',
            ),
      )}
    >
      <div className="mb-6 flex items-center justify-between rounded-2xl border border-sky-100 bg-sky-50/50 p-3 shadow-sm">
        {!collapsed ? (
          <div className="pl-1">
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-sky-600">Environment</p>
            <p className="text-xs font-extrabold text-slate-800">MANAGER PORTAL</p>
          </div>
        ) : (
          <Fingerprint className="text-sky-500 h-5 w-5 mx-auto animate-pulse" />
        )}
        {!isDrawer && (
          <Button size="sm" variant="ghost" onClick={onToggle} className="h-7 w-7 rounded-lg p-0 hover:bg-sky-100/50 text-slate-400 hover:text-sky-600">
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
              <div className="my-2 border-t border-sky-100/50 mx-2" />
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
                      'flex items-center gap-3.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all duration-300',
                      isActive
                        ? 'bg-sky-500 text-white shadow-md shadow-sky-500/10'
                        : 'text-slate-500 hover:bg-sky-50/50 hover:text-sky-600',
                    )
                  }
                >
                  <Icon size={15} className="shrink-0" />
                  {!collapsed ? <span className="tracking-wide">{module.label}</span> : null}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}
