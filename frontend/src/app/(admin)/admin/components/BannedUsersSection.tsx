"use client";

import formatDate from "../../../../utils/formatDate";
import type { AdminPagination, BannedUser, BannedUsersSummary } from "./types";

type BannedUsersSectionProps = {
  bannedUsers: BannedUser[];
  summary: BannedUsersSummary;
  query: string;
  appealStatusFilter: "all" | "pending" | "approved" | "rejected" | "none";
  suspendedOnly: boolean;
  dateFrom: string;
  dateTo: string;
  pagination: AdminPagination;
  onQueryChange: (value: string) => void;
  onAppealStatusFilterChange: (
    value: "all" | "pending" | "approved" | "rejected" | "none",
  ) => void;
  onSuspendedOnlyChange: (value: boolean) => void;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  onPageChange: (value: number) => void;
  onPageSizeChange: (value: number) => void;
  onRefresh: () => void;
  onUnban: (userId: string, approve: boolean) => void;
};

export default function BannedUsersSection({
  bannedUsers,
  summary,
  query,
  appealStatusFilter,
  suspendedOnly,
  dateFrom,
  dateTo,
  pagination,
  onQueryChange,
  onAppealStatusFilterChange,
  onSuspendedOnlyChange,
  onDateFromChange,
  onDateToChange,
  onPageChange,
  onPageSizeChange,
  onRefresh,
  onUnban,
}: BannedUsersSectionProps) {
  return (
    <div id="banned" className="scroll-mt-20">
      <h2 className="mb-3 text-2xl font-semibold text-green-800">Users & Bans</h2>
      <div className="mb-3 rounded-lg border border-slate-200 bg-white p-3">
        <div className="grid grid-cols-1 gap-2 md:grid-cols-6">
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search email or username"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700"
          />
          <select
            value={appealStatusFilter}
            onChange={(e) =>
              onAppealStatusFilterChange(
                e.target.value as "all" | "pending" | "approved" | "rejected" | "none",
              )
            }
            className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700"
          >
            <option value="all">All appeals</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="none">No appeal</option>
          </select>
          <label className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={suspendedOnly}
              onChange={(e) => onSuspendedOnlyChange(e.target.checked)}
            />
            Suspended only
          </label>
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
            Refresh Bans
          </button>
          <select
            value={String(pagination.pageSize)}
            onChange={(e) => onPageSizeChange(Number.parseInt(e.target.value, 10))}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700"
          >
            <option value="10">10 / page</option>
            <option value="25">25 / page</option>
            <option value="50">50 / page</option>
            <option value="100">100 / page</option>
          </select>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-slate-700 md:grid-cols-5">
          <p>Total: {summary.total}</p>
          <p>Pending Appeals: {summary.pendingAppeals}</p>
          <p>Approved Appeals: {summary.approvedAppeals}</p>
          <p>Rejected Appeals: {summary.rejectedAppeals}</p>
          <p>Suspended: {summary.suspended}</p>
        </div>
      </div>
      {bannedUsers.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-slate-100">
              <tr>
                <th className="p-3 text-sm font-semibold text-gray-700">User</th>
                <th className="p-3 text-sm font-semibold text-gray-700">Role</th>
                <th className="p-3 text-sm font-semibold text-gray-700">Appeal</th>
                <th className="p-3 text-sm font-semibold text-gray-700">Suspension</th>
                <th className="p-3 text-sm font-semibold text-gray-700">Updated</th>
                <th className="p-3 text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bannedUsers.map((user) => (
                <tr key={user._id} className="border-t border-gray-100">
                  <td className="p-3 text-gray-700">
                    <p className="font-medium text-slate-900">{user.email}</p>
                    <p className="text-xs text-slate-500">{user.username || "-"}</p>
                  </td>
                  <td className="p-3 text-gray-700">{user.role || "user"}</td>
                  <td className="p-3 text-gray-700">
                    <p>{user.appealStatus || "none"}</p>
                    <p className="text-xs text-slate-500">{user.appealReason || "No appeal"}</p>
                  </td>
                  <td className="p-3 text-gray-700">
                    {user.suspendedUntil ? formatDate(user.suspendedUntil) : "-"}
                  </td>
                  <td className="p-3 text-gray-700">
                    {user.updatedAt ? formatDate(user.updatedAt) : "-"}
                  </td>
                  <td className="p-3">
                    {user.appealStatus === "pending" ? (
                      <>
                        <button
                          onClick={() => onUnban(user._id, true)}
                          className="mr-2 rounded-lg bg-green-600 px-2 py-1 text-sm text-white hover:bg-green-700"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => onUnban(user._id, false)}
                          className="rounded-lg bg-red-600 px-2 py-1 text-sm text-white hover:bg-red-700"
                        >
                          Reject
                        </button>
                      </>
                    ) : (
                      <span className="text-xs text-slate-500">No pending appeal</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="rounded-lg bg-white p-4 text-center text-gray-600">
          No banned users for selected filters.
        </p>
      )}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
        <p>
          Page {pagination.page} of {pagination.totalPages} • {pagination.total} banned users
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(Math.max(pagination.page - 1, 1))}
            disabled={pagination.page <= 1}
            className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
          >
            Previous
          </button>
          <button
            onClick={() => onPageChange(Math.min(pagination.page + 1, pagination.totalPages))}
            disabled={pagination.page >= pagination.totalPages}
            className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
