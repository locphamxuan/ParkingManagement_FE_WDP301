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
    <div className={cn('relative w-full h-10', className)}>
      <DropdownMenu.Root open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenu.Trigger asChild>
          <button
            type="button"
            disabled={disabled}
            className={cn(
              "flex h-full w-full items-center justify-between rounded-xl border border-border bg-card px-4 text-sm font-semibold text-foreground outline-none transition-all duration-300 hover:border-muted-foreground/30",
              isOpen && "border-primary/60 ring-4 ring-primary/10",
              disabled && "cursor-not-allowed opacity-50"
            )}
          >
            <span className="truncate text-left block w-full">
              {selectedOption ? selectedOption.label : <span className="text-muted-foreground">{placeholder}</span>}
            </span>
            <div className="text-primary shrink-0 ml-2">
              <ChevronDown size={16} className={cn("transition-transform duration-200", isOpen && "rotate-180")} />
            </div>
          </button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="start"
            sideOffset={4}
            className="z-[9999] max-h-60 w-[var(--radix-dropdown-menu-trigger-width)] overflow-y-auto rounded-2xl border border-sky-100 bg-card p-1.5 shadow-[0_10px_40px_rgba(0,0,0,0.12)] custom-scrollbar focus:outline-none animate-in fade-in-50 zoom-in-95 duration-100"
          >
            {options.length === 0 ? (
              <div className="px-3.5 py-2.5 text-xs font-semibold text-muted-foreground text-center">No options available</div>
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
                      "relative flex w-full cursor-pointer select-none items-center rounded-xl px-3.5 py-2.5 text-xs font-semibold text-muted-foreground transition-all duration-150 hover:bg-muted hover:text-foreground text-left",
                      isSelected && "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground font-black",
                      isDisabled && "cursor-not-allowed opacity-40 hover:bg-transparent hover:text-muted-foreground"
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
