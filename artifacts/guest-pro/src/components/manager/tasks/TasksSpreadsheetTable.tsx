/**
 * TasksSpreadsheetTable — soft Excel-like grid for manager task views.
 */

import { cn } from "@/lib/utils";

export interface SpreadsheetColumn<T> {
  key: string;
  header: string;
  width?: string;
  align?: "left" | "center" | "right";
  render: (row: T) => React.ReactNode;
}

interface TasksSpreadsheetTableProps<T> {
  columns: SpreadsheetColumn<T>[];
  rows: T[];
  rowKey: (row: T, index: number) => string;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  ariaLabel?: string;
}

const thBase =
  "border border-zinc-200 bg-zinc-100/90 px-3 py-2 text-[11px] font-semibold text-zinc-600 whitespace-nowrap";
const tdBase =
  "border border-zinc-200 px-3 py-2 text-[13px] text-zinc-800 align-middle bg-white";

export function TasksSpreadsheetTable<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  emptyMessage,
  ariaLabel,
}: TasksSpreadsheetTableProps<T>) {
  if (rows.length === 0 && emptyMessage) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-zinc-50/50 px-4 py-10 text-center">
        <p className="text-sm text-zinc-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
      <table className="w-full min-w-[36rem] border-collapse" aria-label={ariaLabel}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={cn(
                  thBase,
                  col.align === "center" && "text-center",
                  col.align === "right" && "text-right",
                )}
                style={col.width ? { width: col.width } : undefined}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const clickable = !!onRowClick;
            return (
              <tr
                key={rowKey(row, index)}
                onClick={clickable ? () => onRowClick(row) : undefined}
                className={cn(
                  clickable && "cursor-pointer hover:bg-zinc-50/80 active:bg-zinc-100/60",
                )}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      tdBase,
                      col.align === "center" && "text-center",
                      col.align === "right" && "text-right",
                    )}
                  >
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function cellText(value: string, muted = false) {
  return (
    <span className={cn("block truncate max-w-[16rem]", muted && "text-zinc-400")}>
      {value}
    </span>
  );
}

export function cellMono(value: string, className?: string) {
  return (
    <span className={cn("font-mono text-[12px] tabular-nums text-zinc-600", className)}>
      {value}
    </span>
  );
}

export function cellDash() {
  return <span className="text-zinc-300">—</span>;
}
