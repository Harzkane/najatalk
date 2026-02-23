"use client";

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
  apiHealthStatus: string;
  readinessStatus: string;
  databaseStatus: string;
  uptimeHours: number;
  lastHealthCheckAt: string;
  onRefreshAll: () => void;
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
  apiHealthStatus,
  readinessStatus,
  databaseStatus,
  uptimeHours,
  lastHealthCheckAt,
  onRefreshAll,
}: AdminOverviewProps) {
  const formatStatus = (value: string) => value.replaceAll("_", " ");
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
