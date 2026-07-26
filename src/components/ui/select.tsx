import { useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { cn } from '@/utils/cn';

export interface SelectOption {
  value: string;
  label: ReactNode;
  disabled?: boolean;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function CustomSelect({
  value,
  onChange,
  options,
  placeholder = 'Select an item...',
  className,
  disabled = false,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className={cn('relative h-11 w-full', className)}>
      <DropdownMenu.Root open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenu.Trigger asChild>
          <button
            type="button"
            disabled={disabled}
            className={cn(
              "flex h-full w-full items-center justify-between rounded-xl border border-border bg-card/90 px-3.5 text-sm font-semibold text-foreground shadow-sm outline-none transition-[border-color,box-shadow,background-color] duration-200 hover:border-primary/25 focus:border-primary/45 focus:bg-card focus:ring-4 focus:ring-ring/10",
              isOpen && "border-blue-500/60 ring-4 ring-blue-500/10",
              disabled && "cursor-not-allowed opacity-50"
            )}
          >
            <span className="truncate text-left block w-full">
              {selectedOption ? selectedOption.label : <span className="text-slate-400">{placeholder}</span>}
            </span>
            <div className="text-blue-500 shrink-0 ml-2">
              <ChevronDown size={16} className={cn("transition-transform duration-200", isOpen && "rotate-180")} />
            </div>
          </button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="start"
            sideOffset={4}
            className="z-[9999] max-h-64 w-[var(--radix-dropdown-menu-trigger-width)] overflow-y-auto rounded-xl border border-border bg-card/98 p-1.5 text-foreground shadow-[0_18px_48px_rgba(15,23,42,0.16)] backdrop-blur-xl custom-scrollbar focus:outline-none animate-in fade-in-50 zoom-in-95 duration-100"
          >
            {options.length === 0 ? (
              <div className="px-3.5 py-2.5 text-xs font-semibold text-slate-400 text-center">No options</div>
            ) : (
              options.map((opt) => {
                const isSelected = opt.value === value;
                const isDisabled = opt.disabled === true;
                return (
                  <button
                    key={String(opt.value)}
                    type="button"
                    disabled={isDisabled}
                    onClick={(e) => {
                      e.preventDefault();
                      onChange(opt.value);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "relative flex min-h-10 w-full cursor-pointer select-none items-center rounded-lg px-3 text-left text-xs font-semibold text-muted-foreground transition-colors duration-150 hover:bg-primary/10 hover:text-foreground",
                      isSelected && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground font-bold",
                      isDisabled && "cursor-not-allowed opacity-40 hover:bg-transparent hover:text-slate-400"
                    )}
                  >
                    {opt.label}
                  </button>
                );
              })
            )}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  );
}
