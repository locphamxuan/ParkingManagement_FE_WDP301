import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Bell, ChevronDown, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface NavbarProps {
  title: string;
  email: string;
  onLogout: () => void;
}

export function Navbar({ title, email, onLogout }: NavbarProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-border/80 bg-[rgba(255,250,243,0.86)] px-4 py-3 backdrop-blur-2xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Admin Operation Center</p>
          <h1 className="text-xl font-semibold">{title}</h1>
        </div>

        <div className="flex flex-1 items-center justify-end gap-2">
          <div className="relative hidden w-full max-w-md md:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input
              className="border-border/80 bg-white/92 pl-9 shadow-[0_8px_20px_rgba(120,83,48,0.06)] placeholder:text-muted-foreground/80"
              placeholder="Search buildings, logs, sessions..."
            />
          </div>

          <Button variant="secondary" size="sm" className="gap-2">
            <Bell size={15} />
            <span className="hidden sm:inline">Alerts</span>
          </Button>

          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <Button variant="secondary" className="gap-2">
                <span className="max-w-[170px] truncate text-xs sm:text-sm">{email}</span>
                <ChevronDown size={14} />
              </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                sideOffset={6}
                className="z-50 min-w-[180px] rounded-md border border-border/80 bg-[rgba(255,250,243,0.98)] p-1 shadow-[0_20px_45px_rgba(120,83,48,0.16)]"
              >
                <DropdownMenu.Item className="rounded px-3 py-2 text-sm text-foreground outline-none hover:bg-primary/10">
                  Profile
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  className="rounded px-3 py-2 text-sm text-orange-600 outline-none hover:bg-orange-500/10"
                  onClick={onLogout}
                >
                  Logout
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </div>
    </header>
  );
}
