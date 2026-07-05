import type { Column, ColumnDef, ColumnFiltersState, SortingState, VisibilityState } from "@tanstack/react-table";

import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import * as React from "react";
import { useTranslation } from "react-i18next";

import { ArrowDownUp, ChevronDown, ChevronUp, Plus, Search, Trash2 } from "~orbit/components/ui/icons";
import { Skeleton } from "~orbit/components/ui/Skeleton";
import { cn } from "~orbit/lib/utils";

import { Pager } from "./list-kit";

/**
 * DataTable — Orbit-native generic table for admin lists (users, invitations,
 * logs, cron). Rebuilt from the `~react` DataTable on Orbit tokens, keeping the
 * same prop surface so existing TanStack `ColumnDef`s drop in unchanged.
 */

/** Sortable column header, Orbit-styled. Use inside a column `header`. */
export function SortableHeader<TData>({ column, title, className }: { column: Column<TData, unknown>; title: string; className?: string }) {
  const sortState = column.getIsSorted() as false | "asc" | "desc";
  const Icon = sortState === "asc" ? ChevronUp : sortState === "desc" ? ChevronDown : ArrowDownUp;
  const handleSort = () => {
    if (sortState === "asc") column.toggleSorting(true);
    else if (sortState === "desc") column.clearSorting();
    else column.toggleSorting(false);
  };
  return (
    <button
      type="button"
      onClick={handleSort}
      className={cn("inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-faint transition-colors hover:text-ink", className)}
    >
      {title}
      <Icon className={cn("size-3", sortState ? "text-ink" : "text-faint")} />
    </button>
  );
}

const TOOLBAR_BTN
  = "inline-flex items-center justify-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs font-medium whitespace-nowrap text-ink shadow-soft transition-all hover:-translate-y-px hover:border-line-strong disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-3.5 [&_svg]:shrink-0";

const TOOLBAR_BTN_DANGER
  = "inline-flex items-center justify-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs font-medium whitespace-nowrap text-coral-deep transition-all hover:border-coral/30 hover:bg-coral-soft disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-3.5 [&_svg]:shrink-0";

type DataTableProps<TData, TValue> = {
  columns: ColumnDef<TData, TValue>[];
  data: TData[] | undefined;
  isLoading?: boolean;
  searchPlaceholder?: string;
  onSearchChange?: (value: string) => void;
  searchValue?: string;
  searchInputRef?: React.RefObject<HTMLInputElement | null>;
  pageCount?: number;
  pagination?: { pageIndex: number; pageSize: number };
  onPaginationChange?: (pagination: { pageIndex: number; pageSize: number }) => void;
  manualPagination?: boolean;
  sorting?: SortingState;
  onSortingChange?: (sorting: SortingState) => void;
  manualSorting?: boolean;
  manualFiltering?: boolean;
  addItemLabel?: string;
  addItemIcon?: React.ElementType;
  onAddItem?: () => void;
  clearItemsLabel?: string;
  clearItemsIcon?: React.ElementType;
  onClearItems?: () => void;
  toolbarRight?: React.ReactNode;
  renderEmpty?: React.ReactNode;
  onSelectionChange?: (rows: TData[]) => void;
  groupBy?: (row: TData) => string;
  renderGroupRow?: (key: string, colSpan: number) => React.ReactNode;
};

function TableSkeleton({ columns }: { columns: ColumnDef<any, any>[] }) {
  return (
    <>
      {Array.from({ length: 5 }).map((_, rowIndex) => (
        <tr key={rowIndex} className="border-t border-line">
          {columns.map((_, colIndex) => (
            <td key={colIndex} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function DataTable<TData, TValue>({
  columns,
  data,
  isLoading = false,
  searchPlaceholder,
  onSearchChange,
  searchValue = "",
  searchInputRef: externalSearchInputRef,
  pageCount,
  pagination: externalPagination,
  onPaginationChange,
  manualPagination = false,
  sorting: externalSorting,
  onSortingChange,
  manualSorting = false,
  manualFiltering = false,
  addItemLabel,
  addItemIcon: AddItemIcon,
  onAddItem,
  clearItemsLabel,
  clearItemsIcon: ClearItemsIcon,
  onClearItems,
  toolbarRight,
  renderEmpty,
  onSelectionChange,
  groupBy,
  renderGroupRow,
}: DataTableProps<TData, TValue>) {
  const { t } = useTranslation("ui");
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [internalPagination, setInternalPagination] = React.useState({ pageIndex: 0, pageSize: 10 });

  const internalSearchInputRef = React.useRef<HTMLInputElement>(null);
  const searchInputRef = externalSearchInputRef ?? internalSearchInputRef;

  React.useEffect(() => {
    if (isLoading || (!isLoading && searchValue)) {
      setTimeout(() => searchInputRef.current?.focus(), 0);
    }
  }, [isLoading, searchValue]);

  const currentPagination = externalPagination ?? internalPagination;
  const currentSorting = externalSorting ?? sorting;

  const handlePaginationChange = React.useCallback((updaterOrValue: any) => {
    const newPagination = typeof updaterOrValue === "function" ? updaterOrValue(currentPagination) : updaterOrValue;
    if (onPaginationChange) onPaginationChange(newPagination);
    else setInternalPagination(newPagination);
  }, [currentPagination, onPaginationChange]);

  const handleSortingChange = React.useCallback((updaterOrValue: any) => {
    const newSorting = typeof updaterOrValue === "function" ? updaterOrValue(currentSorting) : updaterOrValue;
    if (onSortingChange) onSortingChange(newSorting);
    else setSorting(newSorting);
  }, [currentSorting, onSortingChange]);

  const rows = React.useMemo(() => data ?? [], [data]);

  const table = useReactTable({
    data: rows,
    columns,
    defaultColumn: { size: undefined, maxSize: undefined, minSize: undefined },
    onSortingChange: handleSortingChange,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: handlePaginationChange,
    manualPagination,
    manualSorting,
    manualFiltering,
    pageCount: pageCount ?? (data ? Math.ceil(data.length / currentPagination.pageSize) : 0),
    state: { sorting: currentSorting, columnFilters, columnVisibility, rowSelection, pagination: currentPagination },
  });

  React.useEffect(() => {
    if (onSelectionChange) {
      onSelectionChange(table.getFilteredSelectedRowModel().rows.map(r => r.original));
    }
  }, [rowSelection]);

  return (
    <div className="w-full overflow-hidden rounded-xl border border-line bg-surface shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
        <div className="flex h-8 w-full max-w-xs items-center gap-2 rounded-lg border border-line bg-surface-2 px-2.5 text-muted transition-colors focus-within:border-line-strong">
          <Search className="size-3.5 shrink-0" />
          <input
            ref={searchInputRef}
            placeholder={searchPlaceholder ?? t("dataTable.searchPlaceholder")}
            value={searchValue}
            onChange={event => onSearchChange?.(event.target.value)}
            disabled={isLoading}
            className="w-full bg-transparent text-xs text-ink outline-none placeholder:text-faint disabled:opacity-50"
          />
        </div>
        <div className="flex items-center gap-2">
          {toolbarRight}
          {onAddItem && (
            <button type="button" className={TOOLBAR_BTN} onClick={onAddItem}>
              {AddItemIcon ? <AddItemIcon /> : <Plus />}
              {addItemLabel ?? t("dataTable.addItemLabel")}
            </button>
          )}
          {onClearItems && (
            <button type="button" className={TOOLBAR_BTN_DANGER} onClick={onClearItems}>
              {ClearItemsIcon ? <ClearItemsIcon /> : <Trash2 />}
              {clearItemsLabel ?? t("dataTable.clearItemsLabel")}
            </button>
          )}
        </div>
      </div>
      <div className="relative overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id} className="border-b border-line">
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    colSpan={header.colSpan}
                    style={{ width: header.column.columnDef.size !== undefined ? header.getSize() : undefined }}
                    className="px-4 py-2.5 text-left font-mono text-[11px] font-semibold uppercase tracking-wider text-faint"
                  >
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-line">
            {isLoading
              ? <TableSkeleton columns={columns} />
              : table.getRowModel().rows?.length
                ? (() => {
                    let lastGroupKey: string | undefined;
                    return table.getRowModel().rows.map((row) => {
                      const groupKey = groupBy ? groupBy(row.original) : undefined;
                      const isNewGroup = groupKey !== undefined && groupKey !== lastGroupKey;
                      lastGroupKey = groupKey;
                      return (
                        <React.Fragment key={row.id}>
                          {isNewGroup && renderGroupRow && renderGroupRow(groupKey!, columns.length)}
                          <tr data-state={row.getIsSelected() && "selected"} className="transition-colors hover:bg-surface-2 data-[state=selected]:bg-accent-soft/40">
                            {row.getVisibleCells().map(cell => (
                              <td
                                key={cell.id}
                                className="px-4 py-3 text-ink"
                                style={{ width: cell.column.columnDef.size, maxWidth: cell.column.columnDef.maxSize, minWidth: cell.column.columnDef.minSize }}
                              >
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                              </td>
                            ))}
                          </tr>
                        </React.Fragment>
                      );
                    });
                  })()
                : renderEmpty
                  ? (
                      <tr>
                        <td colSpan={columns.length}><div className="flex justify-center py-12">{renderEmpty}</div></td>
                      </tr>
                    )
                  : (
                      <tr>
                        <td colSpan={columns.length} className="h-24 text-center text-muted">{t("dataTable.noResults")}</td>
                      </tr>
                    )}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-line bg-surface-2/40 px-4 py-2.5 text-xs text-muted">
        <div className="min-w-0 flex-1 truncate">
          {isLoading
            ? <Skeleton className="h-4 w-32" />
            : columns.some(col => col.id === "select")
              ? t("dataTable.rowsSelected", { selected: table.getFilteredSelectedRowModel().rows.length, total: table.getFilteredRowModel().rows.length })
              : t("dataTable.rowsTotal", { count: table.getFilteredRowModel().rows.length })}
        </div>
        {isLoading
          ? <Skeleton className="h-4 w-24" />
          : table.getPageCount() > 1 && (
            <Pager page={currentPagination.pageIndex + 1} pageCount={table.getPageCount()} onPage={p => table.setPageIndex(p - 1)} />
          )}
      </div>
    </div>
  );
}
