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
    <Card className="overflow-hidden bg-white shadow-sm border border-slate-200/80 rounded-2xl">
      <CardHeader className="border-b border-slate-100 bg-white px-6 py-4 flex flex-row items-center justify-between">
        <CardTitle className="text-base font-extrabold tracking-tight text-slate-800">{title}</CardTitle>
        {rightElement && <div className="flex items-center">{rightElement}</div>}
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-full border-collapse" aria-label={title}>
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                {columns.map((column) => (
                  <th
                    key={String(column.key)}
                    scope="col"
                    className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500 first:pl-6 last:pr-6"
                  >
                    {column.title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {rows.length > 0 ? (
                rows.map((row, rowIndex) => (
                  <tr key={rowIndex} className="group hover:bg-slate-50/50 transition-colors">
                    {columns.map((column) => (
                      <td key={String(column.key)} className="px-4 py-3.5 text-sm font-semibold text-slate-700 whitespace-nowrap first:pl-6 last:pr-6">
                        {column.render ? column.render(row) : String((row as Record<string, unknown>)[column.key as string] ?? '-')}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-6 py-12 text-center text-sm font-medium text-slate-400" colSpan={columns.length}>
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
