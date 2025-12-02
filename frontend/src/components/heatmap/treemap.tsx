"use client";

import { useRef, useEffect, useState, useMemo, memo } from "react";
import { HeatmapSector, HeatmapStock } from "@/types/heatmap";
import { useTransitionReady } from "@/components/nav/page-carousel";

interface TreemapProps {
  sectors: HeatmapSector[];
}

// Calculate color based on percentage change - frosted transparent style
function getChangeColor(change: number): { bg: string; border: string } {
  const intensity = Math.min(Math.abs(change) / 3, 1); // Cap at 3% for full intensity
  const alpha = 0.25 + intensity * 0.35; // 0.25 to 0.6 opacity

  if (change > 0) {
    // Green - frosted with varying opacity
    return {
      bg: `rgba(34, 197, 94, ${alpha})`,
      border: `rgba(34, 197, 94, ${0.3 + intensity * 0.4})`,
    };
  } else if (change < 0) {
    // Red - frosted with varying opacity
    return {
      bg: `rgba(239, 68, 68, ${alpha})`,
      border: `rgba(239, 68, 68, ${0.3 + intensity * 0.4})`,
    };
  }

  // Neutral - subtle gray
  return {
    bg: "rgba(128, 128, 128, 0.2)",
    border: "rgba(128, 128, 128, 0.3)",
  };
}

// Dampen market cap to prevent mega-caps from dominating
// Uses square root scaling to compress the range
function dampenMarketCap(marketCap: number | null): number {
  const cap = marketCap || 10_000_000_000; // Default 10B
  // Square root dampening with a floor
  return Math.sqrt(cap / 1_000_000_000) * 10 + 5;
}

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface LayoutItem<T> {
  data: T;
  value: number;
  rect?: Rect;
}

// Squarify treemap algorithm - attempts to make tiles as square as possible
function squarify<T>(
  items: LayoutItem<T>[],
  container: Rect,
  minSize: number = 0
): LayoutItem<T>[] {
  if (items.length === 0) return [];

  const totalValue = items.reduce((sum, item) => sum + item.value, 0);
  if (totalValue === 0) return [];

  // Sort by value descending for better layout
  const sorted = [...items].sort((a, b) => b.value - a.value);

  const result: LayoutItem<T>[] = [];
  let remaining = sorted;
  let remainingValue = totalValue;
  let currentRect = { ...container };

  while (remaining.length > 0 && currentRect.width > 0 && currentRect.height > 0) {
    const { row, rest, rowValue } = layoutRow(remaining, currentRect, remainingValue, minSize);

    // Add row items to result
    result.push(...row);

    // Update remaining rect based on actual row dimensions
    if (row.length > 0 && row[0].rect) {
      const isHorizontal = currentRect.width >= currentRect.height;
      if (isHorizontal) {
        const rowWidth = row[0].rect.width;
        currentRect = {
          x: currentRect.x + rowWidth,
          y: currentRect.y,
          width: Math.max(0, currentRect.width - rowWidth),
          height: currentRect.height,
        };
      } else {
        const rowHeight = row[0].rect.height;
        currentRect = {
          x: currentRect.x,
          y: currentRect.y + rowHeight,
          width: currentRect.width,
          height: Math.max(0, currentRect.height - rowHeight),
        };
      }
    }

    remaining = rest;
    remainingValue -= rowValue;

    // Safety: prevent infinite loop
    if (remaining.length === items.length) break;
  }

  return result;
}

function layoutRow<T>(
  items: LayoutItem<T>[],
  container: Rect,
  remainingTotalValue: number,
  minSize: number
): { row: LayoutItem<T>[]; rest: LayoutItem<T>[]; rowValue: number } {
  if (items.length === 0) return { row: [], rest: [], rowValue: 0 };

  const isHorizontal = container.width >= container.height;
  const side = isHorizontal ? container.height : container.width;
  const mainAxis = isHorizontal ? container.width : container.height;

  // Find optimal row
  let row: LayoutItem<T>[] = [];
  let rowValue = 0;
  let bestRatio = Infinity;

  for (let i = 0; i < items.length; i++) {
    const testRow = items.slice(0, i + 1);
    const testValue = testRow.reduce((sum, item) => sum + item.value, 0);
    const rowSize = (testValue / remainingTotalValue) * mainAxis;

    // Calculate worst aspect ratio in this row
    let worstRatio = 0;
    for (const item of testRow) {
      const itemSize = (item.value / testValue) * side;
      const ratio = Math.max(rowSize / Math.max(itemSize, 1), Math.max(itemSize, 1) / Math.max(rowSize, 1));
      worstRatio = Math.max(worstRatio, ratio);
    }

    // Stop if ratio is getting worse and we have at least one item
    if (worstRatio > bestRatio && row.length > 0) {
      break;
    }

    bestRatio = worstRatio;
    row = testRow;
    rowValue = testValue;
  }

  // Calculate actual positions for row items
  const rowSize = (rowValue / remainingTotalValue) * mainAxis;
  let offset = 0;

  const positionedRow = row.map((item) => {
    const itemSize = (item.value / rowValue) * side;
    const rect: Rect = isHorizontal
      ? {
          x: container.x,
          y: container.y + offset,
          width: Math.max(rowSize, minSize),
          height: Math.max(itemSize, minSize),
        }
      : {
          x: container.x + offset,
          y: container.y,
          width: Math.max(itemSize, minSize),
          height: Math.max(rowSize, minSize),
        };
    offset += itemSize;
    return { ...item, rect };
  });

  return {
    row: positionedRow,
    rest: items.slice(row.length),
    rowValue,
  };
}

interface StockTileProps {
  stock: HeatmapStock;
  rect: Rect;
}

const StockTile = memo(function StockTile({ stock, rect }: StockTileProps) {
  const colors = getChangeColor(stock.change);

  // Minimum dimensions for showing content
  const minWidth = 30;
  const minHeight = 20;

  const showTicker = rect.width >= minWidth && rect.height >= minHeight;
  const showChange = rect.width >= 45 && rect.height >= 32;
  const showName = rect.width >= 70 && rect.height >= 50;

  // Dynamic font sizing
  const tickerSize = Math.max(7, Math.min(rect.width / 4.5, rect.height / 2.8, 13));
  const changeSize = Math.max(6, Math.min(rect.width / 6, rect.height / 4, 10));

  return (
    <div
      className="absolute overflow-hidden cursor-pointer transition-opacity duration-150 hover:opacity-80 hover:z-20"
      style={{
        left: rect.x,
        top: rect.y,
        width: rect.width,
        height: rect.height,
        backgroundColor: colors.bg,
        borderWidth: 1,
        borderStyle: "solid",
        borderColor: colors.border,
        willChange: "opacity",
      }}
      title={`${stock.name} (${stock.ticker})\n$${stock.price.toFixed(2)}\n${stock.change >= 0 ? "+" : ""}${stock.change.toFixed(2)}%`}
    >
      <div className="h-full w-full flex flex-col items-center justify-center text-white">
        {showTicker ? (
          <>
            <span
              className="font-semibold leading-none drop-shadow-sm"
              style={{ fontSize: tickerSize }}
            >
              {stock.ticker}
            </span>
            {showChange && (
              <span
                className="leading-none mt-0.5 opacity-95 drop-shadow-sm"
                style={{ fontSize: changeSize }}
              >
                {stock.change >= 0 ? "+" : ""}
                {stock.change.toFixed(2)}%
              </span>
            )}
            {showName && (
              <span
                className="leading-none mt-0.5 opacity-80 truncate max-w-[95%] text-center drop-shadow-sm"
                style={{ fontSize: changeSize * 0.85 }}
              >
                {stock.name}
              </span>
            )}
          </>
        ) : (
          // For tiny tiles, just show a colored block
          <span className="opacity-0">.</span>
        )}
      </div>
    </div>
  );
});

interface SectorBlockProps {
  sector: HeatmapSector;
  rect: Rect;
}

const SectorBlock = memo(function SectorBlock({ sector, rect }: SectorBlockProps) {
  const headerHeight = 16;

  const contentRect: Rect = {
    x: 0,
    y: 0,
    width: rect.width,
    height: Math.max(0, rect.height - headerHeight),
  };

  // Layout stocks within sector using dampened market cap
  const stockItems: LayoutItem<HeatmapStock>[] = sector.stocks.map((stock) => ({
    data: stock,
    value: dampenMarketCap(stock.market_cap),
  }));

  const stockLayout = useMemo(
    () => squarify(stockItems, contentRect, 8),
    [sector.stocks, contentRect.width, contentRect.height]
  );

  // Don't render if too small
  if (rect.width < 40 || rect.height < 30) {
    return (
      <div
        className="absolute overflow-hidden border-[0.5px] border-white/10"
        style={{
          left: rect.x,
          top: rect.y,
          width: rect.width,
          height: rect.height,
          backgroundColor: "rgba(0,0,0,0.3)",
        }}
        title={`${sector.name}: ${sector.change >= 0 ? "+" : ""}${sector.change.toFixed(2)}%`}
      />
    );
  }

  return (
    <div
      className="absolute overflow-hidden"
      style={{
        left: rect.x,
        top: rect.y,
        width: rect.width,
        height: rect.height,
      }}
    >
      {/* Sector header */}
      <div
        className="absolute top-0 left-0 right-0 z-10 px-1.5 flex items-center bg-black/70"
        style={{ height: headerHeight }}
      >
        <span className="text-[9px] font-semibold text-white/90 truncate flex-1">
          {sector.name}
        </span>
        <span
          className={`text-[9px] font-medium ml-1 ${
            sector.change >= 0 ? "text-green-400" : "text-red-400"
          }`}
        >
          {sector.change >= 0 ? "+" : ""}
          {sector.change.toFixed(2)}%
        </span>
      </div>

      {/* Stocks container - directly below header, no gap */}
      <div
        className="absolute left-0 right-0 bottom-0"
        style={{
          top: headerHeight,
        }}
      >
        {stockLayout.map(
          (item) =>
            item.rect && (
              <StockTile
                key={item.data.ticker}
                stock={item.data}
                rect={item.rect}
              />
            )
        )}
      </div>
    </div>
  );
});

export function Treemap({ sectors }: TreemapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { isReady, hasVisited, markVisited } = useTransitionReady();
  const [shouldRender, setShouldRender] = useState(hasVisited.heatmap);

  // Only defer on first visit - subsequent visits render immediately
  useEffect(() => {
    if (hasVisited.heatmap) {
      // Already visited before - render immediately
      setShouldRender(true);
    } else if (isReady) {
      // First visit - wait for transition, then render and mark as visited
      const timer = setTimeout(() => {
        setShouldRender(true);
        markVisited("heatmap");
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isReady, hasVisited.heatmap, markVisited]);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };

    // Debounced resize handler
    const debouncedUpdate = () => {
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
      resizeTimeoutRef.current = setTimeout(updateDimensions, 100);
    };

    // Initial measurement (no debounce)
    updateDimensions();

    const resizeObserver = new ResizeObserver(debouncedUpdate);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
    };
  }, []);

  // Calculate sector layout with dampened values
  const sectorLayout = useMemo(() => {
    if (dimensions.width === 0 || dimensions.height === 0) return [];

    const sectorItems: LayoutItem<HeatmapSector>[] = sectors.map((sector) => ({
      data: sector,
      // Use dampened sum for sector size
      value: sector.stocks.reduce((sum, s) => sum + dampenMarketCap(s.market_cap), 0),
    }));

    return squarify(sectorItems, {
      x: 0,
      y: 0,
      width: dimensions.width,
      height: dimensions.height,
    });
  }, [sectors, dimensions.width, dimensions.height]);

  if (!sectors.length) {
    return (
      <div
        ref={containerRef}
        className="h-full w-full flex items-center justify-center text-muted-foreground"
      >
        No data available
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full h-full bg-black/20 rounded-sm overflow-hidden">
      {shouldRender ? (
        sectorLayout.map(
          (item) =>
            item.rect && (
              <SectorBlock
                key={item.data.name}
                sector={item.data}
                rect={item.rect}
              />
            )
        )
      ) : (
        // Lightweight placeholder only on first render
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
