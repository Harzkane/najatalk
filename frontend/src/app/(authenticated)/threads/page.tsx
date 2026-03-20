// frontend/src/app/(authenticated)/threads/page.tsx
"use client";

import { useState, useEffect, useCallback, useRef, Suspense, useMemo } from "react";
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
import {
  DEFAULT_THREAD_CATEGORY,
  THREAD_CATEGORY_DEFINITIONS,
} from "../../../utils/threadCategories";
import { SEARCH_TAG_DEFINITIONS } from "../../../utils/searchTags";

type Thread = {
  _id: string;
  title: string;
  body: string;
  userId: {
    _id: string;
    username?: string | null;
    flair?: string;
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
  userId: { _id: string; username?: string | null; flair?: string } | null;
  createdAt: string;
  parentReplyId?: string | null;
};

type SearchResponse = {
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
  search?: {
    query: string;
    category?: string | null;
    sort: "relevance" | "latest" | "mostActive";
    unansweredOnly: boolean;
    resultCount: number;
  };
  ranking?: {
    mode: "relevance" | "latest" | "mostActive";
    signals: string[];
  };
};

type TrendingSearchQuery = {
  query: string;
  count: number;
  lastSearchedAt?: string | null;
};

type SearchInteractionOptions = {
  origin?: "submit" | "suggestion";
  suggestionKind?: "category" | "tag" | "trending" | "recent";
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
  const [trendingSearchQueries, setTrendingSearchQueries] = useState<
    TrendingSearchQuery[]
  >([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchSortMode, setSearchSortMode] = useState<
    "relevance" | "latest" | "mostActive" | "unanswered"
  >("relevance");
  const [activeFilter, setActiveFilter] = useState<
    "all" | "unanswered" | "solved" | "bookmarked"
  >("all");
  const [isDiscoveryExpanded, setIsDiscoveryExpanded] = useState(false);
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
  const resolvedSearchParams = searchParams ?? new URLSearchParams();
  const threadId = resolvedSearchParams.get("id");
  const replyId = resolvedSearchParams.get("replyId");
  const composeMode = resolvedSearchParams.get("compose") === "1";
  const contestId = resolvedSearchParams.get("contestId");
  const contestTitle = resolvedSearchParams.get("contestTitle");
  const returnTo = resolvedSearchParams.get("returnTo") || "/contests";

  const newThreadButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setShowRepliesExpanded(true);
    setActiveReplyComposerId(null);
    setActiveReportFormId(null);
  }, [selectedThread?._id, replyId]);

  const trendingTopics = useMemo(
    () => ["Suya joints", "NYSC camp", "Lagos traffic", "Best jollof"],
    [],
  );
  const effectiveTrendingTopics = useMemo(() => {
    const liveTopics = trendingSearchQueries.map((row) => row.query);
    return [...new Set([...liveTopics, ...trendingTopics])].slice(0, 8);
  }, [trendingSearchQueries, trendingTopics]);
  const featuredCategories = useMemo(
    () =>
      THREAD_CATEGORY_DEFINITIONS.filter((category) =>
        ["Trending", "News", "Football", "Jobs", "Japa", "Local Life"].includes(
          category.label,
        ),
      ),
    [],
  );

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

    const reference = resolvedSearchParams.get("reference");
    const receiverId = resolvedSearchParams.get("receiverId");
    const tipStatus = resolvedSearchParams.get("tip");

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
  }, [threadId, resolvedSearchParams, verifyTip, router]);

  useEffect(() => {
    const fetchTrendingSearchQueries = async () => {
      try {
        const res = await api.get<{
          queries: TrendingSearchQuery[];
        }>("/threads/search/trending");
        setTrendingSearchQueries(res.data.queries || []);
      } catch (err) {
        console.error("Trending searches fetch error:", err);
        setTrendingSearchQueries([]);
      }
    };
    fetchTrendingSearchQueries();
  }, []);

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
    async (query: string, _options?: SearchInteractionOptions) => {
      setSearchQuery(query);
      setActiveFilter("all");
      try {
        const res = await api.get<SearchResponse>("/threads/search", {
          params: {
            q: query,
            category: selectedCategory || undefined,
            sort:
              searchSortMode === "latest" || searchSortMode === "mostActive"
                ? searchSortMode
                : undefined,
            unansweredOnly: searchSortMode === "unanswered" ? "1" : undefined,
          },
        });
        setThreads(res.data.threads || []);
        setMessage(res.data.message);
        setSelectedThread(null);

        if (query.trim()) {
          setRecentSearches((prev) => {
            const updatedSearches = [
              query,
              ...prev.filter((s) => s !== query),
            ].slice(0, 5);
            localStorage.setItem(
              "recentSearches",
              JSON.stringify(updatedSearches),
            );
            return updatedSearches;
          });
        }
      } catch (err: unknown) {
        if (isAxiosError<{ message?: string }>(err)) {
          setMessage(err.response?.data?.message || "Search scatter o!");
        } else {
          setMessage("No gist match—try another search!");
        }
      }
    },
    [searchSortMode, selectedCategory],
  );

  useEffect(() => {
    if (selectedThread || !searchQuery.trim()) return;
    void handleSearch(searchQuery);
  }, [handleSearch, searchQuery, searchSortMode, selectedThread]);

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

  const handleCategoryFilter = (category: string | null) => {
    setSelectedCategory(category);
    setActiveFilter("all");
    setSearchQuery("");
    setSelectedThread(null);
    if (!category) {
      void fetchThreads();
      return;
    }
    const filtered = threads.filter(
      (thread) => thread.category.toLowerCase() === category.toLowerCase(),
    );
    setThreads(filtered);
    setMessage(
      filtered.length
        ? `${filtered.length} thread${filtered.length > 1 ? "s" : ""} in ${category}`
        : `No threads in ${category} yet—start one!`,
    );
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
            <div className="mb-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-800">
                    Discovery Engine
                  </p>
                  <h2 className="mt-1 text-base font-semibold text-slate-900">
                    Search the gist without losing the thread list.
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Keep search front and center, then open extra discovery tools only when you need them.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDiscoveryExpanded((value) => !value)}
                  className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700 transition-colors hover:border-emerald-300 hover:text-emerald-700"
                >
                  {isDiscoveryExpanded ? "Hide extras" : "Show discovery tools"}
                </button>
              </div>
              <SearchBar
                onSearch={handleSearch}
                recentSearches={recentSearches}
                trendingTopics={effectiveTrendingTopics}
                suggestedCategories={featuredCategories.map((category) => category.label)}
                suggestedTags={SEARCH_TAG_DEFINITIONS}
                selectedCategoryLabel={selectedCategory}
                helperText={
                  selectedCategory
                    ? `Search is currently focused on ${selectedCategory}. Reset the category to search everything.`
                    : "Search understands topics like Abuja rent, jobs, japa, football, gist, campus life, and local Nigerian conversations."
                }
              />
              {(selectedCategory || isDiscoveryExpanded) && (
                <div className="mt-2 border-t border-slate-100 pt-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      Explore categories
                    </span>
                    {featuredCategories.map((category) => {
                      const isActive = selectedCategory === category.label;
                      return (
                        <button
                          key={category.id}
                          type="button"
                          onClick={() => handleCategoryFilter(category.label)}
                          className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                            isActive
                              ? "border-emerald-600 bg-emerald-600 text-white"
                              : "border-emerald-200 bg-emerald-50 text-emerald-800 hover:border-emerald-300 hover:bg-emerald-100"
                          }`}
                        >
                          {category.label}
                        </button>
                      );
                    })}
                    {selectedCategory && (
                      <button
                        type="button"
                        onClick={() => handleCategoryFilter(null)}
                        className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                  {isDiscoveryExpanded && (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        Try tags
                      </span>
                      {SEARCH_TAG_DEFINITIONS.slice(0, 6).map((tag) => (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => handleSearch(tag.query)}
                          className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700 hover:bg-sky-100"
                        >
                          #{tag.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {!selectedThread && searchQuery.trim() && (
            <div className="mb-3 flex flex-wrap gap-2">
              {([
                { id: "relevance", label: "Relevance" },
                { id: "latest", label: "Latest" },
                { id: "mostActive", label: "Most Active" },
                { id: "unanswered", label: "Unanswered" },
              ] as const).map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setSearchSortMode(option.id)}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                    searchSortMode === option.id
                      ? "border-green-600 bg-green-600 text-white"
                      : "border-slate-300 bg-white text-slate-600 hover:border-green-400 hover:text-green-700"
                  }`}
                >
                  {option.label}
                </button>
              ))}
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
          initialCategory={DEFAULT_THREAD_CATEGORY}
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
