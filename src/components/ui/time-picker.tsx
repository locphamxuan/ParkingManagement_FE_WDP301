import { useState } from 'react';
import { Clock } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { cn } from '@/utils/cn';

interface TimePickerProps {
  value: string; // "HH:mm" format (24h)
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
  ariaLabel?: string;
}

export function TimePicker({
  value,
  onChange,
  className,
  disabled = false,
  ariaLabel = 'Select time',
}: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Parse 24h format to 12h format components
  const parseTime = (timeStr: string) => {
    if (!timeStr) return { hour: '12', minute: '00', period: 'AM' };
    const [hStr, mStr] = timeStr.split(':');
    let h = parseInt(hStr, 10);
    const m = mStr || '00';
    if (isNaN(h)) h = 12;
    const period = h >= 12 ? 'PM' : 'AM';
    let hour12 = h % 12;
    if (hour12 === 0) hour12 = 12;
    return {
      hour: String(hour12).padStart(2, '0'),
      minute: String(m).padStart(2, '0'),
      period,
    };
  };

  const { hour, minute, period } = parseTime(value);

  // Convert 12h components to 24h string
  const updateTime = (h: string, m: string, p: string) => {
    let hourVal = parseInt(h, 10);
    if (p === 'PM' && hourVal < 12) hourVal += 12;
    if (p === 'AM' && hourVal === 12) hourVal = 0;
    const formatted = `${String(hourVal).padStart(2, '0')}:${m}`;
    onChange(formatted);
  };

  const hoursList = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
  const minutesList = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));
  const periodsList = ['AM', 'PM'];

  const displayTime = `${hour}:${minute} ${period}`;

  return (
    <div className={cn('relative w-full', className)}>
      <DropdownMenu.Root open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenu.Trigger asChild>
          <button
            type="button"
            disabled={disabled}
            aria-label={ariaLabel}
            className={cn(
              "flex min-h-11 w-full items-center justify-between rounded-xl border border-border bg-card px-3.5 text-sm font-semibold text-foreground shadow-sm outline-none transition-[border-color,box-shadow,background-color] duration-200 hover:border-primary/25 focus:border-primary/45 focus:ring-4 focus:ring-ring/10",
              isOpen && "border-primary/50 ring-4 ring-primary/10",
              disabled && "cursor-not-allowed opacity-50"
            )}
          >
            <span className="text-left font-medium">{displayTime}</span>
            <Clock size={16} className="text-muted-foreground shrink-0 ml-2" />
          </button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="start"
            sideOffset={8}
            collisionPadding={12}
            className="z-[9999] grid h-72 w-[min(18rem,calc(100vw-2rem))] grid-cols-[1fr_1fr_4.5rem] grid-rows-[1fr_auto] gap-1 rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_18px_48px_rgba(15,23,42,0.16)] outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
          >
            {/* Hour Column */}
            <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar border-r border-border pr-1">
              <span className="text-[9px] font-black uppercase text-muted-foreground text-center mb-1 sticky top-0 bg-card py-1">Hour</span>
              {hoursList.map((h) => {
                const isSelected = h === hour;
                return (
                  <DropdownMenu.Item key={h} asChild onSelect={(event) => event.preventDefault()}>
                    <button
                      type="button"
                      aria-label={`${h} hour`}
                      onClick={() => updateTime(h, minute, period)}
                      className={cn(
                        "min-h-10 rounded-lg px-2 text-center text-xs font-semibold text-muted-foreground outline-none transition-colors duration-150 hover:bg-muted hover:text-foreground focus:bg-muted focus:text-foreground",
                        isSelected && "bg-primary text-primary-foreground hover:bg-primary/90 focus:bg-primary/90 font-black shadow-sm"
                      )}
                    >
                      {h}
                    </button>
                  </DropdownMenu.Item>
                );
              })}
            </div>

            {/* Minute Column */}
            <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar border-r border-border pr-1">
              <span className="text-[9px] font-black uppercase text-muted-foreground text-center mb-1 sticky top-0 bg-card py-1">Minute</span>
              {minutesList.map((m) => {
                const isSelected = m === minute;
                return (
                  <DropdownMenu.Item key={m} asChild onSelect={(event) => event.preventDefault()}>
                    <button
                      type="button"
                      aria-label={`${m} minutes`}
                      onClick={() => updateTime(hour, m, period)}
                      className={cn(
                        "min-h-10 rounded-lg px-2 text-center text-xs font-semibold text-muted-foreground outline-none transition-colors duration-150 hover:bg-muted hover:text-foreground focus:bg-muted focus:text-foreground",
                        isSelected && "bg-primary text-primary-foreground hover:bg-primary/90 focus:bg-primary/90 font-black shadow-sm"
                      )}
                    >
                      {m}
                    </button>
                  </DropdownMenu.Item>
                );
              })}
            </div>

            {/* Period Column */}
            <div className="w-16 flex flex-col justify-start">
              <span className="text-[9px] font-black uppercase text-muted-foreground text-center mb-1 py-1">Period</span>
              <div className="flex flex-col gap-1">
                {periodsList.map((p) => {
                  const isSelected = p === period;
                  return (
                    <DropdownMenu.Item key={p} asChild onSelect={(event) => event.preventDefault()}>
                      <button
                        type="button"
                        aria-label={p}
                        onClick={() => updateTime(hour, minute, p)}
                        className={cn(
                          "min-h-10 rounded-lg px-2 text-center text-xs font-semibold text-muted-foreground outline-none transition-colors duration-150 hover:bg-muted hover:text-foreground focus:bg-muted focus:text-foreground",
                          isSelected && "bg-primary text-primary-foreground hover:bg-primary/90 focus:bg-primary/90 font-black shadow-sm"
                        )}
                      >
                        {p}
                      </button>
                    </DropdownMenu.Item>
                  );
                })}
              </div>
            </div>

            <div className="col-span-3 border-t border-slate-100 pt-2">
              <DropdownMenu.Item
                className="flex min-h-10 cursor-pointer items-center justify-center rounded-xl bg-blue-600 px-4 text-xs font-black uppercase tracking-wider text-white outline-none transition-colors hover:bg-blue-700 focus:bg-blue-700"
                onSelect={() => setIsOpen(false)}
              >
                Done
              </DropdownMenu.Item>
            </div>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  );
}
