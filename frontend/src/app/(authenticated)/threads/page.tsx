// frontend/src/app/(authenticated)/threads/page.tsx
"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Head from "next/head";
import ThreadCard from "../../../components/threads/ThreadCard";
import SearchBar from "../../../components/threads/SearchBar";
import NewThreadButton from "../../../components/threads/NewThreadButton";
import formatDate from "../../../utils/formatDate";
import SponsoredAdCard from "../../../components/ads/SponsoredAdCard";

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

type Reply = {
  _id: string;
  body: string;
  userId: { _id: string; email: string; flair?: string } | null;
  createdAt: string;
  parentReplyId?: string | null;
};

type SearchResponse = {
  threads: Thread[];
  message: string;
};

type Ad = {
  _id: string;
  brand: string;
  text: string;
  link: string;
  type: "sidebar" | "banner" | "popup";
  budget: number;
  cpc: number;
  status: "pending" | "active" | "expired";
};

function ThreadsContent() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [bannerAd, setBannerAd] = useState<Ad | null>(null);
  const [sidebarAd, setSidebarAd] = useState<Ad | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [replyBody, setReplyBody] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<
    "user" | "mod" | "admin" | null
  >(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [activeFilter, setActiveFilter] = useState<
    "all" | "unanswered" | "solved" | "bookmarked"
  >("all");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifyingTip, setIsVerifyingTip] = useState(false);
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

  const verifyTip = useCallback(
    async (reference: string, receiverId: string) => {
      console.log("[verifyTip] Entering:", { reference, receiverId });
      try {
        setIsVerifyingTip(true);
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No token—abeg login!");
        const res = await axios.post(
          "/api/users/verifyTip",
          { reference, receiverId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setMessage(res.data.message || "Tip don land—gist too sweet!");
        if (!threadId) await fetchThreads();
        const walletRes = await axios.get("/api/premium/wallet", {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log("[verifyTip] Wallet after tip:", walletRes.data);
        router.push("/premium");
      } catch (err: unknown) {
        let errMsg = "Tip scatter o—try again!";
        if (axios.isAxiosError(err)) {
          errMsg = err.response?.data?.message || errMsg;
        }
        setMessage(errMsg);
        const failUrl = new URLSearchParams({
          tip: "failed",
          reference,
          receiverId,
        }).toString();
        router.push(`/threads?${failUrl}`);
      } finally {
        setIsVerifyingTip(false);
      }
    },
    [router, threadId]
  );

  useEffect(() => {
    const savedSearches = localStorage.getItem("recentSearches");
    if (savedSearches) setRecentSearches(JSON.parse(savedSearches));

    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);

    const reference = searchParams.get("reference");
    const receiverId = searchParams.get("receiverId");
    const tipStatus = searchParams.get("tip");

    if (reference && receiverId && !tipStatus) verifyTip(reference, receiverId);
    else if (tipStatus === "success") {
      setMessage("Tip sent—gist too sweet!");
      setTimeout(() => router.push("/threads"), 2000);
    } else if (tipStatus === "failed") setMessage("Tip scatter o—try again!");

    if (threadId) fetchSingleThread(threadId);
    else fetchThreads();

    const checkPremiumAndAds = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        const userRes = await axios.get("/api/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCurrentUserId(userRes.data._id || null);
        setCurrentUserRole((userRes.data.role as "user" | "mod" | "admin") || null);
        setIsPremium(userRes.data.isPremium);
        if (!userRes.data.isPremium) {
          fetchBannerAd();
          fetchSidebarAd();
        }
      } else {
        setCurrentUserId(null);
        setCurrentUserRole(null);
        fetchBannerAd();
        fetchSidebarAd();
      }
    };
    checkPremiumAndAds();
  }, [threadId, searchParams, verifyTip, router]);

  const fetchBannerAd = async () => {
    try {
      const res = await axios.get("/api/ads", {
        params: { status: "active", type: "banner" },
      });
      const activeBanners = res.data.ads.filter(
        (ad: Ad) => ad.budget >= ad.cpc
      );
      if (activeBanners.length > 0) {
        const randomBanner =
          activeBanners[Math.floor(Math.random() * activeBanners.length)];
        setBannerAd(randomBanner);
        await axios.get(`/api/ads/impression/${randomBanner._id}`);
      }
    } catch (err) {
      console.error("Banner fetch error:", err);
    }
  };

  const fetchSidebarAd = async () => {
    try {
      const res = await axios.get("/api/ads", {
        params: { status: "active", type: "sidebar" },
      });
      const activeSidebars = res.data.ads.filter(
        (ad: Ad) => ad.budget >= ad.cpc
      );
      if (activeSidebars.length > 0) {
        const randomSidebar =
          activeSidebars[Math.floor(Math.random() * activeSidebars.length)];
        setSidebarAd(randomSidebar);
        await axios.get(`/api/ads/impression/${randomSidebar._id}`);
      }
    } catch (err) {
      console.error("Sidebar fetch error:", err);
    }
  };

  const trackClick = async (adId: string) => {
    try {
      await axios.post(`/api/ads/click/${adId}`);
    } catch (err) {
      console.error("Click track error:", err);
    }
  };

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
      if (!selectedThread) await fetchThreads();
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
          ? { ...prev, replies: [res.data.reply, ...(prev.replies || [])] }
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
    setCurrentUserId(null);
    setCurrentUserRole(null);
    router.push("/login");
  };

  const filteredThreads = threads.filter((thread) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "unanswered") return (thread.replies?.length || 0) === 0;
    if (activeFilter === "solved") return Boolean(thread.isSolved);
    if (activeFilter === "bookmarked") {
      if (!currentUserId) return false;
      return (thread.bookmarks || []).includes(currentUserId);
    }
    return true;
  });
  const canReplySelectedThread = Boolean(
    !selectedThread?.isLocked ||
      currentUserRole === "mod" ||
      currentUserRole === "admin"
  );

  return (
    <>
      <Head>
        <meta
          httpEquiv="Content-Security-Policy"
          content="script-src 'self' https://checkout.paystack.com 'unsafe-inline';"
        />
      </Head>
      <div className="min-h-screen bg-slate-100 p-4 md:p-6 pb-20">
        <div className="max-w-7xl mx-auto mb-4">
          <div className="bg-green-800 text-white p-4 rounded-t-lg shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:justify-between md:items-center">
              <h1 className="text-2xl md:text-4xl font-bold text-gray-50 text-center md:text-left break-words">
                {selectedThread
                  ? selectedThread.title
                  : "NaijaTalk Threads—Drop Your Gist!"}
              </h1>
              <div className="flex flex-wrap items-center justify-center md:justify-end gap-3 md:gap-4">
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
                  Premium
                </Link>
                <Link
                  href="/marketplace"
                  className="text-green-100 hover:text-white text-sm font-medium"
                >
                  Marketplace
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

        <div className="max-w-7xl mx-auto">
          {!isPremium && bannerAd && (
            <SponsoredAdCard ad={bannerAd} onClick={trackClick} className="mb-4" />
          )}

          {!selectedThread && (
            <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 mb-3">
              <SearchBar
                onSearch={handleSearch}
                recentSearches={recentSearches}
                trendingTopics={trendingTopics}
              />
            </div>
          )}

          {!selectedThread && (
            <div className="mb-3 flex flex-wrap gap-2">
              {[
                { id: "all", label: "All" },
                { id: "unanswered", label: "Unanswered" },
                { id: "solved", label: "Solved" },
                { id: "bookmarked", label: "Saved" },
              ].map((filterOption) => (
                <button
                  key={filterOption.id}
                  onClick={() =>
                    setActiveFilter(
                      filterOption.id as
                        | "all"
                        | "unanswered"
                        | "solved"
                        | "bookmarked"
                    )
                  }
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                    activeFilter === filterOption.id
                      ? "border-green-600 bg-green-600 text-white"
                      : "border-slate-300 bg-white text-slate-600 hover:border-green-400 hover:text-green-700"
                  }`}
                >
                  {filterOption.label}
                </button>
              ))}
            </div>
          )}

          {message && (
            <p className="text-center text-sm text-slate-600 mb-3 bg-white border border-slate-200 p-2 rounded-lg">
              {isVerifyingTip ? "Verifying tip—abeg wait small..." : message}
              {searchQuery && !selectedThread ? `: "${searchQuery}"` : ""}
            </p>
          )}

          <div className="flex flex-col lg:flex-row gap-4">
            <div
              className={`w-full ${
                !isPremium && sidebarAd ? "lg:w-3/4" : "lg:w-full"
              }`}
            >
              {selectedThread ? (
                <div className="space-y-4">
                  <ThreadCard
                    thread={selectedThread}
                    formatDate={formatDate}
                    showReplies={true}
                    onReplyAdded={() => fetchSingleThread(selectedThread._id)}
                    currentUserId={currentUserId}
                    currentUserRole={currentUserRole}
                    onThreadUpdated={() => fetchSingleThread(selectedThread._id)}
                  />

                  {isLoggedIn && canReplySelectedThread && (
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

                  {isLoggedIn && !canReplySelectedThread && (
                    <p className="mb-6 rounded-lg border border-slate-300 bg-slate-50 p-3 text-center text-sm text-slate-600">
                      This thread is locked. Only moderators/admins can reply.
                    </p>
                  )}

                  {selectedThread.replies &&
                  selectedThread.replies.length === 0 ? (
                    <div className="bg-white border border-slate-200 p-4 rounded-md text-center mt-4">
                      <p className="text-slate-600">
                        No replies yet—be the first!
                      </p>
                    </div>
                  ) : null}

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
                  {filteredThreads.length ? (
                    filteredThreads.map((thread, index) => (
                      <div key={thread._id} className="space-y-2">
                        <ThreadCard
                          thread={thread}
                          formatDate={formatDate}
                          showReplies={true}
                          onReplyAdded={fetchThreads}
                          currentUserId={currentUserId}
                          currentUserRole={currentUserRole}
                          onThreadUpdated={fetchThreads}
                        />
                        {!isPremium && bannerAd && index > 0 && index % 6 === 0 && (
                          <SponsoredAdCard ad={bannerAd} onClick={trackClick} compact />
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="bg-white border border-slate-200 p-4 rounded-md text-center">
                      <p className="text-slate-600 mb-4">
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

            {!isPremium && sidebarAd && (
              <div className="w-full lg:w-1/4">
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
                  <SponsoredAdCard ad={sidebarAd} onClick={trackClick} compact />
                </div>
              </div>
            )}
          </div>
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
