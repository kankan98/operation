import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface Column<T> {
  key: string;
  header: ReactNode;
  render?: (row: T) => ReactNode;
  align?: 'left' | 'right' | 'center';
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  renderActions?: (row: T) => ReactNode;
  emptyMessage?: ReactNode;
}

const alignClass = { left: 'text-left', right: 'text-right', center: 'text-center' } as const;

export function DataTable<T>({
  columns,
  data,
  rowKey,
  onRowClick,
  renderActions,
  emptyMessage,
}: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-border-subtle">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  'h-12 px-4 text-xs font-medium uppercase tracking-wide text-fg-subtle',
                  alignClass[col.align ?? 'left'],
                  col.className,
                )}
              >
                {col.header}
              </th>
            ))}
            {renderActions && <th className="h-12 w-px px-4" />}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + (renderActions ? 1 : 0)}
                className="px-4 py-12 text-center text-sm text-fg-muted"
              >
                {emptyMessage ?? 'No data available'}
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  'group border-b border-border-subtle transition-colors duration-150 last:border-0 hover:bg-subtle',
                  onRowClick && 'cursor-pointer',
                )}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      'h-16 px-4 text-sm text-fg',
                      alignClass[col.align ?? 'left'],
                      col.className,
                    )}
                  >
                    {col.render ? col.render(row) : (row as Record<string, ReactNode>)[col.key]}
                  </td>
                ))}
                {renderActions && (
                  <td className="h-16 px-4 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                      {renderActions(row)}
                    </div>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
