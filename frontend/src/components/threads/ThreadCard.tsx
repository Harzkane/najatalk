// frontend/src/components/threads/ThreadCard.tsx
"use client";

import { FC, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "../../utils/api";
import axios from "axios";

type Reply = {
  _id: string;
  body: string;
  userId: { _id: string; email: string; flair?: string } | null;
  createdAt: string;
  parentReplyId?: string | null;
};

type Thread = {
  _id: string;
  title: string;
  body: string;
  userId: { _id: string; email: string; flair?: string } | null;
  category: string;
  createdAt: string;
  replies?: Reply[];
  likes?: string[];
  bookmarks?: string[];
  isSolved?: boolean;
  isSticky?: boolean;
  isLocked?: boolean;
};

interface ThreadCardProps {
  thread: Thread | Reply;
  formatDate: (dateString: string) => string;
  isReply?: boolean;
  originalTitle?: string;
  showReplies?: boolean;
  onReplyAdded?: () => Promise<void>;
  threadId?: string;
  allThreadReplies?: Reply[];
  depth?: number;
  threadLocked?: boolean;
  currentUserId?: string | null;
  currentUserRole?: "user" | "mod" | "admin" | null;
  onThreadUpdated?: () => Promise<void> | void;
}

const ThreadCard: FC<ThreadCardProps> = ({
  thread,
  formatDate,
  isReply = false,
  originalTitle = "",
  showReplies = true,
  onReplyAdded,
  threadId,
  allThreadReplies = [],
  depth = 0,
  threadLocked = false,
  currentUserId = null,
  currentUserRole = null,
  onThreadUpdated,
}) => {
  const [showReplyDialog, setShowReplyDialog] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyError, setReplyError] = useState("");
  const [showRepliesExpanded, setShowRepliesExpanded] = useState(true);
  const [isReporting, setIsReporting] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [isReported, setIsReported] = useState(false);
  const [isPidgin, setIsPidgin] = useState(true);
  const [showTipDialog, setShowTipDialog] = useState(false);
  const [isTipping, setIsTipping] = useState(false);
  const [hasTipped, setHasTipped] = useState(false);
  const [isLikeLoading, setIsLikeLoading] = useState(false);
  const [isBookmarkLoading, setIsBookmarkLoading] = useState(false);
  const [isSolvedLoading, setIsSolvedLoading] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [bookmarksCount, setBookmarksCount] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isSolved, setIsSolved] = useState(false);
  const [isSticky, setIsSticky] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [isStickyLoading, setIsStickyLoading] = useState(false);
  const [isLockLoading, setIsLockLoading] = useState(false);

  const router = useRouter();

  const isThread = (t: Thread | Reply): t is Thread => !isReply && "title" in t;

  const displayTitle = isThread(thread) ? thread.title : isReply ? `Re: ${originalTitle}` : "Reply";
  const threadReplies = isThread(thread) ? thread.replies || [] : allThreadReplies;
  const nestedReplies = threadReplies.filter((reply) =>
    isReply ? reply.parentReplyId === thread._id : !reply.parentReplyId
  );
  const hasReplies = nestedReplies.length > 0;
  const rootThreadId = isReply ? threadId : thread._id;
  const titleHref = isReply
    ? rootThreadId
      ? `/threads/${rootThreadId}`
      : undefined
    : `/threads/${thread._id}`;
  const isCurrentThreadLocked = isThread(thread)
    ? Boolean(thread.isLocked)
    : threadLocked;
  const canToggleSolved = Boolean(
    isThread(thread) &&
    currentUserId &&
    (thread.userId?._id === currentUserId ||
      currentUserRole === "mod" ||
      currentUserRole === "admin")
  );
  const canModerateThread = Boolean(
    !isReply && (currentUserRole === "mod" || currentUserRole === "admin")
  );
  const canReplyToThread = Boolean(
    !isCurrentThreadLocked ||
    currentUserRole === "mod" ||
    currentUserRole === "admin"
  );

  const handleReplyClick = () => {
    if (!canReplyToThread) {
      setReplyError("Thread locked—no new replies.");
      return;
    }
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    if (isReply) {
      router.push(`/threads/${rootThreadId}`);
    } else {
      setShowReplyDialog(!showReplyDialog);
    }
  };

  const handleShare = () => {
    const threadIdToShare = isReply ? rootThreadId : thread._id;
    const url = `${window.location.origin}/threads/${threadIdToShare}`;
    navigator.clipboard
      .writeText(url)
      .then(() => alert("Link copied to clipboard!"))
      .catch((err) => console.error("Could not copy text: ", err));
  };

  const handleSubmitReply = async () => {
    if (!replyText.trim()) {
      setReplyError("Reply cannot be empty");
      return;
    }
    setIsSubmitting(true);
    setReplyError("");

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }
      await api.post(
        `/threads/${rootThreadId}/replies`,
        { body: replyText, parentReplyId: isReply ? thread._id : undefined },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setReplyText("");
      setShowReplyDialog(false);
      if (onReplyAdded) await onReplyAdded();
    } catch (error) {
      console.error("Failed to submit reply:", error);
      setReplyError(
        "Failed to submit reply. Try again or continue on thread page."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const checkReportedAndTipped = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const tipPromise = api.get<{ hasTipped: boolean }>(
          `/users/hasTipped?${isReply ? "replyId" : "threadId"}=${thread._id
          }`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (!isReply) {
          const reportRes = await api.get<{ hasReported: boolean; message: string }>(
            `/threads/${thread._id}/hasReported`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setIsReported(reportRes.data.hasReported);
        } else {
          setIsReported(false);
        }

        const tipRes = await tipPromise;
        setHasTipped(tipRes.data.hasTipped);
      } catch (err) {
        console.error("Failed to check status:", err);
      }
    };
    checkReportedAndTipped();
  }, [thread._id, isReply]);

  useEffect(() => {
    if (!isThread(thread)) return;

    const likes = thread.likes || [];
    const bookmarks = thread.bookmarks || [];
    setLikesCount(likes.length);
    setBookmarksCount(bookmarks.length);
    setIsSolved(Boolean(thread.isSolved));
    setIsSticky(Boolean(thread.isSticky));
    setIsLocked(Boolean(thread.isLocked));

    if (!currentUserId) {
      setIsLiked(false);
      setIsBookmarked(false);
      return;
    }

    setIsLiked(likes.includes(currentUserId));
    setIsBookmarked(bookmarks.includes(currentUserId));
  }, [thread, currentUserId]);

  const handleLikeToggle = async () => {
    if (isReply || !isThread(thread) || isLikeLoading) return;
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    setIsLikeLoading(true);
    try {
      const res = await api.post<{ liked: boolean; likesCount: number }>(
        `/threads/${thread._id}/like`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setIsLiked(res.data.liked);
      setLikesCount(res.data.likesCount);
      if (onThreadUpdated) await onThreadUpdated();
    } catch (err) {
      console.error("Like toggle failed:", err);
      setReplyError("Like scatter o!");
    } finally {
      setIsLikeLoading(false);
    }
  };

  const handleStickyToggle = async () => {
    if (isReply || !isThread(thread) || !canModerateThread || isStickyLoading) {
      return;
    }
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    setIsStickyLoading(true);
    try {
      const res = await api.post<{ isSticky: boolean }>(
        `/threads/${thread._id}/sticky`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setIsSticky(res.data.isSticky);
      if (onThreadUpdated) await onThreadUpdated();
    } catch (err) {
      console.error("Sticky toggle failed:", err);
      setReplyError("Pin scatter o!");
    } finally {
      setIsStickyLoading(false);
    }
  };

  const handleLockToggle = async () => {
    if (isReply || !isThread(thread) || !canModerateThread || isLockLoading) {
      return;
    }
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    setIsLockLoading(true);
    try {
      const res = await api.post<{ isLocked: boolean }>(
        `/threads/${thread._id}/lock`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setIsLocked(res.data.isLocked);
      if (onThreadUpdated) await onThreadUpdated();
    } catch (err) {
      console.error("Lock toggle failed:", err);
      setReplyError("Lock scatter o!");
    } finally {
      setIsLockLoading(false);
    }
  };

  const handleBookmarkToggle = async () => {
    if (isReply || !isThread(thread) || isBookmarkLoading) return;
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    setIsBookmarkLoading(true);
    try {
      const res = await api.post<{ bookmarked: boolean; bookmarksCount: number }>(
        `/threads/${thread._id}/bookmark`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setIsBookmarked(res.data.bookmarked);
      setBookmarksCount(res.data.bookmarksCount);
      if (onThreadUpdated) await onThreadUpdated();
    } catch (err) {
      console.error("Bookmark toggle failed:", err);
      setReplyError("Bookmark scatter o!");
    } finally {
      setIsBookmarkLoading(false);
    }
  };

  const handleSolvedToggle = async () => {
    if (!isThread(thread) || !canToggleSolved || isSolvedLoading) return;
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    setIsSolvedLoading(true);
    try {
      const res = await api.post<{ isSolved: boolean }>(
        `/threads/${thread._id}/solved`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setIsSolved(res.data.isSolved);
      if (onThreadUpdated) await onThreadUpdated();
    } catch (err) {
      console.error("Solved toggle failed:", err);
      setReplyError("Solve update scatter o!");
    } finally {
      setIsSolvedLoading(false);
    }
  };

  const handleReport = async () => {
    if (isReply) return;
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    setIsReporting(true);
  };

  const submitReport = async () => {
    if (!reportReason.trim()) {
      setReplyError("Abeg, give reason!");
      return;
    }
    setIsSubmitting(true);
    setReplyError("");

    try {
      const token = localStorage.getItem("token");
      await api.post(
        `/threads/${thread._id}/report`,
        { reason: reportReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setReportReason("");
      setIsReporting(false);
      setIsReported(true);
    } catch (err) {
      console.error("Report failed:", err);
      setReplyError("Report scatter o!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTip = async (amount: number) => {
    setIsTipping(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }
      const res = await api.post(
        "/users/tip",
        { receiverId: thread.userId?._id, amount },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      window.location.href = res.data.paymentLink;
    } catch (err) {
      console.error("Tip Error:", err);
      setReplyError("Tip scatter o!");
      setIsTipping(false);
    }
  };

  return (
    <div
      className={`bg-white border border-slate-200 rounded-xl shadow-sm mb-3 overflow-hidden ${depth > 0 ? "ml-4 md:ml-8 border-l-4 border-l-emerald-500" : ""
        }`}
    >
      <div className="bg-slate-50 border-b border-slate-100 p-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={titleHref || "#"}
              onClick={(e) => {
                if (!titleHref) e.preventDefault();
              }}
              className={`${isReply ? "text-slate-700" : "text-slate-900"
                } font-bold text-lg hover:text-emerald-700 transition-colors`}
            >
              {displayTitle}
            </Link>
            {!isReply && isSolved && (
              <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-tighter text-emerald-700">
                Solved
              </span>
            )}
            {!isReply && isSticky && (
              <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-tighter text-amber-700">
                Pinned
              </span>
            )}
            {!isReply && isLocked && (
              <span className="inline-flex items-center rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-black uppercase tracking-tighter text-slate-700">
                Locked
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-slate-900 flex items-center justify-center text-[10px] text-white font-bold">
                {(thread.userId?.email || "U").charAt(0).toUpperCase()}
              </div>
              <span className="text-xs text-slate-500 font-medium">
                {thread.userId?.email || "Unknown Oga"}
                {thread.userId?.flair && (
                  <span className={`ml-1.5 px-1 rounded text-[9px] font-black text-white uppercase ${thread.userId.flair === "Oga at the Top" ? "bg-amber-500" : "bg-emerald-600"}`}>
                    {thread.userId.flair}
                  </span>
                )}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              {formatDate(thread.createdAt)}
            </span>
          </div>
        </div>
      </div>

      <div className="p-4 text-sm text-slate-800 leading-relaxed font-medium">
        <p className="whitespace-pre-wrap">{thread.body}</p>

        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-4 text-xs">
          <button
            onClick={handleReplyClick}
            className={`flex items-center gap-1.5 font-bold uppercase tracking-wider transition-colors ${canReplyToThread ? "text-slate-600 hover:text-emerald-700" : "text-slate-300 cursor-not-allowed"
              }`}
            disabled={!canReplyToThread}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
            {isPidgin ? "Reply" : "Reply"}
          </button>

          {!isReply && (
            <button
              className={`flex items-center gap-1.5 font-bold uppercase tracking-wider transition-colors ${isLiked ? "text-emerald-700" : "text-slate-600 hover:text-emerald-700"
                }`}
              onClick={handleLikeToggle}
              disabled={isLikeLoading}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill={isLiked ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.704a2 2 0 011.94 2.415l-1.61 6.44A2 2 0 0117.095 21H7a2 2 0 01-2-2V9a2 2 0 01.586-1.414l7-7 1.414 1.414a1 1 0 01.293.707V10z" />
              </svg>
              Like {likesCount > 0 ? `(${likesCount})` : ""}
            </button>
          )}

          {!isReply && (
            <button
              className={`flex items-center gap-1.5 font-bold uppercase tracking-wider transition-colors ${isBookmarked ? "text-blue-700" : "text-slate-600 hover:text-blue-700"
                }`}
              onClick={handleBookmarkToggle}
              disabled={isBookmarkLoading}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill={isBookmarked ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              Save {bookmarksCount > 0 ? `(${bookmarksCount})` : ""}
            </button>
          )}

          {!isReply && canToggleSolved && (
            <button
              className={`flex items-center gap-1.5 font-bold uppercase tracking-wider transition-colors ${isSolved ? "text-emerald-600" : "text-slate-600 hover:text-emerald-600"
                }`}
              onClick={handleSolvedToggle}
              disabled={isSolvedLoading}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {isSolved ? "Unmark Solved" : "Mark Solved"}
            </button>
          )}

          <div className="relative">
            <button
              className={`flex items-center gap-1.5 font-bold uppercase tracking-wider transition-colors ${hasTipped ? "text-slate-300 cursor-not-allowed" : "text-slate-600 hover:text-amber-600"
                }`}
              onClick={() => !hasTipped && setShowTipDialog(!showTipDialog)}
              disabled={hasTipped}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {isPidgin ? "Tip" : "Tip"}
            </button>
            {showTipDialog && !hasTipped && (
              <div className="absolute top-8 left-0 bg-white border border-slate-200 rounded-lg shadow-xl p-2 z-20 w-32 animate-in fade-in slide-in-from-top-2">
                <p className="text-[9px] font-black uppercase text-slate-400 mb-2 px-1">Select Amount</p>
                {[50, 100, 200, 500].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => handleTip(amt)}
                    disabled={isTipping}
                    className="block w-full text-left px-3 py-2 text-xs font-bold text-slate-700 hover:bg-emerald-50 rounded transition-colors disabled:opacity-50"
                  >
                    ₦{amt}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            className="text-slate-600 hover:text-indigo-600 flex items-center gap-1.5 font-bold uppercase tracking-wider transition-colors"
            onClick={handleShare}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Share
          </button>

          {!isReply && (
            <button
              onClick={handleReport}
              className={`flex items-center gap-1.5 font-bold uppercase tracking-wider transition-colors ${isReported ? "text-red-300 cursor-not-allowed" : "text-slate-600 hover:text-red-600"
                }`}
              disabled={isReported}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
              </svg>
              {isReported ? "Reported" : "Report"}
            </button>
          )}

          {canModerateThread && (
            <button
              className={`flex items-center gap-1.5 font-bold uppercase tracking-wider transition-colors ${isSticky ? "text-amber-600" : "text-slate-600 hover:text-amber-600"
                }`}
              onClick={handleStickyToggle}
              disabled={isStickyLoading}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.414a4 4 0 00-5.656-5.656l-6.415 6.414a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              {isSticky ? "Unpin" : "Pin"}
            </button>
          )}

          {canModerateThread && (
            <button
              className={`flex items-center gap-1.5 font-bold uppercase tracking-wider transition-colors ${isLocked ? "text-slate-400" : "text-slate-600 hover:text-slate-900"
                }`}
              onClick={handleLockToggle}
              disabled={isLockLoading}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              {isLocked ? "Unlock" : "Lock"}
            </button>
          )}

          <button
            onClick={() => setIsPidgin(!isPidgin)}
            className="ml-auto flex items-center gap-1 px-2 py-1 rounded bg-slate-100 text-[10px] font-black uppercase text-slate-500 hover:bg-slate-200 transition-colors"
          >
            {isPidgin ? "Use English" : "Use Pidgin"}
          </button>
        </div>

        {isReporting && (
          <div className="mt-4 p-4 rounded-lg bg-red-50 border border-red-100 animate-in fade-in slide-in-from-top-2">
            <label className="block text-[10px] font-black uppercase text-red-800 mb-2">Why you dey report this gist?</label>
            <textarea
              className="w-full p-3 border border-red-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-600 bg-white"
              placeholder="Tell us wetin happen..."
              rows={3}
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
            />
            {replyError && <p className="text-red-600 text-[10px] font-bold mt-1 uppercase">{replyError}</p>}
            <div className="flex justify-end gap-2 mt-3">
              <button
                className="px-4 py-2 text-[10px] font-black uppercase text-slate-500 hover:text-slate-800"
                onClick={() => { setIsReporting(false); setReportReason(""); setReplyError(""); }}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-[10px] font-black uppercase hover:bg-red-700 shadow-sm"
                onClick={submitReport}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Sending..." : "Send Report"}
              </button>
            </div>
          </div>
        )}

        {showReplyDialog && (
          <div className="mt-4 p-4 rounded-lg bg-emerald-50 border border-emerald-100 animate-in fade-in slide-in-from-top-2">
            <label className="block text-[10px] font-black uppercase text-emerald-800 mb-2">Drop your reply</label>
            <textarea
              className="w-full p-3 border border-emerald-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
              placeholder="Wetin you get to talk?"
              rows={3}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
            />
            {replyError && <p className="text-red-600 text-[10px] font-bold mt-1 uppercase">{replyError}</p>}
            <div className="flex justify-end gap-2 mt-3">
              <button
                className="px-4 py-2 text-[10px] font-black uppercase text-slate-500 hover:text-slate-800"
                onClick={() => { setShowReplyDialog(false); setReplyError(""); }}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-[10px] font-black uppercase hover:bg-emerald-700 shadow-sm"
                onClick={handleSubmitReply}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Posting..." : "Post Reply"}
              </button>
            </div>
          </div>
        )}
      </div>

      {showReplies && showRepliesExpanded && hasReplies && (
        <div className="bg-slate-50/50 p-4 space-y-3 border-t border-slate-100">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-2">Conversation</p>
          {nestedReplies.map((reply) => (
            <ThreadCard
              key={reply._id}
              thread={reply}
              formatDate={formatDate}
              isReply={true}
              originalTitle={isThread(thread) ? thread.title : originalTitle}
              showReplies={true}
              onReplyAdded={onReplyAdded}
              threadId={rootThreadId}
              allThreadReplies={threadReplies}
              depth={depth + 1}
              threadLocked={isCurrentThreadLocked}
              currentUserId={currentUserId}
              currentUserRole={currentUserRole}
              onThreadUpdated={onThreadUpdated}
            />
          ))}
        </div>
      )}

      {!isReply && showReplies && hasReplies && !showRepliesExpanded && (
        <div className="bg-slate-50 p-3 flex justify-center border-t border-slate-100">
          <button
            onClick={() => setShowRepliesExpanded(true)}
            className="text-[10px] font-black uppercase text-emerald-700 hover:underline"
          >
            View {threadReplies.length} {threadReplies.length === 1 ? "reply" : "replies"}
          </button>
        </div>
      )}
    </div>
  );
};

export default ThreadCard;
