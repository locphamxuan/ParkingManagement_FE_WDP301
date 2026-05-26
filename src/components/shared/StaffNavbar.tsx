import { useEffect, useRef, useState } from "react";
import { Bell, ChevronDown, Search, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { StaffBuilding } from "@/services/staff/staffApi";

interface StaffNavbarProps {
  title: string;
  email: string;
  fullName?: string | null;
  buildings: StaffBuilding[];
  selectedBuildingId: string | null;
  onBuildingChange: (buildingId: string) => void;
  onLogout: () => void;
  onProfile?: () => void;
}

export function StaffNavbar({
  title,
  email,
  fullName,
  buildings,
  selectedBuildingId,
  onBuildingChange,
  onLogout,
  onProfile,
}: StaffNavbarProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const selectedBuilding = buildings.find(
    (building) => building._id === selectedBuildingId,
  );

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  return (
    <header className="sticky top-0 z-20 border-b border-white/8 bg-slate-900/90 px-6 py-4 backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.2)]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-slate-500">
            CONTROL SYSTEM
          </p>
          <h1 className="text-xl font-bold tracking-tight text-white mt-0.5">
            {title}
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            {selectedBuilding
              ? `${selectedBuilding.code} · ${selectedBuilding.name}`
              : "Select a building to continue"}
          </p>
        </div>

        <div className="flex flex-1 items-center justify-end gap-3">
          {buildings.length > 0 ? (
            <select
              value={selectedBuildingId ?? ""}
              onChange={(e) => onBuildingChange(e.target.value)}
              className="hidden h-9.5 rounded-full border border-white/10 bg-slate-800/70 px-3 text-sm text-slate-200 shadow-none outline-none md:block"
            >
              {buildings.map((building) => (
                <option key={building._id} value={building._id}>
                  {building.code} — {building.name}
                </option>
              ))}
            </select>
          ) : null}

          {/* removed search input per request; showing nothing here */}

          <Button
            variant="secondary"
            size="sm"
            className="gap-2 rounded-full border border-white/10 bg-slate-800/70 hover:bg-slate-700/80 text-slate-300 hover:text-white shadow-sm h-9.5 px-4 transition-all"
          >
            <Bell size={14} className="text-slate-400" />
            <span className="hidden sm:inline font-medium text-xs">
              Notifications
            </span>
          </Button>

          <div className="relative inline-block" ref={ref}>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-800/80 px-3 py-2 text-xs font-medium text-slate-200 shadow-sm transition hover:bg-slate-700/80 focus:outline-none focus:ring-2 focus:ring-orange-500/50 sm:text-sm"
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/20">
                <User size={16} />
              </span>
              <span className="max-w-[170px] truncate text-xs font-medium tracking-[0.06em] text-slate-300 sm:text-sm">
                {fullName ?? email}
              </span>
              <ChevronDown size={14} className="text-slate-500" />
            </button>

            {open ? (
              <div className="absolute right-0 z-50 mt-2 w-48 overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-xl shadow-black/40">
                <button
                  type="button"
                  className="w-full px-4 py-3 text-left text-sm text-slate-200 transition hover:bg-slate-800 border-b border-white/5"
                  onClick={() => onProfile?.()}
                >
                  <User
                    size={14}
                    className="inline-block align-middle text-slate-300"
                  />
                  <span className="ml-2 align-middle">Profile</span>
                </button>
                <button
                  type="button"
                  className="w-full px-4 py-3 text-left text-sm text-rose-400 transition hover:bg-slate-800 border-t border-white/5"
                  onClick={onLogout}
                >
                  <LogOut size={14} className="inline-block align-middle" />
                  <span className="ml-2 align-middle">Sign out</span>
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
