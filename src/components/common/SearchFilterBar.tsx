import { useMemo } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { CustomSelect } from '@/components/ui/select';

interface SearchFilterBarProps {
  query: string;
  onQueryChange: (value: string) => void;
  filterValue?: string;
  filterOptions?: string[];
  onFilterChange?: (value: string) => void;
}

const optionMap: Record<string, string> = {
  all: 'All',
  active: 'Active',
  inactive: 'Inactive',
  maintenance: 'Maintenance',
  warning: 'Warning',
  admin: 'Administrator',
  manager: 'Management',
  staff: 'Staff',
  user: 'Users',
  blocked: 'Locked',
  pending: 'Pending approval',
  low: 'Low',
  medium: 'Medium',
  high: 'Cao',
  critical: 'Critical',
};

export function SearchFilterBar({
  query,
  onQueryChange,
  filterValue = 'all',
  filterOptions,
  onFilterChange,
}: SearchFilterBarProps) {
  const selectOptions = useMemo(() => {
    if (!filterOptions) return [];
    return filterOptions.map((opt) => ({
      value: opt,
      label: optionMap[opt] ?? opt,
    }));
  }, [filterOptions]);

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-sky-100/60 bg-white/45 p-3 md:flex-row md:items-center md:justify-between shadow-sm backdrop-blur-md">
      <div className="relative w-full md:max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
        <Input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Tìm kiếm..."
          className="pl-9 bg-white/90 border-sky-100 focus-visible:ring-blue-500 rounded-xl"
        />
      </div>
      {filterOptions && onFilterChange ? (
        <CustomSelect
          className="h-10 w-full md:w-48"
          value={filterValue}
          onChange={onFilterChange}
          options={selectOptions}
        />
      ) : null}
    </div>
  );
}
