import { NavLink } from 'react-router-dom';
import {
  Building2,
  ClipboardList,
  Flag,
  LayoutDashboard,
  MapPin,
  MessageSquare,
  Package,
  ShieldAlert,
  SlidersHorizontal,
  Square,
  Truck,
  User,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';

interface ManagerSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const modules = [
  { to: '', label: 'Tổng quan', icon: LayoutDashboard },
  { to: 'buildings', label: 'Tòa nhà', icon: Building2 },
  { to: 'vehicle-types', label: 'Loại xe', icon: Truck },
  { to: 'floors', label: 'Tầng', icon: ClipboardList },
  { to: 'gates', label: 'Cổng', icon: Flag },
  { to: 'slots', label: 'Chỗ đỗ', icon: Square },
  { to: 'price-policies', label: 'Giá', icon: SlidersHorizontal },
  { to: 'reservation-policy', label: 'Đặt chỗ', icon: MapPin },
  { to: 'packages', label: 'Gói', icon: Package },
  { to: 'shifts', label: 'Ca trực', icon: Users },
  { to: 'feedbacks', label: 'Phản hồi', icon: MessageSquare },
  { to: 'settings', label: 'Cài đặt', icon: ShieldAlert },
] as const;

export function ManagerSidebar({ collapsed, onToggle }: ManagerSidebarProps) {
  return (
    <aside
      className={cn(
        'sticky top-0 hidden h-screen border-r border-border/80 bg-[rgba(255,250,243,0.92)] p-3 shadow-[12px_0_36px_rgba(120,83,48,0.12)] backdrop-blur-2xl lg:block',
        collapsed ? 'w-[88px]' : 'w-[280px]',
      )}
    >
      <div className="mb-4 flex items-center justify-between rounded-2xl border border-border/80 bg-white/78 p-3 shadow-[0_10px_24px_rgba(120,83,48,0.08)]">
        {!collapsed ? (
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-stone-600">Manager</p>
            <p className="text-sm font-semibold text-black">Quản lý tòa nhà</p>
          </div>
        ) : (
          <User className="text-primary drop-shadow-[0_0_12px_rgba(249,115,22,0.3)]" />
        )}
        <Button size="sm" variant="ghost" onClick={onToggle}>
          <MapPin className={cn('h-4 w-4 transition', collapsed && 'rotate-180')} />
        </Button>
      </div>

      <nav className="space-y-1">
        {modules.map((module) => {
          const Icon = module.icon;
          return (
            <NavLink
              key={module.label}
              to={module.to}
              end={module.to === ''}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition duration-200',
                  isActive
                    ? 'bg-gradient-to-r from-primary to-orange-400 text-primary-foreground shadow-[0_12px_24px_rgba(249,115,22,0.22)]'
                    : 'text-stone-700 hover:bg-primary/10 hover:text-black',
                )
              }
            >
              <Icon size={16} />
              {!collapsed ? <span>{module.label}</span> : null}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
