"use client";

import { useMemo } from "react";
import { DataTable } from "./data-table";
import { createColumns } from "./columns";
import { OptionResult } from "@/types/option";

interface ResultsTableProps {
  results: OptionResult[];
  isScanning: boolean;
  progress: number;
  message: string;
  error: string | null;
  tickersScanned: number;
  tickersTotal: number;
  currentTicker: string | null;
  priceDataTimestamp: number | null;
  onTickerClick?: (ticker: string) => void;
}

export function ResultsTable({
  results,
  isScanning,
  progress,
  message,
  error,
  tickersScanned,
  tickersTotal,
  currentTicker,
  priceDataTimestamp,
  onTickerClick,
}: ResultsTableProps) {
  const columns = useMemo(() => createColumns(onTickerClick), [onTickerClick]);

  return (
    <DataTable
      columns={columns}
      data={results}
      isScanning={isScanning}
      progress={progress}
      message={message}
      error={error}
      tickersScanned={tickersScanned}
      tickersTotal={tickersTotal}
      currentTicker={currentTicker}
      priceDataTimestamp={priceDataTimestamp}
    />
  );
}
