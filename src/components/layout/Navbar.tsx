import { Bell, Command, Radio } from 'lucide-react';
import AdminUserDropdown from './AdminUserDropdown';
import { Button } from '@/components/ui/button';

interface NavbarProps {
  title: string;
  email: string;
  onLogout: () => void;
  fullName?: string;
  role?: string;
  showNotification?: boolean;
  /** Hide search bar (default false) */
  hideSearch?: boolean;
  /** Show compact profile (unused — kept for API compat) */
  compactProfile?: boolean;
}

export function Navbar({ title, email, onLogout, fullName, role, showNotification = true }: NavbarProps) {
  return (
    <header className="portal-topbar sticky top-0 z-20 border-b px-4 py-3 backdrop-blur-xl transition-all duration-200 md:px-6">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600 shadow-sm sm:flex">
            <Command size={17} />
          </div>
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">
              <Radio size={9} className="text-success" />
              Operations workspace
            </p>
            <h1 className="mt-0.5 truncate text-lg font-extrabold tracking-tight text-slate-950">
            {title}
            </h1>
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2 sm:gap-3">
          {showNotification && (
            <Button
              variant="outline"
              size="sm"
              aria-label="Notifications"
              className="h-10 w-10 rounded-xl p-0 sm:w-auto sm:px-3"
            >
              <Bell size={15} />
              <span className="hidden text-xs sm:inline">Notifications</span>
            </Button>
          )}

          <AdminUserDropdown
            email={email}
            onLogout={onLogout}
            fullName={fullName}
            role={role}
          />
        </div>
      </div>
    </header>
  );
}
