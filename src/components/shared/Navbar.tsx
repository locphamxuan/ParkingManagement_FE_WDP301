import { useEffect, useRef, useState } from 'react';
import { Bell, ChevronDown, Search, User, LogOut } from 'lucide-react';
import AdminUserDropdown from './AdminUserDropdown';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface NavbarProps {
  title: string;
  email: string;
  onLogout: () => void;
}

export function Navbar({ title, email, onLogout }: NavbarProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-white/40 bg-white/60 px-6 py-4 backdrop-blur-3xl shadow-[0_4px_30px_rgba(120,83,48,0.02)]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-stone-500">
            HỆ THỐNG ĐIỀU HÀNH
          </p>
          <h1 className="text-xl font-bold tracking-tight text-stone-900 mt-0.5">{title}</h1>
        </div>

        <div className="flex flex-1 items-center justify-end gap-3">
          <div className="relative hidden w-full max-w-md md:block">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
              size={15}
            />
            <Input
              className="border-stone-200 bg-white/80 pl-10 text-stone-850 shadow-[0_2px_12px_rgba(0,0,0,0.02)] placeholder:text-stone-400 rounded-full h-9.5 premium-input"
              placeholder="Tìm kiếm nhanh..."
            />
          </div>

          <Button variant="secondary" size="sm" className="gap-2 rounded-full border border-stone-200 bg-white/80 hover:bg-stone-50 text-stone-700 shadow-sm h-9.5 px-4 transition-all">
            <Bell size={14} className="text-stone-500" />
            <span className="hidden sm:inline font-medium text-xs">Thông báo</span>
          </Button>

          {/* Custom user dropdown (desktop) */}
          <AdminUserDropdown email={email} onLogout={onLogout} />
          
        </div>
      </div>
    </header>
  );
}
