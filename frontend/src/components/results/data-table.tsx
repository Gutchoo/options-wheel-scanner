"use client";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  VisibilityState,
  ColumnResizeMode,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Settings2, Loader2, AlertCircle } from "lucide-react";
import { useState } from "react";

// Display names for columns
const columnLabels: Record<string, string> = {
  ticker: "Ticker",
  option_type: "Type",
  stock_price: "Stock $",
  strike: "Strike",
  expiration: "Expiration",
  dte: "DTE",
  premium: "Premium",
  volume: "Volume",
  open_interest: "OI",
  implied_volatility: "IV",
  collateral: "Collateral",
  roi: "ROI %",
  annualized_roi: "Ann. ROI",
  moneyness: "ITM/OTM",
  pe_ratio: "P/E",
};

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  isScanning?: boolean;
  progress?: number;
  message?: string;
  error?: string | null;
  tickersScanned?: number;
  tickersTotal?: number;
  currentTicker?: string | null;
  priceDataTimestamp?: number | null;
}

// Format timestamp for display
function formatPriceTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function DataTable<TData, TValue>({
  columns,
  data,
  isScanning = false,
  progress = 0,
  message = "",
  error = null,
  tickersScanned = 0,
  tickersTotal = 0,
  currentTicker = null,
  priceDataTimestamp = null,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [columnResizeMode] = useState<ColumnResizeMode>("onChange");

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    columnResizeMode,
    state: {
      sorting,
      columnVisibility,
    },
  });

  return (
    <div className="flex-1 min-h-0 flex flex-col rounded-lg border border-border bg-transparent backdrop-blur-sm">
      {/* Header with status and column selector */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                <Settings2 className="mr-2 h-4 w-4" />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                    onSelect={(e) => e.preventDefault()}
                  >
                    {columnLabels[column.id] || column.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <span className="text-sm text-muted-foreground">
            {data.length} options found
          </span>
        </div>

        {isScanning && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>
              {currentTicker ? `Scanning ${currentTicker}...` : message}
            </span>
            <span>
              ({tickersScanned}/{tickersTotal})
            </span>
          </div>
        )}

        {!isScanning && priceDataTimestamp && (
          <p className="text-sm text-muted-foreground">
            Prices as of {formatPriceTimestamp(priceDataTimestamp)}
          </p>
        )}
      </div>

      {/* Progress Bar */}
      {isScanning && (
        <div className="h-1 w-full bg-muted">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mx-4 mt-4 p-4 rounded-md bg-destructive/10 border border-destructive/20 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <span className="text-sm text-destructive">{error}</span>
        </div>
      )}

      {/* Table */}
      <div className="flex-1 min-h-0 overflow-auto">
        <Table className="w-full" style={{ minWidth: table.getCenterTotalSize() }}>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header, index) => {
                  const isLastColumn = index === headerGroup.headers.length - 1;
                  return (
                    <TableHead
                      key={header.id}
                      className="whitespace-nowrap relative font-semibold"
                      style={{ width: header.getSize() }}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                      {!isLastColumn && (
                        <div
                          onMouseDown={header.getResizeHandler()}
                          onTouchStart={header.getResizeHandler()}
                          className={`absolute right-0 top-0 h-full w-4 cursor-col-resize select-none touch-none group flex justify-center ${
                            header.column.getIsResizing() ? "bg-primary/20" : ""
                          }`}
                        >
                          <div
                            className={`h-full w-[2px] ${
                              header.column.getIsResizing()
                                ? "bg-primary"
                                : "bg-border group-hover:bg-primary/50"
                            }`}
                          />
                        </div>
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className="font-semibold"
                      style={{ width: cell.column.getSize() }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Adjust your filters and scan to find options.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
