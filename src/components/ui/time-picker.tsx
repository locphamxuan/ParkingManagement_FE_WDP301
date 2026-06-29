import { useState } from 'react';
import { Clock } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { cn } from '@/utils/cn';

interface TimePickerProps {
  value: string; // "HH:mm" format (24h)
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

export function TimePicker({ value, onChange, className, disabled = false }: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Parse 24h format to 12h format components
  const parseTime = (timeStr: string) => {
    if (!timeStr) return { hour: '12', minute: '00', period: 'SA' };
    const [hStr, mStr] = timeStr.split(':');
    let h = parseInt(hStr, 10);
    const m = mStr || '00';
    if (isNaN(h)) h = 12;
    const period = h >= 12 ? 'CH' : 'SA';
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
    if (p === 'CH' && hourVal < 12) hourVal += 12;
    if (p === 'SA' && hourVal === 12) hourVal = 0;
    const formatted = `${String(hourVal).padStart(2, '0')}:${m}`;
    onChange(formatted);
  };

  const hoursList = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
  const minutesList = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));
  const periodsList = ['SA', 'CH'];

  const displayTime = `${hour}:${minute} ${period}`;

  return (
    <div className={cn('relative w-full', className)}>
      <DropdownMenu.Root open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenu.Trigger asChild>
          <button
            type="button"
            disabled={disabled}
            className={cn(
              "flex h-10 w-full items-center justify-between rounded-xl border border-border bg-card px-3 text-sm font-semibold text-foreground outline-none transition-all duration-300 hover:border-muted-foreground/30",
              isOpen && "border-primary/50 ring-2 ring-primary/10",
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
            sideOffset={6}
            className="z-[9999] flex h-64 w-60 gap-1 rounded-2xl border border-border bg-card p-2 shadow-lg animate-in fade-in-50 zoom-in-95 duration-100 focus:outline-none"
          >
            {/* Hour Column */}
            <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar border-r border-border pr-1">
              <span className="text-[9px] font-black uppercase text-muted-foreground text-center mb-1 sticky top-0 bg-card py-1">Hour</span>
              {hoursList.map((h) => {
                const isSelected = h === hour;
                return (
                  <button
                    key={h}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      updateTime(h, minute, period);
                    }}
                    className={cn(
                      "py-1.5 px-2 text-xs font-semibold rounded-lg text-center transition-all duration-150 hover:bg-muted hover:text-foreground text-muted-foreground",
                      isSelected && "bg-primary text-primary-foreground hover:bg-primary/90 font-black shadow-sm"
                    )}
                  >
                    {h}
                  </button>
                );
              })}
            </div>

            {/* Minute Column */}
            <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar border-r border-border pr-1">
              <span className="text-[9px] font-black uppercase text-muted-foreground text-center mb-1 sticky top-0 bg-card py-1">Minute</span>
              {minutesList.map((m) => {
                const isSelected = m === minute;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      updateTime(hour, m, period);
                    }}
                    className={cn(
                      "py-1.5 px-2 text-xs font-semibold rounded-lg text-center transition-all duration-150 hover:bg-muted hover:text-foreground text-muted-foreground",
                      isSelected && "bg-primary text-primary-foreground hover:bg-primary/90 font-black shadow-sm"
                    )}
                  >
                    {m}
                  </button>
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
                    <button
                      key={p}
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        updateTime(hour, minute, p);
                      }}
                      className={cn(
                        "py-2 px-2 text-xs font-semibold rounded-lg text-center transition-all duration-150 hover:bg-muted hover:text-foreground text-muted-foreground",
                        isSelected && "bg-primary text-primary-foreground hover:bg-primary/90 font-black shadow-sm"
                      )}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
            </div>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  );
}
