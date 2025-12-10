"use client";

import { ColumnDef } from "@tanstack/react-table";
import { OptionResult } from "@/types/option";
import { Badge } from "@/components/ui/badge";

export function createColumns(
  onTickerClick?: (ticker: string) => void
): ColumnDef<OptionResult>[] {
  return [
    {
      id: "ticker",
      accessorKey: "ticker",
      size: 70,
      header: ({ column }) => (
        <span
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="cursor-pointer hover:text-foreground"
        >
          Ticker
        </span>
      ),
      cell: ({ row }) => {
        const ticker = row.getValue("ticker") as string;
        if (onTickerClick) {
          return (
            <button
              onClick={() => onTickerClick(ticker)}
              className="font-medium text-primary hover:underline cursor-pointer"
            >
              {ticker}
            </button>
          );
        }
        return <span className="font-medium">{ticker}</span>;
      },
    },
  {
    id: "option_type",
    accessorKey: "option_type",
    size: 60,
    header: ({ column }) => (
      <span
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="cursor-pointer hover:text-foreground"
      >
        Type
      </span>
    ),
    cell: ({ row }) => {
      const type = row.getValue("option_type") as string;
      return (
        <Badge variant={type === "call" ? "default" : "secondary"}>
          {type.toUpperCase()}
        </Badge>
      );
    },
  },
  {
    id: "stock_price",
    accessorKey: "stock_price",
    size: 80,
    header: ({ column }) => (
      <span
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="cursor-pointer hover:text-foreground"
      >
        Stock $
      </span>
    ),
    cell: ({ row }) => `$${row.getValue<number>("stock_price").toFixed(2)}`,
  },
  {
    id: "strike",
    accessorKey: "strike",
    size: 75,
    header: ({ column }) => (
      <span
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="cursor-pointer hover:text-foreground"
      >
        Strike
      </span>
    ),
    cell: ({ row }) => `$${row.getValue<number>("strike").toFixed(2)}`,
  },
  {
    id: "expiration",
    accessorKey: "expiration",
    size: 100,
    header: ({ column }) => (
      <span
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="cursor-pointer hover:text-foreground"
      >
        Expiration
      </span>
    ),
  },
  {
    id: "dte",
    accessorKey: "dte",
    size: 50,
    header: ({ column }) => (
      <span
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="cursor-pointer hover:text-foreground"
      >
        DTE
      </span>
    ),
  },
  {
    id: "premium",
    accessorKey: "premium",
    size: 80,
    header: ({ column }) => (
      <span
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="cursor-pointer hover:text-foreground"
      >
        Premium
      </span>
    ),
    cell: ({ row }) => `$${row.getValue<number>("premium").toFixed(2)}`,
  },
  {
    id: "bid",
    accessorKey: "bid",
    size: 70,
    header: ({ column }) => (
      <span
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="cursor-pointer hover:text-foreground"
      >
        Bid
      </span>
    ),
    cell: ({ row }) => {
      const bid = row.getValue<number | null>("bid");
      return bid ? `$${bid.toFixed(2)}` : "-";
    },
  },
  {
    id: "ask",
    accessorKey: "ask",
    size: 70,
    header: ({ column }) => (
      <span
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="cursor-pointer hover:text-foreground"
      >
        Ask
      </span>
    ),
    cell: ({ row }) => {
      const ask = row.getValue<number | null>("ask");
      return ask ? `$${ask.toFixed(2)}` : "-";
    },
  },
  {
    id: "volume",
    accessorKey: "volume",
    size: 80,
    header: ({ column }) => (
      <span
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="cursor-pointer hover:text-foreground"
      >
        Volume
      </span>
    ),
    cell: ({ row }) => row.getValue<number>("volume").toLocaleString(),
  },
  {
    id: "open_interest",
    accessorKey: "open_interest",
    size: 70,
    header: ({ column }) => (
      <span
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="cursor-pointer hover:text-foreground"
      >
        OI
      </span>
    ),
    cell: ({ row }) => row.getValue<number>("open_interest").toLocaleString(),
  },
  {
    id: "implied_volatility",
    accessorKey: "implied_volatility",
    size: 55,
    header: ({ column }) => (
      <span
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="cursor-pointer hover:text-foreground"
      >
        IV
      </span>
    ),
    cell: ({ row }) => {
      const iv = row.getValue<number | null>("implied_volatility");
      return iv ? `${(iv * 100).toFixed(1)}%` : "-";
    },
  },
  {
    id: "collateral",
    accessorKey: "collateral",
    size: 90,
    header: ({ column }) => (
      <span
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="cursor-pointer hover:text-foreground"
      >
        Collateral
      </span>
    ),
    cell: ({ row }) =>
      `$${row.getValue<number>("collateral").toLocaleString()}`,
  },
  {
    id: "roi",
    accessorKey: "roi",
    size: 65,
    header: ({ column }) => (
      <span
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="cursor-pointer hover:text-foreground"
      >
        ROI %
      </span>
    ),
    cell: ({ row }) => {
      const roi = row.getValue<number>("roi");
      return (
        <span className={roi >= 2 ? "text-success font-medium" : ""}>
          {roi.toFixed(2)}%
        </span>
      );
    },
  },
  {
    id: "moneyness",
    accessorKey: "moneyness",
    size: 75,
    header: ({ column }) => (
      <span
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="cursor-pointer hover:text-foreground"
      >
        ITM/OTM
      </span>
    ),
    cell: ({ row }) => <Badge variant="outline">{row.getValue("moneyness")}</Badge>,
  },
  {
    id: "pe_ratio",
    accessorKey: "pe_ratio",
    size: 50,
    header: ({ column }) => (
      <span
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="cursor-pointer hover:text-foreground"
      >
        P/E
      </span>
    ),
    cell: ({ row }) => {
      const pe = row.getValue<number | null>("pe_ratio");
      return pe ? pe.toFixed(1) : "-";
    },
  },
  {
    id: "next_earnings_date",
    accessorKey: "next_earnings_date",
    size: 100,
    header: ({ column }) => (
      <span
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="cursor-pointer hover:text-foreground"
      >
        Earnings
      </span>
    ),
    cell: ({ row }) => {
      const date = row.getValue<string | null>("next_earnings_date");
      if (!date) return "-";
      // Format as MMM DD (e.g., "Jan 29")
      const d = new Date(date);
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    },
  },
  ];
}
