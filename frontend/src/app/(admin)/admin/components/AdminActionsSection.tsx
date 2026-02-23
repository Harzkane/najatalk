"use client";

import type { AdminActionLogRow } from "./types";

type AdminActionsSectionProps = {
  actions: AdminActionLogRow[];
  query: string;
  actionFilter: string;
  dateFrom: string;
  dateTo: string;
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  onQueryChange: (value: string) => void;
  onActionFilterChange: (value: string) => void;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  onPageChange: (value: number) => void;
  onPageSizeChange: (value: number) => void;
  onRefresh: () => void;
};

export default function AdminActionsSection({
  actions,
  query,
  actionFilter,
  dateFrom,
  dateTo,
  page,
  pageSize,
  total,
  totalPages,
  onQueryChange,
  onActionFilterChange,
  onDateFromChange,
  onDateToChange,
  onPageChange,
  onPageSizeChange,
  onRefresh,
}: AdminActionsSectionProps) {
  return (
    <div id="actions" className="mt-6 scroll-mt-20">
      <h2 className="mb-3 text-2xl font-semibold text-slate-900">Admin Actions</h2>
      <div className="mb-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/60">
        <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search actor, target, reason or action"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
          />
          <select
            value={actionFilter}
            onChange={(e) => onActionFilterChange(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
          >
            <option value="all">All actions</option>
            <option value="user.ban">user.ban</option>
            <option value="user.unban">user.unban</option>
            <option value="user.role_update">user.role_update</option>
            <option value="user.suspend">user.suspend</option>
            <option value="user.unsuspend">user.unsuspend</option>
            <option value="payout.approve">payout.approve</option>
            <option value="payout.reject">payout.reject</option>
          </select>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => onDateFromChange(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => onDateToChange(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
          />
          <select
            value={String(pageSize)}
            onChange={(e) => onPageSizeChange(Number.parseInt(e.target.value, 10))}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
          >
            <option value="10">10 / page</option>
            <option value="25">25 / page</option>
            <option value="50">50 / page</option>
            <option value="100">100 / page</option>
          </select>
          <button
            onClick={onRefresh}
            className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Refresh Actions
          </button>
        </div>
      </div>

      {actions.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/60">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-3 font-semibold text-slate-700">When</th>
                <th className="p-3 font-semibold text-slate-700">Action</th>
                <th className="p-3 font-semibold text-slate-700">Actor</th>
                <th className="p-3 font-semibold text-slate-700">Target</th>
                <th className="p-3 font-semibold text-slate-700">Reason</th>
              </tr>
            </thead>
            <tbody>
              {actions.map((row) => (
                <tr key={row._id} className="border-t border-slate-100 hover:bg-slate-50/60">
                  <td className="p-3 text-slate-600">
                    {new Date(row.createdAt).toLocaleString()}
                  </td>
                  <td className="p-3 font-medium text-slate-800">{row.action}</td>
                  <td className="p-3 text-slate-700">{row.actor?.email || "Unknown"}</td>
                  <td className="p-3 text-slate-700">{row.targetUser?.email || "-"}</td>
                  <td className="max-w-md p-3 text-slate-600" title={row.reason || ""}>
                    <p className="truncate">{row.reason || "-"}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="rounded-xl border border-slate-200 bg-white p-4 text-center text-slate-600 shadow-sm shadow-slate-200/50">
          No admin actions found for current filters.
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
