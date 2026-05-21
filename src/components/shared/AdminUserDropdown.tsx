import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, User, LogOut } from 'lucide-react';

interface Props {
  email: string;
  onLogout: () => void;
}

export function AdminUserDropdown({ email, onLogout }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const handleViewProfile = () => {
    setOpen(false);
    if (location.pathname.startsWith('/manager')) {
      navigate('/manager/profile');
    } else if (location.pathname.startsWith('/admin')) {
      navigate('/admin/dashboard/profile');
    } else {
      navigate('/profile');
    }
  };

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, []);

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/95 px-3 py-2 text-xs font-medium text-slate-900 shadow-sm transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 sm:text-sm"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setOpen(true);
            setTimeout(() => {
              const first = ref.current?.querySelector<HTMLButtonElement>('.user-dropdown-item');
              first?.focus();
            }, 0);
          }
          if (e.key === 'Escape') setOpen(false);
        }}
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 text-sky-700">
          <User size={16} />
        </span>
        <span className="max-w-[170px] truncate text-xs font-medium uppercase tracking-[0.06em] text-slate-700 sm:text-sm">
          {email}
        </span>
        <ChevronDown size={14} className="text-slate-500" />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-48 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl ring-1 ring-black/5">
          <button
            type="button"
            className="user-dropdown-item w-full px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-slate-50"
            onClick={handleViewProfile}
          >
            Hồ sơ
          </button>
          <button
            type="button"
            className="user-dropdown-item w-full px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-slate-50"
            onClick={onLogout}
          >
            <LogOut size={14} className="inline-block align-middle text-slate-500" />
            <span className="ml-2 align-middle">Đăng xuất</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default AdminUserDropdown;
