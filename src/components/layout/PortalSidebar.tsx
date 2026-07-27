import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { ChevronDown, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';
import { Logo } from '@/components/layout/Logo';

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
    'portal-nav-link flex min-h-11 items-center gap-3 rounded-xl px-3 text-xs font-bold transition-[background-color,color,box-shadow,transform] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70',
    nested && 'min-h-10 py-2',
    isActive
      ? 'portal-nav-link--active bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/20'
      : 'text-slate-600 hover:bg-blue-50 hover:text-blue-700',
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
        'portal-sidebar sticky top-0 h-screen border-r p-3 shadow-2xl backdrop-blur-xl transition-[width] duration-300 ease-out',
        isDrawer ? 'w-full' : 'hidden lg:block',
        !isDrawer && (effectiveCollapsed ? 'w-[84px]' : 'w-[272px]'),
      )}
    >
      <div className="mb-5 flex min-h-[68px] items-center justify-between rounded-2xl border border-blue-100 bg-blue-50/70 p-3 shadow-inner backdrop-blur-md">
        {!effectiveCollapsed ? (
          <div className="flex min-w-0 items-center gap-3">
            <Logo variant="mark" size={36} className="shrink-0" />
            <div className="min-w-0">
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-blue-600">PBMS Workspace</p>
              <p className="truncate text-xs font-extrabold text-slate-900">{portalLabel}</p>
            </div>
          </div>
        ) : (
          <Logo variant="mark" size={36} className="mx-auto" />
        )}
        {!isDrawer && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onToggle}
            aria-label={effectiveCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="h-9 w-9 shrink-0 rounded-xl p-0 text-slate-500 hover:bg-blue-100 hover:text-blue-700 focus-visible:ring-blue-400"
          >
            <ChevronLeft className={cn('h-3.5 w-3.5 transition-all duration-300', effectiveCollapsed && 'rotate-180')} />
          </Button>
        )}
      </div>

      {!effectiveCollapsed ? (
        <p className="mb-2 px-3 text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">
          Navigation
        </p>
      ) : null}

      <nav className="max-h-[calc(100vh-112px)] space-y-1 overflow-y-auto pr-1" aria-label={`${portalLabel} navigation`}>
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
                title={effectiveCollapsed ? entry.label : undefined}
              >
                <Icon size={17} strokeWidth={2} className="shrink-0" />
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
                aria-expanded={isOpen}
                title={effectiveCollapsed ? entry.label : undefined}
                className={cn(
                  'flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-xs font-bold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70',
                  hasActive && !isOpen
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:bg-blue-50 hover:text-blue-700',
                )}
              >
                <Icon size={17} strokeWidth={2} className="shrink-0" />
                {!effectiveCollapsed ? (
                  <>
                    <span className="tracking-wide flex-1 text-left">{entry.label}</span>
                    <ChevronDown className={cn('h-3.5 w-3.5 transition-transform duration-300', isOpen && 'rotate-180')} />
                  </>
                ) : null}
              </button>

              {!effectiveCollapsed && isOpen ? (
                <div className="mb-1.5 ml-5 mt-1 space-y-1 border-l border-blue-100 pl-2.5">
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
                        <ChildIcon size={15} className="shrink-0" />
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
