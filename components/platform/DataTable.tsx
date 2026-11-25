"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { EmptyState, Pagination, SearchInput } from "./ui";

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  className?: string;
  /** Used for sorting when the header is clicked. */
  sortValue?: (row: T) => string | number;
  /** Hidden in the phone card layout (still in the table). */
  hideOnMobile?: boolean;
}

// A table on desktop; each row becomes a card on phones.
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  searchText,
  searchPlaceholder,
  pageSize = 10,
  onRowClick,
  toolbar,
  empty,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  /** Text used by the search box; omit to hide the search box. */
  searchText?: (row: T) => string;
  searchPlaceholder?: string;
  pageSize?: number;
  onRowClick?: (row: T) => void;
  toolbar?: React.ReactNode;
  empty?: React.ReactNode;
}) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 } | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = q && searchText ? rows.filter((r) => searchText(r).toLowerCase().includes(q)) : rows;
    if (sort) {
      const col = columns.find((c) => c.key === sort.key);
      if (col?.sortValue) {
        const get = col.sortValue;
        list = [...list].sort((a, b) => {
          const x = get(a);
          const y = get(b);
          return (typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y))) * sort.dir;
        });
      }
    }
    return list;
  }, [rows, query, sort, searchText, columns]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, pageCount);
  const visible = filtered.slice((current - 1) * pageSize, current * pageSize);

  return (
    <div>
      {(searchText || toolbar) && (
        <div className="flex flex-wrap items-center gap-3 mb-4">
          {searchText && (
            <div className="flex-1 min-w-[12rem] max-w-md">
              <SearchInput
                value={query}
                onChange={(v) => {
                  setQuery(v);
                  setPage(1);
                }}
                placeholder={searchPlaceholder}
              />
            </div>
          )}
          {toolbar}
        </div>
      )}

      {filtered.length === 0 ? (
        (empty ?? <EmptyState title="Hech narsa topilmadi" text={query ? "Qidiruvni o'zgartirib ko'ring." : undefined} />)
      ) : (
        <>
          {/* desktop table */}
          <div className="hidden md:block overflow-x-auto rounded-2xl border border-border bg-surface shadow-[var(--shadow-xs)]">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-muted border-b border-border bg-background/70">
                  {columns.map((c) => (
                    <th key={c.key} className={`px-4 py-3.5 font-bold whitespace-nowrap ${c.className ?? ""}`}>
                      {c.sortValue ? (
                        <button
                          onClick={() => setSort((s) => (s?.key === c.key ? { key: c.key, dir: s.dir === 1 ? -1 : 1 } : { key: c.key, dir: 1 }))}
                          className="inline-flex items-center gap-1 uppercase tracking-wider hover:text-foreground"
                        >
                          {c.header}
                          {sort?.key === c.key && (sort.dir === 1 ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
                        </button>
                      ) : (
                        c.header
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visible.map((row) => (
                  <tr
                    key={rowKey(row)}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className={`border-b border-border last:border-0 transition-colors ${onRowClick ? "cursor-pointer hover:bg-brand-tint dark:hover:bg-white/[0.04]" : ""}`}
                  >
                    {columns.map((c) => (
                      <td key={c.key} className={`px-4 py-3.5 align-middle ${c.className ?? ""}`}>
                        {c.render(row)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* phone cards */}
          <div className="md:hidden flex flex-col gap-2.5">
            {visible.map((row) => (
              <div
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={`rounded-2xl border border-border bg-surface p-4 flex flex-col gap-2 shadow-[var(--shadow-xs)] ${onRowClick ? "active:bg-brand-tint" : ""}`}
              >
                {columns
                  .filter((c) => !c.hideOnMobile)
                  .map((c, i) => (
                    <div key={c.key} className={i === 0 ? "" : "flex items-start justify-between gap-3 text-sm"}>
                      {i === 0 ? (
                        c.render(row)
                      ) : (
                        <>
                          <span className="text-xs text-muted shrink-0 pt-0.5">{c.header}</span>
                          <span className="text-right min-w-0">{c.render(row)}</span>
                        </>
                      )}
                    </div>
                  ))}
              </div>
            ))}
          </div>

          <Pagination page={current} pageCount={pageCount} onChange={setPage} total={filtered.length} pageSize={pageSize} />
        </>
      )}
    </div>
  );
}
