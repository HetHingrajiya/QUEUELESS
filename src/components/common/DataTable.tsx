import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/common/EmptyState';

export interface Column<T> {
  header: string;
  accessor?: keyof T;
  render?: (item: T) => React.ReactNode;
  className?: string;
  headerClassName?: string;
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
}

export function DataTable<T>({ data, columns, keyExtractor, emptyMessage = "No items found.", emptyIcon }: DataTableProps<T>) {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-600">
            <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                {columns.map((col, idx) => (
                  <th key={idx} scope="col" className={`px-6 py-4 ${col.headerClassName || ''}`}>
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr key={keyExtractor(item)} className="bg-white border-b border-slate-100 hover:bg-slate-50">
                  {columns.map((col, idx) => (
                    <td key={idx} className={`px-6 py-4 ${col.className || ''}`}>
                      {col.render ? col.render(item) : (col.accessor ? String(item[col.accessor] ?? '-') : '-')}
                    </td>
                  ))}
                </tr>
              ))}
              
              {data.length === 0 && (
                <EmptyState colSpan={columns.length} title={emptyMessage} icon={emptyIcon} />
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
