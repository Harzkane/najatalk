// frontend/src/app/(authenticated)/threads/page.tsx
"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Head from "next/head";
import ThreadCard from "@/components/threads/ThreadCard";
import SearchBar from "@/components/threads/SearchBar";
import NewThreadButton from "@/components/threads/NewThreadButton";
import formatDate from "@/utils/formatDate";

type Thread = {
  _id: string;
  title: string;
  body: string;
  userId: { _id: string; email: string; flair?: string } | null; // Add flair
  category: string;
  createdAt: string;
  replies?: Reply[];
};

type Reply = {
  _id: string;
  body: string;
  userId: { _id: string; email: string; flair?: string } | null; // Add flair
  createdAt: string;
};

type SearchResponse = {
  threads: Thread[];
  message: string;
};

function ThreadsContent() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [replyBody, setReplyBody] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const threadId = searchParams.get("id");

  const newThreadButtonRef = useRef<HTMLButtonElement>(null);

  const trendingTopics = [
    "Suya joints",
    "NYSC camp",
    "Lagos traffic",
    "Best jollof",
  ];

  useEffect(() => {
    const savedSearches = localStorage.getItem("recentSearches");
    if (savedSearches) {
      setRecentSearches(JSON.parse(savedSearches));
    }

    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);

    const tipStatus = searchParams.get("tip");
    if (tipStatus === "success") setMessage("Tip sent—gist too sweet!");
    if (tipStatus === "failed") setMessage("Tip scatter o—try again!");

    if (threadId) {
      fetchSingleThread(threadId);
    } else {
      fetchThreads();
    }
  }, [threadId, searchParams]);

  const fetchSingleThread = async (id: string) => {
    try {
      const res = await axios.get<Thread>(`/api/threads/${id}`);
      setSelectedThread(res.data);
      setThreads([]);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setMessage(err.response?.data?.message || "Thread no dey!");
      } else {
        setMessage("Thread fetch scatter o!");
      }
    }
  };

  const handleSearch = useCallback(
    async (query: string) => {
      setSearchQuery(query);
      try {
        const res = await axios.get<SearchResponse>(
          `/api/threads/search?q=${query}`
        );
        setThreads(res.data.threads);
        setMessage(res.data.message);
        setSelectedThread(null);

        if (query.trim()) {
          const updatedSearches = [
            query,
            ...recentSearches.filter((s) => s !== query),
          ].slice(0, 5);
          setRecentSearches(updatedSearches);
          localStorage.setItem(
            "recentSearches",
            JSON.stringify(updatedSearches)
          );
        }
      } catch (err: unknown) {
        if (axios.isAxiosError(err)) {
          setMessage(err.response?.data?.message || "Search scatter o!");
        } else {
          setMessage("No gist match—try another search!");
        }
      }
    },
    [recentSearches]
  );

  const fetchThreads = async () => {
    try {
      const res = await axios.get<{ threads: Thread[]; message: string }>(
        "/api/threads"
      );
      console.log("Threads Response:", res.data);
      const threadsWithReplies = await Promise.all(
        res.data.threads.map(async (thread) => {
          try {
            const replyRes = await axios.get<Thread>(
              `/api/threads/${thread._id}`
            );
            return replyRes.data;
          } catch (err) {
            console.error(`Failed to fetch thread ${thread._id}:`, err);
            return { ...thread, replies: [] };
          }
        })
      );
      setThreads(threadsWithReplies);
      setMessage(res.data.message || "");
      setSelectedThread(null);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setMessage(err.response?.data?.message || "Fetch scatter o!");
      } else {
        setMessage("No gist yet—drop your own!");
      }
    }
  };

  const handleSubmitThread = async (
    title: string,
    body: string,
    category: string
  ) => {
    if (!isLoggedIn) {
      setMessage("Abeg login first!");
      setTimeout(() => router.push("/login"), 1000);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post<{ message: string; thread: Thread }>(
        "/api/threads",
        { title, body, category },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(res.data.message);
      if (!selectedThread) {
        await fetchThreads();
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const errorMsg = err.response?.data?.message || "Thread scatter o!";
        setMessage(errorMsg);
        if (err.response?.status === 401) {
          setMessage("Token don expire—abeg login again!");
          localStorage.removeItem("token");
          setTimeout(() => router.push("/login"), 1000);
        }
      } else {
        setMessage("Thread scatter o!");
      }
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn) {
      setMessage("Abeg login first!");
      return;
    }

    if (!replyBody.trim() || !selectedThread) {
      setMessage("Reply cannot be empty!");
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post<{ message: string; reply: Reply }>(
        `/api/threads/${selectedThread._id}/replies`,
        { body: replyBody },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(res.data.message || "Reply posted—gist dey grow!");
      setReplyBody("");
      setSelectedThread((prev) =>
        prev
          ? {
              ...prev,
              replies: [res.data.reply, ...(prev.replies || [])],
            }
          : null
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

  return (
    <>
      <Head>
        <meta
          httpEquiv="Content-Security-Policy"
          content="script-src 'self' https://checkout.paystack.com 'unsafe-inline';"
        />
      </Head>
      <div className="min-h-screen bg-gray-100 p-6 pb-20">
        <div className="max-w-5xl mx-auto mb-3">
          <div className="bg-green-800 text-white p-4 rounded-t-lg shadow-md">
            <div className="flex justify-between items-center">
              <h1 className="text-4xl font-bold text-gray-50 text-center">
                {selectedThread
                  ? selectedThread.title
                  : "NaijaTalk Threads—Drop Your Gist!"}
              </h1>
              <div className="flex items-center space-x-4">
                <Link
                  href="/"
                  className="text-green-100 hover:text-white text-sm font-medium"
                >
                  Home
                </Link>
                <Link
                  href="/premium"
                  className="text-green-100 hover:text-white text-sm font-medium"
                >
                  Wallet
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

        <div className="max-w-5xl mx-auto">
          {!selectedThread && (
            <div className="bg-white p-4 rounded-lg shadow-md mb-3">
              <SearchBar
                onSearch={handleSearch}
                recentSearches={recentSearches}
                trendingTopics={trendingTopics}
              />
            </div>
          )}

          {message && (
            <p className="text-center text-sm text-gray-600 mb-3 bg-white p-2 rounded-lg">
              {message}
              {searchQuery && !selectedThread ? `: "${searchQuery}"` : ""}
            </p>
          )}

          {selectedThread ? (
            <div className="space-y-4">
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-4">
                <div className="p-3 bg-gray-200 pb-2">
                  <div className="flex flex-wrap items-baseline gap-x-1">
                    <span className="text-green-800 font-bold text-base">
                      {selectedThread.title}
                    </span>
                    <span className="text-xs text-gray-600">
                      by{" "}
                      <span className="font-medium">
                        {selectedThread.userId?.email || "Unknown Oga"}
                      </span>
                      {selectedThread.userId?.flair && (
                        <span
                          className={`ml-1 inline-block text-white px-1 rounded text-xs ${
                            selectedThread.userId.flair === "Oga at the Top"
                              ? "bg-yellow-500"
                              : "bg-green-500"
                          }`}
                        >
                          {selectedThread.userId.flair}
                        </span>
                      )}
                      : {formatDate(selectedThread.createdAt)} •{" "}
                      {selectedThread.category}
                    </span>
                  </div>
                </div>
                <div className="px-3 py-2 text-sm bg-gray-50 text-gray-800">
                  <p>{selectedThread.body}</p>
                  <div className="mt-2 pt-1 border-t border-gray-200 flex gap-1 text-xs text-gray-500">
                    {/* Hover Tooltip: /threads—hover on “Reply” button dey show “Reply to [flair]”—small Naija vibe tweak! Not working yet */}
                    <button
                      onClick={() =>
                        document.getElementById("replyForm")?.focus()
                      }
                      className="hover:text-blue-600 flex items-center gap-1 text-xs"
                      title={
                        selectedThread?.userId?.flair
                          ? `Reply to ${selectedThread.userId.flair}`
                          : "Reply"
                      }
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
                    <button
                      className="hover:text-purple-600 flex items-center gap-1 text-xs"
                      onClick={() => {
                        const url = `${window.location.origin}/threads?id=${selectedThread._id}`;
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

              {isLoggedIn && (
                <form onSubmit={handleReply} className="mb-6">
                  <textarea
                    id="replyForm"
                    placeholder="Drop your reply..."
                    value={replyBody}
                    onChange={(e) => setReplyBody(e.target.value)}
                    className="w-full p-3 mb-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 h-24 text-gray-800"
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-green-600 text-white p-3 rounded-lg hover:bg-green-700 disabled:bg-green-400"
                  >
                    {isSubmitting ? "Posting..." : "Reply am!"}
                  </button>
                </form>
              )}

              {selectedThread.replies && selectedThread.replies.length > 0 ? (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-green-800 mb-2">
                    Replies
                  </h3>
                  {selectedThread.replies.map((reply) => (
                    <div key={reply._id} className="mb-2">
                      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                        <div className="p-3 bg-gray-200 pb-2">
                          <div className="flex flex-wrap items-baseline gap-x-1">
                            <span className="text-blue-800 font-bold text-base">
                              Re: {selectedThread.title}
                            </span>
                            <span className="text-xs text-gray-600">
                              by{" "}
                              <span className="font-medium">
                                {reply.userId?.email || "Unknown Oga"}
                              </span>
                              {reply.userId?.flair && (
                                <span
                                  className={`ml-1 inline-block text-white px-1 rounded text-xs ${
                                    reply.userId.flair === "Oga at the Top"
                                      ? "bg-yellow-500"
                                      : "bg-green-500"
                                  }`}
                                >
                                  {reply.userId.flair}
                                </span>
                              )}
                              : {formatDate(reply.createdAt)}
                            </span>
                          </div>
                        </div>
                        <div className="px-3 py-2 text-sm bg-gray-50 text-gray-800">
                          <p>{reply.body}</p>
                          <div className="mt-2 pt-1 border-t border-gray-200 flex gap-1 text-xs text-gray-500">
                            <button
                              onClick={() =>
                                document.getElementById("replyForm")?.focus()
                              }
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
                              onClick={() =>
                                alert("Report feature coming soon!")
                              }
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
              ) : (
                <div className="bg-white border border-gray-200 p-4 rounded-md text-center mt-4">
                  <p className="text-gray-600">No replies yet—be the first!</p>
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
            </div>
          ) : (
            <div className="space-y-1">
              {threads.length ? (
                threads.map((thread) => (
                  <ThreadCard
                    key={thread._id}
                    thread={thread}
                    formatDate={formatDate}
                    showReplies={true}
                    onReplyAdded={fetchThreads}
                  />
                ))
              ) : (
                <div className="bg-white border border-gray-200 p-4 rounded-md text-center">
                  <p className="text-gray-600 mb-4">
                    No gist yet—be the first!
                  </p>
                  {isLoggedIn ? (
                    <button
                      onClick={() => {
                        if (newThreadButtonRef.current) {
                          newThreadButtonRef.current.click();
                        }
                      }}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center mx-auto"
                    >
                      <span
                        className="material-icons-outlined mr-1"
                        style={{ fontSize: "16px" }}
                      >
                        add
                      </span>
                      Start a New Thread
                    </button>
                  ) : (
                    <button
                      onClick={() => router.push("/login")}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center mx-auto"
                    >
                      <span
                        className="material-icons-outlined mr-1"
                        style={{ fontSize: "16px" }}
                      >
                        login
                      </span>
                      Login to Post
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <NewThreadButton
          isLoggedIn={isLoggedIn}
          onSubmit={handleSubmitThread}
          buttonRef={newThreadButtonRef}
        />
      </div>
    </>
  );
}

function ThreadsLoading() {
  return <div className="text-center p-10">Loading gist...</div>;
}

export default function Threads() {
  return (
    <Suspense fallback={<ThreadsLoading />}>
      <ThreadsContent />
    </Suspense>
  );
}
