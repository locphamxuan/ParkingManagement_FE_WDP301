import { useEffect, useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation, useMatch, useNavigate } from 'react-router-dom';
import {
  CalendarClock,
  CalendarCheck2,
  Car,
  ChevronLeft,
  ChevronDown,
  CircleDollarSign,
  LayoutDashboard,
  LogOut,
  ScanLine,
  ShieldAlert,
  User,
} from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Button } from '@/components/ui/button';
import { MobileNavDrawer, MobileNavButton } from '@/components/layout/MobileNavDrawer';
import { useAuth } from '@/hooks/useAuth';
import { useAssignedGates } from '@/hooks/staff/useAssignedGates';
import { staffApi, extractBuildings, type StaffBuilding } from '@/services/staff/staffApi';
import { cn } from '@/utils/cn';

const pageTitle: Record<string, string> = {
  '': 'Overview',
  dashboard: 'Overview',
  operations: 'Check-in',
  checkout: 'Check-out',
  parked: 'Parked vehicles',
  reservations: 'Reservations',
  sessions: 'Revenue',
  'my-shifts': 'My shifts',
  incidents: 'Incidents',
};

export function StaffLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { showCheckIn, showCheckOut } = useAssignedGates();
  const [buildings, setBuildings] = useState<StaffBuilding[]>([]);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Entry gate → check-in (only entry-gate staff see this tab). The "Parked vehicles" page is shown to
  // both staff types, but only exit-gate staff can process payments.
  const navItems = useMemo(
    () => [
      { to: '', label: 'Overview', icon: LayoutDashboard, end: true },
      ...(showCheckIn ? [{ to: 'operations', label: 'Check-in', icon: ScanLine }] : []),
      ...(showCheckOut ? [{ to: 'checkout', label: 'Check-out', icon: LogOut }] : []),
      { to: 'parked', label: 'Parked vehicles', icon: Car },
      { to: 'reservations', label: 'Reservations', icon: CalendarCheck2 },
      { to: 'sessions', label: 'Revenue', icon: CircleDollarSign },
      { to: 'my-shifts', label: 'My shifts', icon: CalendarClock },
      { to: 'incidents', label: 'Incidents', icon: ShieldAlert },
    ],
    [showCheckIn, showCheckOut],
  );

  useEffect(() => {
    staffApi
      .buildings()
      .then((res) => {
        const list = extractBuildings(res.data as StaffBuilding[] | { items: StaffBuilding[] });
        setBuildings(list);
        setSelectedBuildingId(list[0]?._id ?? null);
      })
      .catch(() => undefined)
      .finally(() => setBootstrapping(false));
  }, []);

  const slug = useMemo(() => {
    const tail = location.pathname.replace(/^\/staff\/?/, '');
    if (!tail) return '';
    return tail.split('/')[0];
  }, [location.pathname]);

  const title = pageTitle[slug] ?? 'Staff';
  const selectedBuilding = buildings.find((b) => b._id === selectedBuildingId);
  const isProfileRoute = Boolean(useMatch('/staff/profile'));

  const onLogout = () => {
    logout();
    navigate('/auth/login', { replace: true });
  };

  return (
    <div className="relative min-h-screen bg-background text-foreground transition-colors duration-200">
      {/* Subtle blue/cyan ambient glow for staff theme */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle_at_center,rgba(14,165,233,0.04),transparent_65%)] blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.03),transparent_60%)] blur-3xl" />
      </div>

      <div className="relative z-10 flex min-h-screen">
        {/* ── Sidebar ── */}
        <aside
          className={cn(
            'sticky top-0 hidden h-screen border-r border-sky-100 bg-white p-4 shadow-[4px_0_30px_rgba(14,165,233,0.015)] lg:flex lg:flex-col transition-all duration-300 ease-in-out shrink-0',
            collapsed ? 'w-[80px]' : 'w-[248px]',
          )}
        >
          {/* Sidebar header */}
          <div className="mb-5 flex items-center justify-between rounded-2xl border border-sky-100 bg-sky-50/50 p-3 shadow-sm">
            {!collapsed ? (
              <div className="pl-1 min-w-0">
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-sky-600">
                  PBMS Staff
                </p>
                <p className="text-xs font-extrabold text-slate-800">Operations staff</p>
                {selectedBuilding ? (
                  <p className="mt-0.5 truncate text-[10px] text-slate-500">
                    {selectedBuilding.code} · {selectedBuilding.name}
                  </p>
                ) : null}
              </div>
            ) : (
              <ScanLine
                size={18}
                className="mx-auto text-sky-500 drop-shadow-[0_0_8px_rgba(14,165,233,0.25)] animate-pulse"
              />
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setCollapsed((p) => !p)}
              className="h-7 w-7 shrink-0 rounded-lg p-0 text-slate-400 hover:bg-sky-100/50 text-slate-400 hover:text-sky-600"
            >
              <ChevronLeft
                size={14}
                className={cn('transition-transform duration-300', collapsed && 'rotate-180')}
              />
            </Button>
          </div>

          {/* Nav */}
          <nav className="flex-1 space-y-1 overflow-y-auto pr-1 custom-scrollbar">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.label}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all duration-200',
                      isActive
                        ? 'bg-sky-500 text-white shadow-md shadow-sky-500/10 scale-[1.02]'
                        : 'text-slate-500 hover:bg-sky-50/50 hover:text-sky-600',
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

        {/* Điều hướng mobile (<lg): aside desktop bị hidden nên cần drawer + FAB. */}
        <MobileNavButton onOpen={() => setMobileNavOpen(true)} />
        <MobileNavDrawer open={mobileNavOpen} onClose={() => setMobileNavOpen(false)}>
          <div className="p-4">
            <div className="mb-5 rounded-2xl border border-sky-100 bg-sky-50/50 p-3">
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-sky-600">PBMS Staff</p>
              <p className="text-xs font-extrabold text-slate-800">Operations staff</p>
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
                        'flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all duration-200',
                        isActive
                          ? 'bg-sky-500 text-white shadow-md shadow-sky-500/10'
                          : 'text-slate-500 hover:bg-sky-50/50 hover:text-sky-600',
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

        {/* ── Main area ── */}
        <div className="flex min-h-screen flex-1 flex-col">
          {/* Header */}
          <header className="sticky top-0 z-20 border-b border-sky-100 bg-white px-5 py-3.5 backdrop-blur-xl">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-sky-600">Staff Portal</p>
                <h1 className="text-lg font-semibold text-slate-800">{title}</h1>
              </div>

              <div className="flex items-center gap-2">
                {buildings.length > 1 ? (
                  <select
                    value={selectedBuildingId ?? ''}
                    onChange={(e) => setSelectedBuildingId(e.target.value)}
                    className="h-9 rounded-lg border border-sky-100 bg-slate-50 px-3 text-sm text-slate-800 outline-none focus:ring-1 focus:ring-sky-500"
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
                      className="group inline-flex items-center gap-2.5 rounded-full border border-sky-100 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 shadow-md backdrop-blur-md transition-all duration-300 hover:bg-sky-50/50 hover:border-sky-500/30 hover:shadow-[0_0_15px_rgba(14,165,233,0.15)] focus:outline-none focus:ring-2 focus:ring-sky-500/40 cursor-pointer"
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sky-100 text-xs font-extrabold text-sky-600 border border-sky-200 shadow-inner">
                        {(user?.fullName ?? user?.email ?? 'S')[0]?.toUpperCase()}
                      </span>
                      <span className="max-w-[120px] truncate text-slate-800 font-bold tracking-wide">
                        {user?.fullName || user?.email?.split('@')[0]}
                      </span>
                      <ChevronDown size={13} className="shrink-0 text-slate-500 transition-transform duration-300 group-aria-expanded:rotate-180 ml-0.5" />
                    </button>
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Portal>
                    <DropdownMenu.Content
                      sideOffset={6}
                      className="z-50 w-72 overflow-hidden rounded-2xl border border-sky-100 bg-white shadow-[0_20px_45px_rgba(14,165,233,0.08)]"
                    >
                      {/* Profile card */}
                      <div className="border-b border-sky-100 px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-sky-200 bg-sky-50">
                            <span className="text-base font-bold text-sky-600">
                              {(user?.fullName ?? user?.email ?? 'S')[0]?.toUpperCase()}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-800 truncate">
                              {user?.fullName || 'Staff'}
                            </p>
                            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                            <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-sky-600">
                              Staff
                            </p>
                          </div>
                        </div>

                        {/* Building info */}
                        {selectedBuilding && (
                          <div className="mt-3 rounded-xl border border-sky-100 bg-sky-50/50 px-3 py-2">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Assigned building</p>
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
                          className="flex cursor-pointer items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-700 outline-none transition-all duration-200 hover:bg-sky-500/10 hover:text-sky-600 focus:bg-sky-500/10 focus:text-sky-600"
                          onClick={() => navigate('/staff/profile')}
                        >
                          <User size={14} className="text-sky-600" />View profile</DropdownMenu.Item>
                        <DropdownMenu.Separator className="my-1.5 h-px bg-sky-50" />
                        <DropdownMenu.Item
                          className="flex cursor-pointer items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-bold text-rose-600 outline-none transition-all duration-200 hover:bg-rose-500/10 hover:text-rose-700 focus:bg-rose-500/10 focus:text-rose-700"
                          onClick={onLogout}
                        >
                          <LogOut size={14} />Log out</DropdownMenu.Item>
                      </div>
                    </DropdownMenu.Content>
                  </DropdownMenu.Portal>
                </DropdownMenu.Root>
              </div>
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 p-4 md:p-6">
            {bootstrapping && !isProfileRoute ? (
              <div className="rounded-2xl border border-sky-100 bg-sky-50 p-6 text-sm text-slate-400">Loading...</div>
            ) : !selectedBuildingId && !isProfileRoute ? (
              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/8 p-6 text-sm text-amber-600">This account has not been assigned to any building. Please contact a manager.</div>
            ) : (
              <Outlet
                context={{ buildingId: selectedBuildingId ?? '', building: selectedBuilding ?? null }}
              />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
