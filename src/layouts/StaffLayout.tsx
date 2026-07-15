import { useEffect, useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation, useMatch, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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

  // Áp admin-theme lên body để dùng chung CSS variable
  useEffect(() => {
    document.body.classList.add('admin-theme');
    document.body.classList.remove('manager-theme');
    return () => { document.body.classList.remove('admin-theme'); };
  }, []);

  const navItems = useMemo(
    () => [
      { to: '', label: 'Overview',         icon: LayoutDashboard,    end: true },
      ...(showCheckIn  ? [{ to: 'operations', label: 'Check-in',  icon: ScanLine }]  : []),
      ...(showCheckOut ? [{ to: 'checkout',   label: 'Check-out', icon: LogOut }]    : []),
      { to: 'parked',       label: 'Parked vehicles', icon: Car             },
      { to: 'reservations', label: 'Reservations',    icon: CalendarCheck2  },
      { to: 'sessions',     label: 'Revenue',          icon: CircleDollarSign },
      { to: 'my-shifts',    label: 'My shifts',        icon: CalendarClock   },
      { to: 'incidents',    label: 'Incidents',        icon: ShieldAlert     },
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
    return tail ? tail.split('/')[0] : '';
  }, [location.pathname]);

  const title            = pageTitle[slug] ?? 'Staff';
  const selectedBuilding = buildings.find((b) => b._id === selectedBuildingId);
  const isProfileRoute   = Boolean(useMatch('/staff/profile'));
  const onLogout         = () => { logout(); navigate('/auth/login', { replace: true }); };

  return (
    <div className="relative min-h-screen bg-[#f8fafc] text-[#0f172a] transition-colors duration-200">
      {/* Admin-style ambient glow */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle at center, rgba(14,165,233,0.05) 0%, transparent 65%)', filter: 'blur(40px)' }} />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full"
          style={{ background: 'radial-gradient(circle at center, rgba(56,189,248,0.04) 0%, transparent 60%)', filter: 'blur(36px)' }} />
      </div>

      <div className="relative z-10 flex min-h-screen">

        {/* ════ SIDEBAR ════ */}
        <aside
          className={cn(
            'sticky top-0 hidden h-screen lg:flex lg:flex-col shrink-0 overflow-hidden transition-all duration-300 ease-in-out',
            collapsed ? 'w-[76px]' : 'w-[240px]',
          )}
          style={{
            background: 'rgba(255,255,255,0.62)',
            borderRight: '1px solid rgba(14,165,233,0.12)',
            boxShadow: '4px 0 32px rgba(14,165,233,0.04)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
          }}
        >
          {/* Brand header card */}
          <div
            className="relative m-3 mb-4 overflow-hidden rounded-2xl p-3.5 shrink-0"
            style={{
              background: 'linear-gradient(135deg, rgba(14,165,233,0.1) 0%, rgba(56,189,248,0.06) 55%, rgba(2,132,199,0.08) 100%)',
              border: '1px solid rgba(14,165,233,0.18)',
              boxShadow: '0 4px 20px rgba(14,165,233,0.05), inset 0 1px 0 rgba(255,255,255,0.8)',
            }}
          >
            {/* Corner sparkle */}
            <div style={{
              position: 'absolute', top: -8, right: -8, width: 44, height: 44, borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(56,189,248,0.2) 0%, transparent 70%)',
              pointerEvents: 'none',
            }} />

            <div className="flex items-center justify-between gap-2">
              {!collapsed ? (
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                    </span>
                    <p className="text-[9px] font-black uppercase tracking-[0.25em] text-sky-600 truncate">
                      PBMS Staff
                    </p>
                  </div>
                  <p className="text-[11px] font-extrabold text-slate-800 mt-1 truncate">Operations staff</p>
                  {selectedBuilding && (
                    <p className="text-[10px] text-slate-500 mt-1.5 font-semibold truncate">
                      🏢 {selectedBuilding.name}
                    </p>
                  )}
                </div>
              ) : (
                <div className="relative mx-auto flex items-center justify-center">
                  <span className="absolute -top-1 -right-1 flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  </span>
                  <ScanLine
                    size={17}
                    className="text-sky-500"
                    style={{ filter: 'drop-shadow(0 0 5px rgba(14,165,233,0.4))' }}
                  />
                </div>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setCollapsed(p => !p)}
                className="h-6 w-6 shrink-0 rounded-lg p-0 text-slate-400 hover:bg-sky-100/60 hover:text-sky-600"
              >
                <ChevronLeft size={13} className={cn('transition-transform duration-300', collapsed && 'rotate-180')} />
              </Button>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 pb-4 custom-scrollbar">
            <AnimatePresence>
              {navItems.map(item => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.label}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      cn(
                        'group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all duration-200 z-10 overflow-hidden',
                        isActive
                          ? 'bg-sky-500 text-white shadow-md font-extrabold'
                          : 'text-slate-500 hover:bg-sky-50/50 hover:text-sky-600',
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon size={15} className="shrink-0 transition-transform duration-200 group-hover:scale-110" />
                        {!collapsed && <span className="tracking-wide">{item.label}</span>}
                        {isActive && (
                          <motion.div
                            layoutId="activeNavBg"
                            className="absolute inset-0 bg-gradient-to-r from-sky-500 to-sky-600 -z-10"
                            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                          />
                        )}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </AnimatePresence>
          </nav>
        </aside>

        {/* Mobile nav */}
        <MobileNavButton onOpen={() => setMobileNavOpen(true)} />
        <MobileNavDrawer open={mobileNavOpen} onClose={() => setMobileNavOpen(false)}>
          <div className="p-4" style={{ background: 'rgba(255,255,255,0.95)', minHeight: '100%' }}>
            <div className="mb-5 rounded-2xl p-3"
              style={{ background: 'rgba(14,165,233,0.07)', border: '1px solid rgba(14,165,233,0.15)' }}>
              <p className="text-[9px] font-black uppercase tracking-[0.25em] text-sky-500">PBMS Staff</p>
              <p className="text-xs font-extrabold text-slate-800">Operations staff</p>
              {selectedBuilding && <p className="mt-0.5 truncate text-[10px] text-slate-500">{selectedBuilding.code} · {selectedBuilding.name}</p>}
            </div>
            <nav className="space-y-0.5">
              {navItems.map(item => {
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
                        isActive ? 'text-white shadow-md' : 'text-slate-500 hover:bg-sky-50 hover:text-sky-700',
                      )
                    }
                    style={({ isActive }) => isActive ? { background: 'linear-gradient(135deg, #0ea5e9, #0284c7)', boxShadow: '0 4px 14px rgba(14,165,233,0.28)' } : {}}
                  >
                    <Icon size={15} className="shrink-0" />
                    <span className="tracking-wide">{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>
        </MobileNavDrawer>

        {/* ════ MAIN AREA ════ */}
        <div className="flex min-h-screen flex-1 flex-col">

          {/* Top header — admin style */}
          <header
            className="sticky top-0 z-20 px-5 py-3.5"
            style={{
              background: 'rgba(255,255,255,0.85)',
              borderBottom: '1px solid rgba(14,165,233,0.1)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              boxShadow: '0 1px 20px rgba(14,165,233,0.04)',
            }}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-sky-500">Staff Portal</p>
                <h1 className="text-lg font-bold text-slate-800">{title}</h1>
              </div>

              <div className="flex items-center gap-2">
                {buildings.length > 1 && (
                  <select
                    value={selectedBuildingId ?? ''}
                    onChange={e => setSelectedBuildingId(e.target.value)}
                    className="h-9 rounded-lg px-3 text-sm text-slate-800 outline-none"
                    style={{
                      background: 'rgba(255,255,255,0.9)',
                      border: '1px solid rgba(14,165,233,0.2)',
                      boxShadow: '0 1px 4px rgba(14,165,233,0.06)',
                    }}
                  >
                    {buildings.map(b => <option key={b._id} value={b._id}>{b.code} — {b.name}</option>)}
                  </select>
                )}

                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild>
                    <button
                      type="button"
                      className="inline-flex items-center gap-2.5 rounded-full px-3.5 py-2 text-xs font-semibold text-slate-800 cursor-pointer outline-none transition-all duration-200 hover:shadow-md"
                      style={{
                        background: 'rgba(255,255,255,0.9)',
                        border: '1px solid rgba(14,165,233,0.18)',
                        boxShadow: '0 2px 10px rgba(14,165,233,0.07)',
                        backdropFilter: 'blur(8px)',
                      }}
                    >
                      <span
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-extrabold"
                        style={{
                          background: 'linear-gradient(135deg, #e0f2fe, #bae6fd)',
                          border: '1px solid rgba(14,165,233,0.25)',
                          color: '#0284c7',
                        }}
                      >
                        {(user?.fullName ?? user?.email ?? 'S')[0]?.toUpperCase()}
                      </span>
                      <span className="max-w-[120px] truncate font-bold">
                        {user?.fullName || user?.email?.split('@')[0]}
                      </span>
                      <ChevronDown size={13} className="text-slate-400 shrink-0" />
                    </button>
                  </DropdownMenu.Trigger>

                  <DropdownMenu.Portal>
                    <DropdownMenu.Content
                      sideOffset={6}
                      className="z-50 w-72 overflow-hidden rounded-2xl"
                      style={{
                        background: 'rgba(255,255,255,0.96)',
                        border: '1px solid rgba(14,165,233,0.14)',
                        boxShadow: '0 20px 50px rgba(14,165,233,0.12), 0 4px 12px rgba(0,0,0,0.06)',
                        backdropFilter: 'blur(20px)',
                      }}
                    >
                      <div className="px-4 py-4" style={{ borderBottom: '1px solid rgba(14,165,233,0.08)' }}>
                        <div className="flex items-center gap-3">
                          <div
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                            style={{ background: 'linear-gradient(135deg, #e0f2fe, #bae6fd)', border: '1px solid rgba(14,165,233,0.22)' }}
                          >
                            <span className="text-base font-bold text-sky-600">
                              {(user?.fullName ?? user?.email ?? 'S')[0]?.toUpperCase()}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-800 truncate">{user?.fullName || 'Staff'}</p>
                            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                            <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-sky-500">Staff</p>
                          </div>
                        </div>
                        {selectedBuilding && (
                          <div className="mt-3 rounded-xl px-3 py-2"
                            style={{ background: 'rgba(14,165,233,0.05)', border: '1px solid rgba(14,165,233,0.12)' }}>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Assigned building</p>
                            <p className="mt-0.5 text-xs font-semibold text-slate-700">{selectedBuilding.name}</p>
                            <p className="text-[10px] text-slate-400">
                              {selectedBuilding.code}{selectedBuilding.operatingHours ? ` · ${selectedBuilding.operatingHours.open}–${selectedBuilding.operatingHours.close}` : ''}
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="p-1.5 space-y-0.5">
                        <DropdownMenu.Item
                          className="flex cursor-pointer items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-600 outline-none transition-all duration-150 hover:bg-sky-50 hover:text-sky-700"
                          onClick={() => navigate('/staff/profile')}
                        >
                          <User size={14} className="text-sky-500" /> View profile
                        </DropdownMenu.Item>
                        <DropdownMenu.Separator style={{ height: 1, background: 'rgba(14,165,233,0.07)', margin: '4px 0' }} />
                        <DropdownMenu.Item
                          className="flex cursor-pointer items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-bold text-rose-500 outline-none transition-all duration-150 hover:bg-rose-50"
                          onClick={onLogout}
                        >
                          <LogOut size={14} /> Log out
                        </DropdownMenu.Item>
                      </div>
                    </DropdownMenu.Content>
                  </DropdownMenu.Portal>
                </DropdownMenu.Root>
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 p-4 md:p-6">
            {bootstrapping && !isProfileRoute ? (
              <div className="rounded-2xl p-6 text-sm text-slate-400"
                style={{ background: 'rgba(14,165,233,0.04)', border: '1px solid rgba(14,165,233,0.1)' }}>
                Loading...
              </div>
            ) : !selectedBuildingId && !isProfileRoute ? (
              <div className="rounded-2xl p-6 text-sm text-amber-600"
                style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.18)' }}>
                This account has not been assigned to any building. Please contact a manager.
              </div>
            ) : (
              <Outlet context={{ buildingId: selectedBuildingId ?? '', building: selectedBuilding ?? null }} />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
