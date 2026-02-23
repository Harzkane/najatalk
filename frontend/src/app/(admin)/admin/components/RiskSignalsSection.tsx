"use client";

import type {
  AdminPagination,
  ContestRiskSignalRow,
  ContestRiskSignalSummary,
  UserRiskSignalRow,
  UserRiskSignalSummary,
} from "./types";

type RiskSignalsSectionProps = {
  userSummary: UserRiskSignalSummary;
  userRows: UserRiskSignalRow[];
  userSeverityFilter: "all" | "low" | "medium" | "high";
  userWindowDays: string;
  userQuery: string;
  userPagination: AdminPagination;
  contestSummary: ContestRiskSignalSummary;
  contestRows: ContestRiskSignalRow[];
  contestSeverityFilter: "all" | "low" | "medium" | "high";
  contestStatusFilter: "all" | "draft" | "live" | "closed" | "archived";
  contestQuery: string;
  contestPagination: AdminPagination;
  onUserSeverityFilterChange: (value: "all" | "low" | "medium" | "high") => void;
  onUserWindowDaysChange: (value: string) => void;
  onUserQueryChange: (value: string) => void;
  onUserPageChange: (value: number) => void;
  onUserPageSizeChange: (value: number) => void;
  onRefreshUsers: () => void;
  onViewUser360: (userId: string) => void;
  onContestSeverityFilterChange: (value: "all" | "low" | "medium" | "high") => void;
  onContestStatusFilterChange: (value: "all" | "draft" | "live" | "closed" | "archived") => void;
  onContestQueryChange: (value: string) => void;
  onContestPageChange: (value: number) => void;
  onContestPageSizeChange: (value: number) => void;
  onRefreshContests: () => void;
  onViewContest360: (contestId: string) => void;
};

const asNaira = (kobo = 0) => `₦${(Number(kobo || 0) / 100).toLocaleString("en-NG")}`;

export default function RiskSignalsSection({
  userSummary,
  userRows,
  userSeverityFilter,
  userWindowDays,
  userQuery,
  userPagination,
  contestSummary,
  contestRows,
  contestSeverityFilter,
  contestStatusFilter,
  contestQuery,
  contestPagination,
  onUserSeverityFilterChange,
  onUserWindowDaysChange,
  onUserQueryChange,
  onUserPageChange,
  onUserPageSizeChange,
  onRefreshUsers,
  onViewUser360,
  onContestSeverityFilterChange,
  onContestStatusFilterChange,
  onContestQueryChange,
  onContestPageChange,
  onContestPageSizeChange,
  onRefreshContests,
  onViewContest360,
}: RiskSignalsSectionProps) {
  return (
    <div id="riskSignals" className="mt-6 scroll-mt-20">
      <h2 className="mb-3 text-2xl font-semibold text-green-800">Risk Signals</h2>
      <div className="mb-4 rounded-lg border border-slate-200 bg-white p-3">
        <h3 className="text-lg font-semibold text-slate-900">User Risk Signals</h3>
        <div className="mt-2 grid grid-cols-1 gap-2 text-sm text-slate-700 md:grid-cols-4">
          <p>Flagged: {userSummary.totalFlagged}</p>
          <p>High: {userSummary.high}</p>
          <p>Medium: {userSummary.medium}</p>
          <p>Low: {userSummary.low}</p>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-6">
          <input
            value={userQuery}
            onChange={(e) => onUserQueryChange(e.target.value)}
            placeholder="Search user email or username"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700"
          />
          <select
            value={userSeverityFilter}
            onChange={(e) =>
              onUserSeverityFilterChange(e.target.value as "all" | "low" | "medium" | "high")
            }
            className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700"
          >
            <option value="all">All severity</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <input
            value={userWindowDays}
            onChange={(e) => onUserWindowDaysChange(e.target.value.replace(/[^\d]/g, ""))}
            placeholder="Window days (1-90)"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700"
          />
          <select
            value={String(userPagination.pageSize)}
            onChange={(e) => onUserPageSizeChange(Number(e.target.value))}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700"
          >
            <option value="10">10 / page</option>
            <option value="25">25 / page</option>
            <option value="50">50 / page</option>
            <option value="100">100 / page</option>
          </select>
          <button
            onClick={onRefreshUsers}
            className="rounded-md bg-green-700 px-3 py-2 text-sm font-medium text-white hover:bg-green-800"
          >
            Refresh Users
          </button>
        </div>
        {userRows.length > 0 ? (
          <div className="mt-3 overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full text-left">
              <thead className="bg-slate-100">
                <tr>
                  <th className="p-3 text-sm font-semibold text-gray-700">User</th>
                  <th className="p-3 text-sm font-semibold text-gray-700">Score</th>
                  <th className="p-3 text-sm font-semibold text-gray-700">Severity</th>
                  <th className="p-3 text-sm font-semibold text-gray-700">Failed Payouts</th>
                  <th className="p-3 text-sm font-semibold text-gray-700">Tip Volume</th>
                  <th className="p-3 text-sm font-semibold text-gray-700">Reasons</th>
                  <th className="p-3 text-sm font-semibold text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody>
                {userRows.map((row) => (
                  <tr key={row.user._id} className="border-t border-slate-100">
                    <td className="p-3 text-sm text-slate-800">{row.user.email}</td>
                    <td className="p-3 text-sm text-slate-700">{row.score}</td>
                    <td className="p-3 text-sm text-slate-700">{row.severity}</td>
                    <td className="p-3 text-sm text-slate-700">
                      {row.metrics.failedPayoutCount} / {row.metrics.payoutTotalCount}
                    </td>
                    <td className="p-3 text-sm text-slate-700">
                      {asNaira(row.metrics.tipReceivedTotalKobo)}
                    </td>
                    <td className="max-w-sm p-3 text-sm text-slate-700">
                      {row.reasons.join(", ") || "-"}
                    </td>
                    <td className="p-3 text-sm text-slate-700">
                      <button
                        onClick={() => onViewUser360(row.user._id)}
                        className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs hover:bg-slate-50"
                      >
                        User 360
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-3 text-center text-sm text-slate-500">No flagged users for filters.</p>
        )}
        <div className="mt-3 flex items-center justify-between text-xs text-slate-600">
          <p>
            Page {userPagination.page} of {userPagination.totalPages} ({userPagination.total} total)
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onUserPageChange(Math.max(1, userPagination.page - 1))}
              disabled={!userPagination.hasPrev}
              className="rounded-md border border-slate-300 bg-white px-2 py-1 disabled:opacity-50"
            >
              Prev
            </button>
            <button
              onClick={() =>
                onUserPageChange(Math.min(userPagination.totalPages, userPagination.page + 1))
              }
              disabled={!userPagination.hasNext}
              className="rounded-md border border-slate-300 bg-white px-2 py-1 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-3">
        <h3 className="text-lg font-semibold text-slate-900">Contest Vote Integrity Signals</h3>
        <div className="mt-2 grid grid-cols-1 gap-2 text-sm text-slate-700 md:grid-cols-4">
          <p>Flagged: {contestSummary.totalFlagged}</p>
          <p>High: {contestSummary.high}</p>
          <p>Medium: {contestSummary.medium}</p>
          <p>Low: {contestSummary.low}</p>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-6">
          <input
            value={contestQuery}
            onChange={(e) => onContestQueryChange(e.target.value)}
            placeholder="Search contest title or category"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700"
          />
          <select
            value={contestSeverityFilter}
            onChange={(e) =>
              onContestSeverityFilterChange(e.target.value as "all" | "low" | "medium" | "high")
            }
            className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700"
          >
            <option value="all">All severity</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select
            value={contestStatusFilter}
            onChange={(e) =>
              onContestStatusFilterChange(
                e.target.value as "all" | "draft" | "live" | "closed" | "archived"
              )
            }
            className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700"
          >
            <option value="all">All statuses</option>
            <option value="draft">Draft</option>
            <option value="live">Live</option>
            <option value="closed">Closed</option>
            <option value="archived">Archived</option>
          </select>
          <select
            value={String(contestPagination.pageSize)}
            onChange={(e) => onContestPageSizeChange(Number(e.target.value))}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700"
          >
            <option value="10">10 / page</option>
            <option value="25">25 / page</option>
            <option value="50">50 / page</option>
            <option value="100">100 / page</option>
          </select>
          <button
            onClick={onRefreshContests}
            className="rounded-md bg-green-700 px-3 py-2 text-sm font-medium text-white hover:bg-green-800"
          >
            Refresh Contests
          </button>
        </div>
        {contestRows.length > 0 ? (
          <div className="mt-3 overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full text-left">
              <thead className="bg-slate-100">
                <tr>
                  <th className="p-3 text-sm font-semibold text-gray-700">Contest</th>
                  <th className="p-3 text-sm font-semibold text-gray-700">Score</th>
                  <th className="p-3 text-sm font-semibold text-gray-700">Severity</th>
                  <th className="p-3 text-sm font-semibold text-gray-700">Votes</th>
                  <th className="p-3 text-sm font-semibold text-gray-700">Top Share</th>
                  <th className="p-3 text-sm font-semibold text-gray-700">Reasons</th>
                  <th className="p-3 text-sm font-semibold text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody>
                {contestRows.map((row) => {
                  const topShare =
                    row.metrics.totalVotes > 0
                      ? ((row.metrics.topSubmissionVotes / row.metrics.totalVotes) * 100).toFixed(1)
                      : "0.0";
                  return (
                    <tr key={row.contest._id} className="border-t border-slate-100">
                      <td className="p-3 text-sm text-slate-800">{row.contest.title}</td>
                      <td className="p-3 text-sm text-slate-700">{row.score}</td>
                      <td className="p-3 text-sm text-slate-700">{row.severity}</td>
                      <td className="p-3 text-sm text-slate-700">{row.metrics.totalVotes}</td>
                      <td className="p-3 text-sm text-slate-700">{topShare}%</td>
                      <td className="max-w-sm p-3 text-sm text-slate-700">
                        {row.reasons.join(", ") || "-"}
                      </td>
                      <td className="p-3 text-sm text-slate-700">
                        <button
                          onClick={() => onViewContest360(row.contest._id)}
                          className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs hover:bg-slate-50"
                        >
                          Contest 360
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-3 text-center text-sm text-slate-500">No flagged contests for filters.</p>
        )}
        <div className="mt-3 flex items-center justify-between text-xs text-slate-600">
          <p>
            Page {contestPagination.page} of {contestPagination.totalPages} (
            {contestPagination.total} total)
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onContestPageChange(Math.max(1, contestPagination.page - 1))}
              disabled={!contestPagination.hasPrev}
              className="rounded-md border border-slate-300 bg-white px-2 py-1 disabled:opacity-50"
            >
              Prev
            </button>
            <button
              onClick={() =>
                onContestPageChange(
                  Math.min(contestPagination.totalPages, contestPagination.page + 1)
                )
              }
              disabled={!contestPagination.hasNext}
              className="rounded-md border border-slate-300 bg-white px-2 py-1 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
