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
}

export function DataTable<T extends object>({
  title,
  rows,
  columns,
  emptyText = 'No records found.',
}: DataTableProps<T>) {
  return (
    <Card className="overflow-hidden glass-premium relative shadow-lg border border-sky-100/80">
      {/* Crystal Bevel Border */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500/10 via-blue-500/40 to-indigo-500/10" />
      <CardHeader className="border-b border-sky-100/40 bg-sky-500/5 p-5">
        <CardTitle className="text-base font-extrabold tracking-tight text-slate-800">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-full border-collapse">
            <thead>
              <tr className="bg-sky-500/5 border-b border-sky-100/30">
                {columns.map((column) => (
                  <th
                    key={String(column.key)}
                    className="px-2 py-3 text-left text-xs font-black uppercase tracking-[0.1em] text-slate-400 font-mono first:pl-5 last:pr-5"
                  >
                    {column.title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-sky-100/20">
              {rows.length > 0 ? (
                rows.map((row, rowIndex) => (
                  <tr key={rowIndex} className="premium-row group hover:bg-sky-500/[0.03] transition-colors border-b border-sky-100/10">
                    {columns.map((column) => (
                      <td key={String(column.key)} className="px-2 py-3 text-sm font-semibold text-slate-700 whitespace-nowrap first:pl-5 last:pr-5">
                        {column.render ? column.render(row) : String((row as Record<string, unknown>)[column.key as string] ?? '-')}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-6 py-8 text-center text-sm text-stone-500 italic" colSpan={columns.length}>
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
