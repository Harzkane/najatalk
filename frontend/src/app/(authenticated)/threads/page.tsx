// frontend/src/app/(authenticated)/threads/page.tsx
"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { isAxiosError } from "axios";
import api from "../../../utils/api";
import { clearStoredAuth } from "@/utils/authStorage";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Head from "next/head";
import ThreadCard from "../../../components/threads/ThreadCard";
import SearchBar from "../../../components/threads/SearchBar";
import NewThreadButton from "../../../components/threads/NewThreadButton";
import formatDate from "../../../utils/formatDate";
import SponsoredAdCard from "../../../components/ads/SponsoredAdCard";
import Header from "../../../components/Header";

type Thread = {
  _id: string;
  title: string;
  body: string;
  userId: {
    _id: string;
    email: string;
    flair?: string;
    username?: string;
    avatarUrl?: string | null;
  } | null;
  category: string;
  createdAt: string;
  replyCount?: number;
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

const getReplyCount = (thread: Thread) =>
  typeof thread.replyCount === "number"
    ? thread.replyCount
    : thread.replies?.length || 0;

const hasUserInIdList = (ids: unknown[] | undefined, userId: string) => {
  if (!ids?.length) return false;
  return ids.some((id) => String(id) === String(userId));
};

function ThreadsContent() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [bannerAd, setBannerAd] = useState<Ad | null>(null);
  const [sidebarAd, setSidebarAd] = useState<Ad | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<
    "user" | "mod" | "admin" | "super_admin" | null
  >(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [activeFilter, setActiveFilter] = useState<
    "all" | "unanswered" | "solved" | "bookmarked"
  >("all");
  const [isVerifyingTip, setIsVerifyingTip] = useState(false);
  const [showRepliesExpanded, setShowRepliesExpanded] = useState(true);
  const [activeReplyComposerId, setActiveReplyComposerId] = useState<
    string | null
  >(null);
  const [activeReportFormId, setActiveReportFormId] = useState<string | null>(
    null,
  );
  const router = useRouter();
  const searchParams = useSearchParams();
  const threadId = searchParams.get("id");
  const replyId = searchParams.get("replyId");
  const composeMode = searchParams.get("compose") === "1";
  const contestId = searchParams.get("contestId");
  const contestTitle = searchParams.get("contestTitle");
  const returnTo = searchParams.get("returnTo") || "/contests";

  const newThreadButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setShowRepliesExpanded(true);
    setActiveReplyComposerId(null);
    setActiveReportFormId(null);
  }, [selectedThread?._id, replyId]);

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
        const res = await api.post(
          "/users/verifyTip",
          { reference, receiverId },
          { headers: { Authorization: `Bearer ${token}` } },
        );
        setMessage(res.data.message || "Tip don land—gist too sweet!");
        if (!threadId) await fetchThreads();
        const walletRes = await api.get("/premium/wallet", {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log("[verifyTip] Wallet after tip:", walletRes.data);
        router.push("/premium");
      } catch (err: unknown) {
        let errMsg = "Tip scatter o—try again!";
        if (isAxiosError<{ message?: string }>(err)) {
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
    [router, threadId],
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
        const userRes = await api.get("/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCurrentUserId(userRes.data._id || null);
        setCurrentUserRole(
          (userRes.data.role as "user" | "mod" | "admin" | "super_admin") ||
            null,
        );
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
      const res = await api.get("/ads", {
        params: { status: "active", type: "banner" },
      });
      const activeBanners = res.data.ads.filter(
        (ad: Ad) => ad.budget >= ad.cpc,
      );
      if (activeBanners.length > 0) {
        const randomBanner =
          activeBanners[Math.floor(Math.random() * activeBanners.length)];
        setBannerAd(randomBanner);
        await api.get(`/ads/impression/${randomBanner._id}`);
      }
    } catch (err) {
      console.error("Banner fetch error:", err);
    }
  };

  const fetchSidebarAd = async () => {
    try {
      const res = await api.get("/ads", {
        params: { status: "active", type: "sidebar" },
      });
      const activeSidebars = res.data.ads.filter(
        (ad: Ad) => ad.budget >= ad.cpc,
      );
      if (activeSidebars.length > 0) {
        const randomSidebar =
          activeSidebars[Math.floor(Math.random() * activeSidebars.length)];
        setSidebarAd(randomSidebar);
        await api.get(`/ads/impression/${randomSidebar._id}`);
      }
    } catch (err) {
      console.error("Sidebar fetch error:", err);
    }
  };

  const trackClick = async (adId: string) => {
    try {
      await api.post(`/ads/click/${adId}`);
    } catch (err) {
      console.error("Click track error:", err);
    }
  };

  const fetchSingleThread = async (id: string) => {
    try {
      const res = await api.get<Thread>(`/threads/${id}`);
      setSelectedThread(res.data);
      setThreads([]);
    } catch (err: unknown) {
      if (isAxiosError<{ message?: string }>(err)) {
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
        const res = await api.get<SearchResponse>(`/threads/search?q=${query}`);
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
            JSON.stringify(updatedSearches),
          );
        }
      } catch (err: unknown) {
        if (isAxiosError<{ message?: string }>(err)) {
          setMessage(err.response?.data?.message || "Search scatter o!");
        } else {
          setMessage("No gist match—try another search!");
        }
      }
    },
    [recentSearches],
  );

  const fetchThreads = async () => {
    try {
      const res = await api.get<{
        threads: Thread[];
        message: string;
        pagination?: {
          page: number;
          pageSize: number;
          total: number;
          totalPages: number;
          hasNext: boolean;
          hasPrev: boolean;
        };
      }>("/threads");
      setThreads(res.data.threads || []);
      setMessage(res.data.message || "");
      setSelectedThread(null);
    } catch (err: unknown) {
      if (isAxiosError<{ message?: string }>(err)) {
        setMessage(err.response?.data?.message || "Fetch scatter o!");
      } else {
        setMessage("No gist yet—drop your own!");
      }
    }
  };

  const handleSubmitThread = async (
    title: string,
    body: string,
    category: string,
  ): Promise<{ _id?: string; title?: string } | void> => {
    if (!isLoggedIn) {
      setMessage("Abeg login first!");
      setTimeout(() => router.push("/login"), 1000);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await api.post<{ message: string; thread: Thread }>(
        "/threads",
        { title, body, category },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setMessage(res.data.message);
      if (!selectedThread) await fetchThreads();
      if (contestId && res.data.thread?._id) {
        const params = new URLSearchParams({
          contestId,
          threadId: res.data.thread._id,
          from: "create-thread",
        });
        router.push(`${returnTo}?${params.toString()}`);
        return { _id: res.data.thread._id, title: res.data.thread.title };
      }
      return { _id: res.data.thread?._id, title: res.data.thread?.title };
    } catch (err: unknown) {
      if (isAxiosError<{ message?: string }>(err)) {
        const errorMsg = err.response?.data?.message || "Thread scatter o!";
        setMessage(errorMsg);
        if (err.response?.status === 401) {
          setMessage("Token don expire—abeg login again!");
          clearStoredAuth();
          setTimeout(() => router.push("/login"), 1000);
        }
      } else {
        setMessage("Thread scatter o!");
      }
      return;
    }
  };

  const handleLogout = () => {
    clearStoredAuth();
    setIsLoggedIn(false);
    setCurrentUserId(null);
    setCurrentUserRole(null);
    router.push("/login");
  };

  const filteredThreads = threads.filter((thread) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "unanswered") return getReplyCount(thread) === 0;
    if (activeFilter === "solved") return Boolean(thread.isSolved);
    if (activeFilter === "bookmarked") {
      if (!currentUserId) return false;
      return hasUserInIdList(
        thread.bookmarks as unknown[] | undefined,
        currentUserId,
      );
    }
    return true;
  });
  return (
    <>
      <Head>
        <meta
          httpEquiv="Content-Security-Policy"
          content="script-src 'self' https://checkout.paystack.com 'unsafe-inline';"
        />
      </Head>
      <div className="min-h-screen bg-slate-100 p-4 md:p-6 pb-20">
        <div className="max-w-7.5xl mx-auto mb-4">
          <Header
            title={
              selectedThread
                ? selectedThread.title
                : "NaijaTalk Threads—Drop Your Gist!"
            }
            isLoggedIn={isLoggedIn}
            onLogout={handleLogout}
            loginHref="/login"
          />
        </div>

        <div className="max-w-7.5xl mx-auto">
          {!isPremium && bannerAd && (
            <SponsoredAdCard
              ad={bannerAd}
              onClick={trackClick}
              className="mb-4"
            />
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
                        | "bookmarked",
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
                    showRepliesExpanded={showRepliesExpanded}
                    onToggleRepliesExpanded={() =>
                      setShowRepliesExpanded((prev) => !prev)
                    }
                    focusReplyId={replyId}
                    onReplyAdded={() => fetchSingleThread(selectedThread._id)}
                    currentUserId={currentUserId}
                    currentUserRole={currentUserRole}
                    onThreadUpdated={() =>
                      fetchSingleThread(selectedThread._id)
                    }
                    activeReplyComposerId={activeReplyComposerId}
                    onSetActiveReplyComposerId={setActiveReplyComposerId}
                    activeReportFormId={activeReportFormId}
                    onSetActiveReportFormId={setActiveReportFormId}
                  />

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
                          showReplies={false}
                          onReplyAdded={fetchThreads}
                          currentUserId={currentUserId}
                          currentUserRole={currentUserRole}
                          onThreadUpdated={fetchThreads}
                        />
                        {!isPremium &&
                          bannerAd &&
                          index > 0 &&
                          index % 6 === 0 && (
                            <SponsoredAdCard
                              ad={bannerAd}
                              onClick={trackClick}
                              compact
                            />
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
                  <SponsoredAdCard
                    ad={sidebarAd}
                    onClick={trackClick}
                    compact
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <NewThreadButton
          isLoggedIn={isLoggedIn}
          onSubmit={handleSubmitThread}
          buttonRef={newThreadButtonRef}
          initialOpen={composeMode}
          initialTitle={
            contestTitle ? `${contestTitle} - My Contest Entry` : ""
          }
          initialBody={
            contestTitle
              ? `Contest Entry for "${contestTitle}"\n\nMy submission:\n1. \n2. \n3. `
              : ""
          }
          initialCategory="Gist"
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
