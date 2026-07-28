import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ReactNode } from 'react';

export interface DataColumn<T> {
  key: keyof T | string;
  title: string;
  render?: (row: T) => ReactNode;
}

interface DataTableProps<T> {
  title: string;
  rows: T[];
  columns: DataColumn<T>[];
  emptyText?: string;
  rightElement?: ReactNode;
}

export function DataTable<T extends object>({
  title,
  rows,
  columns,
  emptyText = 'No records found.',
  rightElement,
}: DataTableProps<T>) {
  return (
    <Card className="overflow-hidden glass-premium relative shadow-lg border border-blue-100/80">
      {/* Crystal Bevel Border */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500/10 via-blue-500/40 to-indigo-500/10" />
      <CardHeader className="border-b border-blue-100/40 bg-blue-50/30 p-5 flex flex-row items-center justify-between">
        <CardTitle className="text-base font-extrabold tracking-tight text-slate-800">{title}</CardTitle>
        {rightElement && <div className="flex items-center">{rightElement}</div>}
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-full border-collapse" aria-label={title}>
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200/80">
                {columns.map((column) => (
                  <th
                    key={String(column.key)}
                    scope="col"
                    className="px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500 first:pl-6 last:pr-6"
                  >
                    {column.title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-100/20">
              {rows.length > 0 ? (
                rows.map((row, rowIndex) => (
                  <tr key={rowIndex} className="premium-row group hover:bg-blue-500/[0.02] transition-colors border-b border-blue-100/10">
                    {columns.map((column) => (
                      <td key={String(column.key)} className="px-4 py-3.5 text-sm font-semibold text-slate-700 whitespace-nowrap first:pl-6 last:pr-6">
                        {column.render ? column.render(row) : String((row as Record<string, unknown>)[column.key as string] ?? '-')}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-6 py-12 text-center text-sm font-medium text-muted-foreground" colSpan={columns.length}>
                    {emptyText}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
