"use client";

import formatDate from "../../../../utils/formatDate";
import type { WalletMismatch, WalletMismatchDetails, WalletMismatchSummary } from "./types";

type WalletMismatchSectionProps = {
  mismatchSummary: WalletMismatchSummary;
  mismatches: WalletMismatch[];
  query: string;
  severityFilter: "all" | "low" | "medium" | "high";
  minDeltaKobo: string;
  dateFrom: string;
  dateTo: string;
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  selectedMismatchDetails: WalletMismatchDetails | null;
  isDetailsLoading: boolean;
  onQueryChange: (value: string) => void;
  onSeverityFilterChange: (value: "all" | "low" | "medium" | "high") => void;
  onMinDeltaKoboChange: (value: string) => void;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  onPageChange: (value: number) => void;
  onPageSizeChange: (value: number) => void;
  onRunScan: () => void;
  onViewDetails: (userId: string) => void;
  onCloseDetails: () => void;
  onOpenUser360: (userId: string) => void;
};

const asNaira = (kobo = 0) => `₦${(Number(kobo || 0) / 100).toLocaleString("en-NG")}`;

export default function WalletMismatchSection({
  mismatchSummary,
  mismatches,
  query,
  severityFilter,
  minDeltaKobo,
  dateFrom,
  dateTo,
  page,
  totalPages,
  total,
  pageSize,
  selectedMismatchDetails,
  isDetailsLoading,
  onQueryChange,
  onSeverityFilterChange,
  onMinDeltaKoboChange,
  onDateFromChange,
  onDateToChange,
  onPageChange,
  onPageSizeChange,
  onRunScan,
  onViewDetails,
  onCloseDetails,
  onOpenUser360,
}: WalletMismatchSectionProps) {
  return (
    <div id="mismatches" className="mt-6 scroll-mt-20">
      <h2 className="mb-3 text-2xl font-semibold text-green-800">Wallet Mismatch Alerts</h2>
      <div className="mb-3 rounded-lg border border-slate-200 bg-white p-3">
        <div className="grid grid-cols-1 gap-2 text-sm text-slate-700 md:grid-cols-5">
          <p>Checked Users: {mismatchSummary.totalUsersChecked}</p>
          <p>Mismatched: {mismatchSummary.mismatchedUsers}</p>
          <p>High: {mismatchSummary.highCount}</p>
          <p>Medium: {mismatchSummary.mediumCount}</p>
          <p>Low: {mismatchSummary.lowCount}</p>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-6">
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search user email or username"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700"
          />
          <select
            value={severityFilter}
            onChange={(e) =>
              onSeverityFilterChange(e.target.value as "all" | "low" | "medium" | "high")
            }
            className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700"
          >
            <option value="all">All severity</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <input
            value={minDeltaKobo}
            onChange={(e) => onMinDeltaKoboChange(e.target.value.replace(/[^\d]/g, ""))}
            placeholder="Min delta (kobo)"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700"
          />
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
            onClick={onRunScan}
            className="rounded-md bg-green-700 px-3 py-2 text-sm font-medium text-white hover:bg-green-800"
          >
            Run Scan
          </button>
        </div>
      </div>

      {isDetailsLoading ? (
        <p className="mb-3 rounded-lg border border-slate-200 bg-white p-2 text-center text-sm text-slate-700">
          Loading mismatch details...
        </p>
      ) : null}

      {selectedMismatchDetails ? (
        <section className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/60">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-lg font-semibold text-slate-900">
              Wallet Alert 360: {selectedMismatchDetails.user?.email || selectedMismatchDetails.user?._id}
            </h3>
            <button
              onClick={onCloseDetails}
              className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Close
            </button>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {selectedMismatchDetails.user?._id ? (
              <button
                onClick={() => onOpenUser360(selectedMismatchDetails.user?._id || "")}
                className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Open User 360
              </button>
            ) : null}
            <span className="rounded-md bg-slate-50 px-2 py-1 text-xs text-slate-700">
              Severity: {selectedMismatchDetails.summary.severity}
            </span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
            <p className="rounded-md bg-slate-50 px-2 py-1 text-slate-900">
              <span className="font-semibold">Expected:</span> {asNaira(selectedMismatchDetails.summary.expectedEffect)}
            </p>
            <p className="rounded-md bg-slate-50 px-2 py-1 text-slate-900">
              <span className="font-semibold">Ledger:</span> {asNaira(selectedMismatchDetails.summary.ledgerEffect)}
            </p>
            <p className="rounded-md bg-slate-50 px-2 py-1 text-slate-900">
              <span className="font-semibold">Delta:</span> {asNaira(selectedMismatchDetails.summary.delta)}
            </p>
            <p className="rounded-md bg-slate-50 px-2 py-1 text-slate-900">
              <span className="font-semibold">Tx/Ledger:</span> {selectedMismatchDetails.summary.transactionCount}/
              {selectedMismatchDetails.summary.ledgerCount}
            </p>
            <p className="rounded-md bg-slate-50 px-2 py-1 text-slate-900">
              <span className="font-semibold">Wallet:</span> {asNaira(selectedMismatchDetails.wallet.balance)}
            </p>
            <p className="rounded-md bg-slate-50 px-2 py-1 text-slate-900">
              <span className="font-semibold">Available:</span> {asNaira(selectedMismatchDetails.wallet.availableBalance)}
            </p>
            <p className="rounded-md bg-slate-50 px-2 py-1 text-slate-900">
              <span className="font-semibold">Held:</span> {asNaira(selectedMismatchDetails.wallet.heldBalance)}
            </p>
            <p className="rounded-md bg-slate-50 px-2 py-1 text-slate-900">
              <span className="font-semibold">Wallet Updated:</span>{" "}
              {selectedMismatchDetails.wallet.updatedAt
                ? formatDate(selectedMismatchDetails.wallet.updatedAt)
                : "-"}
            </p>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <p className="border-b border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900">
                Recent Transactions
              </p>
              <table className="w-full text-left text-xs">
                <thead className="bg-white">
                  <tr>
                    <th className="p-2 font-semibold text-slate-700">When</th>
                    <th className="p-2 font-semibold text-slate-700">Type</th>
                    <th className="p-2 font-semibold text-slate-700">Status</th>
                    <th className="p-2 font-semibold text-slate-700">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedMismatchDetails.recentTransactions.map((row) => (
                    <tr key={row._id} className="border-t border-slate-100">
                      <td className="p-2 text-slate-700">{formatDate(row.createdAt)}</td>
                      <td className="p-2 text-slate-900">{row.type}</td>
                      <td className="p-2 text-slate-700">{row.status}</td>
                      <td className="p-2 text-slate-900">{asNaira(row.amount)}</td>
                    </tr>
                  ))}
                  {selectedMismatchDetails.recentTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-2 text-center text-slate-500">
                        No transactions.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <p className="border-b border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900">
                Recent Ledger Entries
              </p>
              <table className="w-full text-left text-xs">
                <thead className="bg-white">
                  <tr>
                    <th className="p-2 font-semibold text-slate-700">When</th>
                    <th className="p-2 font-semibold text-slate-700">Entry</th>
                    <th className="p-2 font-semibold text-slate-700">Status</th>
                    <th className="p-2 font-semibold text-slate-700">Effect</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedMismatchDetails.recentLedger.map((row) => (
                    <tr key={row._id} className="border-t border-slate-100">
                      <td className="p-2 text-slate-700">{formatDate(row.createdAt)}</td>
                      <td className="p-2 text-slate-900">{row.entryKind}</td>
                      <td className="p-2 text-slate-700">{row.status}</td>
                      <td className="p-2 text-slate-900">{asNaira(row.walletEffect)}</td>
                    </tr>
                  ))}
                  {selectedMismatchDetails.recentLedger.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-2 text-center text-slate-500">
                        No ledger entries.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      ) : null}

      {mismatches.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-slate-100">
              <tr>
                <th className="p-3 text-sm font-semibold text-gray-700">User</th>
                <th className="p-3 text-sm font-semibold text-gray-700">Expected</th>
                <th className="p-3 text-sm font-semibold text-gray-700">Ledger</th>
                <th className="p-3 text-sm font-semibold text-gray-700">Delta</th>
                <th className="p-3 text-sm font-semibold text-gray-700">Tx/Ledger</th>
                <th className="p-3 text-sm font-semibold text-gray-700">Severity</th>
                <th className="p-3 text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {mismatches.map((item) => (
                <tr key={item.userId} className="border-t border-gray-100">
                  <td className="p-3 text-xs text-gray-700">
                    <p className="text-xs font-semibold text-slate-800">
                      {item.user?.email || item.user?.username || "Unknown user"}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-500">{item.userId}</p>
                  </td>
                  <td className="p-3 text-gray-700">{asNaira(item.expectedEffect)}</td>
                  <td className="p-3 text-gray-700">{asNaira(item.ledgerEffect)}</td>
                  <td className="p-3 text-gray-700">{asNaira(item.delta)}</td>
                  <td className="p-3 text-gray-700">
                    {item.transactionCount}/{item.ledgerCount}
                  </td>
                  <td className="p-3">
                    <span
                      className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${
                        item.severity === "high"
                          ? "bg-red-100 text-red-700"
                          : item.severity === "medium"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {item.severity}
                    </span>
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => onViewDetails(item.userId)}
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
          No wallet mismatches found for selected filters.
        </p>
      )}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
        <p>
          Page {page} of {totalPages} • {total} mismatches
        </p>
        <div className="flex items-center gap-2">
          <select
            value={String(pageSize)}
            onChange={(e) => onPageSizeChange(Number.parseInt(e.target.value, 10))}
            className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-700"
          >
            <option value="10">10 / page</option>
            <option value="25">25 / page</option>
            <option value="50">50 / page</option>
            <option value="100">100 / page</option>
          </select>
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
