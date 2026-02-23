"use client";

import formatDate from "../../../../utils/formatDate";
import type { RollupBucket, RollupBucketDetails } from "./types";

type SettlementRollupsSectionProps = {
  rollupPeriod: "daily" | "monthly";
  statusFilter: "all" | "pending" | "completed" | "failed";
  dateFrom: string;
  dateTo: string;
  timezone: string;
  rollupBuckets: RollupBucket[];
  selectedBucketDetails: RollupBucketDetails | null;
  isBucketDetailsLoading: boolean;
  onRollupPeriodChange: (value: "daily" | "monthly") => void;
  onStatusFilterChange: (value: "all" | "pending" | "completed" | "failed") => void;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  onTimezoneChange: (value: string) => void;
  onViewBucket: (bucket: string) => void;
  onExportCsv: () => void;
  onRefreshRollups: () => void;
  onCloseBucketDetails: () => void;
  onBucketPageChange: (value: number) => void;
  onBucketPageSizeChange: (value: number) => void;
};

const asNaira = (kobo = 0) => `₦${(Number(kobo || 0) / 100).toLocaleString("en-NG")}`;

export default function SettlementRollupsSection({
  rollupPeriod,
  statusFilter,
  dateFrom,
  dateTo,
  timezone,
  rollupBuckets,
  selectedBucketDetails,
  isBucketDetailsLoading,
  onRollupPeriodChange,
  onStatusFilterChange,
  onDateFromChange,
  onDateToChange,
  onTimezoneChange,
  onViewBucket,
  onExportCsv,
  onRefreshRollups,
  onCloseBucketDetails,
  onBucketPageChange,
  onBucketPageSizeChange,
}: SettlementRollupsSectionProps) {
  return (
    <div id="rollups" className="mt-6 scroll-mt-20">
      <h2 className="mb-3 text-2xl font-semibold text-green-800">Settlement Rollups</h2>
      <div className="mb-3 rounded-lg border border-slate-200 bg-white p-3">
        <div className="grid grid-cols-1 gap-2 md:grid-cols-6">
          <select
            value={rollupPeriod}
            onChange={(e) => onRollupPeriodChange(e.target.value as "daily" | "monthly")}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700"
          >
            <option value="daily">Daily</option>
            <option value="monthly">Monthly</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) =>
              onStatusFilterChange(e.target.value as "all" | "pending" | "completed" | "failed")
            }
            className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => onDateFromChange(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => onDateToChange(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700"
          />
          <input
            value={timezone}
            onChange={(e) => onTimezoneChange(e.target.value)}
            placeholder="Africa/Lagos"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700"
          />
          <button
            onClick={onRefreshRollups}
            className="rounded-md bg-green-700 px-3 py-2 text-sm font-medium text-white hover:bg-green-800"
          >
            Refresh Rollups
          </button>
        </div>
        <button
          onClick={onExportCsv}
          className="mt-2 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          Export Rollups CSV
        </button>
      </div>

      {isBucketDetailsLoading ? (
        <p className="mb-3 rounded-lg border border-slate-200 bg-white p-2 text-center text-sm text-slate-700">
          Loading rollup bucket details...
        </p>
      ) : null}

      {selectedBucketDetails ? (
        <section className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/60">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-lg font-semibold text-slate-900">
              Rollup Bucket 360: {selectedBucketDetails.bucket}
            </h3>
            <button
              onClick={onCloseBucketDetails}
              className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Close
            </button>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-sm md:grid-cols-5">
            <p className="rounded-md bg-slate-50 px-2 py-1 text-slate-900">
              <span className="font-semibold">Total:</span> {asNaira(selectedBucketDetails.summary.totalAmount)} (
              {selectedBucketDetails.summary.totalCount})
            </p>
            <p className="rounded-md bg-slate-50 px-2 py-1 text-slate-900">
              <span className="font-semibold">Pending:</span> {selectedBucketDetails.summary.pendingCount}
            </p>
            <p className="rounded-md bg-slate-50 px-2 py-1 text-slate-900">
              <span className="font-semibold">Completed:</span> {selectedBucketDetails.summary.completedCount}
            </p>
            <p className="rounded-md bg-slate-50 px-2 py-1 text-slate-900">
              <span className="font-semibold">Failed:</span> {selectedBucketDetails.summary.failedCount}
            </p>
            <p className="rounded-md bg-slate-50 px-2 py-1 text-slate-900">
              <span className="font-semibold">Timezone:</span> {selectedBucketDetails.timezone}
            </p>
          </div>
          {selectedBucketDetails.rows.length > 0 ? (
            <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="p-2 font-semibold text-slate-700">User</th>
                    <th className="p-2 font-semibold text-slate-700">Amount</th>
                    <th className="p-2 font-semibold text-slate-700">Status</th>
                    <th className="p-2 font-semibold text-slate-700">Reference</th>
                    <th className="p-2 font-semibold text-slate-700">Destination</th>
                    <th className="p-2 font-semibold text-slate-700">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedBucketDetails.rows.map((row) => (
                    <tr key={row._id} className="border-t border-slate-100">
                      <td className="p-2 text-slate-900">{row.user?.email || "Unknown"}</td>
                      <td className="p-2 text-slate-900">{asNaira(row.amount)}</td>
                      <td className="p-2 text-slate-700">{row.status}</td>
                      <td className="p-2 text-slate-700">{row.reference || "-"}</td>
                      <td className="p-2 text-slate-700">{row.recipientId || "-"}</td>
                      <td className="p-2 text-slate-700">{formatDate(row.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
              No payout rows in this bucket.
            </p>
          )}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
            <p>
              Page {selectedBucketDetails.pagination.page} of {selectedBucketDetails.pagination.totalPages} •{" "}
              {selectedBucketDetails.pagination.total} rows
            </p>
            <div className="flex items-center gap-2">
              <select
                value={String(selectedBucketDetails.pagination.pageSize)}
                onChange={(e) => onBucketPageSizeChange(Number.parseInt(e.target.value, 10))}
                className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-700"
              >
                <option value="10">10 / page</option>
                <option value="25">25 / page</option>
                <option value="50">50 / page</option>
                <option value="100">100 / page</option>
              </select>
              <button
                onClick={() =>
                  onBucketPageChange(Math.max(selectedBucketDetails.pagination.page - 1, 1))
                }
                disabled={selectedBucketDetails.pagination.page <= 1}
                className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
              >
                Previous
              </button>
              <button
                onClick={() =>
                  onBucketPageChange(
                    Math.min(
                      selectedBucketDetails.pagination.page + 1,
                      selectedBucketDetails.pagination.totalPages,
                    ),
                  )
                }
                disabled={selectedBucketDetails.pagination.page >= selectedBucketDetails.pagination.totalPages}
                className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
              >
                Next
              </button>
            </div>
          </div>
        </section>
      ) : null}

      {rollupBuckets.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-slate-100">
              <tr>
                <th className="p-3 text-sm font-semibold text-gray-700">Bucket</th>
                <th className="p-3 text-sm font-semibold text-gray-700">Total</th>
                <th className="p-3 text-sm font-semibold text-gray-700">Pending</th>
                <th className="p-3 text-sm font-semibold text-gray-700">Completed</th>
                <th className="p-3 text-sm font-semibold text-gray-700">Failed</th>
                <th className="p-3 text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rollupBuckets.map((bucket) => (
                <tr key={bucket.bucket} className="border-t border-gray-100">
                  <td className="p-3 text-gray-700">{bucket.bucket}</td>
                  <td className="p-3 text-gray-700">
                    {asNaira(bucket.totalAmount)} ({bucket.totalCount})
                  </td>
                  <td className="p-3 text-gray-700">
                    {asNaira(bucket.pendingAmount)} ({bucket.pendingCount})
                  </td>
                  <td className="p-3 text-gray-700">
                    {asNaira(bucket.completedAmount)} ({bucket.completedCount})
                  </td>
                  <td className="p-3 text-gray-700">
                    {asNaira(bucket.failedAmount)} ({bucket.failedCount})
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => onViewBucket(bucket.bucket)}
                      className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Drilldown
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="rounded-lg bg-white p-4 text-center text-gray-600">
          No rollup buckets yet for selected filters.
        </p>
      )}
    </div>
  );
}
