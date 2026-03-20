"use client";
import { useState } from "react";

type AdminOverviewProps = {
  reportsCount: number;
  adsCount: number;
  pendingPayoutCount: number;
  failedPayoutCount: number;
  premiumInFlightCount: number;
  premiumFailedCount: number;
  payoutFailureRatePct: number;
  premiumFailureRatePct: number;
  oldestPendingPayoutHours: number;
  oldestPremiumInFlightHours: number;
  mismatchedUsersCount: number;
  highSeverityMismatchCount: number;
  riskSignalsCount: number;
  searchInsightsSummary: {
    totalSearches: number;
    noResultSearches: number;
    uniqueQueries: number;
    suggestionClicks: number;
    resultClicks: number;
    categoryFilterUses: number;
  };
  topSearchQueries: Array<{
    query: string;
    count: number;
    lastSearchedAt: string | null;
    category?: string | null;
  }>;
  topNoResultQueries: Array<{
    query: string;
    count: number;
    lastSearchedAt: string | null;
  }>;
  topSuggestionQueries: Array<{
    query: string;
    count: number;
    lastSearchedAt: string | null;
  }>;
  topClickedQueries: Array<{
    query: string;
    count: number;
    lastSearchedAt: string | null;
  }>;
  topCategoryFilters: Array<{
    query: string;
    count: number;
    lastSearchedAt: string | null;
    category?: string | null;
  }>;
  apiHealthStatus: string;
  readinessStatus: string;
  databaseStatus: string;
  uptimeHours: number;
  lastHealthCheckAt: string;
  opsQuickCheckRows: Array<{
    id: string;
    label: string;
    status: "pass" | "fail";
    ms: number;
    detail: string;
  }>;
  opsQuickCheckLastRunAt: string;
  isOpsQuickCheckRunning: boolean;
  onRefreshAll: () => void;
  onRunOpsQuickCheck: () => void;
};

export default function AdminOverview({
  reportsCount,
  adsCount,
  pendingPayoutCount,
  failedPayoutCount,
  premiumInFlightCount,
  premiumFailedCount,
  payoutFailureRatePct,
  premiumFailureRatePct,
  oldestPendingPayoutHours,
  oldestPremiumInFlightHours,
  mismatchedUsersCount,
  highSeverityMismatchCount,
  riskSignalsCount,
  searchInsightsSummary,
  topSearchQueries,
  topNoResultQueries,
  topSuggestionQueries,
  topClickedQueries,
  topCategoryFilters,
  apiHealthStatus,
  readinessStatus,
  databaseStatus,
  uptimeHours,
  lastHealthCheckAt,
  opsQuickCheckRows,
  opsQuickCheckLastRunAt,
  isOpsQuickCheckRunning,
  onRefreshAll,
  onRunOpsQuickCheck,
}: AdminOverviewProps) {
  const [copiedCommandKey, setCopiedCommandKey] = useState<string>("");
  const formatStatus = (value: string) => value.replaceAll("_", " ");
  const rollbackCaptureCommand =
    "npm run ops:drill:rollback:capture -- evidence/drills/<drill-id>";
  const restoreCaptureCommand =
    "npm run ops:drill:restore:capture -- evidence/drills/<drill-id>";
  const copyCommand = async (key: string, command: string) => {
    try {
      await navigator.clipboard.writeText(command);
      setCopiedCommandKey(key);
      setTimeout(() => {
        setCopiedCommandKey((prev) => (prev === key ? "" : prev));
      }, 1500);
    } catch {
      setCopiedCommandKey("");
    }
  };
  const thresholds = {
    pendingPayoutCount: 20,
    failedPayoutCount: 10,
    premiumInFlightCount: 20,
    premiumFailedCount: 8,
    mismatchedUsersCount: 6,
    highSeverityMismatchCount: 2,
    oldestPendingPayoutHours: 24,
    oldestPremiumInFlightHours: 2,
  };
  const alerts: Array<{ label: string; value: string; href: string }> = [];
  if (pendingPayoutCount >= thresholds.pendingPayoutCount) {
    alerts.push({
      label: "Pending payout queue above threshold",
      value: `${pendingPayoutCount} pending`,
      href: "#payouts",
    });
  }
  if (failedPayoutCount >= thresholds.failedPayoutCount) {
    alerts.push({
      label: "Payout failures above threshold",
      value: `${failedPayoutCount} failed`,
      href: "#payouts",
    });
  }
  if (premiumInFlightCount >= thresholds.premiumInFlightCount) {
    alerts.push({
      label: "Premium verification queue is growing",
      value: `${premiumInFlightCount} in flight`,
      href: "#premium",
    });
  }
  if (premiumFailedCount >= thresholds.premiumFailedCount) {
    alerts.push({
      label: "Premium payment failures above threshold",
      value: `${premiumFailedCount} failed`,
      href: "#premium",
    });
  }
  if (mismatchedUsersCount >= thresholds.mismatchedUsersCount) {
    alerts.push({
      label: "Wallet mismatch queue above threshold",
      value: `${mismatchedUsersCount} mismatched`,
      href: "#mismatches",
    });
  }
  if (highSeverityMismatchCount >= thresholds.highSeverityMismatchCount) {
    alerts.push({
      label: "High-severity wallet mismatches detected",
      value: `${highSeverityMismatchCount} high severity`,
      href: "#mismatches",
    });
  }
  if (oldestPendingPayoutHours >= thresholds.oldestPendingPayoutHours) {
    alerts.push({
      label: "Oldest pending payout is aging out",
      value: `${oldestPendingPayoutHours.toFixed(1)}h old`,
      href: "#payouts",
    });
  }
  if (oldestPremiumInFlightHours >= thresholds.oldestPremiumInFlightHours) {
    alerts.push({
      label: "Oldest premium verification is aging",
      value: `${oldestPremiumInFlightHours.toFixed(1)}h old`,
      href: "#premium",
    });
  }

  return (
    <section
      id="overview"
      className="scroll-mt-20 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60"
    >
      <h2 className="text-2xl font-semibold text-slate-900">Overview</h2>
      <p className="mt-1 text-sm text-slate-600">
        Quick pulse of moderation, payouts, ads, and reconciliations.
      </p>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
          <p className="text-xs uppercase tracking-wide text-rose-700">Reports</p>
          <p className="mt-1 text-3xl font-semibold text-rose-900">{reportsCount}</p>
        </div>
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
          <p className="text-xs uppercase tracking-wide text-blue-700">Pending Ads</p>
          <p className="mt-1 text-3xl font-semibold text-blue-900">{adsCount}</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs uppercase tracking-wide text-amber-700">Pending Payouts</p>
          <p className="mt-1 text-3xl font-semibold text-amber-900">{pendingPayoutCount}</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-xs uppercase tracking-wide text-emerald-700">Wallet Alerts</p>
          <p className="mt-1 text-3xl font-semibold text-emerald-900">{mismatchedUsersCount}</p>
        </div>
        <div className="rounded-xl border border-fuchsia-200 bg-fuchsia-50 p-4">
          <p className="text-xs uppercase tracking-wide text-fuchsia-700">Risk Signals</p>
          <p className="mt-1 text-3xl font-semibold text-fuchsia-900">{riskSignalsCount}</p>
        </div>
      </div>
      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs uppercase tracking-wide text-slate-600">Search Insights (7d)</p>
          <p className="text-xs text-slate-500">Live signals from forum discovery.</p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Total Searches</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">
              {searchInsightsSummary.totalSearches}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">No-result Searches</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">
              {searchInsightsSummary.noResultSearches}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Unique Queries</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">
              {searchInsightsSummary.uniqueQueries}
            </p>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Suggestion Clicks</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">
              {searchInsightsSummary.suggestionClicks}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Result Clicks</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">
              {searchInsightsSummary.resultClicks}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Category Filter Uses</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">
              {searchInsightsSummary.categoryFilterUses}
            </p>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Top Searches</p>
            <div className="mt-2 space-y-2">
              {topSearchQueries.length ? (
                topSearchQueries.map((row) => (
                  <div
                    key={`top-${row.query}`}
                    className="flex items-start justify-between gap-3 border-b border-slate-100 pb-2 last:border-b-0 last:pb-0"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900">{row.query}</p>
                      <p className="text-xs text-slate-500">
                        {row.category ? `Category: ${row.category}` : "All categories"}
                      </p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                      {row.count}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">No search data yet.</p>
              )}
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Top No-result Queries</p>
            <div className="mt-2 space-y-2">
              {topNoResultQueries.length ? (
                topNoResultQueries.map((row) => (
                  <div
                    key={`no-result-${row.query}`}
                    className="flex items-start justify-between gap-3 border-b border-slate-100 pb-2 last:border-b-0 last:pb-0"
                  >
                    <p className="text-sm font-medium text-slate-900">{row.query}</p>
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                      {row.count}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">No no-result searches yet.</p>
              )}
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Top Suggestion Clicks</p>
            <div className="mt-2 space-y-2">
              {topSuggestionQueries.length ? (
                topSuggestionQueries.map((row) => (
                  <div
                    key={`suggestion-${row.query}`}
                    className="flex items-start justify-between gap-3 border-b border-slate-100 pb-2 last:border-b-0 last:pb-0"
                  >
                    <p className="text-sm font-medium text-slate-900">{row.query}</p>
                    <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-800">
                      {row.count}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">No suggestion click data yet.</p>
              )}
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Top Result-click Queries</p>
            <div className="mt-2 space-y-2">
              {topClickedQueries.length ? (
                topClickedQueries.map((row) => (
                  <div
                    key={`click-${row.query}`}
                    className="flex items-start justify-between gap-3 border-b border-slate-100 pb-2 last:border-b-0 last:pb-0"
                  >
                    <p className="text-sm font-medium text-slate-900">{row.query}</p>
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                      {row.count}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">No result clicks recorded yet.</p>
              )}
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Top Category Filters</p>
            <div className="mt-2 space-y-2">
              {topCategoryFilters.length ? (
                topCategoryFilters.map((row) => (
                  <div
                    key={`filter-${row.query}`}
                    className="flex items-start justify-between gap-3 border-b border-slate-100 pb-2 last:border-b-0 last:pb-0"
                  >
                    <p className="text-sm font-medium text-slate-900">
                      {row.category || row.query}
                    </p>
                    <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-800">
                      {row.count}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">No category filter data yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs uppercase tracking-wide text-slate-600">SLA Snapshot</p>
          <p className="text-xs text-slate-500">
            Last check: {lastHealthCheckAt ? new Date(lastHealthCheckAt).toLocaleString() : "-"}
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">API Health</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{formatStatus(apiHealthStatus)}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Readiness</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{formatStatus(readinessStatus)}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Database</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{formatStatus(databaseStatus)}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Uptime</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{uptimeHours.toFixed(2)}h</p>
          </div>
        </div>
      </div>
      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="mb-2 text-xs uppercase tracking-wide text-slate-600">
          Queue, Failure, and Aging Drill-down
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Pending Payout Queue</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{pendingPayoutCount}</p>
            <a href="#payouts" className="mt-1 inline-block text-xs text-blue-700 hover:underline">
              Open Payouts
            </a>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Payout Failures</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{failedPayoutCount}</p>
            <p className="text-xs text-slate-500">Rate: {payoutFailureRatePct.toFixed(1)}%</p>
            <a href="#payouts" className="mt-1 inline-block text-xs text-blue-700 hover:underline">
              Drill into failed payouts
            </a>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Premium In-flight Queue</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{premiumInFlightCount}</p>
            <p className="text-xs text-slate-500">Oldest: {oldestPremiumInFlightHours.toFixed(1)}h</p>
            <a href="#premium" className="mt-1 inline-block text-xs text-blue-700 hover:underline">
              Open Premium Audit
            </a>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Premium Failures</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{premiumFailedCount}</p>
            <p className="text-xs text-slate-500">Rate: {premiumFailureRatePct.toFixed(1)}%</p>
            <a href="#premium" className="mt-1 inline-block text-xs text-blue-700 hover:underline">
              Review failure reasons
            </a>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Wallet Mismatch Queue</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{mismatchedUsersCount}</p>
            <p className="text-xs text-slate-500">High severity: {highSeverityMismatchCount}</p>
            <a
              href="#mismatches"
              className="mt-1 inline-block text-xs text-blue-700 hover:underline"
            >
              Open Wallet Alerts
            </a>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Oldest Pending Payout</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">
              {oldestPendingPayoutHours.toFixed(1)}h
            </p>
            <p className="text-xs text-slate-500">Threshold: {thresholds.oldestPendingPayoutHours}h</p>
            <a href="#payouts" className="mt-1 inline-block text-xs text-blue-700 hover:underline">
              Prioritize oldest items
            </a>
          </div>
        </div>
      </div>
      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
        <p className="text-xs uppercase tracking-wide text-slate-600">Threshold Alerts</p>
        {alerts.length ? (
          <div className="mt-2 space-y-2">
            {alerts.map((alert, index) => (
              <div
                key={`${alert.label}-${index}`}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm"
              >
                <p className="font-medium text-rose-900">
                  {alert.label}: <span className="font-semibold">{alert.value}</span>
                </p>
                <a href={alert.href} className="text-rose-700 underline-offset-2 hover:underline">
                  Open section
                </a>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm text-emerald-700">No threshold breaches right now.</p>
        )}
      </div>
      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs uppercase tracking-wide text-slate-600">Ops Quick Check</p>
          <p className="text-xs text-slate-500">
            Last run:{" "}
            {opsQuickCheckLastRunAt ? new Date(opsQuickCheckLastRunAt).toLocaleString() : "-"}
          </p>
        </div>
        <p className="mt-1 text-sm text-slate-600">
          Lightweight endpoint probes only. No Playwright jobs, no rollback/restore tasks.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={onRunOpsQuickCheck}
            disabled={isOpsQuickCheckRunning}
            className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isOpsQuickCheckRunning ? "Running..." : "Run Ops Quick Check"}
          </button>
        </div>
        {opsQuickCheckRows.length ? (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50">
                <tr>
                  <th className="p-2 font-semibold text-slate-700">Check</th>
                  <th className="p-2 font-semibold text-slate-700">Status</th>
                  <th className="p-2 font-semibold text-slate-700">Latency</th>
                  <th className="p-2 font-semibold text-slate-700">Detail</th>
                </tr>
              </thead>
              <tbody>
                {opsQuickCheckRows.map((row) => (
                  <tr key={row.id} className="border-t border-slate-100">
                    <td className="p-2 text-slate-700">{row.label}</td>
                    <td className="p-2">
                      <span
                        className={
                          row.status === "pass"
                            ? "rounded bg-emerald-100 px-2 py-0.5 text-emerald-800"
                            : "rounded bg-rose-100 px-2 py-0.5 text-rose-800"
                        }
                      >
                        {row.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-2 text-slate-600">{row.ms}ms</td>
                    <td className="p-2 text-slate-600">{row.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-3 text-xs text-slate-500">
            Run once to capture current backend/admin endpoint health.
          </p>
        )}
      </div>
      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
        <p className="text-xs uppercase tracking-wide text-slate-600">Drill Evidence</p>
        <p className="mt-1 text-sm text-slate-600">
          These commands capture rollback/restore validation logs for audit evidence. Run them in
          terminal after completing the actual drill steps.
        </p>
        <div className="mt-3 space-y-3">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-semibold text-slate-700">Post-Rollback Capture</p>
            <code className="mt-1 block overflow-x-auto rounded bg-slate-900 px-2 py-1 text-xs text-slate-100">
              {rollbackCaptureCommand}
            </code>
            <button
              onClick={() => copyCommand("rollback", rollbackCaptureCommand)}
              className="mt-2 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
            >
              {copiedCommandKey === "rollback" ? "Copied" : "Copy command"}
            </button>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-semibold text-slate-700">Post-Restore Capture</p>
            <code className="mt-1 block overflow-x-auto rounded bg-slate-900 px-2 py-1 text-xs text-slate-100">
              {restoreCaptureCommand}
            </code>
            <button
              onClick={() => copyCommand("restore", restoreCaptureCommand)}
              className="mt-2 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
            >
              {copiedCommandKey === "restore" ? "Copied" : "Copy command"}
            </button>
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Note: Keep heavy drills in terminal/CI to avoid stressing production dashboard runtime.
        </p>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={onRefreshAll}
          className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Refresh All Data
        </button>
        <a
          href="#reports"
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Go to Moderation
        </a>
      </div>
    </section>
  );
}
