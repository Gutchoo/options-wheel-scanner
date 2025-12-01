"use client";

import { DataTable } from "./data-table";
import { columns } from "./columns";
import { OptionResult } from "@/types/option";
import { Loader2, AlertCircle } from "lucide-react";

interface ResultsTableProps {
  results: OptionResult[];
  isScanning: boolean;
  progress: number;
  message: string;
  error: string | null;
  tickersScanned: number;
  tickersTotal: number;
  currentTicker: string | null;
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
}: ResultsTableProps) {
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
    />
  );
}
