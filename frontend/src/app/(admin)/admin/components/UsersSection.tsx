"use client";

import type { AdminManagedUser, AdminUsersSummary } from "./types";

type UsersSectionProps = {
  users: AdminManagedUser[];
  summary: AdminUsersSummary;
  query: string;
  roleFilter: "all" | "user" | "mod" | "admin" | "super_admin";
  bannedOnly: boolean;
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onQueryChange: (value: string) => void;
  onRoleFilterChange: (value: "all" | "user" | "mod" | "admin" | "super_admin") => void;
  onBannedOnlyChange: (value: boolean) => void;
  onRefresh: () => void;
  onPageChange: (value: number) => void;
  onPageSizeChange: (value: number) => void;
  onRoleUpdate: (userId: string, role: "user" | "mod" | "admin" | "super_admin") => void;
  onBan: (userId: string, email: string) => void;
  onUnban: (userId: string) => void;
  onSuspend: (userId: string, email: string) => void;
  onUnsuspend: (userId: string) => void;
  onViewDetails: (userId: string) => void;
  selectedUserIds: string[];
  onToggleUserSelection: (userId: string) => void;
  onToggleSelectAllUsers: () => void;
  onClearUserSelection: () => void;
  onBulkBan: () => void;
  onBulkUnban: () => void;
  onBulkRoleUpdate: (role: "user" | "mod" | "admin" | "super_admin") => void;
};

export default function UsersSection({
  users,
  summary,
  query,
  roleFilter,
  bannedOnly,
  page,
  totalPages,
  total,
  pageSize,
  onQueryChange,
  onRoleFilterChange,
  onBannedOnlyChange,
  onRefresh,
  onPageChange,
  onPageSizeChange,
  onRoleUpdate,
  onBan,
  onUnban,
  onSuspend,
  onUnsuspend,
  onViewDetails,
  selectedUserIds,
  onToggleUserSelection,
  onToggleSelectAllUsers,
  onClearUserSelection,
  onBulkBan,
  onBulkUnban,
  onBulkRoleUpdate,
}: UsersSectionProps) {
  const allSelected = users.length > 0 && users.every((user) => selectedUserIds.includes(user._id));
  const now = Date.now();

  return (
    <div id="users" className="mt-6 scroll-mt-20">
      <h2 className="text-2xl font-semibold text-green-800 mb-3">All Users</h2>
      <div className="mb-3 rounded-lg border border-slate-200 bg-white p-3">
        <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search email or username"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700"
          />
          <select
            value={roleFilter}
            onChange={(e) =>
              onRoleFilterChange(
                e.target.value as "all" | "user" | "mod" | "admin" | "super_admin"
              )
            }
            className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700"
          >
            <option value="all">All Roles</option>
            <option value="user">User</option>
            <option value="mod">Mod</option>
            <option value="admin">Admin</option>
            <option value="super_admin">Super Admin</option>
          </select>
          <label className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={bannedOnly}
              onChange={(e) => onBannedOnlyChange(e.target.checked)}
            />
            Banned only
          </label>
          <button
            onClick={onRefresh}
            className="rounded-md bg-green-700 px-3 py-2 text-sm font-medium text-white hover:bg-green-800"
          >
            Refresh Users
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
        <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-slate-700 md:grid-cols-5">
          <p>Total: {summary.total}</p>
          <p>Banned: {summary.banned}</p>
          <p>Admins: {summary.admins}</p>
          <p>Mods: {summary.mods}</p>
          <p>Premium: {summary.premium}</p>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-200 pt-3">
          <span className="text-xs font-semibold text-slate-600">
            Selected: {selectedUserIds.length}
          </span>
          <button
            onClick={onBulkBan}
            disabled={selectedUserIds.length === 0}
            className="rounded bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            Ban Selected
          </button>
          <button
            onClick={onBulkUnban}
            disabled={selectedUserIds.length === 0}
            className="rounded bg-green-600 px-2 py-1 text-xs text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            Unban Selected
          </button>
          <button
            onClick={() => onBulkRoleUpdate("mod")}
            disabled={selectedUserIds.length === 0}
            className="rounded bg-indigo-600 px-2 py-1 text-xs text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            Set Mod
          </button>
          <button
            onClick={() => onBulkRoleUpdate("admin")}
            disabled={selectedUserIds.length === 0}
            className="rounded bg-indigo-600 px-2 py-1 text-xs text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            Set Admin
          </button>
          <button
            onClick={() => onBulkRoleUpdate("user")}
            disabled={selectedUserIds.length === 0}
            className="rounded bg-slate-700 px-2 py-1 text-xs text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            Set User
          </button>
          <button
            onClick={onClearUserSelection}
            disabled={selectedUserIds.length === 0}
            className="rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
          >
            Clear Selection
          </button>
        </div>
      </div>

      {users.length > 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-100">
              <tr>
                <th className="p-3 text-sm font-semibold text-gray-700">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={onToggleSelectAllUsers}
                  />
                </th>
                <th className="p-3 text-sm font-semibold text-gray-700">Email</th>
                <th className="p-3 text-sm font-semibold text-gray-700">Username</th>
                <th className="p-3 text-sm font-semibold text-gray-700">Role</th>
                <th className="p-3 text-sm font-semibold text-gray-700">Status</th>
                <th className="p-3 text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id} className="border-t border-gray-100">
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={selectedUserIds.includes(user._id)}
                      onChange={() => onToggleUserSelection(user._id)}
                    />
                  </td>
                  <td className="p-3 text-gray-700">{user.email}</td>
                  <td className="p-3 text-gray-700">{user.username || "-"}</td>
                  <td className="p-3 text-gray-700">{user.role}</td>
                  <td className="p-3 text-gray-700">
                    {user.isBanned ? "Banned" : "Active"}
                    {user.suspendedUntil &&
                    new Date(user.suspendedUntil).getTime() > now
                      ? " • Suspended"
                      : ""}
                    {user.isPremium ? " • Premium" : ""}
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => onViewDetails(user._id)}
                        className="rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
                      >
                        View
                      </button>
                      <select
                        value={user.role}
                        onChange={(e) =>
                          onRoleUpdate(
                            user._id,
                            e.target.value as "user" | "mod" | "admin" | "super_admin"
                          )
                        }
                        className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-700"
                      >
                        <option value="user">user</option>
                        <option value="mod">mod</option>
                        <option value="admin">admin</option>
                        <option value="super_admin">super_admin</option>
                      </select>
                      {user.isBanned ? (
                        <button
                          onClick={() => onUnban(user._id)}
                          className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700"
                        >
                          Unban
                        </button>
                      ) : (
                        <button
                          onClick={() => onBan(user._id, user.email)}
                          className="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700"
                        >
                          Ban
                        </button>
                      )}
                      {user.suspendedUntil &&
                      new Date(user.suspendedUntil).getTime() > now ? (
                        <button
                          onClick={() => onUnsuspend(user._id)}
                          className="bg-amber-600 text-white px-2 py-1 rounded text-xs hover:bg-amber-700"
                        >
                          Unsuspend
                        </button>
                      ) : (
                        <button
                          onClick={() => onSuspend(user._id, user.email)}
                          className="bg-slate-700 text-white px-2 py-1 rounded text-xs hover:bg-slate-800"
                        >
                          Suspend
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-center text-gray-600 bg-white p-4 rounded-lg">No users for selected filters.</p>
      )}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
        <p>
          Page {page} of {totalPages} • {total} users
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
