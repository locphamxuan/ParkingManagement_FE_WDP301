import { useEffect, useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation, useMatch, useNavigate } from 'react-router-dom';
import {
  CalendarClock,
  Car,
  ChevronLeft,
  ChevronDown,
  History,
  LayoutDashboard,
  LogOut,
  ScanLine,
  ShieldAlert,
  User,
} from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { staffApi, extractBuildings, type StaffBuilding } from '@/services/staff/staffApi';
import { cn } from '@/utils/cn';
import { MobileNavDrawer, MobileNavButton } from '@/components/layout/MobileNavDrawer';
import { AppBackdrop } from '@/components/layout/AppBackdrop';

const BASE_PAGE_TITLE: Record<string, string> = {
  '': 'Overview',
  dashboard: 'Overview',
  operations: 'Vehicle Check-in',
  checkout: 'Vehicle Check-out',
  parked: 'Parked Vehicles',
  'my-shifts': 'My Shifts',
  sessions: 'Shift History',
  incidents: 'Incident Management',
};

export function StaffLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, user, logout } = useAuth();
  const assignedBuildingId = session?.assignedBuildingIds?.[0] ?? null;
  const [buildings, setBuildings] = useState<StaffBuilding[]>([]);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(assignedBuildingId);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    document.body.classList.add('admin-theme');
    document.body.classList.remove('manager-theme');
    return () => {
      document.body.classList.remove('admin-theme');
    };
  }, []);

  // Staff nào cũng thao tác được cả hai chiều — gate được gán chỉ hiển thị dạng badge.
  const navItems = useMemo(
    () => [
      { to: '', label: 'Overview', icon: LayoutDashboard, end: true },
      { to: 'operations', label: 'Vehicle Check-in', icon: ScanLine },
      { to: 'checkout', label: 'Vehicle Check-out', icon: LogOut },
      { to: 'parked', label: 'Parked Vehicles', icon: Car },
      { to: 'my-shifts', label: 'My Shifts', icon: CalendarClock },
      { to: 'sessions', label: 'Shift History', icon: History },
      { to: 'incidents', label: 'Incidents', icon: ShieldAlert },
    ],
    [],
  );

  useEffect(() => {
    const assignedBuildingId = session?.assignedBuildingIds?.[0] ?? null;

    const loadBuildings = async () => {
      try {
        const res = await staffApi.buildings();
        const list = extractBuildings(res);
        if (list.length > 0) {
          setBuildings(list);
          setSelectedBuildingId((prev) => prev || list[0]._id || assignedBuildingId);
        } else if (assignedBuildingId) {
          const detailRes = await staffApi.buildingDetail(assignedBuildingId);
          const building = detailRes && typeof detailRes === 'object' && 'data' in detailRes ? (detailRes as { data?: StaffBuilding }).data : detailRes as StaffBuilding;
          if (building && building._id) {
            setBuildings([building]);
            setSelectedBuildingId(building._id);
          } else {
            setSelectedBuildingId(null);
          }
        } else {
          setSelectedBuildingId(null);
        }
      } catch (_err) {
        setSelectedBuildingId(assignedBuildingId);
      } finally {
        setBootstrapping(false);
      }
    };

    void loadBuildings();
  }, [session?.assignedBuildingIds]);

  const slug = useMemo(() => {
    const tail = location.pathname.replace(/^\/staff\/?/, '');
    if (!tail) return '';
    return tail.split('/')[0];
  }, [location.pathname]);

  const title = slug === 'sessions'
    ? 'Shift History'
    : (BASE_PAGE_TITLE[slug] ?? 'Staff');
  const selectedBuilding = buildings.find((b) => b._id === selectedBuildingId);
  const isProfileRoute = Boolean(useMatch('/staff/profile'));

  const onLogout = () => {
    logout();
    navigate('/auth/login', { replace: true });
  };

  return (
    <div className="portal-shell relative min-h-screen text-slate-900">
      <AppBackdrop />
      {/* Background glows */}
      <div className="pointer-events-none fixed inset-0 -z-10 hidden overflow-hidden">
        <div className="absolute -right-24 -top-24 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle_at_center,rgba(14,165,233,0.06),transparent_65%)] blur-3xl" />
        <div className="absolute bottom-0 left-0 h-[320px] w-[320px] rounded-full bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.04),transparent_60%)] blur-3xl" />
      </div>

      <div className="relative z-10 flex min-h-screen">
        {/* ── Sidebar ── */}
        <aside
          className={cn(
            'portal-sidebar sticky top-0 hidden h-screen border-r p-3 shadow-2xl backdrop-blur-xl lg:flex lg:flex-col transition-[width] duration-300 ease-out',
            collapsed ? 'w-[84px]' : 'w-[272px]',
          )}
        >
          {/* Sidebar header */}
          <div className="mb-5 flex items-center justify-between rounded-2xl border border-sky-100 bg-sky-50/70 p-3 shadow-xs">
            {!collapsed ? (
              <div className="pl-1 min-w-0">
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-sky-600">
                  PBMS Staff
                </p>
                <p className="text-xs font-extrabold text-slate-900">Operations Staff</p>
                {selectedBuilding ? (
                  <p className="mt-0.5 truncate text-[10px] text-slate-500">
                    {selectedBuilding.code} · {selectedBuilding.name}
                  </p>
                ) : null}
              </div>
            ) : (
              <ScanLine
                size={18}
                className="mx-auto text-blue-600 drop-shadow-[0_0_8px_rgba(37,99,235,0.25)]"
              />
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setCollapsed((p) => !p)}
              aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
              className="h-11 w-11 shrink-0 rounded-lg p-0 text-slate-500 hover:bg-sky-100/60 hover:text-blue-600"
            >
              <ChevronLeft
                size={14}
                className={cn('transition-transform duration-300', collapsed && 'rotate-180')}
              />
            </Button>
          </div>

          {/* Nav */}
          <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.label}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    cn(
                      'portal-nav-link flex min-h-11 items-center gap-3 rounded-xl px-3 text-xs font-bold transition-[background-color,color,box-shadow] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70',
                      isActive
                        ? 'portal-nav-link--active bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/20'
                        : 'text-slate-600 hover:bg-blue-50 hover:text-blue-700',
                    )
                  }
                >
                  <Icon size={15} className="shrink-0" />
                  {!collapsed ? <span className="tracking-wide">{item.label}</span> : null}
                </NavLink>
              );
            })}
          </nav>
        </aside>

        {/* ── Main area ── */}
        <div className="flex min-h-screen flex-1 flex-col">
          {/* Header */}
          <header className="portal-topbar sticky top-0 z-20 border-b px-4 py-3 backdrop-blur-xl md:px-6">
            <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-600">
                  Staff Operations
                </p>
                <h1 className="text-lg font-bold text-slate-900">{title}</h1>
              </div>

              <div className="flex items-center gap-2">
                {buildings.length > 1 ? (
                  <select
                    value={selectedBuildingId ?? ''}
                    onChange={(e) => setSelectedBuildingId(e.target.value)}
                    aria-label="Select building"
                    className="h-11 rounded-xl border border-border bg-white px-3 text-sm font-semibold text-slate-800 shadow-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10"
                  >
                    {buildings.map((b) => (
                      <option key={b._id} value={b._id}>
                        {b.code} — {b.name}
                      </option>
                    ))}
                  </select>
                ) : null}

                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild>
                    <button
                      type="button"
                      className="group inline-flex h-11 max-w-[220px] items-center gap-2.5 rounded-xl border border-border bg-white px-2.5 text-xs font-semibold text-slate-800 shadow-sm transition-[border-color,background-color,box-shadow] duration-200 hover:border-blue-300 hover:bg-blue-50/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60"
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-extrabold text-blue-600 border border-blue-200">
                        {(user?.fullName ?? user?.email ?? 'S')[0]?.toUpperCase()}
                      </span>
                      <span className="max-w-[120px] truncate text-slate-800 font-bold tracking-wide">
                        {user?.fullName || user?.email?.split('@')[0]}
                      </span>
                      <ChevronDown size={13} className="shrink-0 text-slate-400 transition-transform duration-300 group-aria-expanded:rotate-180 ml-0.5" />
                    </button>
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Portal>
                    <DropdownMenu.Content
                      align="end"
                      sideOffset={8}
                      collisionPadding={12}
                      className="z-50 w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_20px_48px_rgba(15,23,42,0.16)] outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
                    >
                      {/* Profile card */}
                      <div className="border-b border-slate-100 px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-emerald-500/25 bg-emerald-500/10">
                            <span className="text-base font-bold text-emerald-400">
                              {(user?.fullName ?? user?.email ?? 'S')[0]?.toUpperCase()}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-900 truncate">
                              {user?.fullName || 'Staff'}
                            </p>
                            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                            <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-emerald-500">
                              Staff
                            </p>
                          </div>
                        </div>

                        {/* Building info */}
                        {selectedBuilding && (
                          <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50/70 px-3 py-2">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Assigned Building</p>
                            <p className="mt-0.5 text-xs font-semibold text-slate-800">
                              {selectedBuilding.name}
                            </p>
                            <p className="text-[10px] text-slate-500">
                              {selectedBuilding.code}
                              {selectedBuilding.operatingHours
                                ? ` · ${selectedBuilding.operatingHours.open}–${selectedBuilding.operatingHours.close}`
                                : ''}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="p-1.5 space-y-1">
                        <DropdownMenu.Item
                          className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-3.5 text-xs font-bold text-slate-600 outline-none transition-colors duration-150 hover:bg-blue-50 hover:text-blue-700 focus:bg-blue-50 focus:text-blue-700"
                          onSelect={() => navigate('/staff/profile')}
                        >
                          <User size={15} className="text-blue-500" /> View Profile
                        </DropdownMenu.Item>
                        <DropdownMenu.Separator className="my-1.5 h-px bg-slate-100" />
                        <DropdownMenu.Item
                          className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-3.5 text-xs font-bold text-rose-500 outline-none transition-colors duration-150 hover:bg-rose-50 hover:text-rose-700 focus:bg-rose-50 focus:text-rose-700"
                          onSelect={onLogout}
                        >
                          <LogOut size={15} /> Sign Out
                        </DropdownMenu.Item>
                      </div>
                    </DropdownMenu.Content>
                  </DropdownMenu.Portal>
                </DropdownMenu.Root>
              </div>
            </div>
          </header>

          {/* Content */}
          <main className="portal-main flex-1 p-4 md:p-6 lg:p-8">
            <div className="mx-auto w-full max-w-[1600px]">
            {bootstrapping && !isProfileRoute ? (
              <div className="flex items-center gap-3 rounded-2xl border border-sky-200 bg-white/90 p-6 text-sm font-semibold text-slate-600" aria-live="polite">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                Loading assigned building...
              </div>
            ) : !selectedBuildingId && !isProfileRoute ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm font-semibold text-amber-800" role="alert">
                This account has not been assigned to any building. Please contact your manager.
              </div>
            ) : (
              <Outlet
                context={{ buildingId: selectedBuildingId ?? '', building: selectedBuilding ?? null }}
              />
            )}
            </div>
          </main>
        </div>
      </div>

      <MobileNavButton onOpen={() => setMobileNavOpen(true)} />
      <MobileNavDrawer open={mobileNavOpen} onClose={() => setMobileNavOpen(false)}>
        <div className="p-4">
          <div className="mb-5 rounded-2xl border border-sky-100 bg-sky-50/70 p-3 shadow-xs">
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-sky-600">PBMS Staff</p>
            <p className="text-xs font-extrabold text-slate-900">Operations Staff</p>
            {selectedBuilding ? (
              <p className="mt-0.5 truncate text-[10px] text-slate-500">
                {selectedBuilding.code} · {selectedBuilding.name}
              </p>
            ) : null}
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.label}
                  to={item.to}
                  end={item.end}
                  onClick={() => setMobileNavOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex min-h-11 items-center gap-3 rounded-xl px-3 text-xs font-bold transition-all duration-200',
                      isActive
                        ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/20'
                        : 'text-slate-600 hover:bg-blue-50 hover:text-blue-700',
                    )
                  }
                >
                  <Icon size={15} className="shrink-0" />
                  <span className="tracking-wide">{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>
      </MobileNavDrawer>
    </div>
  );
}
