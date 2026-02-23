"use client";

import Link from "next/link";
import formatDate from "../../../../utils/formatDate";
import type { Report } from "./types";

type ReportsSectionProps = {
  reports: Report[];
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  dateFrom: string;
  dateTo: string;
  onPageChange: (value: number) => void;
  onPageSizeChange: (value: number) => void;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  onRefresh: () => void;
  onDelete: (threadId: string) => void;
  onDismiss: (reportId: string) => void;
  onBanUser: (userId: string, email: string) => void;
};

export default function ReportsSection({
  reports,
  page,
  totalPages,
  total,
  pageSize,
  dateFrom,
  dateTo,
  onPageChange,
  onPageSizeChange,
  onDateFromChange,
  onDateToChange,
  onRefresh,
  onDelete,
  onDismiss,
  onBanUser,
}: ReportsSectionProps) {
  const flairClassName = (flair?: string) =>
    flair === "Oga at the Top"
      ? "border-amber-200 bg-amber-50 text-amber-800"
      : "border-emerald-200 bg-emerald-50 text-emerald-800";

  return (
    <div id="reports" className="mb-6 mt-6 scroll-mt-20">
      <h2 className="mb-3 text-2xl font-semibold text-slate-900">Reports</h2>
      <div className="mb-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/60">
        <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
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
            Refresh Reports
          </button>
        </div>
      </div>
      {reports && reports.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/60">
          <table className="w-full text-left text-sm">
            <thead className="bg-rose-50">
              <tr>
                <th className="p-3 text-sm font-semibold text-rose-900">Thread</th>
                <th className="p-3 text-sm font-semibold text-rose-900">Reported By</th>
                <th className="p-3 text-sm font-semibold text-rose-900">Reason</th>
                <th className="p-3 text-sm font-semibold text-rose-900">Date</th>
                <th className="p-3 text-sm font-semibold text-rose-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report._id} className="border-t border-slate-100 align-top hover:bg-slate-50/60">
                  <td className="p-3">
                    <Link
                      href={`/threads/${report.threadId._id}`}
                      className="font-medium text-slate-800 hover:text-rose-700 hover:underline"
                      title={report.threadId.title}
                    >
                      <span className="inline-block max-w-xs truncate">{report.threadId.title}</span>
                    </Link>
                  </td>
                  <td className="p-3 text-slate-700">
                    <span>{report.userId.email}</span>
                    {report.userId.flair && (
                      <span
                        className={`ml-2 inline-block rounded-full border px-2 py-0.5 text-xs font-medium ${flairClassName(
                          report.userId.flair,
                        )}`}
                      >
                        {report.userId.flair}
                      </span>
                    )}
                  </td>
                  <td className="max-w-md p-3 text-slate-700" title={report.reason}>
                    <p className="truncate">{report.reason}</p>
                  </td>
                  <td className="p-3 text-slate-500">{formatDate(report.createdAt)}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => onDismiss(report._id)}
                        className="rounded-md bg-amber-600 px-2 py-1 text-xs font-medium text-white hover:bg-amber-700"
                      >
                        Dismiss
                      </button>
                      <button
                        onClick={() =>
                          onBanUser(report.reportedUserId._id, report.reportedUserId.email)
                        }
                        className="rounded-md bg-rose-700 px-2 py-1 text-xs font-medium text-white hover:bg-rose-800"
                      >
                        Ban {report.reportedUserId.flair ? `(${report.reportedUserId.flair})` : ""}
                      </button>
                      <button
                        onClick={() => onDelete(report.threadId._id)}
                        className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-100"
                      >
                        Delete Thread
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
          No reports yet - clean slate!
        </p>
      )}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
        <p>
          Page {page} of {totalPages} • {total} reports
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
