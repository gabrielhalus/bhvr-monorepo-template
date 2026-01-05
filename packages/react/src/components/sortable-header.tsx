import type { Column } from "@tanstack/react-table";

import { ArrowDownNarrowWide, ArrowUpDown, ArrowUpNarrowWide } from "lucide-react";

import { Button } from "~react/components/button";
import { cn } from "~react/lib/utils";

type SortableHeaderProps<TData> = {
  column: Column<TData, unknown>;
  title: string;
  className?: string;
};

export function SortableHeader<TData>({ column, title, className }: SortableHeaderProps<TData>) {
  const sortState = column.getIsSorted() as false | "asc" | "desc";

  const getSortIcon = () => {
    if (sortState === "asc")
      return <ArrowUpNarrowWide className="ml-2 size-4 text-muted-foreground" />;
    if (sortState === "desc")
      return <ArrowDownNarrowWide className="ml-2 size-4 text-muted-foreground" />;
    return <ArrowUpDown className="ml-2 size-4 text-muted-foreground" />;
  };

  const handleSort = () => {
    if (sortState === "asc") {
      column.toggleSorting(true);
    } else if (sortState === "desc") {
      column.clearSorting();
    } else {
      column.toggleSorting(false);
    }
  };

  return (
    <Button
      variant="ghost"
      onClick={handleSort}
      className={cn("h-8 -ml-3 p-0 font-medium hover:bg-transparent", className)}
    >
      {title}
      {getSortIcon()}
    </Button>
  );
}
