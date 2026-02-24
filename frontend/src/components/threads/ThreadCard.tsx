// // frontend/src/components/threads/ThreadCard.tsx
"use client";

import { FC, useState, useEffect, useCallback, useMemo, useRef } from "react";
import { isAxiosError } from "axios";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/utils/api";
import RichTextEditor from "./RichTextEditor";
import {
  normalizeContentForRender,
  richHtmlToPlainText,
  sanitizeRichHtml,
} from "./richText";

type Reply = {
  _id: string;
  body: string;
  userId: { _id: string; email: string; flair?: string } | null;
  createdAt: string;
  parentReplyId?: string | null;
  likes?: string[];
};

type Thread = {
  _id: string;
  title: string;
  body: string;
  userId: { _id: string; email: string; flair?: string } | null;
  category: string;
  createdAt: string;
  updatedAt?: string;
  replies?: Reply[];
  replyCount?: number;
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
  showRepliesExpanded?: boolean;
  onToggleRepliesExpanded?: () => void;
  onReplyAdded?: () => Promise<void>;
  threadId?: string;
  allThreadReplies?: Reply[];
  depth?: number;
  threadLocked?: boolean;
  currentUserId?: string | null;
  currentUserRole?: "user" | "mod" | "admin" | "super_admin" | null;
  onThreadUpdated?: () => Promise<void> | void;
  replyingToEmail?: string | null;
  focusReplyId?: string | null;
  focusReplyPathIds?: ReadonlySet<string>;
  isLastSibling?: boolean;
  activeReplyComposerId?: string | null;
  onSetActiveReplyComposerId?: (id: string | null) => void;
  activeReportFormId?: string | null;
  onSetActiveReportFormId?: (id: string | null) => void;
}

const MAX_VISUAL_REPLY_DEPTH = 2;
const REPLIES_PAGE_SIZE = 10;

const emailToHandle = (email?: string | null) => {
  if (!email) return "unknown";
  const handle = email.split("@")[0]?.trim();
  return handle || "unknown";
};

const ThreadCard: FC<ThreadCardProps> = ({
  thread,
  formatDate,
  isReply = false,
  originalTitle = "",
  showReplies = true,
  showRepliesExpanded: controlledShowRepliesExpanded,
  onToggleRepliesExpanded,
  onReplyAdded,
  threadId,
  allThreadReplies = [],
  depth = 0,
  threadLocked = false,
  currentUserId = null,
  currentUserRole = null,
  onThreadUpdated,
  replyingToEmail = null,
  focusReplyId = null,
  focusReplyPathIds,
  isLastSibling = false,
  activeReplyComposerId = null,
  onSetActiveReplyComposerId,
  activeReportFormId = null,
  onSetActiveReportFormId,
}) => {
  const [localShowReplyDialog, setLocalShowReplyDialog] = useState(false);
  const [replyHtml, setReplyHtml] = useState("<p></p>");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyError, setReplyError] = useState("");
  const [localShowRepliesExpanded, setLocalShowRepliesExpanded] = useState(false);
  const [visibleRepliesCount, setVisibleRepliesCount] =
    useState(REPLIES_PAGE_SIZE);
  const [localIsReporting, setLocalIsReporting] = useState(false);
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
  const cardRef = useRef<HTMLDivElement | null>(null);

  const router = useRouter();

  const isThread = useCallback(
    (t: Thread | Reply): t is Thread => !isReply && "title" in t,
    [isReply],
  );

  const displayTitle = isReply
    ? `Re: ${originalTitle}`
    : isThread(thread)
      ? thread.title
      : "Reply";
  const threadReplies = isThread(thread)
    ? thread.replies || []
    : allThreadReplies;
  const repliesCount = isThread(thread)
    ? typeof thread.replyCount === "number"
      ? thread.replyCount
      : threadReplies.length
    : threadReplies.filter((reply) => reply.parentReplyId === thread._id)
        .length;
  const nestedReplies = threadReplies.filter((reply) =>
    isReply ? reply.parentReplyId === thread._id : !reply.parentReplyId,
  );
  const visibleNestedReplies = nestedReplies.slice(0, visibleRepliesCount);
  const hasMoreNestedReplies = nestedReplies.length > visibleRepliesCount;
  const hiddenRepliesCount = Math.max(
    nestedReplies.length - visibleRepliesCount,
    0,
  );
  const hasReplies = repliesCount > 0;
  const visualDepth = Math.min(depth, MAX_VISUAL_REPLY_DEPTH);
  const isCompactNode = depth >= 2;
  const depthClass =
    visualDepth === 0 ? "" : visualDepth === 1 ? "ml-1" : "ml-2";
  const isFlattenedReply = isReply && depth > MAX_VISUAL_REPLY_DEPTH;
  const replyingToHandle = emailToHandle(replyingToEmail);
  const replyAuthorHandle = emailToHandle(thread.userId?.email || null);
  const replyAuthorInitial = replyAuthorHandle.slice(0, 1).toUpperCase();
  const replyBgToneClass = (() => {
    if (!isReply) return "bg-white";
    if (depth === 1) return "bg-green-50/40";
    if (depth % 2 === 0) return "bg-white";
    return "bg-green-100/40";
  })();
  const railToneClass =
    depth <= 1
      ? "border-slate-500"
      : depth === 2
        ? "border-slate-400"
        : "border-slate-300";
  const rootThreadId = isReply ? threadId : thread._id;
  const computedFocusPathIds = useMemo(() => {
    if (!focusReplyId || !threadReplies.length) return new Set<string>();
    const parentByReplyId = new Map<string, string | null>();
    for (const reply of threadReplies) {
      parentByReplyId.set(reply._id, reply.parentReplyId || null);
    }
    if (!parentByReplyId.has(focusReplyId)) return new Set<string>();
    const pathIds = new Set<string>();
    let cursor: string | null = focusReplyId;
    while (cursor) {
      pathIds.add(cursor);
      cursor = parentByReplyId.get(cursor) || null;
    }
    return pathIds;
  }, [focusReplyId, threadReplies]);
  const resolvedFocusPathIds = focusReplyPathIds || computedFocusPathIds;
  const isFocusedReply =
    isReply && Boolean(focusReplyId && thread._id === focusReplyId);
  const isFocusBranch = isReply
    ? resolvedFocusPathIds.has(thread._id)
    : Boolean(focusReplyId && resolvedFocusPathIds.size > 0);
  const containerClass = isReply
    ? `relative mb-1 rounded-md ${replyBgToneClass}`
    : "mb-2 rounded-lg border border-gray-200 bg-white shadow-sm";
  const isReplyComposerControlled =
    typeof onSetActiveReplyComposerId === "function";
  const showReplyDialog = isReplyComposerControlled
    ? activeReplyComposerId === thread._id
    : localShowReplyDialog;
  const isReportFormControlled = typeof onSetActiveReportFormId === "function";
  const isReporting = isReportFormControlled
    ? activeReportFormId === thread._id
    : localIsReporting;
  const repliesExpanded =
    typeof controlledShowRepliesExpanded === "boolean"
      ? controlledShowRepliesExpanded
      : localShowRepliesExpanded;
  const shouldNudgeRepliesTrigger = hasReplies && !repliesExpanded;
  const toggleRepliesExpanded = () => {
    if (onToggleRepliesExpanded) {
      onToggleRepliesExpanded();
      return;
    }
    setLocalShowRepliesExpanded((prev) => !prev);
  };
  const titleHref = isReply
    ? rootThreadId
      ? `/threads/${rootThreadId}`
      : undefined
    : `/threads/${thread._id}`;
  const isCurrentThreadLocked = isThread(thread)
    ? Boolean(thread.isLocked)
    : threadLocked;
  const isAdminLike =
    currentUserRole === "admin" || currentUserRole === "super_admin";
  const canToggleSolved = Boolean(
    isThread(thread) &&
    currentUserId &&
    (thread.userId?._id === currentUserId ||
      currentUserRole === "mod" ||
      isAdminLike),
  );
  const canModerateThread = Boolean(
    !isReply && (currentUserRole === "mod" || isAdminLike),
  );
  const canReplyToThread = Boolean(
    !isCurrentThreadLocked || currentUserRole === "mod" || isAdminLike,
  );
  const threadUpdatedAt = isThread(thread) ? thread.updatedAt : undefined;
  const showUpdatedAt = (() => {
    if (!threadUpdatedAt) return false;
    const createdAtMs = new Date(thread.createdAt).getTime();
    const updatedAtMs = new Date(threadUpdatedAt).getTime();
    if (Number.isNaN(createdAtMs) || Number.isNaN(updatedAtMs)) return false;
    return updatedAtMs > createdAtMs + 1000;
  })();
  const setReplyComposerOpen = useCallback(
    (nextOpen: boolean) => {
      if (isReplyComposerControlled) {
        onSetActiveReplyComposerId?.(nextOpen ? thread._id : null);
        return;
      }
      setLocalShowReplyDialog(nextOpen);
    },
    [isReplyComposerControlled, onSetActiveReplyComposerId, thread._id],
  );
  const setReportFormOpen = useCallback(
    (nextOpen: boolean) => {
      if (isReportFormControlled) {
        onSetActiveReportFormId?.(nextOpen ? thread._id : null);
        return;
      }
      setLocalIsReporting(nextOpen);
    },
    [isReportFormControlled, onSetActiveReportFormId, thread._id],
  );
  const toggleReplyComposer = useCallback(() => {
    const nextOpen = !showReplyDialog;
    setReplyComposerOpen(nextOpen);
    if (nextOpen) {
      setReportFormOpen(false);
    }
  }, [showReplyDialog, setReplyComposerOpen, setReportFormOpen]);
  const openReportForm = useCallback(() => {
    setReportFormOpen(true);
    setReplyComposerOpen(false);
  }, [setReplyComposerOpen, setReportFormOpen]);

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
    setReplyError("");
    toggleReplyComposer();
  };

  const handleShare = () => {
    const url = `${window.location.origin}/threads/${thread._id}`;
    navigator.clipboard
      .writeText(url)
      .then(() => alert("Link copied to clipboard!"))
      .catch((err) => console.error("Could not copy text: ", err));
  };

  const handleRepliesCountClick = () => {
    if (!hasReplies) return;
    if (showReplies) {
      toggleRepliesExpanded();
      return;
    }
    if (rootThreadId) {
      router.push(`/threads/${rootThreadId}`);
      return;
    }
    if (!isReply) {
      router.push(`/threads/${thread._id}`);
    }
  };
  const canToggleReplyBranchFromAvatar = isReply && showReplies && hasReplies;
  const handleAvatarToggle = () => {
    if (!canToggleReplyBranchFromAvatar) return;
    toggleRepliesExpanded();
  };

  const handleSubmitReply = async () => {
    const plainReply = richHtmlToPlainText(replyHtml);
    if (!plainReply.trim()) {
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
      const sanitizedReplyHtml = sanitizeRichHtml(replyHtml);
      const payload = {
        body: sanitizedReplyHtml || plainReply,
        ...(isReply ? { parentReplyId: thread._id } : {}),
      };

      const targetId = isReply ? threadId : thread._id;
      if (!targetId) {
        console.error("threadId is undefined!", { isReply, threadId, thread });
        setReplyError("Thread ID missing—contact support!");
        setIsSubmitting(false);
        return;
      }

      console.log("Posting reply:", `/threads/${targetId}/replies`, payload);

      await api.post(`/threads/${targetId}/replies`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReplyHtml("<p></p>");
      setReplyComposerOpen(false);
      if (onReplyAdded) await onReplyAdded();
    } catch (error) {
      console.error("Failed to submit reply:", error);
      if (isAxiosError<{ message?: string }>(error)) {
        setReplyError(
          error.response?.data?.message || "Failed to submit reply. Try again!",
        );
      } else {
        setReplyError("Failed to submit reply. Try again!");
      }
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
          `/users/hasTipped?${isReply ? "replyId" : "threadId"}=${thread._id}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );

        const reportPath = isReply
          ? `/threads/replies/${thread._id}/hasReported`
          : `/threads/${thread._id}/hasReported`;
        const reportRes = await api.get<{
          hasReported: boolean;
          message: string;
        }>(reportPath, { headers: { Authorization: `Bearer ${token}` } });
        setIsReported(reportRes.data.hasReported);

        const tipRes = await tipPromise;
        setHasTipped(tipRes.data.hasTipped);
      } catch (err) {
        console.error("Failed to check report/tip status:", err);
      }
    };
    checkReportedAndTipped();
  }, [thread._id, isReply]);

  useEffect(() => {
    setVisibleRepliesCount(REPLIES_PAGE_SIZE);
  }, [thread._id]);

  useEffect(() => {
    setLocalShowReplyDialog(false);
    setLocalIsReporting(false);
  }, [thread._id]);

  useEffect(() => {
    if (!isFocusBranch) return;
    if (typeof controlledShowRepliesExpanded === "boolean") return;
    setLocalShowRepliesExpanded(true);
  }, [isFocusBranch, controlledShowRepliesExpanded]);

  useEffect(() => {
    if (!isFocusBranch || !focusReplyId || !nestedReplies.length) return;
    const revealIndex = nestedReplies.findIndex((reply) =>
      resolvedFocusPathIds.has(reply._id),
    );
    if (revealIndex >= 0) {
      setVisibleRepliesCount((prev) =>
        Math.max(prev, revealIndex + 1, REPLIES_PAGE_SIZE),
      );
    }
  }, [isFocusBranch, focusReplyId, nestedReplies, resolvedFocusPathIds]);

  useEffect(() => {
    if (!isFocusedReply || !cardRef.current) return;
    cardRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [isFocusedReply]);

  useEffect(() => {
    const likes = (thread as Thread | Reply).likes || [];
    setLikesCount(likes.length);
    setIsLiked(
      Boolean(
        currentUserId &&
        likes.some((likeId) => String(likeId) === String(currentUserId)),
      ),
    );

    if (!isThread(thread)) {
      setBookmarksCount(0);
      setIsBookmarked(false);
      setIsSolved(false);
      setIsSticky(false);
      setIsLocked(Boolean(threadLocked));
      return;
    }

    const bookmarks = thread.bookmarks || [];
    setBookmarksCount(bookmarks.length);
    setIsSolved(Boolean(thread.isSolved));
    setIsSticky(Boolean(thread.isSticky));
    setIsLocked(Boolean(thread.isLocked));
    setIsBookmarked(
      Boolean(
        currentUserId &&
        bookmarks.some(
          (bookmarkId) => String(bookmarkId) === String(currentUserId),
        ),
      ),
    );
  }, [thread, currentUserId, isThread, threadLocked]);

  const handleLikeToggle = async () => {
    if (isLikeLoading) return;
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    setIsLikeLoading(true);
    try {
      const likePath = isReply
        ? `/threads/replies/${thread._id}/like`
        : isThread(thread)
          ? `/threads/${thread._id}/like`
          : null;
      if (!likePath) return;

      const res = await api.post<{ liked: boolean; likesCount: number }>(
        likePath,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
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
        { headers: { Authorization: `Bearer ${token}` } },
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
        { headers: { Authorization: `Bearer ${token}` } },
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
      const res = await api.post<{
        bookmarked: boolean;
        bookmarksCount: number;
      }>(
        `/threads/${thread._id}/bookmark`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
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
        { headers: { Authorization: `Bearer ${token}` } },
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

  const handleReport = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    setReplyError("");
    openReportForm();
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
      const reportPath = isReply
        ? `/threads/replies/${thread._id}/report`
        : `/threads/${thread._id}/report`;
      await api.post(
        reportPath,
        { reason: reportReason },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setReportReason("");
      setReportFormOpen(false);
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
    } catch (err: unknown) {
      console.error("Tip Error:", err);
      if (
        isAxiosError<{ message?: string }>(err) &&
        err.response?.data?.message
      ) {
        setReplyError(err.response.data.message); // Show "You no fit tip yourself, bros!"
      } else {
        setReplyError("Tip scatter o!");
      }
      setIsTipping(false);
    }
  };

  return (
    <div
      ref={cardRef}
      className={`${containerClass} ${depthClass} ${isReply ? "pl-5" : ""} ${isFocusedReply ? "ring-2 ring-blue-400 ring-offset-1" : ""}`}
    >
      {isReply && (
        <div className="absolute inset-y-0 left-0 w-8">
          <span
            className={`pointer-events-none absolute left-3 top-0 h-3 border-l-2 ${railToneClass}`}
          />
          <span
            className={`pointer-events-none absolute left-3 top-4 h-4 w-4 rounded-bl-md border-b-2 border-l-2 ${railToneClass}`}
          />
          {!isLastSibling && (
            <span
              className={`pointer-events-none absolute left-3 top-8 bottom-0 border-l-2 ${railToneClass}`}
            />
          )}
          {canToggleReplyBranchFromAvatar ? (
            <button
              type="button"
              onClick={handleAvatarToggle}
              title={repliesExpanded ? "Collapse thread" : "Expand thread"}
              className={`absolute left-1 top-2 inline-flex h-5 w-5 items-center justify-center rounded-full border text-[10px] font-semibold ${
                repliesExpanded
                  ? "border-emerald-300 bg-emerald-100 text-emerald-800"
                  : "border-slate-300 bg-slate-100 text-slate-700"
              }`}
            >
              {replyAuthorInitial}
            </button>
          ) : (
            <span className="absolute left-1 top-2 inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-200 bg-emerald-100 text-[10px] font-semibold text-emerald-800">
              {replyAuthorInitial}
            </span>
          )}
        </div>
      )}
      <div
        className={`${isCompactNode ? "p-2" : "p-3"} ${isReply ? replyBgToneClass : "bg-gray-200"} pb-2`}
      >
        <div className="flex flex-wrap items-baseline gap-x-1 justify-between">
          {!isReply && (
            <Link
              href={titleHref || "#"}
              onClick={(e) => {
                if (!titleHref) e.preventDefault();
              }}
              className="font-bold text-base text-green-800 hover:underline"
            >
              {displayTitle}
            </Link>
          )}
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
          {!isReply && (
            <button
              type="button"
              onClick={handleRepliesCountClick}
              className={`inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-700 hover:bg-blue-200 ${
                shouldNudgeRepliesTrigger ? "animate-[pulse_2.8s_ease-in-out_infinite]" : ""
              }`}
              title={showReplies ? "Toggle replies" : "Open thread discussion"}
            >
              {repliesCount} {repliesCount === 1 ? "Reply" : "Replies"}
            </button>
          )}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600 break-words">
              {isFlattenedReply && (
                <span className="mr-1 inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                  Replying to @{replyingToHandle}
                </span>
              )}
              by{" "}
              {thread.userId?._id ? (
                <Link
                  href={`/users/${thread.userId._id}`}
                  className="font-medium text-blue-700 hover:underline"
                >
                  {thread.userId?.email || "Unknown Oga"}
                </Link>
              ) : (
                <span className="font-medium">
                  {thread.userId?.email || "Unknown Oga"}
                </span>
              )}
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
              {!isReply && showUpdatedAt && threadUpdatedAt && (
                <span>• Updated {formatDate(threadUpdatedAt)} </span>
              )}
              {!isReply && isThread(thread) && `• ${thread.category}`}
            </span>
            {hasReplies && (
              <button
                onClick={handleRepliesCountClick}
                className={`group text-blue-600 hover:text-blue-800 ${
                  shouldNudgeRepliesTrigger ? "animate-[pulse_2.8s_ease-in-out_infinite]" : ""
                }`}
                title={
                  showReplies
                    ? repliesExpanded
                      ? "Hide replies"
                      : "Show replies"
                    : "Open thread discussion"
                }
              >
                <span
                  className="material-icons-outlined transition-transform group-hover:-translate-y-0.5"
                  style={{ fontSize: "16px" }}
                >
                  {showReplies && repliesExpanded ? "expand_less" : "chat"}
                </span>
                <span className="text-xs ml-1">+{repliesCount}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div
        className={`${isCompactNode ? "px-3 py-2" : "px-4 py-3 sm:px-5"} text-sm text-gray-800 ${isReply ? replyBgToneClass : "bg-gray-50"}`}
      >
        <div
          className="max-w-none text-sm text-gray-800 [&_h1]:my-2 [&_h1]:text-xl [&_h1]:font-bold [&_h2]:my-2 [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:my-2 [&_h3]:text-base [&_h3]:font-semibold [&_h4]:my-2 [&_h4]:text-[15px] [&_h4]:font-semibold [&_h5]:my-2 [&_h5]:text-sm [&_h5]:font-semibold [&_h6]:my-2 [&_h6]:text-sm [&_h6]:font-semibold [&_p]:my-2 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-1 [&_blockquote]:my-2 [&_blockquote]:border-l-4 [&_blockquote]:border-slate-300 [&_blockquote]:pl-3 [&_blockquote]:text-slate-600 [&_pre]:my-2 [&_pre]:overflow-x-auto [&_pre]:rounded [&_pre]:bg-slate-900 [&_pre]:p-2 [&_pre]:text-slate-100 [&_code]:rounded [&_code]:bg-slate-100 [&_code]:px-1 [&_code]:py-0.5 [&_a]:text-blue-700 [&_a]:underline"
          dangerouslySetInnerHTML={{
            __html: normalizeContentForRender(thread.body),
          }}
        />

        <div
          className={`mt-3 pt-2 flex flex-wrap gap-2 text-xs text-gray-500 ${isReply ? "border-t border-slate-100" : "border-t border-gray-200"}`}
        >
          <button
            onClick={handleReplyClick}
            className={`flex items-center gap-1 text-xs ${
              canReplyToThread ? "hover:text-blue-600" : "text-gray-400"
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
              className={`hidden sm:flex items-center gap-1 text-xs ${
                isSticky ? "text-amber-600" : "hover:text-amber-600"
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
              className={`hidden sm:flex items-center gap-1 text-xs ${
                isLocked ? "text-slate-600" : "hover:text-slate-700"
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
            className={`flex items-center gap-1 text-xs ${
              isReply
                ? isReported
                  ? "text-gray-400"
                  : "hover:text-red-600"
                : isReported
                  ? "text-gray-400"
                  : "hover:text-red-600"
            }`}
            disabled={isReported}
            title="Report"
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
            className={`flex items-center gap-1 text-xs ${
              isLiked ? "text-green-600" : "hover:text-green-600"
            }`}
            onClick={handleLikeToggle}
            disabled={isLikeLoading}
            title="Like"
          >
            <span
              className="material-icons-outlined"
              style={{ fontSize: "12px" }}
            >
              thumb_up
            </span>
            <span className="text-xs">
              Like {likesCount > 0 ? `(${likesCount})` : ""}
            </span>
          </button>

          {!isReply && (
            <button
              className={`hidden sm:flex items-center gap-1 text-xs ${
                isBookmarked ? "text-blue-600" : "hover:text-blue-600"
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
              className={`hidden sm:flex items-center gap-1 text-xs ${
                isSolved ? "text-emerald-600" : "hover:text-emerald-600"
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
              <span className="text-xs">
                {isSolved ? "Solved" : "Mark solved"}
              </span>
            </button>
          )}

          <button
            className={`hidden sm:flex items-center gap-1 text-xs ${
              hasTipped ? "text-gray-400" : "hover:text-yellow-600"
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
            className="hidden sm:flex hover:text-purple-600 items-center gap-1 text-xs"
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
            className="hidden sm:flex hover:text-green-600 items-center gap-1 text-xs ml-auto"
          >
            <span className="text-xs">{isPidgin ? "English" : "Pidgin"}</span>
          </button>
        </div>

        {isReporting && (
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
                  setReportFormOpen(false);
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
            <RichTextEditor
              value={replyHtml}
              onChange={setReplyHtml}
              placeholder="Drop your reply..."
              minHeightClassName="min-h-[90px]"
              disabled={isSubmitting}
            />
            {replyError && (
              <p className="text-red-500 text-xs mt-1">{replyError}</p>
            )}
            <div className="flex justify-end gap-2 mt-2">
              <button
                className="px-3 py-1 bg-gray-200 rounded-md text-xs hover:bg-gray-300"
                onClick={() => {
                  setReplyComposerOpen(false);
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
                    className={`px-3 py-1 rounded-md text-sm ${
                      tipAmount === amt
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

      {showReplies && repliesExpanded && hasReplies && (
        <div
          className={`${isReply ? "ml-2 mt-1" : "mx-3 mt-2"} space-y-0 border-t border-gray-100 py-2`}
        >
          {visibleNestedReplies.map((reply, index) => (
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
              replyingToEmail={thread.userId?.email || null}
              focusReplyId={focusReplyId}
              focusReplyPathIds={resolvedFocusPathIds}
              isLastSibling={
                index === visibleNestedReplies.length - 1 &&
                !hasMoreNestedReplies
              }
              activeReplyComposerId={activeReplyComposerId}
              onSetActiveReplyComposerId={onSetActiveReplyComposerId}
              activeReportFormId={activeReportFormId}
              onSetActiveReportFormId={onSetActiveReportFormId}
            />
          ))}
          {hasMoreNestedReplies && (
            <div className="pt-1">
              <button
                type="button"
                onClick={() =>
                  setVisibleRepliesCount((prev) => prev + REPLIES_PAGE_SIZE)
                }
                className="text-xs font-semibold text-blue-700 hover:text-blue-900 hover:underline"
              >
                Show more replies ({hiddenRepliesCount} more)
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ThreadCard;
