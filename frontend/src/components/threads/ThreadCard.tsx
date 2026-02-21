// // frontend/src/components/threads/ThreadCard.tsx
"use client";

import { FC, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/utils/api";

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
  const [showTipModal, setShowTipModal] = useState(false); // Changed from showTipDialog
  const [isTipping, setIsTipping] = useState(false);
  const [tipAmount, setTipAmount] = useState<number | null>(null);
  const [hasTipped, setHasTipped] = useState(false); // Added for cooldown
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

  const displayTitle = isReply
    ? `Re: ${originalTitle}`
    : isThread(thread)
      ? thread.title
      : "Reply";
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
    // if (isReply) {
    //   router.push(`/threads/${thread._id}`);
    // } else {
    //   setShowReplyDialog(!showReplyDialog);
    // }
    setShowReplyDialog(!showReplyDialog); // No redirect for replies
  };

  const handleShare = () => {
    const url = `${window.location.origin}/threads/${thread._id}`;
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
      const payload = {
        body: replyText,
        ...(isReply ? { parentReplyId: thread._id } : {}),
      };

      const targetId = isReply ? threadId : thread._id;
      if (!targetId) {
        console.error("threadId is undefined!", { isReply, threadId, thread });
        setReplyError("Thread ID missing—contact support!");
        setIsSubmitting(false);
        return;
      }

      console.log(
        "Posting reply:",
        `/threads/${targetId}/replies`,
        payload
      );

      await api.post(`/threads/${targetId}/replies`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReplyText("");
      setShowReplyDialog(false);
      if (onReplyAdded) await onReplyAdded();
    } catch (error) {
      console.error("Failed to submit reply:", error);
      setReplyError("Failed to submit reply. Try again!");
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
        console.error("Failed to check report/tip status:", err);
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

  const handleTip = async () => {
    if (!tipAmount) return;
    setIsTipping(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }
      const payload = {
        receiverId: thread.userId?._id,
        amount: tipAmount,
        [isReply ? "replyId" : "threadId"]: thread._id, // Pass threadId or replyId
      };
      const res = await api.post("/users/tip", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Tip Response:", res.data);
      window.location.href = res.data.paymentLink;
    } catch (err: any) {
      console.error("Tip Error:", err);
      if (err.isAxiosError && err.response?.data?.message) {
        setReplyError(err.response.data.message); // Show "You no fit tip yourself, bros!"
      } else {
        setReplyError("Tip scatter o!");
      }
      setIsTipping(false);
    }
  };

  return (
    <div
      className={`bg-white border border-gray-200 rounded-lg shadow-sm mb-2 ${depth > 0 ? "ml-4 border-l-4 border-l-slate-200" : ""
        }`}
    >
      <div className="p-3 bg-gray-200 pb-2">
        <div className="flex flex-wrap items-baseline gap-x-1 justify-between">
          <Link
            href={titleHref || "#"}
            onClick={(e) => {
              if (!titleHref) e.preventDefault();
            }}
            className={`${isReply ? "text-blue-900" : "text-green-800"
              } font-bold text-base hover:underline`}
          >
            {displayTitle}
          </Link>
          {!isReply && isSolved && (
            <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
              Solved
            </span>
          )}
          {!isReply && isSticky && (
            <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
              Pinned
            </span>
          )}
          {!isReply && isLocked && (
            <span className="inline-flex items-center rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
              Locked
            </span>
          )}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600">
              by{" "}
              <span className="font-medium">
                {thread.userId?.email || "Unknown Oga"}
              </span>
              {thread.userId?.flair && (
                <span
                  className={`ml-1 inline-block text-white px-1 rounded text-xs ${thread.userId.flair === "Oga at the Top"
                      ? "bg-yellow-500"
                      : "bg-green-500"
                    }`}
                >
                  {thread.userId.flair}
                </span>
              )}
              : {formatDate(thread.createdAt)}{" "}
              {!isReply && isThread(thread) && `• ${thread.category}`}
            </span>
            {!isReply && hasReplies && (
              <button
                onClick={() => setShowRepliesExpanded(!showRepliesExpanded)}
                className="text-blue-600 hover:text-blue-800"
                title={showRepliesExpanded ? "Hide replies" : "Show replies"}
              >
                <span
                  className="material-icons-outlined"
                  style={{ fontSize: "16px" }}
                >
                  {showRepliesExpanded ? "expand_less" : "chat"}
                </span>
                <span className="text-xs ml-1">{threadReplies.length}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="px-3 py-2 text-sm bg-gray-50 text-gray-800">
        <p>{thread.body}</p>

        <div className="mt-2 pt-1 border-t border-gray-200 flex gap-1 text-xs text-gray-500">
          <button
            onClick={handleReplyClick}
            className={`flex items-center gap-1 text-xs ${canReplyToThread ? "hover:text-blue-600" : "text-gray-400"
              }`}
            disabled={!canReplyToThread}
          >
            <span
              className="material-icons-outlined"
              style={{ fontSize: "12px" }}
            >
              reply
            </span>
            <span className="text-xs">{isPidgin ? "Reply" : "Answer"}</span>
          </button>

          {canModerateThread && (
            <button
              className={`flex items-center gap-1 text-xs ${isSticky ? "text-amber-600" : "hover:text-amber-600"
                }`}
              onClick={handleStickyToggle}
              disabled={isStickyLoading}
            >
              <span
                className="material-icons-outlined"
                style={{ fontSize: "12px" }}
              >
                push_pin
              </span>
              <span className="text-xs">{isSticky ? "Unpin" : "Pin"}</span>
            </button>
          )}

          {canModerateThread && (
            <button
              className={`flex items-center gap-1 text-xs ${isLocked ? "text-slate-600" : "hover:text-slate-700"
                }`}
              onClick={handleLockToggle}
              disabled={isLockLoading}
            >
              <span
                className="material-icons-outlined"
                style={{ fontSize: "12px" }}
              >
                lock
              </span>
              <span className="text-xs">{isLocked ? "Unlock" : "Lock"}</span>
            </button>
          )}

          <button
            onClick={handleReport}
            className={`flex items-center gap-1 text-xs ${isReply
                ? "text-gray-300 cursor-not-allowed"
                : isReported
                  ? "text-gray-400"
                  : "hover:text-red-600"
              }`}
            disabled={isReported || isReply}
            title={isReply ? "Reply reporting not enabled yet" : "Report"}
          >
            <span
              className="material-icons-outlined"
              style={{ fontSize: "12px" }}
            >
              flag
            </span>
            <span className="text-xs">
              {isReported ? "Reported" : "Report"}
            </span>
          </button>

          <button
            className={`flex items-center gap-1 text-xs ${isLiked ? "text-green-600" : "hover:text-green-600"
              }`}
            onClick={handleLikeToggle}
            disabled={isReply || isLikeLoading}
          >
            <span
              className="material-icons-outlined"
              style={{ fontSize: "12px" }}
            >
              thumb_up
            </span>
            <span className="text-xs">Like {likesCount > 0 ? `(${likesCount})` : ""}</span>
          </button>

          {!isReply && (
            <button
              className={`flex items-center gap-1 text-xs ${isBookmarked ? "text-blue-600" : "hover:text-blue-600"
                }`}
              onClick={handleBookmarkToggle}
              disabled={isBookmarkLoading}
            >
              <span
                className="material-icons-outlined"
                style={{ fontSize: "12px" }}
              >
                bookmark
              </span>
              <span className="text-xs">
                Save {bookmarksCount > 0 ? `(${bookmarksCount})` : ""}
              </span>
            </button>
          )}

          {!isReply && canToggleSolved && (
            <button
              className={`flex items-center gap-1 text-xs ${isSolved ? "text-emerald-600" : "hover:text-emerald-600"
                }`}
              onClick={handleSolvedToggle}
              disabled={isSolvedLoading}
            >
              <span
                className="material-icons-outlined"
                style={{ fontSize: "12px" }}
              >
                task_alt
              </span>
              <span className="text-xs">{isSolved ? "Solved" : "Mark solved"}</span>
            </button>
          )}

          <button
            className={`flex items-center gap-1 text-xs ${hasTipped ? "text-gray-400" : "hover:text-yellow-600"
              }`}
            onClick={() => !hasTipped && setShowTipModal(true)}
            disabled={hasTipped}
          >
            <span
              className="material-icons-outlined"
              style={{ fontSize: "12px" }}
            >
              monetization_on
            </span>
            <span className="text-xs">
              {hasTipped ? "Tipped today" : isPidgin ? "Tip" : "Dash"}
            </span>
          </button>

          <button
            className="hover:text-purple-600 flex items-center gap-1 text-xs"
            onClick={handleShare}
          >
            <span
              className="material-icons-outlined"
              style={{ fontSize: "12px" }}
            >
              share
            </span>
            <span className="text-xs">Share</span>
          </button>

          <button
            onClick={() => setIsPidgin(!isPidgin)}
            className="hover:text-green-600 flex items-center gap-1 text-xs ml-auto"
          >
            <span className="text-xs">{isPidgin ? "English" : "Pidgin"}</span>
          </button>
        </div>

        {isReporting && !isReply && (
          <div className="mt-3 border-t border-gray-200 pt-3">
            <textarea
              className="w-full p-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-600 text-gray-800"
              placeholder="Why you dey report this gist?"
              rows={3}
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
            />
            {replyError && (
              <p className="text-red-500 text-xs mt-1">{replyError}</p>
            )}
            <div className="flex justify-end gap-2 mt-2">
              <button
                className="px-3 py-1 bg-gray-200 rounded-md text-xs hover:bg-gray-300"
                onClick={() => {
                  setIsReporting(false);
                  setReportReason("");
                  setReplyError("");
                }}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                className="px-3 py-1 bg-red-600 text-white rounded-md text-xs hover:bg-red-700"
                onClick={submitReport}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Reporting..." : "Send Report"}
              </button>
            </div>
          </div>
        )}

        {/* {showReplyDialog && !isReply && ( */}
        {showReplyDialog && (
          <div className="mt-3 border-t border-gray-200 pt-3">
            <textarea
              className="w-full p-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-600 text-gray-800"
              placeholder="Drop your reply..."
              rows={3}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
            />
            {replyError && (
              <p className="text-red-500 text-xs mt-1">{replyError}</p>
            )}
            <div className="flex justify-end gap-2 mt-2">
              <button
                className="px-3 py-1 bg-gray-200 rounded-md text-xs hover:bg-gray-300"
                onClick={() => {
                  setShowReplyDialog(false);
                  setReplyError("");
                }}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                className="px-3 py-1 bg-blue-600 text-white rounded-md text-xs hover:bg-blue-700"
                onClick={() => router.push(`/threads/${thread._id}`)}
                disabled={isSubmitting}
              >
                Continue on Thread Page
              </button>
              <button
                className="px-3 py-1 bg-green-600 text-white rounded-md text-xs hover:bg-green-700"
                onClick={handleSubmitReply}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Posting..." : "Post Reply"}
              </button>
            </div>
          </div>
        )}

        {showTipModal && ( // Removed !isReply condition
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-80 md:w-96">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-green-800">Tip this Gist</h3>
                <button
                  onClick={() => {
                    setShowTipModal(false);
                    setTipAmount(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <span className="material-icons-outlined">close</span>
                </button>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                How much you wan tip {thread.userId?.email || "this oga"}?
              </p>
              <div className="flex gap-2 mb-4">
                {[50, 100, 200].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setTipAmount(amt)}
                    className={`px-3 py-1 rounded-md text-sm ${tipAmount === amt
                        ? "bg-green-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                  >
                    ₦{amt}
                  </button>
                ))}
              </div>
              {replyError && (
                <p className="text-red-500 text-xs mb-2">{replyError}</p>
              )}
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setShowTipModal(false);
                    setTipAmount(null);
                  }}
                  className="px-3 py-1 bg-gray-200 rounded-md text-xs hover:bg-gray-300"
                  disabled={isTipping}
                >
                  Cancel
                </button>
                <button
                  onClick={handleTip}
                  className="px-3 py-1 bg-green-600 text-white rounded-md text-xs hover:bg-green-700 flex items-center gap-1"
                  disabled={isTipping || !tipAmount}
                >
                  {isTipping ? (
                    <>
                      <span
                        className="material-icons-outlined animate-spin"
                        style={{ fontSize: "12px" }}
                      >
                        refresh
                      </span>
                      Processing...
                    </>
                  ) : (
                    "Confirm Tip"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {showReplies && showRepliesExpanded && hasReplies && (
        <div className="mx-3 mt-2 space-y-2 border-t border-gray-100 py-3">
          {nestedReplies.map((reply) => (
            <ThreadCard
              key={reply._id}
              thread={reply}
              formatDate={formatDate}
              isReply={true}
              originalTitle={originalTitle || displayTitle}
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
        <div className="flex justify-end px-3 py-2 text-xs border-t border-gray-100">
          <Link
            href={`/threads/${thread._id}`}
            className="text-blue-600 hover:underline"
          >
            {threadReplies.length}{" "}
            {threadReplies.length === 1 ? "Reply" : "Replies"} - View
            discussion →
          </Link>
        </div>
      )}
    </div>
  );
};

export default ThreadCard;
