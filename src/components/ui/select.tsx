import { useState, useRef, useEffect, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
  placeholder = 'Chọn một mục...',
  className,
  disabled = false,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-lg border border-slate-700 bg-slate-800/60 px-3 text-sm text-white outline-none transition focus:border-orange-500 focus:ring-1 focus:ring-orange-500",
          isOpen && "border-orange-500 ring-1 ring-orange-500",
          disabled && "cursor-not-allowed opacity-50"
        )}
      >
        <span className="truncate text-left block w-full">
          {selectedOption ? selectedOption.label : <span className="text-slate-400">{placeholder}</span>}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-orange-400 shrink-0 ml-2"
        >
          <ChevronDown size={16} />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.ul
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 4, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute z-[999] w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl max-h-60 overflow-y-auto custom-scrollbar"
            style={{ top: '100%' }}
          >
            {options.length === 0 ? (
              <li className="p-2.5 text-sm text-slate-500 text-center">
                Không có lựa chọn nào
              </li>
            ) : (
              options.map((opt) => {
                const isSelected = opt.value === value;
                const isDisabled = opt.disabled === true;
                return (
                  <li
                    key={String(opt.value)}
                    onClick={() => {
                      if (isDisabled) return;
                      onChange(opt.value);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "p-2.5 text-slate-200 hover:bg-orange-500 hover:text-white cursor-pointer transition-colors text-sm",
                      isSelected && "bg-orange-500 text-white font-bold",
                      isDisabled && "cursor-not-allowed opacity-40 hover:bg-transparent hover:text-slate-200"
                    )}
                  >
                    {opt.label}
                  </li>
                );
              })
            )}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
