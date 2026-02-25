"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { isAxiosError } from "axios";
import api from "@/utils/api";
import { clearStoredAuth } from "@/utils/authStorage";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header";

function ContestsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [contests, setContests] = useState([]);
  const [selectedContest, setSelectedContest] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [message, setMessage] = useState("");
  const [statusFilter, setStatusFilter] = useState("live");
  const [threadId, setThreadId] = useState("");
  const [listingId, setListingId] = useState("");
  const [submissionTitle, setSubmissionTitle] = useState("");
  const [submissionSummary, setSubmissionSummary] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [myThreads, setMyThreads] = useState([]);
  const [myListings, setMyListings] = useState([]);
  const [isPickerLoading, setIsPickerLoading] = useState(false);
  const [votingSubmissionId, setVotingSubmissionId] = useState(null);
  const [votePulseSubmissionId, setVotePulseSubmissionId] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const hasSelectedAsset = Boolean(threadId.trim() || listingId.trim());

  const getToken = () => localStorage.getItem("token");

  const getErr = useCallback(
    (err, fallback) => (isAxiosError(err) ? err.response?.data?.message || fallback : fallback),
    []
  );
  const normalizeIdInput = (value) => {
    const raw = String(value || "").trim();
    if (!raw) return "";
    const noQuery = raw.split("?")[0].split("#")[0];
    const parts = noQuery.split("/").filter(Boolean);
    return parts.length > 0 ? parts[parts.length - 1] : raw;
  };

  const fetchContests = useCallback(async () => {
    try {
      const res = await api.get("/contests", { params: { status: statusFilter } });
      setContests(res.data.contests || []);
      setMessage(res.data.message || "");
    } catch (err) {
      setMessage(getErr(err, "Contests load scatter o!"));
    }
  }, [statusFilter, getErr]);

  const fetchMyContestAssets = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setMyThreads([]);
      setMyListings([]);
      return;
    }
    try {
      setIsPickerLoading(true);
      const [threadsRes, listingsRes] = await Promise.all([
        api.get("/contests/me/threads", {
          headers: { Authorization: `Bearer ${token}` },
          params: { limit: 50 },
        }),
        api.get("/contests/me/listings", {
          headers: { Authorization: `Bearer ${token}` },
          params: { limit: 50 },
        }),
      ]);
      setMyThreads(threadsRes.data?.threads || []);
      setMyListings(listingsRes.data?.listings || []);
    } catch (err) {
      setMyThreads([]);
      setMyListings([]);
      setMessage(getErr(err, "Could not load your threads/listings for picker."));
    } finally {
      setIsPickerLoading(false);
    }
  }, [getErr]);

  const openContest = useCallback(async (contestId) => {
    try {
      const token = getToken();
      const res = await api.get(`/contests/${contestId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      setSelectedContest(res.data.contest || null);
      setSubmissions(res.data.submissions || []);
      setAcceptTerms(false);
      setSubmitMessage("");
      setMessage(res.data.message || "");
    } catch (err) {
      setMessage(getErr(err, "Contest details scatter o!"));
    }
  }, [getErr]);

  const startThreadForContest = () => {
    if (!selectedContest?._id) return;
    const token = getToken();
    if (!token) {
      setSubmitMessage("Login first to create contest thread.");
      return;
    }
    const params = new URLSearchParams({
      compose: "1",
      contestId: selectedContest._id,
      contestTitle: selectedContest.title || "Contest",
      returnTo: "/contests",
    });
    router.push(`/threads?${params.toString()}`);
  };

  const submitToContest = async () => {
    if (!selectedContest?._id) {
      setSubmitMessage("Select a contest first.");
      return;
    }
    const token = getToken();
    if (!token) {
      setSubmitMessage("Login first to submit.");
      return;
    }
    const normalizedThreadId = normalizeIdInput(threadId);
    const normalizedListingId = normalizeIdInput(listingId);
    if (!normalizedThreadId && !normalizedListingId) {
      setSubmitMessage("Add your thread ID or listing ID before submitting.");
      return;
    }
    if (selectedContest.requireTermsAcceptance !== false && !acceptTerms) {
      setSubmitMessage("Please accept contest terms before submitting.");
      return;
    }
    try {
      setIsSubmitting(true);
      setSubmitMessage("Submitting entry...");
      const payload = {
        threadId: normalizedThreadId || undefined,
        listingId: normalizedListingId || undefined,
        title: submissionTitle,
        summary: submissionSummary,
        acceptTerms,
        termsVersionAccepted: selectedContest?.termsVersion || "2026-02-21",
      };
      const res = await api.post(`/contests/${selectedContest._id}/submissions`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage(res.data.message || "Submission sent.");
      setThreadId("");
      setListingId("");
      setSubmissionTitle("");
      setSubmissionSummary("");
      setAcceptTerms(false);
      setSubmitMessage("Entry submitted successfully.");
      openContest(selectedContest._id);
    } catch (err) {
      const errMessage = getErr(err, "Submission scatter o!");
      setSubmitMessage(errMessage);
      setMessage(errMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const voteSubmission = async (submissionId) => {
    const token = getToken();
    if (!token) {
      setMessage("Login first to vote.");
      return;
    }
    try {
      setVotingSubmissionId(submissionId);
      const res = await api.post(
        `/contests/submissions/${submissionId}/vote`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(res.data.message || "Vote updated.");
      const voted = Boolean(res.data?.voted);
      const voteCount = Number(res.data?.voteCount || 0);
      setSubmissions((prev) =>
        prev.map((row) =>
          row._id === submissionId ? { ...row, viewerHasVoted: voted, voteCount } : row
        )
      );
      setVotePulseSubmissionId(submissionId);
      setTimeout(() => setVotePulseSubmissionId(null), 450);
      if (selectedContest?._id) openContest(selectedContest._id);
    } catch (err) {
      setMessage(getErr(err, "Vote scatter o!"));
    } finally {
      setVotingSubmissionId(null);
    }
  };

  const requestPrizeClaim = async (submissionId) => {
    const token = getToken();
    if (!token) {
      setMessage("Login first to request your prize.");
      return;
    }
    const fullName = window.prompt("Full legal name for payout verification:", "") || "";
    const phone = window.prompt("Phone number:", "") || "";
    const idType = window.prompt("ID type (NIN / Passport / Driver License):", "") || "";
    const idNumber = window.prompt("ID number:", "") || "";
    try {
      const res = await api.post(
        `/contests/submissions/${submissionId}/claim-prize`,
        { fullName, phone, idType, idNumber },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setMessage(res.data.message || "Prize claim submitted.");
      if (selectedContest?._id) openContest(selectedContest._id);
    } catch (err) {
      setMessage(getErr(err, "Prize claim scatter o!"));
    }
  };

  const handleLogout = () => {
    clearStoredAuth();
    setCurrentUserId(null);
    setIsLoggedIn(false);
    router.push("/login");
  };

  useEffect(() => {
    fetchContests();
  }, [fetchContests]);

  useEffect(() => {
    fetchMyContestAssets();
  }, [fetchMyContestAssets]);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setCurrentUserId(null);
      setIsLoggedIn(false);
      return;
    }
    setIsLoggedIn(true);
    const loadMe = async () => {
      try {
        const res = await api.get("/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCurrentUserId(res.data?._id || null);
      } catch {
        setCurrentUserId(null);
        setIsLoggedIn(false);
      }
    };
    loadMe();
  }, []);

  useEffect(() => {
    const contestIdFromQuery = searchParams.get("contestId");
    const threadIdFromQuery = searchParams.get("threadId");
    const from = searchParams.get("from");
    if (!contestIdFromQuery) return;
    openContest(contestIdFromQuery);
    if (threadIdFromQuery) {
      setThreadId(threadIdFromQuery);
      setSubmitMessage(
        from === "create-thread"
          ? "Thread created and preselected. Review details, accept terms, then submit entry."
          : "Thread preselected from URL."
      );
    }
    router.replace("/contests");
  }, [searchParams, openContest, router]);

  useEffect(() => {
    if (submissionTitle.trim()) return;
    if (!threadId.trim() && !listingId.trim()) return;

    const selectedThread = myThreads.find((row) => row._id === threadId);
    if (selectedThread?.title) {
      setSubmissionTitle(selectedThread.title);
      return;
    }

    const selectedListing = myListings.find((row) => row._id === listingId);
    if (selectedListing?.title) {
      setSubmissionTitle(selectedListing.title);
    }
  }, [threadId, listingId, myThreads, myListings, submissionTitle]);

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-6">
      <div className="mx-auto max-w-7.5xl">
        <Header
          title="NaijaTalk Contests"
          subtitle="Discover live contests, submit entries, and vote on top community work."
          isLoggedIn={isLoggedIn}
          onLogout={handleLogout}
          loginHref="/login"
          compact
        />
        <div className="mb-3 mt-3 flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700"
          >
            <option value="live">Live</option>
            <option value="closed">Closed</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
            <option value="all">All</option>
          </select>
          <button
            onClick={fetchContests}
            className="rounded-md bg-green-700 px-3 py-2 text-sm font-medium text-white hover:bg-green-800"
          >
            Refresh
          </button>
        </div>

        {message ? (
          <p className="mb-4 rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-600">
            {message}
          </p>
        ) : null}

        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <div className="space-y-3">
            {contests.length > 0 ? (
              contests.map((contest) => (
                <button
                  key={contest._id}
                  onClick={() => openContest(contest._id)}
                  className="w-full rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm hover:border-green-300"
                >
                  <h2 className="text-lg font-bold text-green-800">{contest.title}</h2>
                  <p className="mt-1 text-sm text-slate-600">{contest.description || "No description."}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span>Status: {contest.status}</span>
                    <span>Prize: ₦{Number(contest.prize || 0).toLocaleString("en-NG")}</span>
                    <span>Ends: {new Date(contest.endDate).toLocaleString()}</span>
                    <span>Submissions: {contest.stats?.submissionCount || 0}</span>
                    <span>Votes: {contest.stats?.totalVotes || 0}</span>
                  </div>
                </button>
              ))
            ) : (
              <p className="rounded-lg bg-white p-4 text-slate-600">No contests yet—abeg check back!</p>
            )}
          </div>

          <div className="self-start rounded-lg border border-slate-200 bg-white p-4 shadow-sm lg:sticky lg:top-24">
            {selectedContest ? (
              <>
                <h3 className="text-xl font-semibold text-slate-900">{selectedContest.title}</h3>
                <p className="mt-2 text-sm text-slate-700">{selectedContest.description || "No description."}</p>
                <p className="mt-1 text-xs text-slate-500">
                  Window: {new Date(selectedContest.startDate).toLocaleString()} -{" "}
                  {new Date(selectedContest.endDate).toLocaleString()}
                </p>
                <p className="mt-1 text-xs text-slate-500">Rules: {selectedContest.rules || "No special rules."}</p>
                <p className="mt-1 text-xs text-slate-500">
                  Terms: {selectedContest.termsVersion || "2026-02-21"}{" "}
                  <a
                    href={selectedContest.termsUrl || "/contests/terms"}
                    target="_blank"
                    rel="noreferrer"
                    className="text-green-700 hover:text-green-800 hover:underline"
                  >
                    Contest Terms
                  </a>{" "}
                  •{" "}
                  <a
                    href={selectedContest.policyUrl || "/contests/policy"}
                    target="_blank"
                    rel="noreferrer"
                    className="text-green-700 hover:text-green-800 hover:underline"
                  >
                    Privacy & Policy
                  </a>
                </p>

                {selectedContest.isLiveNow ? (
                  <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="mb-2 text-sm font-semibold text-slate-800">Submit Entry</p>
                    <div className="mb-2 rounded-md border border-emerald-200 bg-emerald-50 p-2">
                      <p className="text-xs text-emerald-900">
                        Smooth flow: create a thread first, then it will be preselected here.
                      </p>
                      <button
                        onClick={startThreadForContest}
                        className="mt-2 rounded-md bg-emerald-700 px-3 py-2 text-xs font-medium text-white hover:bg-emerald-800"
                      >
                        Create Thread for This Contest
                      </button>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      <label className="text-xs font-medium text-slate-700">
                        Pick from my threads
                        <select
                          value={threadId}
                          onChange={(e) => setThreadId(e.target.value)}
                          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700"
                        >
                          <option value="">Select a thread (optional)</option>
                          {myThreads.map((thread) => (
                            <option key={thread._id} value={thread._id}>
                              {thread.title || "Untitled thread"} ({new Date(thread.createdAt).toLocaleDateString()})
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="text-xs font-medium text-slate-700">
                        Pick from my listings
                        <select
                          value={listingId}
                          onChange={(e) => setListingId(e.target.value)}
                          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700"
                        >
                          <option value="">Select a listing (optional)</option>
                          {myListings.map((listing) => (
                            <option key={listing._id} value={listing._id}>
                              {listing.title || "Untitled listing"} ({new Date(listing.createdAt).toLocaleDateString()})
                            </option>
                          ))}
                        </select>
                      </label>
                      <p className="text-xs text-slate-500">
                        {isPickerLoading
                          ? "Loading your threads/listings..."
                          : "Prefer selectors above. Manual URL/ID inputs below are advanced fallback."}
                      </p>
                      <input
                        value={threadId}
                        onChange={(e) => setThreadId(e.target.value)}
                        placeholder="Advanced: paste thread ID or full thread URL"
                        title="From your thread URL: /threads/<threadId>"
                        className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700"
                      />
                      <input
                        value={listingId}
                        onChange={(e) => setListingId(e.target.value)}
                        placeholder="Advanced: paste listing ID or full listing URL"
                        title="From your listing URL: /marketplace/<listingId>"
                        className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700"
                      />
                      <p className="text-xs text-slate-500">
                        Tip: open your thread/listing page and copy the ID at the end of the URL. Example:
                        <span className="font-mono"> /threads/&lt;id&gt; </span>
                        or
                        <span className="font-mono"> /marketplace/&lt;id&gt;</span>.
                      </p>
                      {!hasSelectedAsset ? (
                        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                          Step 1: Create or select a thread/listing first. Step 2 (entry details + submit)
                          will appear after selection.
                        </p>
                      ) : (
                        <>
                          <input
                            value={submissionTitle}
                            onChange={(e) => setSubmissionTitle(e.target.value)}
                            placeholder="Submission title"
                            title="Short title for your contest entry"
                            className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700"
                          />
                          <textarea
                            value={submissionSummary}
                            onChange={(e) => setSubmissionSummary(e.target.value)}
                            placeholder="Short summary"
                            title="Brief summary of your entry"
                            rows={3}
                            className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700"
                          />
                          {selectedContest.requireTermsAcceptance !== false ? (
                            <label className="flex items-start gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700">
                              <input
                                type="checkbox"
                                checked={acceptTerms}
                                onChange={(e) => setAcceptTerms(e.target.checked)}
                                className="mt-0.5"
                              />
                              <span>
                                I agree to the contest terms and policy for version{" "}
                                <strong>{selectedContest.termsVersion || "2026-02-21"}</strong>.
                              </span>
                            </label>
                          ) : null}
                          {submitMessage ? (
                            <p className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700">
                              {submitMessage}
                            </p>
                          ) : null}
                          <button
                            onClick={submitToContest}
                            disabled={isSubmitting}
                            className="rounded-md bg-green-700 px-3 py-2 text-sm font-medium text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {isSubmitting ? "Submitting..." : "Submit Entry"}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                    Contest submissions are closed.
                  </p>
                )}

                <div className="mt-4">
                  <p className="mb-2 text-sm font-semibold text-slate-800">Approved Leaderboard</p>
                  {submissions.length > 0 ? (
                    <div className="space-y-2">
                      {submissions.map((row) => (
                        <div
                          key={row._id}
                          className="rounded-md border border-slate-200 bg-white px-3 py-2"
                        >
                          <p className="text-sm font-medium text-slate-900">{row.title || "Untitled entry"}</p>
                          <p className="text-xs text-slate-600">{row.summary || "No summary."}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            By: {row.userId?.email || "Unknown"} • Votes: {row.voteCount || 0} • Status: {row.status}
                          </p>
                          {row.status === "winner" &&
                          String(row.userId?._id || "") === String(currentUserId || "") ? (
                            <div className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-2 py-2 text-xs text-amber-900">
                              <p className="font-semibold">You won this contest.</p>
                              <p className="mt-1">
                                Claim status: {row.prizeClaim?.status || "not_requested"}
                                {row.prizeClaim?.payoutReference
                                  ? ` • Ref: ${row.prizeClaim.payoutReference}`
                                  : ""}
                              </p>
                              {row.prizeClaim?.status !== "pending_review" &&
                              row.prizeClaim?.status !== "paid" ? (
                                <button
                                  onClick={() => requestPrizeClaim(row._id)}
                                  className="mt-2 rounded-md bg-amber-600 px-2 py-1 text-xs font-medium text-white hover:bg-amber-700"
                                >
                                  Request Prize Payout
                                </button>
                              ) : null}
                            </div>
                          ) : null}
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            {row.threadId?._id ? (
                              <Link
                                href={`/threads/${row.threadId._id}`}
                                className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
                              >
                                Open Thread
                              </Link>
                            ) : null}
                            <button
                              onClick={() => voteSubmission(row._id)}
                              disabled={votingSubmissionId === row._id}
                              className={`rounded-md border px-2 py-1 text-xs transition-all duration-200 hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60 ${
                                row.viewerHasVoted
                                  ? "border-green-700 bg-green-700 text-white"
                                  : "border-slate-300 bg-white text-slate-700"
                              } ${
                                votePulseSubmissionId === row._id ? "scale-105 shadow-md shadow-green-300/40" : ""
                              }`}
                            >
                              {votingSubmissionId === row._id
                                ? "Updating..."
                                : row.viewerHasVoted
                                  ? "Voted (Click to Unvote)"
                                  : "Vote"}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-600">No approved submissions yet.</p>
                  )}
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-600">Select a contest to view details and leaderboard.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ContestsLoading() {
  return <div className="min-h-screen bg-slate-100 p-4 text-center text-sm text-slate-600 md:p-6">Loading contests...</div>;
}

export default function Contests() {
  return (
    <Suspense fallback={<ContestsLoading />}>
      <ContestsContent />
    </Suspense>
  );
}
