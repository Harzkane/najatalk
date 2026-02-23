"use client";

import formatDate from "../../../../utils/formatDate";
import type {
  AdminContest,
  AdminContestDetails,
  AdminContestsSummary,
} from "./types";

type ContestsSectionProps = {
  contests: AdminContest[];
  summary: AdminContestsSummary;
  query: string;
  statusFilter: "all" | "draft" | "live" | "closed" | "archived";
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  selectedContestDetails: AdminContestDetails | null;
  isContestDetailsLoading: boolean;
  onQueryChange: (value: string) => void;
  onStatusFilterChange: (value: "all" | "draft" | "live" | "closed" | "archived") => void;
  onPageChange: (value: number) => void;
  onPageSizeChange: (value: number) => void;
  onRefresh: () => void;
  onCreateContest: () => void;
  onViewDetails: (contestId: string) => void;
  onUpdateStatus: (contestId: string, status: "draft" | "live" | "closed" | "archived") => void;
  onReviewSubmission: (
    contestId: string,
    submissionId: string,
    status: "pending" | "approved" | "rejected" | "winner",
  ) => void;
  onReviewPrizeClaim: (submissionId: string, approve: boolean) => void;
  onCloseDetails: () => void;
};

export default function ContestsSection({
  contests,
  summary,
  query,
  statusFilter,
  page,
  totalPages,
  total,
  pageSize,
  selectedContestDetails,
  isContestDetailsLoading,
  onQueryChange,
  onStatusFilterChange,
  onPageChange,
  onPageSizeChange,
  onRefresh,
  onCreateContest,
  onViewDetails,
  onUpdateStatus,
  onReviewSubmission,
  onReviewPrizeClaim,
  onCloseDetails,
}: ContestsSectionProps) {
  return (
    <div id="contests" className="mt-6 scroll-mt-20">
      <h2 className="mb-3 text-2xl font-semibold text-green-800">Contests</h2>
      <div className="mb-3 rounded-lg border border-slate-200 bg-white p-3">
        <div className="grid grid-cols-1 gap-2 md:grid-cols-5">
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search title/category"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700"
          />
          <select
            value={statusFilter}
            onChange={(e) =>
              onStatusFilterChange(
                e.target.value as "all" | "draft" | "live" | "closed" | "archived",
              )
            }
            className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700"
          >
            <option value="all">All statuses</option>
            <option value="draft">Draft</option>
            <option value="live">Live</option>
            <option value="closed">Closed</option>
            <option value="archived">Archived</option>
          </select>
          <button
            onClick={onRefresh}
            className="rounded-md bg-green-700 px-3 py-2 text-sm font-medium text-white hover:bg-green-800"
          >
            Refresh Contests
          </button>
          <button
            onClick={onCreateContest}
            className="rounded-md bg-blue-700 px-3 py-2 text-sm font-medium text-white hover:bg-blue-800"
          >
            Create Contest
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
          <p>Draft: {summary.draft}</p>
          <p>Live: {summary.live}</p>
          <p>Closed: {summary.closed}</p>
          <p>Archived: {summary.archived}</p>
        </div>
      </div>

      {isContestDetailsLoading ? (
        <p className="mb-3 rounded-lg border border-slate-200 bg-white p-2 text-center text-sm text-slate-700">
          Loading contest details...
        </p>
      ) : null}

      {selectedContestDetails ? (
        <section className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/60">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-lg font-semibold text-slate-900">
              Contest 360: {selectedContestDetails.contest.title}
            </h3>
            <button
              onClick={onCloseDetails}
              className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Close
            </button>
          </div>
          <p className="mt-2 text-sm text-slate-700">{selectedContestDetails.contest.description}</p>
          <div className="mt-3 grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
            <p className="rounded-md bg-slate-50 px-2 py-1 text-slate-900">
              <span className="font-semibold">Status:</span> {selectedContestDetails.contest.status}
            </p>
            <p className="rounded-md bg-slate-50 px-2 py-1 text-slate-900">
              <span className="font-semibold">Prize:</span> ₦
              {Number(selectedContestDetails.contest.prize || 0).toLocaleString("en-NG")}
            </p>
            <p className="rounded-md bg-slate-50 px-2 py-1 text-slate-900">
              <span className="font-semibold">Start:</span> {formatDate(selectedContestDetails.contest.startDate)}
            </p>
            <p className="rounded-md bg-slate-50 px-2 py-1 text-slate-900">
              <span className="font-semibold">End:</span> {formatDate(selectedContestDetails.contest.endDate)}
            </p>
          </div>
          <div className="mt-2 grid grid-cols-1 gap-2 text-xs text-slate-700 md:grid-cols-2">
            <p className="rounded-md bg-slate-50 px-2 py-1">
              <span className="font-semibold">Terms:</span>{" "}
              {selectedContestDetails.contest.termsVersion || "Not set"}{" "}
              ({selectedContestDetails.contest.requireTermsAcceptance !== false ? "Required" : "Optional"})
            </p>
            <p className="rounded-md bg-slate-50 px-2 py-1">
              <span className="font-semibold">Docs:</span>{" "}
              {selectedContestDetails.contest.termsUrl || "/contests/terms"} •{" "}
              {selectedContestDetails.contest.policyUrl || "/contests/policy"}
            </p>
          </div>
          <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50">
                <tr>
                  <th className="p-2 font-semibold text-slate-700">When</th>
                  <th className="p-2 font-semibold text-slate-700">User</th>
                  <th className="p-2 font-semibold text-slate-700">Submission</th>
                  <th className="p-2 font-semibold text-slate-700">Status</th>
                  <th className="p-2 font-semibold text-slate-700">Votes</th>
                  <th className="p-2 font-semibold text-slate-700">Terms</th>
                  <th className="p-2 font-semibold text-slate-700">Prize Claim</th>
                  <th className="p-2 font-semibold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {selectedContestDetails.submissions.map((row) => (
                  <tr key={row._id} className="border-t border-slate-100">
                    <td className="p-2 text-slate-700">{formatDate(row.createdAt)}</td>
                    <td className="p-2 text-slate-900">{row.userId?.email || "Unknown"}</td>
                    <td className="p-2 text-slate-900">
                      <p className="font-medium">{row.title || "Untitled"}</p>
                      <p className="text-slate-600">{row.summary || "-"}</p>
                    </td>
                    <td className="p-2 text-slate-700">{row.status}</td>
                    <td className="p-2 text-slate-700">{row.voteCount}</td>
                    <td className="p-2 text-slate-700">
                      {row.termsAccepted ? "Accepted" : "Missing"}
                      {row.termsVersionAccepted ? ` (${row.termsVersionAccepted})` : ""}
                    </td>
                    <td className="p-2 text-slate-700">
                      {row.prizeClaim?.status || "not_requested"}
                      {row.prizeClaim?.idType
                        ? ` • ${row.prizeClaim.idType} (${row.prizeClaim.idNumberLast4 || "****"})`
                        : ""}
                    </td>
                    <td className="p-2">
                      <div className="flex flex-wrap gap-1">
                        {row.prizeClaim?.status === "paid" ? (
                          <span className="rounded bg-emerald-100 px-2 py-1 text-[11px] font-medium text-emerald-800">
                            Paid out - locked
                          </span>
                        ) : null}
                        <button
                          onClick={() =>
                            onReviewSubmission(selectedContestDetails.contest._id, row._id, "approved")
                          }
                          disabled={row.status === "approved" || row.prizeClaim?.status === "paid"}
                          className="rounded border border-slate-300 bg-white px-2 py-1 text-[11px] text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() =>
                            onReviewSubmission(selectedContestDetails.contest._id, row._id, "rejected")
                          }
                          disabled={row.status === "rejected" || row.prizeClaim?.status === "paid"}
                          className="rounded border border-slate-300 bg-white px-2 py-1 text-[11px] text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() =>
                            onReviewSubmission(selectedContestDetails.contest._id, row._id, "winner")
                          }
                          disabled={row.status === "winner" || row.prizeClaim?.status === "paid"}
                          className="rounded bg-amber-600 px-2 py-1 text-[11px] text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:bg-amber-300"
                        >
                          Winner
                        </button>
                        {row.status === "winner" && row.prizeClaim?.status === "pending_review" ? (
                          <>
                            <button
                              onClick={() => onReviewPrizeClaim(row._id, true)}
                              className="rounded bg-green-700 px-2 py-1 text-[11px] text-white hover:bg-green-800"
                            >
                              Approve Claim + Pay
                            </button>
                            <button
                              onClick={() => onReviewPrizeClaim(row._id, false)}
                              className="rounded border border-slate-300 bg-white px-2 py-1 text-[11px] text-slate-700 hover:bg-slate-50"
                            >
                              Reject Claim
                            </button>
                          </>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
                {selectedContestDetails.submissions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-2 text-center text-slate-500">
                      No submissions yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {contests.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-slate-100">
              <tr>
                <th className="p-3 text-sm font-semibold text-gray-700">Title</th>
                <th className="p-3 text-sm font-semibold text-gray-700">Status</th>
                <th className="p-3 text-sm font-semibold text-gray-700">Prize</th>
                <th className="p-3 text-sm font-semibold text-gray-700">Window</th>
                <th className="p-3 text-sm font-semibold text-gray-700">Submissions</th>
                <th className="p-3 text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {contests.map((contest) => (
                <tr key={contest._id} className="border-t border-gray-100">
                  <td className="p-3 text-gray-700">{contest.title}</td>
                  <td className="p-3 text-gray-700">{contest.status}</td>
                  <td className="p-3 text-gray-700">
                    ₦{Number(contest.prize || 0).toLocaleString("en-NG")}
                  </td>
                  <td className="p-3 text-gray-700 text-xs">
                    {formatDate(contest.startDate)} - {formatDate(contest.endDate)}
                  </td>
                  <td className="p-3 text-gray-700">
                    {contest.stats?.approvedSubmissions || 0}/{contest.stats?.totalSubmissions || 0}
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => onViewDetails(contest._id)}
                        className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
                      >
                        360
                      </button>
                      <select
                        value={contest.status}
                        onChange={(e) =>
                          onUpdateStatus(
                            contest._id,
                            e.target.value as "draft" | "live" | "closed" | "archived",
                          )
                        }
                        className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-700"
                      >
                        <option value="draft">draft</option>
                        <option value="live">live</option>
                        <option value="closed">closed</option>
                        <option value="archived">archived</option>
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="rounded-lg bg-white p-4 text-center text-gray-600">
          No contests found for selected filters.
        </p>
      )}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
        <p>
          Page {page} of {totalPages} • {total} contests
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
