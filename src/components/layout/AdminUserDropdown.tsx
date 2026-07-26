import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, LogOut, User } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { cn } from '@/utils/cn';

interface Props {
  email: string;
  onLogout: () => void;
  fullName?: string;
  role?: string;
}

export function AdminUserDropdown({ email, onLogout, fullName, role }: Props) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleViewProfile = () => {
    if (location.pathname.startsWith('/manager')) {
      navigate('/manager/profile');
    } else if (location.pathname.startsWith('/admin')) {
      navigate('/admin/profile');
    }
  };

  const initials = (fullName ?? email)[0]?.toUpperCase() ?? '?';
  const displayName = fullName || email;
  const roleBadgeColor =
    role === 'admin'
      ? 'text-rose-500 dark:text-rose-400'
      : role === 'manager'
      ? 'text-sky-600 dark:text-amber-400'
      : 'text-emerald-600 dark:text-sky-400';

  return (
    <DropdownMenu.Root open={open} onOpenChange={setOpen}>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className="group inline-flex h-11 max-w-[220px] items-center gap-2 rounded-xl border border-border bg-white px-2.5 text-xs font-semibold text-slate-800 shadow-sm transition-[border-color,background-color,box-shadow] duration-200 hover:border-blue-300 hover:bg-blue-50/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-sm font-bold text-primary">
            {initials}
          </span>
          <span className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-800">
            {displayName}
          </span>
          <ChevronDown
            size={13}
            className={cn('shrink-0 text-slate-400 transition-transform duration-200', open && 'rotate-180')}
          />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          collisionPadding={12}
          className="z-50 w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-[0_20px_48px_rgba(15,23,42,0.16)] outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
        >
          <div className="border-b border-slate-100 px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
                <span className="text-sm font-bold text-primary">{initials}</span>
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">{fullName || '—'}</p>
                <p className="truncate text-xs text-slate-500">{email}</p>
                {role && (
                  <p className={`mt-0.5 text-[10px] font-bold uppercase tracking-widest ${roleBadgeColor}`}>
                    {role}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-1 p-1.5">
            <DropdownMenu.Item
              className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-3.5 text-xs font-bold text-slate-600 outline-none transition-colors duration-150 hover:bg-blue-50 hover:text-blue-700 focus:bg-blue-50 focus:text-blue-700"
              onSelect={handleViewProfile}
            >
              <User size={15} />
              View Profile
            </DropdownMenu.Item>
            <DropdownMenu.Separator className="my-1 h-px bg-slate-100" />
            <DropdownMenu.Item
              className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-3.5 text-xs font-bold text-rose-500 outline-none transition-colors duration-150 hover:bg-rose-50 hover:text-rose-700 focus:bg-rose-50 focus:text-rose-700"
              onSelect={onLogout}
            >
              <LogOut size={15} />
              Log out
            </DropdownMenu.Item>
          </div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

export default AdminUserDropdown;
