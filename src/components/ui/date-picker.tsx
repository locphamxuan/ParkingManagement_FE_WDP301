import { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { cn } from '@/utils/cn';

interface DatePickerProps {
  value: string; // "YYYY-MM-DD" format
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  ariaLabel?: string;
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function DatePicker({
  value,
  onChange,
  placeholder = 'dd/mm/yyyy',
  className,
  disabled = false,
  ariaLabel = 'Select date',
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Parse value to Date object or null
  const parsedDate = value ? new Date(value) : null;
  const isValidDate = parsedDate && !isNaN(parsedDate.getTime());

  // Month shown in calendar view
  const [viewDate, setViewDate] = useState(() => (isValidDate ? new Date(parsedDate) : new Date()));

  useEffect(() => {
    if (isValidDate) {
      setViewDate(new Date(parsedDate));
    }
  }, [value]);

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.preventDefault();
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.preventDefault();
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const handleSelectDay = (e: React.MouseEvent, day: number, isCurrentMonth: boolean) => {
    e.preventDefault();
    let targetMonth = viewDate.getMonth();
    let targetYear = viewDate.getFullYear();

    if (!isCurrentMonth) {
      if (day > 20) {
        // Clicked previous month's day
        targetMonth -= 1;
      } else {
        // Clicked next month's day
        targetMonth += 1;
      }
    }

    const d = new Date(targetYear, targetMonth, day);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    onChange(`${yyyy}-${mm}-${dd}`);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.preventDefault();
    onChange('');
    setIsOpen(false);
  };

  const handleToday = (e: React.MouseEvent) => {
    e.preventDefault();
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    onChange(`${yyyy}-${mm}-${dd}`);
    setIsOpen(false);
  };

  // Generate calendar days
  const getCalendarDays = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday, 1 is Monday...
    // Adjust firstDayIndex to make Monday (1) the first index (0 in WEEK_DAYS)
    // Sunday (0) becomes index 6
    const adjustedStart = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevMonthTotalDays = new Date(year, month, 0).getDate();

    const days: Array<{ day: number; currentMonth: boolean }> = [];

    // Prev month overflow days
    for (let i = adjustedStart - 1; i >= 0; i--) {
      days.push({ day: prevMonthTotalDays - i, currentMonth: false });
    }

    // Current month days
    for (let i = 1; i <= totalDays; i++) {
      days.push({ day: i, currentMonth: true });
    }

    // Next month overflow days
    const remainingSlots = 42 - days.length; // 6 rows * 7 days
    for (let i = 1; i <= remainingSlots; i++) {
      days.push({ day: i, currentMonth: false });
    }

    return days;
  };

  const formattedDisplay = () => {
    if (!isValidDate) return <span className="text-slate-400 font-medium">{placeholder}</span>;
    const dd = String(parsedDate.getDate()).padStart(2, '0');
    const mm = String(parsedDate.getMonth() + 1).padStart(2, '0');
    const yyyy = parsedDate.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  const displayMonthName = `${MONTH_NAMES[viewDate.getMonth()]} ${viewDate.getFullYear()}`;
  const days = getCalendarDays();

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
            <span className="text-left font-semibold text-slate-800">{formattedDisplay()}</span>
            <Calendar size={16} className="text-slate-500 shrink-0 ml-2" />
          </button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="start"
            sideOffset={8}
            collisionPadding={12}
            className="z-[9999] flex w-[min(20rem,calc(100vw-2rem))] flex-col rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_18px_48px_rgba(15,23,42,0.16)] outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
          >
            {/* Header: Month & Year Selector */}
            <div className="flex items-center justify-between mb-3.5">
              <DropdownMenu.Item asChild onSelect={(event) => event.preventDefault()}>
                <button
                  type="button"
                  aria-label="Previous month"
                  onClick={handlePrevMonth}
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 outline-none transition-colors hover:bg-blue-50 hover:text-blue-700 focus:bg-blue-50 focus:text-blue-700"
                >
                  <ChevronLeft size={16} />
                </button>
              </DropdownMenu.Item>
              <span className="text-xs font-black uppercase text-slate-800 tracking-wider font-mono">{displayMonthName}</span>
              <DropdownMenu.Item asChild onSelect={(event) => event.preventDefault()}>
                <button
                  type="button"
                  aria-label="Next month"
                  onClick={handleNextMonth}
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 outline-none transition-colors hover:bg-blue-50 hover:text-blue-700 focus:bg-blue-50 focus:text-blue-700"
                >
                  <ChevronRight size={16} />
                </button>
              </DropdownMenu.Item>
            </div>

            {/* Week days Header */}
            <div className="grid grid-cols-7 gap-1 text-center mb-1">
              {WEEK_DAYS.map((day, idx) => (
                <span key={idx} className="text-[10px] font-black uppercase text-slate-400 font-mono">
                   {day}
                </span>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {days.map((item, idx) => {
                const isSelected =
                  isValidDate &&
                  item.currentMonth &&
                  parsedDate.getDate() === item.day &&
                  parsedDate.getMonth() === viewDate.getMonth() &&
                  parsedDate.getFullYear() === viewDate.getFullYear();

                const isToday =
                  item.currentMonth &&
                  new Date().getDate() === item.day &&
                  new Date().getMonth() === viewDate.getMonth() &&
                  new Date().getFullYear() === viewDate.getFullYear();

                const targetDate = new Date(
                  viewDate.getFullYear(),
                  viewDate.getMonth() + (item.currentMonth ? 0 : item.day > 20 ? -1 : 1),
                  item.day,
                );

                return (
                  <DropdownMenu.Item key={targetDate.toISOString()} asChild>
                    <button
                      type="button"
                      aria-label={targetDate.toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                      aria-current={isToday ? 'date' : undefined}
                      onClick={(e) => handleSelectDay(e, item.day, item.currentMonth)}
                      className={cn(
                        "flex min-h-9 w-full items-center justify-center rounded-lg text-xs font-bold outline-none transition-colors duration-150",
                        item.currentMonth ? "text-slate-800 hover:bg-blue-50 focus:bg-blue-50" : "text-slate-400 hover:bg-blue-50/60 focus:bg-blue-50/60",
                        isToday && !isSelected && "border border-blue-400/60 font-black text-blue-700",
                        isSelected && "bg-blue-600 text-white hover:bg-blue-700 hover:text-white focus:bg-blue-700 focus:text-white font-black shadow-md shadow-blue-500/10"
                      )}
                    >
                      {item.day}
                    </button>
                  </DropdownMenu.Item>
                );
              })}
            </div>

            {/* Footer buttons: Clear & Today */}
            <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-sky-100">
              <DropdownMenu.Item asChild>
                <button
                  type="button"
                  onClick={handleClear}
                  className="min-h-10 rounded-xl px-3 text-[10px] font-black uppercase tracking-wider text-rose-600 outline-none transition-colors hover:bg-rose-50 hover:text-rose-700 focus:bg-rose-50 focus:text-rose-700"
                >
                  Clear date
                </button>
              </DropdownMenu.Item>
              <DropdownMenu.Item asChild>
                <button
                  type="button"
                  onClick={handleToday}
                  className="min-h-10 rounded-xl px-3 text-[10px] font-black uppercase tracking-wider text-blue-600 outline-none transition-colors hover:bg-blue-50 hover:text-blue-700 focus:bg-blue-50 focus:text-blue-700"
                >
                  Today
                </button>
              </DropdownMenu.Item>
            </div>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  );
}
