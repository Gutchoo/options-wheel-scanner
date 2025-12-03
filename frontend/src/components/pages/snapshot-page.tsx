"use client";

import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useTickerSnapshot } from "@/hooks/use-ticker-snapshot";
import { TickerHeader } from "@/components/snapshot/ticker-header";
import { MetricCard, MetricRow } from "@/components/snapshot/metric-card";
import {
  DollarSign,
  TrendingUp,
  PieChart,
  BarChart3,
  Landmark,
  Wallet,
  Calendar,
  AlertTriangle,
  Newspaper,
  FileText,
  Building2,
} from "lucide-react";

interface SnapshotPageProps {
  initialTicker?: string | null;
  onTickerClear?: () => void;
}

export function SnapshotPage({ initialTicker, onTickerClear }: SnapshotPageProps) {
  const {
    ticker,
    snapshot,
    priceHistory,
    news,
    filings,
    chartPeriod,
    isLoading,
    error,
    loadTicker,
    setChartPeriod,
  } = useTickerSnapshot();

  // Load initial ticker from navigation (heatmap/scanner click)
  useEffect(() => {
    if (initialTicker && initialTicker !== ticker) {
      loadTicker(initialTicker);
    }
  }, [initialTicker, ticker, loadTicker]);

  const handleTickerSubmit = (newTicker: string) => {
    onTickerClear?.();
    loadTicker(newTicker);
  };

  return (
    <div className="h-full w-full p-4 overflow-y-auto">
      <div className="max-w-[1800px] mx-auto space-y-4">
        {/* Header with ticker input */}
        <TickerHeader
          ticker={ticker}
          snapshot={snapshot}
          isLoading={isLoading}
          error={error}
          onSubmit={handleTickerSubmit}
        />

        {/* Show content only when we have data */}
        {snapshot && (
          <>
            {/* Row 1: Key Metrics Grid (4 columns) */}
            <div className="grid grid-cols-4 gap-4">
              {/* Valuation */}
              <MetricCard title="Valuation" icon={<DollarSign className="h-3.5 w-3.5" />}>
                <MetricRow label="P/E (TTM)" value={snapshot.valuation.pe_ratio} format="ratio" />
                <MetricRow label="P/E (Fwd)" value={snapshot.valuation.forward_pe} format="ratio" />
                <MetricRow label="PEG" value={snapshot.valuation.peg_ratio} format="ratio" />
                <MetricRow label="P/S" value={snapshot.valuation.ps_ratio} format="ratio" />
                <MetricRow label="P/B" value={snapshot.valuation.pb_ratio} format="ratio" />
                <MetricRow label="EV/EBITDA" value={snapshot.valuation.ev_ebitda} format="ratio" />
              </MetricCard>

              {/* Analyst */}
              <MetricCard title="Analyst" icon={<BarChart3 className="h-3.5 w-3.5" />}>
                <div className="mb-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-white/50">Rating</span>
                    <span className="text-sm font-medium text-white capitalize">
                      {snapshot.analyst.rating || "N/A"}
                      {snapshot.analyst.rating_score && ` (${snapshot.analyst.rating_score.toFixed(1)})`}
                    </span>
                  </div>
                  <div className="text-xs text-white/40 text-right">
                    {snapshot.analyst.num_analysts} analysts
                  </div>
                </div>
                <MetricRow label="Target Low" value={snapshot.analyst.target_low} format="currency" />
                <MetricRow label="Target Mean" value={snapshot.analyst.target_mean} format="currency" />
                <MetricRow label="Target High" value={snapshot.analyst.target_high} format="currency" />
              </MetricCard>

              {/* Profitability */}
              <MetricCard title="Profitability" icon={<PieChart className="h-3.5 w-3.5" />}>
                <MetricRow label="Gross Margin" value={snapshot.profitability.gross_margin} format="percent" />
                <MetricRow label="Operating Margin" value={snapshot.profitability.operating_margin} format="percent" />
                <MetricRow label="Profit Margin" value={snapshot.profitability.profit_margin} format="percent" />
                <MetricRow label="ROE" value={snapshot.profitability.roe} format="percent" />
                <MetricRow label="ROA" value={snapshot.profitability.roa} format="percent" />
              </MetricCard>

              {/* Growth */}
              <MetricCard title="Growth" icon={<TrendingUp className="h-3.5 w-3.5" />}>
                <MetricRow label="Revenue Growth" value={snapshot.growth.revenue_growth} format="percent" colorCode />
                <MetricRow label="Earnings Growth" value={snapshot.growth.earnings_growth} format="percent" colorCode />
                <MetricRow label="EPS (TTM)" value={snapshot.growth.eps_trailing} format="currency" />
                <MetricRow label="EPS (Fwd)" value={snapshot.growth.eps_forward} format="currency" />
              </MetricCard>
            </div>

            {/* Row 2: Financial Health Grid (4 columns) */}
            <div className="grid grid-cols-4 gap-4">
              {/* Balance Sheet */}
              <MetricCard title="Balance Sheet" icon={<Landmark className="h-3.5 w-3.5" />}>
                <MetricRow label="Total Cash" value={snapshot.balance_sheet.cash} format="currency" />
                <MetricRow label="Total Debt" value={snapshot.balance_sheet.debt} format="currency" />
                <MetricRow label="Debt/Equity" value={snapshot.balance_sheet.debt_equity} format="ratio" />
                <MetricRow label="Current Ratio" value={snapshot.balance_sheet.current_ratio} format="ratio" />
                <MetricRow label="Book Value" value={snapshot.balance_sheet.book_value} format="currency" />
              </MetricCard>

              {/* Cash Flow */}
              <MetricCard title="Cash Flow" icon={<Wallet className="h-3.5 w-3.5" />}>
                <MetricRow label="Operating CF" value={snapshot.cash_flow.operating_cf} format="currency" />
                <MetricRow label="Free Cash Flow" value={snapshot.cash_flow.free_cf} format="currency" />
                {snapshot.dividend.yield && (
                  <>
                    <div className="h-px bg-white/10 my-2" />
                    <MetricRow label="Div Yield" value={snapshot.dividend.yield} format="percent" />
                    <MetricRow label="Payout Ratio" value={snapshot.dividend.payout_ratio} format="percent" />
                  </>
                )}
              </MetricCard>

              {/* Earnings */}
              <MetricCard title="Earnings" icon={<Calendar className="h-3.5 w-3.5" />}>
                <div className="mb-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-white/50">Next Earnings</span>
                    <span className="text-sm font-medium text-white">
                      {snapshot.earnings.next_date
                        ? new Date(snapshot.earnings.next_date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })
                        : "N/A"}
                    </span>
                  </div>
                </div>
                <div className="text-xs text-white/50 mb-1">Recent Surprises</div>
                <div className="space-y-0.5">
                  {snapshot.earnings.beat_history.slice(0, 4).map((beat, i) => (
                    <div key={i} className="flex justify-between text-xs">
                      <span className="text-white/40">
                        {new Date(beat.date).toLocaleDateString("en-US", { month: "short", year: "2-digit" })}
                      </span>
                      <span className={beat.surprise_pct && beat.surprise_pct >= 0 ? "text-green-400" : "text-red-400"}>
                        {beat.surprise_pct !== null ? `${beat.surprise_pct >= 0 ? "+" : ""}${beat.surprise_pct.toFixed(1)}%` : "N/A"}
                      </span>
                    </div>
                  ))}
                </div>
              </MetricCard>

              {/* Risk */}
              <MetricCard title="Risk" icon={<AlertTriangle className="h-3.5 w-3.5" />}>
                <MetricRow label="Beta" value={snapshot.risk.beta} format="ratio" />
                <MetricRow label="Short % Float" value={snapshot.risk.short_percent} format="percent" />
                <MetricRow label="Short Ratio" value={snapshot.risk.short_ratio} format="ratio" suffix=" days" />
                <div className="h-px bg-white/10 my-2" />
                <MetricRow label="Insider Own" value={snapshot.risk.insider_ownership} format="percent" />
                <MetricRow label="Institutional" value={snapshot.risk.institutional_ownership} format="percent" />
              </MetricCard>
            </div>

            {/* Row 3: News, Filings, Profile (3 columns) */}
            <div className="grid grid-cols-3 gap-4">
              {/* News */}
              <MetricCard title="Recent News" icon={<Newspaper className="h-3.5 w-3.5" />}>
                {news.length > 0 ? (
                  <div className="space-y-2">
                    {news.slice(0, 4).map((article) => (
                      <a
                        key={article.id}
                        href={article.link || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block group"
                      >
                        <div className="text-xs text-white/80 group-hover:text-white line-clamp-2">
                          {article.title}
                        </div>
                        <div className="text-[10px] text-white/40 mt-0.5">
                          {article.publisher}
                          {article.published_at && ` · ${formatTimeAgo(article.published_at)}`}
                        </div>
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-white/40">No recent news</div>
                )}
              </MetricCard>

              {/* SEC Filings */}
              <MetricCard title="SEC Filings" icon={<FileText className="h-3.5 w-3.5" />}>
                {filings.length > 0 ? (
                  <div className="space-y-1.5">
                    {filings.slice(0, 5).map((filing, i) => (
                      <a
                        key={i}
                        href={filing.edgar_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between group"
                      >
                        <span className="text-xs font-medium text-white/70 group-hover:text-white">
                          {filing.type}
                        </span>
                        <span className="text-[10px] text-white/40">
                          {filing.date}
                        </span>
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-white/40">No filings available</div>
                )}
              </MetricCard>

              {/* Company Profile */}
              <MetricCard title="Company Profile" icon={<Building2 className="h-3.5 w-3.5" />}>
                {snapshot.profile.description ? (
                  <p className="text-xs text-white/60 line-clamp-5">
                    {snapshot.profile.description}
                  </p>
                ) : (
                  <p className="text-xs text-white/40">No description available</p>
                )}
                <div className="mt-2 pt-2 border-t border-white/10 space-y-0.5">
                  {snapshot.profile.hq && (
                    <div className="text-[10px] text-white/40">HQ: {snapshot.profile.hq}</div>
                  )}
                  {snapshot.profile.employees && (
                    <div className="text-[10px] text-white/40">
                      Employees: {snapshot.profile.employees.toLocaleString()}
                    </div>
                  )}
                  {snapshot.profile.website && (
                    <a
                      href={snapshot.profile.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-primary hover:underline"
                    >
                      {snapshot.profile.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                    </a>
                  )}
                </div>
              </MetricCard>
            </div>
          </>
        )}

        {/* Empty state */}
        {!snapshot && !isLoading && !error && (
          <Card className="bg-transparent backdrop-blur-sm border-white/10">
            <CardContent className="h-[400px] flex flex-col items-center justify-center text-center p-6">
              <h3 className="text-lg font-medium text-white/80 mb-2">
                Enter a ticker symbol to view financial snapshot
              </h3>
              <p className="text-sm text-white/50">
                Or click on any stock in the Sector Heatmap or Scanner results
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
