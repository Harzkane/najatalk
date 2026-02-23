"use client";

import formatDate from "../../../../utils/formatDate";
import type { PremiumAuditRow, PremiumAuditSummary } from "./types";

type PremiumAuditSectionProps = {
  premiumAuditRows: PremiumAuditRow[];
  premiumAuditSummary: PremiumAuditSummary;
  query: string;
  premiumStatusFilter: "all" | "initiated" | "processing" | "completed" | "failed";
  premiumSourceFilter: "all" | "manual" | "webhook";
  premiumMismatchOnly: boolean;
  premiumDateFrom: string;
  premiumDateTo: string;
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onQueryChange: (value: string) => void;
  onPremiumStatusFilterChange: (
    value: "all" | "initiated" | "processing" | "completed" | "failed"
  ) => void;
  onPremiumSourceFilterChange: (value: "all" | "manual" | "webhook") => void;
  onPremiumMismatchOnlyChange: (value: boolean) => void;
  onPremiumDateFromChange: (value: string) => void;
  onPremiumDateToChange: (value: string) => void;
  onPageChange: (value: number) => void;
  onPageSizeChange: (value: number) => void;
  onViewDetails: (paymentId: string) => void;
  onRefreshAudit: () => void;
};

export default function PremiumAuditSection({
  premiumAuditRows,
  premiumAuditSummary,
  query,
  premiumStatusFilter,
  premiumSourceFilter,
  premiumMismatchOnly,
  premiumDateFrom,
  premiumDateTo,
  page,
  totalPages,
  total,
  pageSize,
  onQueryChange,
  onPremiumStatusFilterChange,
  onPremiumSourceFilterChange,
  onPremiumMismatchOnlyChange,
  onPremiumDateFromChange,
  onPremiumDateToChange,
  onPageChange,
  onPageSizeChange,
  onViewDetails,
  onRefreshAudit,
}: PremiumAuditSectionProps) {
  return (
    <div id="premium" className="mt-6 scroll-mt-20">
      <h2 className="text-2xl font-semibold text-green-800 mb-3">Premium Payments Audit</h2>
      <div className="mb-3 rounded-lg border border-slate-200 bg-white p-3">
        <div className="grid grid-cols-1 gap-2 md:grid-cols-7">
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search reference, email, channel"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700"
          />
          <select
            value={premiumStatusFilter}
            onChange={(e) =>
              onPremiumStatusFilterChange(
                e.target.value as "all" | "initiated" | "processing" | "completed" | "failed"
              )
            }
            className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700"
          >
            <option value="all">All Statuses</option>
            <option value="initiated">Initiated</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
          <select
            value={premiumSourceFilter}
            onChange={(e) =>
              onPremiumSourceFilterChange(e.target.value as "all" | "manual" | "webhook")
            }
            className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700"
          >
            <option value="all">All Sources</option>
            <option value="manual">Manual Verify</option>
            <option value="webhook">Webhook</option>
          </select>
          <input
            type="date"
            value={premiumDateFrom}
            onChange={(e) => onPremiumDateFromChange(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700"
          />
          <input
            type="date"
            value={premiumDateTo}
            onChange={(e) => onPremiumDateToChange(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700"
          />
          <button
            onClick={onRefreshAudit}
            className="rounded-md bg-green-700 px-3 py-2 text-sm font-medium text-white hover:bg-green-800"
          >
            Refresh Audit
          </button>
          <select
            value={String(pageSize)}
            onChange={(e) => onPageSizeChange(Number.parseInt(e.target.value, 10))}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700"
          >
            <option value="10">10 / page</option>
            <option value="25">25 / page</option>
            <option value="50">50 / page</option>
            <option value="100">100 / page</option>
          </select>
        </div>
        <label className="mt-2 inline-flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={premiumMismatchOnly}
            onChange={(e) => onPremiumMismatchOnlyChange(e.target.checked)}
          />
          Show mismatches only
        </label>
        <div className="mt-3 grid grid-cols-1 gap-2 text-sm text-slate-700 md:grid-cols-6">
          <p>Total: {premiumAuditSummary.total}</p>
          <p>Mismatches: {premiumAuditSummary.mismatchCount}</p>
          <p>Completed: {premiumAuditSummary.completedCount}</p>
          <p>Failed: {premiumAuditSummary.failedCount}</p>
          <p>Processing: {premiumAuditSummary.processingCount}</p>
          <p>Initiated: {premiumAuditSummary.initiatedCount}</p>
        </div>
      </div>
      {premiumAuditRows.length > 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-100">
              <tr>
                <th className="p-3 text-sm font-semibold text-gray-700">User</th>
                <th className="p-3 text-sm font-semibold text-gray-700">Reference</th>
                <th className="p-3 text-sm font-semibold text-gray-700">Amount</th>
                <th className="p-3 text-sm font-semibold text-gray-700">Status</th>
                <th className="p-3 text-sm font-semibold text-gray-700">Source</th>
                <th className="p-3 text-sm font-semibold text-gray-700">Mismatch</th>
                <th className="p-3 text-sm font-semibold text-gray-700">Date</th>
                <th className="p-3 text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {premiumAuditRows.map((row) => (
                <tr key={row._id} className="border-t border-gray-100">
                  <td className="p-3 text-gray-700">{row.user?.username || row.user?.email || "Unknown"}</td>
                  <td className="p-3 text-xs text-gray-700">{row.reference}</td>
                  <td className="p-3 text-gray-700">
                    {row.currency} {(row.amount / 100).toLocaleString("en-NG")}
                  </td>
                  <td className="p-3 text-gray-700">{row.status}</td>
                  <td className="p-3 text-gray-700">{row.verificationSource || "-"}</td>
                  <td className="p-3 text-gray-700 text-xs">
                    {row.hasMismatch ? row.mismatchReasons.join(", ") : "OK"}
                  </td>
                  <td className="p-3 text-gray-600">{formatDate(row.createdAt)}</td>
                  <td className="p-3">
                    <button
                      onClick={() => onViewDetails(row._id)}
                      className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      360
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-center text-gray-600 bg-white p-4 rounded-lg">
          No premium payment rows for selected filters.
        </p>
      )}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
        <p>
          Page {page} of {totalPages} • {total} records
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(Math.max(page - 1, 1))}
            disabled={page <= 1}
            className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
          >
            Previous
          </button>
          <button
            onClick={() => onPageChange(Math.min(page + 1, totalPages))}
            disabled={page >= totalPages}
            className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
