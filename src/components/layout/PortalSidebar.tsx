import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { ChevronDown, ChevronLeft, Fingerprint } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';

export interface PortalNavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

export interface PortalNavGroup {
  label: string;
  icon: LucideIcon;
  children: readonly PortalNavItem[];
}

export type PortalNavEntry = PortalNavItem | PortalNavGroup;

const isGroup = (entry: PortalNavEntry): entry is PortalNavGroup => 'children' in entry;

interface PortalSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  /** Tên portal hiển thị ở header sidebar (vd: "ADMIN PORTAL") */
  portalLabel: string;
  items: readonly PortalNavEntry[];
  /** Prefix route của portal (vd: "/manager") — dùng để xác định group đang active */
  basePath?: string;
  /**
   * 'sidebar' (default): cột cố định bên trái, tự ẩn dưới breakpoint `lg`
   * (dùng trong desktop layout). 'drawer': luôn hiển thị đầy đủ, không ẩn —
   * dùng khi render bên trong `MobileNavDrawer` cho viewport < lg.
   */
  variant?: 'sidebar' | 'drawer';
  /** Gọi khi bấm 1 link điều hướng — dùng để đóng drawer mobile sau khi chuyển trang. */
  onNavigate?: () => void;
}

const linkClass = (isActive: boolean, nested = false) =>
  cn(
    'flex items-center gap-3.5 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all duration-300',
    nested && 'py-2',
    isActive
      ? 'bg-gradient-to-r from-blue-600 to-sky-500 text-white shadow-md shadow-blue-500/20 scale-[1.02]'
      : 'text-slate-600 hover:bg-sky-50 hover:text-blue-600',
  );

// Sidebar dùng chung cho các portal quản trị (admin/manager) — hỗ trợ cả mục
// đơn lẻ lẫn nhóm collapsible để tránh danh sách quá dài.
export function PortalSidebar({
  collapsed,
  onToggle,
  portalLabel,
  items,
  basePath = '',
  variant = 'sidebar',
  onNavigate,
}: PortalSidebarProps) {
  const location = useLocation();
  const isDrawer = variant === 'drawer';
  // Drawer luôn hiện đầy đủ nhãn (không thu gọn), bất kể state `collapsed` của sidebar desktop.
  const effectiveCollapsed = isDrawer ? false : collapsed;

  const groupHasActiveChild = (group: PortalNavGroup) =>
    group.children.some((child) => location.pathname === `${basePath}/${child.to}`);

  // Mặc định mở nhóm chứa route hiện tại để người dùng không mất ngữ cảnh.
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const entry of items) {
      if (isGroup(entry)) initial[entry.label] = groupHasActiveChild(entry);
    }
    return initial;
  });

  const toggleGroup = (group: PortalNavGroup) => {
    if (effectiveCollapsed) {
      // Sidebar đang thu gọn: mở rộng lại và mở luôn nhóm được bấm.
      onToggle();
      setOpenGroups((prev) => ({ ...prev, [group.label]: true }));
      return;
    }
    setOpenGroups((prev) => ({ ...prev, [group.label]: !prev[group.label] }));
  };

  return (
    <aside
      className={cn(
        'sticky top-0 h-screen border-r border-sky-100 bg-white/95 p-4 shadow-xs backdrop-blur-xl transition-all duration-350 ease-in-out',
        isDrawer ? 'w-full' : 'hidden lg:block',
        !isDrawer && (effectiveCollapsed ? 'w-[84px]' : 'w-[264px]'),
      )}
    >
      <div className="mb-6 flex items-center justify-between rounded-2xl border border-sky-100 bg-sky-50/70 p-3 shadow-xs backdrop-blur-md">
        {!effectiveCollapsed ? (
          <div className="pl-1">
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-sky-600">Environment</p>
            <p className="text-xs font-extrabold text-slate-900">{portalLabel}</p>
          </div>
        ) : (
          <Fingerprint className="text-blue-600 drop-shadow-[0_0_8px_rgba(37,99,235,0.25)] h-5 w-5 mx-auto" />
        )}
        {!isDrawer && (
          <Button size="sm" variant="ghost" onClick={onToggle} className="h-7 w-7 rounded-lg p-0 hover:bg-sky-100/60 text-slate-500 hover:text-blue-600">
            <ChevronLeft className={cn('h-3.5 w-3.5 transition-all duration-300', effectiveCollapsed && 'rotate-180')} />
          </Button>
        )}
      </div>

      <nav className="space-y-1.5 overflow-y-auto max-h-[calc(100vh-100px)] pr-1">
        {items.map((entry) => {
          const Icon = entry.icon;

          if (!isGroup(entry)) {
            return (
              <NavLink
                key={entry.label}
                to={entry.to}
                end={entry.to === ''}
                className={({ isActive }) => linkClass(isActive)}
                onClick={onNavigate}
              >
                <Icon size={15} className="shrink-0" />
                {!effectiveCollapsed ? <span className="tracking-wide">{entry.label}</span> : null}
              </NavLink>
            );
          }

          const isOpen = Boolean(openGroups[entry.label]);
          const hasActive = groupHasActiveChild(entry);

          return (
            <div key={entry.label}>
              <button
                type="button"
                onClick={() => toggleGroup(entry)}
                className={cn(
                  'w-full flex items-center gap-3.5 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all duration-300',
                  hasActive && !isOpen
                    ? 'text-blue-600 bg-blue-50/80 font-bold'
                    : 'text-slate-600 hover:bg-sky-50 hover:text-blue-600',
                )}
              >
                <Icon size={15} className="shrink-0" />
                {!effectiveCollapsed ? (
                  <>
                    <span className="tracking-wide flex-1 text-left">{entry.label}</span>
                    <ChevronDown className={cn('h-3.5 w-3.5 transition-transform duration-300', isOpen && 'rotate-180')} />
                  </>
                ) : null}
              </button>

              {!effectiveCollapsed && isOpen ? (
                <div className="mt-1 mb-1.5 ml-4 space-y-1 border-l border-sky-100 pl-2.5">
                  {entry.children.map((child) => {
                    const ChildIcon = child.icon;
                    return (
                      <NavLink
                        key={child.label}
                        to={child.to}
                        end={child.to === ''}
                        className={({ isActive }) => linkClass(isActive, true)}
                        onClick={onNavigate}
                      >
                        <ChildIcon size={14} className="shrink-0" />
                        <span className="tracking-wide">{child.label}</span>
                      </NavLink>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
