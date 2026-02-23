"use client";

import Link from "next/link";
import formatDate from "../../../../utils/formatDate";
import type { AdminManagedThread, AdminThreadsSummary } from "./types";

type ThreadsSectionProps = {
  threads: AdminManagedThread[];
  summary: AdminThreadsSummary;
  query: string;
  statusFilter: "all" | "locked" | "sticky" | "solved";
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onQueryChange: (value: string) => void;
  onStatusFilterChange: (value: "all" | "locked" | "sticky" | "solved") => void;
  onRefresh: () => void;
  onPageChange: (value: number) => void;
  onPageSizeChange: (value: number) => void;
  onDelete: (threadId: string) => void;
  onToggleLock: (threadId: string) => void;
  onToggleSticky: (threadId: string) => void;
  onViewDetails: (threadId: string) => void;
  selectedThreadIds: string[];
  onToggleThreadSelection: (threadId: string) => void;
  onToggleSelectAllThreads: () => void;
  onClearThreadSelection: () => void;
  onBulkDelete: () => void;
  onBulkToggleLock: () => void;
  onBulkToggleSticky: () => void;
};

export default function ThreadsSection({
  threads,
  summary,
  query,
  statusFilter,
  page,
  totalPages,
  total,
  pageSize,
  onQueryChange,
  onStatusFilterChange,
  onRefresh,
  onPageChange,
  onPageSizeChange,
  onDelete,
  onToggleLock,
  onToggleSticky,
  onViewDetails,
  selectedThreadIds,
  onToggleThreadSelection,
  onToggleSelectAllThreads,
  onClearThreadSelection,
  onBulkDelete,
  onBulkToggleLock,
  onBulkToggleSticky,
}: ThreadsSectionProps) {
  const allSelected =
    threads.length > 0 && threads.every((thread) => selectedThreadIds.includes(thread._id));
  const getStatusItems = (thread: AdminManagedThread) => {
    const items: Array<{ label: string; className: string }> = [];
    if (thread.isLocked) {
      items.push({
        label: "Locked",
        className: "border-amber-200 bg-amber-50 text-amber-800",
      });
    }
    if (thread.isSticky) {
      items.push({
        label: "Pinned",
        className: "border-blue-200 bg-blue-50 text-blue-800",
      });
    }
    if (thread.isSolved) {
      items.push({
        label: "Solved",
        className: "border-emerald-200 bg-emerald-50 text-emerald-800",
      });
    }
    if (items.length === 0) {
      items.push({
        label: "Normal",
        className: "border-slate-200 bg-slate-50 text-slate-700",
      });
    }
    return items;
  };

  return (
    <div id="threads" className="mt-6 scroll-mt-20">
      <h2 className="mb-3 text-2xl font-semibold text-slate-900">All Threads</h2>
      <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/60">
        <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search title or body"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400"
          />
          <select
            value={statusFilter}
            onChange={(e) =>
              onStatusFilterChange(e.target.value as "all" | "locked" | "sticky" | "solved")
            }
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
          >
            <option value="all">All statuses</option>
            <option value="locked">Locked</option>
            <option value="sticky">Sticky</option>
            <option value="solved">Solved</option>
          </select>
          <button
            onClick={onRefresh}
            className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Refresh Threads
          </button>
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
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-5">
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
            Total: <span className="font-semibold text-slate-900">{summary.total}</span>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Locked: <span className="font-semibold text-amber-900">{summary.locked}</span>
          </div>
          <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">
            Sticky: <span className="font-semibold text-blue-900">{summary.sticky}</span>
          </div>
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            Solved: <span className="font-semibold text-emerald-900">{summary.solved}</span>
          </div>
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
            Reported: <span className="font-semibold text-rose-900">{summary.reported}</span>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-200 pt-3">
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
            Selected: {selectedThreadIds.length}
          </span>
          <button
            onClick={onBulkToggleLock}
            disabled={selectedThreadIds.length === 0}
            className="rounded-md bg-amber-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            Toggle Lock Selected
          </button>
          <button
            onClick={onBulkToggleSticky}
            disabled={selectedThreadIds.length === 0}
            className="rounded-md bg-blue-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            Toggle Pin Selected
          </button>
          <button
            onClick={onBulkDelete}
            disabled={selectedThreadIds.length === 0}
            className="rounded-md bg-red-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            Delete Selected
          </button>
          <button
            onClick={onClearThreadSelection}
            disabled={selectedThreadIds.length === 0}
            className="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
          >
            Clear Selection
          </button>
        </div>
      </div>

      {threads.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/60">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-3 text-sm font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={onToggleSelectAllThreads}
                  />
                </th>
                <th className="p-3 text-sm font-semibold text-slate-700">Thread</th>
                <th className="p-3 text-sm font-semibold text-slate-700">Author</th>
                <th className="p-3 text-sm font-semibold text-slate-700">Status</th>
                <th className="p-3 text-sm font-semibold text-slate-700">Replies/Reports</th>
                <th className="p-3 text-sm font-semibold text-slate-700">Date</th>
                <th className="p-3 text-sm font-semibold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {threads.map((thread) => (
                <tr key={thread._id} className="border-t border-slate-100 align-top hover:bg-slate-50/60">
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={selectedThreadIds.includes(thread._id)}
                      onChange={() => onToggleThreadSelection(thread._id)}
                    />
                  </td>
                  <td className="max-w-sm p-3 font-medium text-slate-800" title={thread.title}>
                    <p className="truncate">{thread.title}</p>
                  </td>
                  <td className="p-3 text-slate-700">{thread.userId?.email || "Unknown"}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1.5">
                      {getStatusItems(thread).map((status) => (
                        <span
                          key={`${thread._id}-${status.label}`}
                          className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${status.className}`}
                        >
                          {status.label}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-3 text-slate-700">
                    <span className="font-semibold text-slate-900">{thread.replyCount}</span>
                    <span className="text-slate-400"> / </span>
                    <span className="font-semibold text-rose-700">{thread.reportCount}</span>
                  </td>
                  <td className="p-3 text-slate-500">{formatDate(thread.createdAt)}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/threads/${thread._id}`}
                        className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        View
                      </Link>
                      <button
                        onClick={() => onViewDetails(thread._id)}
                        className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        360
                      </button>
                      <button
                        onClick={() => onToggleLock(thread._id)}
                        className="rounded-md bg-amber-600 px-2 py-1 text-xs font-medium text-white hover:bg-amber-700"
                      >
                        {thread.isLocked ? "Unlock" : "Lock"}
                      </button>
                      <button
                        onClick={() => onToggleSticky(thread._id)}
                        className="rounded-md bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-700"
                      >
                        {thread.isSticky ? "Unpin" : "Pin"}
                      </button>
                      <button
                        onClick={() => onDelete(thread._id)}
                        className="rounded-md bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="rounded-xl border border-slate-200 bg-white p-4 text-center text-slate-600 shadow-sm shadow-slate-200/50">
          No threads for selected filters.
        </p>
      )}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
        <p>
          Page {page} of {totalPages} • {total} threads
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
