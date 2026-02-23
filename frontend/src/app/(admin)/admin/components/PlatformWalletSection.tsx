"use client";

import formatDate from "../../../../utils/formatDate";
import type {
  PlatformWalletEntry,
  PlatformWalletEntryDetails,
  PlatformWalletOverview,
  PlatformWalletSummary,
} from "./types";

type PlatformWalletSectionProps = {
  overview: PlatformWalletOverview;
  summary: PlatformWalletSummary;
  entries: PlatformWalletEntry[];
  query: string;
  statusFilter: "all" | "pending" | "completed" | "failed";
  entryKindFilter: "all" | "platform_fee" | "contest_prize_paid";
  dateFrom: string;
  dateTo: string;
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  selectedDetails: PlatformWalletEntryDetails | null;
  isDetailsLoading: boolean;
  onQueryChange: (value: string) => void;
  onStatusFilterChange: (value: "all" | "pending" | "completed" | "failed") => void;
  onEntryKindFilterChange: (value: "all" | "platform_fee" | "contest_prize_paid") => void;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  onPageChange: (value: number) => void;
  onPageSizeChange: (value: number) => void;
  onRefresh: () => void;
  onViewDetails: (entryId: string) => void;
  onCloseDetails: () => void;
  onOpenUser360: (userId: string) => void;
};

const asNaira = (kobo = 0) =>
  `₦${(Number(kobo || 0) / 100).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export default function PlatformWalletSection({
  overview,
  summary,
  entries,
  query,
  statusFilter,
  entryKindFilter,
  dateFrom,
  dateTo,
  page,
  totalPages,
  total,
  pageSize,
  selectedDetails,
  isDetailsLoading,
  onQueryChange,
  onStatusFilterChange,
  onEntryKindFilterChange,
  onDateFromChange,
  onDateToChange,
  onPageChange,
  onPageSizeChange,
  onRefresh,
  onViewDetails,
  onCloseDetails,
  onOpenUser360,
}: PlatformWalletSectionProps) {
  return (
    <div id="platformWallet" className="mt-6 scroll-mt-20">
      <h2 className="mb-3 text-2xl font-semibold text-green-800">Platform Wallet</h2>
      <div className="mb-3 rounded-lg border border-slate-200 bg-white p-3">
        <div className="grid grid-cols-1 gap-2 text-sm text-slate-700 md:grid-cols-5">
          <p>Balance: {asNaira(overview.wallet.balance)}</p>
          <p>Credits: {asNaira(overview.summary.totalCredits)}</p>
          <p>Debits: {asNaira(overview.summary.totalDebits)}</p>
          <p>Net Flow: {asNaira(overview.summary.netFlow)}</p>
          <p>Updated: {overview.wallet.lastUpdated ? formatDate(overview.wallet.lastUpdated) : "-"}</p>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-7">
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search ref, user, listing, contest"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700"
          />
          <select
            value={entryKindFilter}
            onChange={(e) =>
              onEntryKindFilterChange(
                e.target.value as "all" | "platform_fee" | "contest_prize_paid",
              )
            }
            className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700"
          >
            <option value="all">All entry kinds</option>
            <option value="platform_fee">Platform Fee</option>
            <option value="contest_prize_paid">Contest Prize Paid</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) =>
              onStatusFilterChange(e.target.value as "all" | "pending" | "completed" | "failed")
            }
            className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700"
          >
            <option value="all">All status</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
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
          <button
            onClick={onRefresh}
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
        <div className="mt-3 grid grid-cols-1 gap-2 text-sm text-slate-700 md:grid-cols-2">
          <p>Filtered Credits: {asNaira(summary.totalCredits)}</p>
          <p>Filtered Debits: {asNaira(summary.totalDebits)}</p>
        </div>
      </div>

      {isDetailsLoading ? (
        <p className="mb-3 rounded-lg border border-slate-200 bg-white p-2 text-center text-sm text-slate-700">
          Loading platform wallet entry details...
        </p>
      ) : null}

      {selectedDetails ? (
        <section className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/60">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-lg font-semibold text-slate-900">
              Platform Wallet 360: {selectedDetails.entry.entryKind}
            </h3>
            <button
              onClick={onCloseDetails}
              className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Close
            </button>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {selectedDetails.entry.user?._id ? (
              <button
                onClick={() => onOpenUser360(selectedDetails.entry.user?._id || "")}
                className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Open User 360
              </button>
            ) : null}
            <button
              onClick={() => onViewDetails(selectedDetails.entry.entryId)}
              className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Refresh
            </button>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
            <p className="rounded-md bg-slate-50 px-2 py-1 text-slate-900">
              <span className="font-semibold">Direction:</span> {selectedDetails.entry.direction}
            </p>
            <p className="rounded-md bg-slate-50 px-2 py-1 text-slate-900">
              <span className="font-semibold">Amount:</span> {asNaira(selectedDetails.entry.amount)}
            </p>
            <p className="rounded-md bg-slate-50 px-2 py-1 text-slate-900">
              <span className="font-semibold">Status:</span> {selectedDetails.entry.status}
            </p>
            <p className="rounded-md bg-slate-50 px-2 py-1 text-slate-900">
              <span className="font-semibold">Reference:</span>{" "}
              <span className="break-all">{selectedDetails.entry.reference || "-"}</span>
            </p>
            <p className="rounded-md bg-slate-50 px-2 py-1 text-slate-900">
              <span className="font-semibold">User:</span>{" "}
              {selectedDetails.entry.user?.email || "System"}
            </p>
            <p className="rounded-md bg-slate-50 px-2 py-1 text-slate-900">
              <span className="font-semibold">Listing:</span> {selectedDetails.entry.listingTitle || "-"}
            </p>
            <p className="rounded-md bg-slate-50 px-2 py-1 text-slate-900">
              <span className="font-semibold">Contest:</span> {selectedDetails.entry.contestTitle || "-"}
            </p>
            <p className="rounded-md bg-slate-50 px-2 py-1 text-slate-900">
              <span className="font-semibold">Created:</span> {formatDate(selectedDetails.entry.createdAt)}
            </p>
          </div>

          {selectedDetails.relatedLedger?.length ? (
            <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200">
              <p className="border-b border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900">
                Related Ledger Trail
              </p>
              <table className="w-full text-left text-xs">
                <thead className="bg-white">
                  <tr>
                    <th className="p-2 font-semibold text-slate-700">When</th>
                    <th className="p-2 font-semibold text-slate-700">Entry</th>
                    <th className="p-2 font-semibold text-slate-700">User</th>
                    <th className="p-2 font-semibold text-slate-700">Effect</th>
                    <th className="p-2 font-semibold text-slate-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedDetails.relatedLedger.map((row) => (
                    <tr key={row._id} className="border-t border-slate-100">
                      <td className="p-2 text-slate-700">{formatDate(row.createdAt)}</td>
                      <td className="p-2 text-slate-900">{row.entryKind}</td>
                      <td className="p-2 text-slate-700">{row.user?.email || "-"}</td>
                      <td className="p-2 text-slate-900">{asNaira(row.walletEffect)}</td>
                      <td className="p-2 text-slate-700">{row.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>
      ) : null}

      {entries.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-slate-100">
              <tr>
                <th className="p-3 text-sm font-semibold text-gray-700">When</th>
                <th className="p-3 text-sm font-semibold text-gray-700">Entry Kind</th>
                <th className="p-3 text-sm font-semibold text-gray-700">Direction</th>
                <th className="p-3 text-sm font-semibold text-gray-700">Amount</th>
                <th className="p-3 text-sm font-semibold text-gray-700">User</th>
                <th className="p-3 text-sm font-semibold text-gray-700">Reference</th>
                <th className="p-3 text-sm font-semibold text-gray-700">Status</th>
                <th className="p-3 text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.entryId} className="border-t border-gray-100">
                  <td className="p-3 text-xs text-slate-700">{formatDate(entry.createdAt)}</td>
                  <td className="p-3 text-xs text-slate-800">{entry.entryKind}</td>
                  <td className="p-3 text-xs text-slate-700">{entry.direction}</td>
                  <td className="p-3 text-sm font-semibold text-slate-800">{asNaira(entry.amount)}</td>
                  <td className="p-3 text-xs text-slate-700">
                    {entry.user?.username || entry.user?.email || "System"}
                  </td>
                  <td className="max-w-[260px] p-3 text-xs text-slate-700">
                    <span className="break-all">{entry.reference || "-"}</span>
                  </td>
                  <td className="p-3 text-xs text-slate-700">{entry.status}</td>
                  <td className="p-3">
                    <button
                      onClick={() => onViewDetails(entry.entryId)}
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
        <p className="rounded-lg bg-white p-4 text-center text-gray-600">
          No platform wallet entries found for selected filters.
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
        <p>
          Page {page} of {totalPages} • {total} entries
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
