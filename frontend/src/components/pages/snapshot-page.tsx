"use client";

import { Card, CardContent } from "@/components/ui/card";

export function SnapshotPage() {
  return (
    <div className="h-full w-full flex items-center justify-center p-4">
      <Card className="w-full h-full bg-transparent backdrop-blur-sm">
        <CardContent className="h-full flex flex-col items-center justify-center p-6">
          <h2 className="text-2xl font-semibold text-white mb-2">
            Ticker Snapshot
          </h2>
          <p className="text-white/60 text-center">
            Company health and financials viewer coming soon
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
