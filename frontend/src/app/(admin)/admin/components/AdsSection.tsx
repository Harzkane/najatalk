"use client";

import formatDate from "../../../../utils/formatDate";
import type { Ad, AdminPagination, AdsReviewSummary } from "./types";

type AdsSectionProps = {
  ads: Ad[];
  summary: AdsReviewSummary;
  query: string;
  statusFilter: "all" | "pending" | "active" | "paused" | "expired";
  typeFilter: "all" | "sidebar" | "banner" | "popup";
  dateFrom: string;
  dateTo: string;
  pagination: AdminPagination;
  onQueryChange: (value: string) => void;
  onStatusFilterChange: (value: "all" | "pending" | "active" | "paused" | "expired") => void;
  onTypeFilterChange: (value: "all" | "sidebar" | "banner" | "popup") => void;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  onPageChange: (value: number) => void;
  onPageSizeChange: (value: number) => void;
  onRefresh: () => void;
  onApprove: (adId: string) => void;
  onReject: (adId: string) => void;
};

export default function AdsSection({
  ads,
  summary,
  query,
  statusFilter,
  typeFilter,
  dateFrom,
  dateTo,
  pagination,
  onQueryChange,
  onStatusFilterChange,
  onTypeFilterChange,
  onDateFromChange,
  onDateToChange,
  onPageChange,
  onPageSizeChange,
  onRefresh,
  onApprove,
  onReject,
}: AdsSectionProps) {
  return (
    <div id="ads" className="mt-6 scroll-mt-20">
      <h2 className="mb-3 text-2xl font-semibold text-green-800">Ads Review</h2>
      <div className="mb-3 rounded-lg border border-slate-200 bg-white p-3">
        <div className="grid grid-cols-1 gap-2 md:grid-cols-6">
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search brand, text, link, owner"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700"
          />
          <select
            value={statusFilter}
            onChange={(e) =>
              onStatusFilterChange(
                e.target.value as "all" | "pending" | "active" | "paused" | "expired",
              )
            }
            className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700"
          >
            <option value="pending">Pending</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="expired">Expired</option>
            <option value="all">All statuses</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) =>
              onTypeFilterChange(e.target.value as "all" | "sidebar" | "banner" | "popup")
            }
            className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700"
          >
            <option value="all">All types</option>
            <option value="sidebar">Sidebar</option>
            <option value="banner">Banner</option>
            <option value="popup">Popup</option>
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
            Refresh Ads
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
        <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-slate-700 md:grid-cols-6">
          <p>Total: {summary.total}</p>
          <p>Pending: {summary.pending}</p>
          <p>Active: {summary.active}</p>
          <p>Paused: {summary.paused}</p>
          <p>Expired: {summary.expired}</p>
          <p>Budget: ₦{(summary.totalBudget / 100).toLocaleString("en-NG")}</p>
        </div>
      </div>
      {ads.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-slate-100">
              <tr>
                <th className="p-3 text-sm font-semibold text-gray-700">Brand/Owner</th>
                <th className="p-3 text-sm font-semibold text-gray-700">Text</th>
                <th className="p-3 text-sm font-semibold text-gray-700">Type</th>
                <th className="p-3 text-sm font-semibold text-gray-700">Budget/CPC</th>
                <th className="p-3 text-sm font-semibold text-gray-700">Status</th>
                <th className="p-3 text-sm font-semibold text-gray-700">Created</th>
                <th className="p-3 text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {ads.map((ad) => (
                <tr key={ad._id} className="border-t border-gray-100">
                  <td className="p-3 text-gray-700">
                    <p className="font-medium text-slate-900">{ad.brand}</p>
                    <p className="text-xs text-slate-500">{ad.userId?.email || "Unknown"}</p>
                  </td>
                  <td className="max-w-sm p-3 text-gray-700">
                    <p className="truncate" title={ad.text}>
                      {ad.text}
                    </p>
                  </td>
                  <td className="p-3 text-gray-700">{ad.type}</td>
                  <td className="p-3 text-gray-700">
                    ₦{(ad.budget / 100).toLocaleString("en-NG")} / ₦
                    {(ad.cpc / 100).toLocaleString("en-NG")}
                  </td>
                  <td className="p-3 text-gray-700">{ad.status}</td>
                  <td className="p-3 text-gray-700">{formatDate(ad.createdAt)}</td>
                  <td className="p-3">
                    {ad.status === "pending" ? (
                      <>
                        <button
                          onClick={() => onApprove(ad._id)}
                          className="mr-2 rounded-lg bg-green-600 px-2 py-1 text-sm text-white hover:bg-green-700"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => onReject(ad._id)}
                          className="rounded-lg bg-red-600 px-2 py-1 text-sm text-white hover:bg-red-700"
                        >
                          Reject
                        </button>
                      </>
                    ) : (
                      <span className="text-xs text-slate-500">No pending action</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="rounded-lg bg-white p-4 text-center text-gray-600">
          No ads found for selected filters.
        </p>
      )}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
        <p>
          Page {pagination.page} of {pagination.totalPages} • {pagination.total} ads
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
