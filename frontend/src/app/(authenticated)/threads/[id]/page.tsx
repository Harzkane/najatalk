// frontend/src/app/(authenticated)/threads/[id]/page.tsx
"use client";

import { useState, useEffect, FormEvent } from "react";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import formatDate from "@/utils/formatDate";

type Thread = {
  _id: string;
  title: string;
  body: string;
  userId: { email: string } | null;
  category: string;
  createdAt: string;
  replies: Reply[];
};

type Reply = {
  _id: string;
  body: string;
  userId: { email: string } | null;
  createdAt: string;
};

export default function ThreadDetail() {
  const [thread, setThread] = useState<Thread | null>(null);
  const [replyBody, setReplyBody] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReplyBox, setShowReplyBox] = useState(false); // Toggle reply box
  const [isReporting, setIsReporting] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [isReported, setIsReported] = useState(false);
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  useEffect(() => {
    const fetchThread = async () => {
      try {
        const res = await axios.get<Thread>(`/api/threads/${id}`);
        setThread(res.data);
      } catch (err: unknown) {
        if (axios.isAxiosError(err)) {
          setMessage(err.response?.data?.message || "Thread no dey!");
        } else {
          setMessage("Thread fetch scatter o!");
        }
      }
    };

    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
    fetchThread();
  }, [id]);

  const handleReply = async (e: FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn) {
      setMessage("Abeg login first!");
      return;
    }

    if (!replyBody.trim()) {
      setMessage("Reply cannot be empty!");
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post<{ message: string; reply: Reply }>(
        `/api/threads/${id}/replies`,
        { body: replyBody },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(res.data.message || "Reply posted—gist dey grow!");
      setReplyBody("");
      setShowReplyBox(false); // Close box on success
      setThread((prev) =>
        prev ? { ...prev, replies: [res.data.reply, ...prev.replies] } : null
      );
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setMessage(err.response?.data?.message || "Reply scatter o!");
        if (err.response?.status === 401) {
          setMessage("Token don expire—abeg login again!");
          localStorage.removeItem("token");
          setTimeout(() => router.push("/login"), 1000);
        }
      } else {
        setMessage("Reply scatter o!");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    router.push("/login");
  };

  // const handleReport = async () => {
  //   if (!isLoggedIn) {
  //     setMessage("Abeg login first!");
  //     return;
  //   }

  //   const reason = prompt("Why you dey report this gist?");
  //   if (!reason?.trim()) {
  //     setMessage("Abeg, give reason!");
  //     return;
  //   }

  //   try {
  //     const token = localStorage.getItem("token");
  //     const res = await axios.post<{ message: string }>(
  //       `/api/threads/${id}/report`,
  //       { reason },
  //       { headers: { Authorization: `Bearer ${token}` } }
  //     );
  //     setMessage(res.data.message);
  //   } catch (err: unknown) {
  //     if (axios.isAxiosError(err)) {
  //       setMessage(err.response?.data?.message || "Report scatter o!");
  //       if (err.response?.status === 401) {
  //         setMessage("Token don expire—abeg login again!");
  //         localStorage.removeItem("token");
  //         setTimeout(() => router.push("/login"), 1000);
  //       }
  //     } else {
  //       setMessage("Report scatter o!");
  //     }
  //   }
  // };

  const handleReport = async () => {
    if (!isLoggedIn) {
      setMessage("Abeg login first!");
      return;
    }
    setIsReporting(true);
  };

  const submitReport = async () => {
    if (!reportReason.trim()) {
      setMessage("Abeg, give reason!");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post<{ message: string }>(
        `/api/threads/${id}/report`,
        { reason: reportReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(res.data.message);
      setReportReason("");
      setIsReporting(false);
      setIsReported(true);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setMessage(err.response?.data?.message || "Report scatter o!");
        if (err.response?.status === 401) {
          setMessage("Token don expire—abeg login again!");
          localStorage.removeItem("token");
          setTimeout(() => router.push("/login"), 1000);
        }
      } else {
        setMessage("Report scatter o!");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!thread && !message)
    return <p className="text-center p-10">Loading gist...</p>;

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Header */}
      <div className="max-w-5xl mx-auto mb-3">
        <div className="bg-green-800 text-white p-4 rounded-t-lg shadow-md">
          <div className="flex justify-between items-center">
            <h1 className="text-4xl font-bold text-gray-50 text-center">
              {thread ? thread.title : "NaijaTalk Threads—Drop Your Gist!"}
            </h1>
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="text-green-100 hover:text-white text-sm font-medium"
              >
                Home
              </Link>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700 text-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto">
        {message && (
          <p className="text-center text-sm text-gray-600 mb-3 bg-white p-2 rounded-lg">
            {message}
          </p>
        )}

        {thread && (
          <>
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-4">
              <div className="p-3 bg-gray-200 pb-2">
                <div className="flex flex-wrap items-baseline gap-x-1">
                  <span className="text-green-800 font-bold text-base">
                    {thread.title}
                  </span>
                  <span className="text-xs text-gray-600">
                    by{" "}
                    <span className="font-medium">
                      {thread.userId?.email || "Unknown Oga"}
                    </span>
                    : {formatDate(thread.createdAt)} • {thread.category}
                  </span>
                </div>
              </div>
              <div className="px-3 py-2 text-sm bg-gray-50 text-gray-800">
                <p>{thread.body}</p>
                <div className="mt-2 pt-1 border-t border-gray-200 flex gap-1 text-xs text-gray-500">
                  <button
                    onClick={() => isLoggedIn && setShowReplyBox(true)}
                    className="hover:text-blue-600 flex items-center gap-1 text-xs"
                    disabled={!isLoggedIn}
                  >
                    <span
                      className="material-icons-outlined"
                      style={{ fontSize: "12px" }}
                    >
                      reply
                    </span>
                    <span className="text-xs">Reply</span>
                  </button>
                  <button
                    // onClick={() => alert("Report feature coming soon!")}
                    className={`flex items-center gap-1 text-xs ${
                      isReported ? "text-gray-400" : "hover:text-red-600"
                    }`}
                    onClick={handleReport}
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

                  {isLoggedIn && isReporting && (
                    <div className="fixed bottom-6 right-6 w-96 bg-white p-4 rounded-lg shadow-lg border border-gray-200 z-50">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="text-sm font-semibold text-green-800">
                          Report This Gist
                        </h3>
                        <button
                          onClick={() => {
                            setIsReporting(false);
                            setReportReason("");
                          }}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <span
                            className="material-icons-outlined"
                            style={{ fontSize: "16px" }}
                          >
                            close
                          </span>
                        </button>
                      </div>
                      <textarea
                        placeholder="Why you dey report this gist?"
                        value={reportReason}
                        onChange={(e) => setReportReason(e.target.value)}
                        className="w-full p-2 mb-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 h-24 text-gray-800 text-sm"
                      />
                      <button
                        onClick={submitReport}
                        disabled={isSubmitting}
                        className="w-full bg-red-600 text-white p-2 rounded-lg hover:bg-red-700 disabled:bg-red-400 text-sm"
                      >
                        {isSubmitting ? "Reporting..." : "Send Report"}
                      </button>
                    </div>
                  )}

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
                  <button
                    className="hover:text-purple-600 flex items-center gap-1 text-xs"
                    onClick={() => {
                      const url = `${window.location.origin}/threads/${thread._id}`;
                      navigator.clipboard
                        .writeText(url)
                        .then(() => alert("Link copied to clipboard!"))
                        .catch((err) =>
                          console.error("Could not copy text: ", err)
                        );
                    }}
                  >
                    <span
                      className="material-icons-outlined"
                      style={{ fontSize: "12px" }}
                    >
                      share
                    </span>
                    <span className="text-xs">Share</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Floating Reply Box */}
            {isLoggedIn && showReplyBox && (
              <div className="fixed bottom-6 right-6 w-96 bg-white p-4 rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-semibold text-green-800">
                    Drop Your Reply
                  </h3>
                  <button
                    onClick={() => setShowReplyBox(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <span
                      className="material-icons-outlined"
                      style={{ fontSize: "16px" }}
                    >
                      close
                    </span>
                  </button>
                </div>
                <form onSubmit={handleReply}>
                  <textarea
                    placeholder="Wetin you wan talk?"
                    value={replyBody}
                    onChange={(e) => setReplyBody(e.target.value)}
                    className="w-full p-2 mb-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 h-24 text-gray-800 text-sm"
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-green-600 text-white p-2 rounded-lg hover:bg-green-700 disabled:bg-green-400 text-sm"
                  >
                    {isSubmitting ? "Posting..." : "Reply am!"}
                  </button>
                </form>
              </div>
            )}

            {/* Replies Section */}
            {thread.replies.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-green-800 mb-2">
                  Replies
                </h3>
                {thread.replies.map((reply) => (
                  <div key={reply._id} className="mb-2">
                    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                      <div className="p-3 bg-gray-200 pb-2">
                        <div className="flex flex-wrap items-baseline gap-x-1">
                          <span className="text-blue-800 font-bold text-base">
                            Re: {thread.title}
                          </span>
                          <span className="text-xs text-gray-600">
                            by{" "}
                            <span className="font-medium">
                              {reply.userId?.email || "Unknown Oga"}
                            </span>
                            : {formatDate(reply.createdAt)}
                          </span>
                        </div>
                      </div>
                      <div className="px-3 py-2 text-sm bg-gray-50 text-gray-800">
                        <p>{reply.body}</p>
                        <div className="mt-2 pt-1 border-t border-gray-200 flex gap-1 text-xs text-gray-500">
                          <button
                            onClick={() => setShowReplyBox(true)}
                            className="hover:text-blue-600 flex items-center gap-1 text-xs"
                          >
                            <span
                              className="material-icons-outlined"
                              style={{ fontSize: "12px" }}
                            >
                              reply
                            </span>
                            <span className="text-xs">Reply</span>
                          </button>
                          <button
                            className="hover:text-red-600 flex items-center gap-1 text-xs"
                            onClick={() => alert("Report feature coming soon!")}
                          >
                            <span
                              className="material-icons-outlined"
                              style={{ fontSize: "12px" }}
                            >
                              flag
                            </span>
                            <span className="text-xs">Report</span>
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
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 text-center">
              <Link
                href="/threads"
                className="text-blue-600 hover:underline text-sm"
              >
                ← Back to all threads
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
