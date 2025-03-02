// frontend/src/components/threads/ThreadCard.tsx
"use client";

import { FC, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";

type Reply = {
  _id: string;
  body: string;
  userId: { _id: string; email: string; flair?: string } | null; // Add flair
  createdAt: string;
};

type Thread = {
  _id: string;
  title: string;
  body: string;
  userId: { _id: string; email: string; flair?: string } | null; // Add flair
  category: string;
  createdAt: string;
  replies?: Reply[];
};

interface ThreadCardProps {
  thread: Thread | Reply;
  formatDate: (dateString: string) => string;
  isReply?: boolean;
  originalTitle?: string;
  showReplies?: boolean;
  onReplyAdded?: () => Promise<void>;
}

const ThreadCard: FC<ThreadCardProps> = ({
  thread,
  formatDate,
  isReply = false,
  originalTitle = "",
  showReplies = true,
  onReplyAdded,
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

  const router = useRouter();

  const isThread = (t: Thread | Reply): t is Thread => !isReply && "title" in t;

  const displayTitle = isReply
    ? `Re: ${originalTitle}`
    : isThread(thread)
    ? thread.title
    : "Reply";
  const hasReplies =
    isThread(thread) && thread.replies && thread.replies.length > 0;

  const handleReplyClick = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    if (isReply) {
      router.push(`/threads/${thread._id}`);
    } else {
      setShowReplyDialog(!showReplyDialog);
    }
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
      await axios.post(
        `/api/threads/${thread._id}/replies`,
        { body: replyText },
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
    const checkReported = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const res = await axios.get<{ hasReported: boolean; message: string }>(
          `/api/threads/${thread._id}/hasReported`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setIsReported(res.data.hasReported);
      } catch (err) {
        console.error("Failed to check report status:", err);
      }
    };
    checkReported();
  }, [thread._id]);

  const handleReport = async () => {
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
      await axios.post(
        `/api/threads/${thread._id}/report`,
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
      const res = await axios.post(
        "/api/premium/tip",
        { recipientId: thread.userId?._id, amount },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log("Tip Response:", res.data);
      window.location.href = res.data.paymentLink;
    } catch (err) {
      console.error("Tip Error:", err);
      setReplyError("Tip scatter o!");
      setIsTipping(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-2">
      <div className="p-3 bg-gray-200 pb-2">
        <div className="flex flex-wrap items-baseline gap-x-1 justify-between">
          <Link
            href={isReply ? "#" : `/threads/${thread._id}`}
            className={`${
              isReply ? "text-blue-900" : "text-green-800"
            } font-bold text-base hover:underline`}
          >
            {displayTitle}
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600">
              by{" "}
              <span className="font-medium">
                {thread.userId?.email || "Unknown Oga"}
              </span>
              {thread.userId?.flair && (
                <span
                  className={`ml-1 inline-block text-white px-1 rounded text-xs ${
                    thread.userId.flair === "Oga at the Top"
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
                <span className="text-xs ml-1">{thread.replies?.length}</span>
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
            className="hover:text-blue-600 flex items-center gap-1 text-xs"
          >
            <span
              className="material-icons-outlined"
              style={{ fontSize: "12px" }}
            >
              reply
            </span>
            <span className="text-xs">{isPidgin ? "Reply" : "Answer"}</span>
          </button>

          <button
            onClick={handleReport}
            className={`flex items-center gap-1 text-xs ${
              isReported ? "text-gray-400" : "hover:text-red-600"
            }`}
            disabled={isReported}
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
            className="hover:text-green-600 flex items-center gap-1 text-xs"
            onClick={() => alert("Like feature coming soon!")}
          >
            <span
              className="material-icons-outlined"
              style={{ fontSize: "12px" }}
            >
              thumb_up
            </span>
            <span className="text-xs">Like</span>
          </button>

          <div
            className="hover:text-yellow-600 flex items-center gap-1 text-xs relative cursor-pointer"
            onClick={() => setShowTipDialog(!showTipDialog)}
          >
            <span
              className="material-icons-outlined"
              style={{ fontSize: "12px" }}
            >
              monetization_on
            </span>
            <span className="text-xs">{isPidgin ? "Tip" : "Dash"}</span>
            {showTipDialog && (
              <div className="absolute top-6 left-0 bg-white border border-gray-200 rounded shadow-md p-2 z-10">
                {[50, 100, 200].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => handleTip(amt)}
                    disabled={isTipping}
                    className="block w-full text-left px-2 py-1 text-sm text-gray-700 hover:bg-green-100 disabled:text-gray-400"
                  >
                    ₦{amt}
                  </button>
                ))}
              </div>
            )}
          </div>

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

        {showReplyDialog && !isReply && (
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
      </div>

      {!isReply && showRepliesExpanded && hasReplies && (
        <div className="mx-3 mt-2 space-y-2 border-t border-gray-100 py-3">
          {isThread(thread) &&
            thread.replies!.map((reply) => (
              <ThreadCard
                key={reply._id}
                thread={reply}
                formatDate={formatDate}
                isReply={true}
                originalTitle={thread.title}
                showReplies={false}
                onReplyAdded={onReplyAdded}
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
            {thread.replies?.length}{" "}
            {thread.replies?.length === 1 ? "Reply" : "Replies"} - View
            discussion →
          </Link>
        </div>
      )}
    </div>
  );
};

export default ThreadCard;
