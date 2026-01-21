import type { ColumnDef, ColumnFiltersState, SortingState, VisibilityState } from "@tanstack/react-table";

import {

  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronDown, Search, Settings2 } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";

import { Button } from "~react/components/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "~react/components/dropdown-menu";
import { Input } from "~react/components/input";
import { Skeleton } from "~react/components/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~react/components/table";

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
  // Add sorting props
  sorting?: SortingState;
  onSortingChange?: (sorting: SortingState) => void;
  manualSorting?: boolean;
  // Add search props
  manualFiltering?: boolean;
};

function TableSkeleton({ columns }: { columns: ColumnDef<any, any>[] }) {
  return (
    <>
      {Array.from({ length: 5 }).map((_, rowIndex) => (
        <TableRow key={rowIndex}>
          {columns.map((_, colIndex) => (
            <TableCell key={colIndex}>
              <Skeleton className="h-4 w-full" />
            </TableCell>
          ))}
        </TableRow>
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
  // Add sorting props
  sorting: externalSorting,
  onSortingChange,
  manualSorting = false,
  // Add search props
  manualFiltering = false,
}: DataTableProps<TData, TValue>) {
  const { t } = useTranslation("ui");
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [internalPagination, setInternalPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const internalSearchInputRef = React.useRef<HTMLInputElement>(null);
  const searchInputRef = externalSearchInputRef || internalSearchInputRef;

  React.useEffect(() => {
    if (isLoading || (!isLoading && searchValue)) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 0);
    }
  }, [isLoading, searchValue]);

  const currentPagination = externalPagination ?? internalPagination;
  const currentSorting = externalSorting || sorting;

  const handlePaginationChange = React.useCallback(
    (updaterOrValue: any) => {
      const newPagination = typeof updaterOrValue === "function"
        ? updaterOrValue(currentPagination)
        : updaterOrValue;

      if (onPaginationChange) {
        onPaginationChange(newPagination);
      } else {
        setInternalPagination(newPagination);
      }
    },
    [currentPagination, onPaginationChange],
  );

  const handleSortingChange = React.useCallback(
    (updaterOrValue: any) => {
      const newSorting = typeof updaterOrValue === "function"
        ? updaterOrValue(currentSorting)
        : updaterOrValue;

      if (onSortingChange) {
        onSortingChange(newSorting);
      } else {
        setSorting(newSorting);
      }
    },
    [currentSorting, onSortingChange],
  );

  const rows = React.useMemo(() => {
    return data || [];
  }, [data]);

  const table = useReactTable({
    data: rows,
    columns,
    defaultColumn: {
      size: undefined,
      maxSize: undefined,
      minSize: undefined,
    },
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
    pageCount: pageCount || (data ? Math.ceil(data.length / currentPagination.pageSize) : 0),
    state: {
      sorting: currentSorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination: currentPagination,
    },
  });

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 size-4 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              placeholder={searchPlaceholder ?? t("dataTable.searchPlaceholder")}
              value={searchValue}
              onChange={event => onSearchChange?.(event.target.value)}
              className="pl-8 max-w-sm"
              disabled={isLoading}
            />
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto bg-transparent" disabled={isLoading}>
              <Settings2 className="mr-2 size-4" />
              {t("dataTable.columns")}
              <ChevronDown className="ml-2 size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter(column => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={value => column.toggleVisibility(!!value)}
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="relative rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      colSpan={header.colSpan}
                      style={{
                        width: header.column.columnDef.size !== undefined
                          ? header.getSize()
                          : undefined,
                      }}
                    >
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading
              ? (
                  <TableSkeleton columns={columns} />
                )
              : table.getRowModel().rows?.length
                ? (
                    table.getRowModel().rows.map(row => (
                      <TableRow
                        key={row.id}
                        data-state={row.getIsSelected() && "selected"}
                      >
                        {row.getVisibleCells().map(cell => (
                          <TableCell
                            className="text-muted-foreground"
                            key={cell.id}
                            style={{
                              width: cell.column.columnDef.size,
                              maxWidth: cell.column.columnDef.maxSize,
                              minWidth: cell.column.columnDef.minSize,
                            }}
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  )
                : (
                    <TableRow>
                      <TableCell colSpan={columns.length} className="h-24 text-center">
                        {t("dataTable.noResults")}
                      </TableCell>
                    </TableRow>
                  )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between space-x-2">
        <div className="flex-1 text-sm text-muted-foreground">
          {isLoading
            ? (
                <Skeleton className="h-4 w-32" />
              )
            : (
                columns.some(col => col.id === "select")
                  ? t("dataTable.rowsSelected", {
                      selected: table.getFilteredSelectedRowModel().rows.length,
                      total: table.getFilteredRowModel().rows.length,
                    })
                  : t("dataTable.rowsTotal", {
                      count: table.getFilteredRowModel().rows.length,
                    })
              )}
        </div>
        <div className="flex items-center space-x-2">
          {isLoading
            ? (
                <Skeleton className="h-4 w-24" />
              )
            : (
                <p className="text-sm font-medium">
                  {t("dataTable.pageOf", {
                    current: currentPagination.pageIndex + 1,
                    total: table.getPageCount(),
                  })}
                </p>
              )}
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage() || isLoading}
            >
              {t("dataTable.previous")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage() || isLoading}
            >
              {t("dataTable.next")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
