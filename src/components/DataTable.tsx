import { ReactNode } from "react";

export interface DataTableColumn<T> {
  key: string;
  label: string;
  className?: string;
  render: (row: T) => ReactNode;
}

interface DataTableProps<T> {
  columns: Array<DataTableColumn<T>>;
  rows: T[];
  getRowKey: (row: T) => string;
  emptyState?: ReactNode;
  mobileCardRender?: (row: T) => ReactNode;
}

export function DataTable<T>({ columns, rows, getRowKey, emptyState, mobileCardRender }: DataTableProps<T>) {
  if (!rows.length) {
    return <>{emptyState}</>;
  }

  return (
    <>
      {mobileCardRender ? (
        <div className="grid gap-3 md:hidden">
          {rows.map((row) => (
            <div key={getRowKey(row)} className="rounded-2xl border border-line/80 bg-surface p-4">
              {mobileCardRender(row)}
            </div>
          ))}
        </div>
      ) : null}

      <div className={mobileCardRender ? "hidden md:block" : ""}>
        <div className="overflow-hidden rounded-2xl border border-line/80">
          <div className="overflow-x-auto">
            <table className="min-w-[900px] divide-y divide-line/80">
              <thead className="bg-surface">
                <tr>
                  {columns.map((column) => (
                    <th
                      key={column.key}
                      className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-soft ${column.className ?? ""}`}
                    >
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line/70 bg-surface-soft">
                {rows.map((row) => (
                  <tr key={getRowKey(row)} className="hover:bg-surface">
                    {columns.map((column) => (
                      <td key={column.key} className={`px-4 py-3 text-sm text-text ${column.className ?? ""}`}>
                        {column.render(row)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
