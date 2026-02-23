"use client";

import formatDate from "../../../../utils/formatDate";
import type { Payout, PayoutSummary } from "./types";

type PayoutsSectionProps = {
  payouts: Payout[];
  payoutSummary: PayoutSummary;
  query: string;
  payoutStatusFilter: "all" | "pending" | "completed" | "failed";
  payoutDateFrom: string;
  payoutDateTo: string;
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPayoutStatusFilterChange: (value: "all" | "pending" | "completed" | "failed") => void;
  onQueryChange: (value: string) => void;
  onPayoutDateFromChange: (value: string) => void;
  onPayoutDateToChange: (value: string) => void;
  onPageChange: (value: number) => void;
  onPageSizeChange: (value: number) => void;
  onApplyFilters: () => void;
  onExportCsv: () => void;
  onExportPdf: () => void;
  onDecidePayout: (payoutId: string, approve: boolean) => void;
  onViewDetails: (payoutId: string) => void;
};

export default function PayoutsSection({
  payouts,
  payoutSummary,
  query,
  payoutStatusFilter,
  payoutDateFrom,
  payoutDateTo,
  page,
  totalPages,
  total,
  pageSize,
  onPayoutStatusFilterChange,
  onQueryChange,
  onPayoutDateFromChange,
  onPayoutDateToChange,
  onPageChange,
  onPageSizeChange,
  onApplyFilters,
  onExportCsv,
  onExportPdf,
  onDecidePayout,
  onViewDetails,
}: PayoutsSectionProps) {
  return (
    <div id="payouts" className="mt-6 scroll-mt-20">
      <h2 className="text-2xl font-semibold text-green-800 mb-3">Payout Reconciliation</h2>
      <div className="mb-3 rounded-lg border border-slate-200 bg-white p-3">
        <div className="grid grid-cols-1 gap-2 md:grid-cols-6">
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search user, reference, destination"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700"
          />
          <select
            value={payoutStatusFilter}
            onChange={(e) =>
              onPayoutStatusFilterChange(
                e.target.value as "all" | "pending" | "completed" | "failed"
              )
            }
            className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700"
          >
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="all">All</option>
          </select>
          <input
            type="date"
            value={payoutDateFrom}
            onChange={(e) => onPayoutDateFromChange(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700"
          />
          <input
            type="date"
            value={payoutDateTo}
            onChange={(e) => onPayoutDateToChange(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700"
          />
          <button
            onClick={onApplyFilters}
            className="rounded-md bg-green-700 px-3 py-2 text-sm font-medium text-white hover:bg-green-800"
          >
            Apply Filters
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
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            onClick={onExportCsv}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Export CSV
          </button>
          <button
            onClick={onExportPdf}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Export PDF
          </button>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-2 text-sm text-slate-700 md:grid-cols-4">
          <p>
            Total: ₦{(payoutSummary.totalAmount / 100).toLocaleString("en-NG")} (
            {payoutSummary.totalCount})
          </p>
          <p>
            Pending: ₦{(payoutSummary.pendingAmount / 100).toLocaleString("en-NG")} (
            {payoutSummary.pendingCount})
          </p>
          <p>
            Completed: ₦{(payoutSummary.completedAmount / 100).toLocaleString("en-NG")} (
            {payoutSummary.completedCount})
          </p>
          <p>
            Failed: ₦{(payoutSummary.failedAmount / 100).toLocaleString("en-NG")} (
            {payoutSummary.failedCount})
          </p>
        </div>
      </div>
      {payouts.length > 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-100">
              <tr>
                <th className="p-3 text-sm font-semibold text-gray-700">User</th>
                <th className="p-3 text-sm font-semibold text-gray-700">Amount</th>
                <th className="p-3 text-sm font-semibold text-gray-700">Status</th>
                <th className="p-3 text-sm font-semibold text-gray-700">Destination</th>
                <th className="p-3 text-sm font-semibold text-gray-700">Date</th>
                <th className="p-3 text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {payouts.map((payout) => (
                <tr key={payout._id} className="border-t border-gray-100">
                  <td className="p-3 text-gray-700">
                    {payout.user?.username || payout.user?.email || "Unknown user"}
                  </td>
                  <td className="p-3 text-gray-700 font-medium">
                    ₦{(payout.amount / 100).toLocaleString("en-NG")}
                  </td>
                  <td className="p-3 text-gray-700">{payout.status}</td>
                  <td className="p-3 text-gray-700 text-sm">
                    {payout.recipientId || "No payout account details"}
                  </td>
                  <td className="p-3 text-gray-600">{formatDate(payout.createdAt)}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => onViewDetails(payout._id)}
                        className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        360
                      </button>
                      {payout.status === "pending" ? (
                        <>
                          <button
                            onClick={() => onDecidePayout(payout._id, true)}
                            className="bg-green-600 text-white px-2 py-1 rounded-lg hover:bg-green-700 text-sm mr-2"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => onDecidePayout(payout._id, false)}
                            className="bg-red-600 text-white px-2 py-1 rounded-lg hover:bg-red-700 text-sm"
                          >
                            Reject
                          </button>
                        </>
                      ) : (
                        <span className="text-xs text-slate-500">Processed</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-center text-gray-600 bg-white p-4 rounded-lg">
          No payouts found for selected filters.
        </p>
      )}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
        <p>
          Page {page} of {totalPages} • {total} payouts
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
