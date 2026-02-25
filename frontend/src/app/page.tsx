// frontend/src/app/page.tsx
"use client";

import { Suspense, useState, useEffect, useRef, useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { isAxiosError } from "axios";
import api from "../utils/api";
import { clearStoredAuth } from "../utils/authStorage";
import { trackEvent } from "../utils/analytics";
import Link from "next/link";
import SearchBar from "../components/threads/SearchBar";
import NewThreadButton from "../components/threads/NewThreadButton";
import Header from "../components/Header";
import formatDate from "../utils/formatDate";
import SponsoredAdCard from "../components/ads/SponsoredAdCard";
import {
  Activity,
  CalendarPlus,
  Clock3,
  Flame,
  Gem,
  FolderTree,
  LogIn,
  Megaphone,
  MessageCircle,
  MessagesSquare,
  Pin,
  PenSquare,
  ShieldAlert,
  Sparkles,
  Tag,
  CheckCircle2,
  UserRound,
} from "lucide-react";

type Reply = {
  _id: string;
  body: string;
  userId: { _id?: string; email: string; flair?: string } | null;
  createdAt: string;
};

type Thread = {
  _id: string;
  title: string;
  body: string;
  userId: { _id?: string; email: string; flair?: string } | null;
  category: string;
  createdAt: string;
  replyCount?: number;
  latestReplyAt?: string | null;
  latestReplyUser?: { email: string; flair?: string | null } | null;
  replies?: Reply[];
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
  status?: "pending" | "active" | "expired";
};

type SortMode = "latest" | "top" | "unanswered";
type ActiveFilter = "all" | "forYou" | "unread" | "following" | "solved" | "mostActive";
const HOME_CATEGORIES = ["General", "Gist", "Politics", "Romance"] as const;

const parseSortMode = (value: string | null): SortMode => {
  if (value === "top" || value === "unanswered") return value;
  return "latest";
};

const getLatestActivity = (thread: Thread) => {
  if (thread.latestReplyAt) {
    return new Date(thread.latestReplyAt);
  }
  if (!thread.replies || thread.replies.length === 0) {
    return new Date(thread.createdAt);
  }
  const replyDates = thread.replies.map((reply) => new Date(reply.createdAt));
  return new Date(Math.max(...replyDates.map((d) => d.getTime())));
};

const getReplyCount = (thread: Thread) => {
  if (typeof thread.replyCount === "number") return thread.replyCount;
  return thread.replies?.length || 0;
};

const getLatestReplyMeta = (thread: Thread) => {
  if (thread.latestReplyUser?.email) {
    return {
      email: thread.latestReplyUser.email,
      flair: thread.latestReplyUser.flair || null,
    };
  }
  if (thread.replies?.length) {
    const latestReply = thread.replies[0];
    return {
      email: latestReply.userId?.email || "",
      flair: latestReply.userId?.flair || null,
    };
  }
  return null;
};

const getEmailHandle = (email?: string | null) => {
  if (!email) return "Unknown";
  return email.split("@")[0] || "Unknown";
};

const getHandleInitial = (email?: string | null) => {
  const handle = getEmailHandle(email);
  return handle.slice(0, 1).toUpperCase();
};

const hasUserInIdList = (ids: unknown[] | undefined, userId: string) => {
  if (!ids?.length) return false;
  return ids.some((id) => String(id) === userId);
};

function HomeContent() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [allThreads, setAllThreads] = useState<Thread[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [bannerAd, setBannerAd] = useState<Ad | null>(null);
  const [sidebarAds, setSidebarAds] = useState<Ad[]>([]);
  const [message, setMessage] = useState<string>("");
  const [isLoadingThreads, setIsLoadingThreads] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [threadsPage, setThreadsPage] = useState(1);
  const [hasMoreThreads, setHasMoreThreads] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("all");
  const [isPremium, setIsPremium] = useState(false);
  const [isProfileCompleted, setIsProfileCompleted] = useState<boolean | null>(null);
  const [lastVisitAt, setLastVisitAt] = useState<number>(0);
  const [viewedCategories, setViewedCategories] = useState<string[]>([]);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [sortMode, setSortMode] = useState<SortMode>(() => {
    if (typeof window === "undefined") return "latest";
    return parseSortMode(
      new URLSearchParams(window.location.search).get("sort"),
    );
  });
  const newThreadButtonRef = useRef<HTMLButtonElement>(null);
  const getAxiosMessage = (err: unknown, fallback: string) =>
    isAxiosError<{ message?: string }>(err)
      ? err.response?.data?.message || fallback
      : fallback;

  const trendingTopics = [
    "Suya joints",
    "NYSC camp",
    "Lagos traffic",
    "Best jollof",
  ];
  const categoryCounts = useMemo(() => {
    const counts = Object.fromEntries(HOME_CATEGORIES.map((cat) => [cat, 0]));
    for (const thread of allThreads) {
      const matchedCategory = HOME_CATEGORIES.find(
        (category) => category.toLowerCase() === thread.category.toLowerCase(),
      );
      if (matchedCategory) counts[matchedCategory] += 1;
    }
    return counts;
  }, [allThreads]);
  const sortedThreads = useMemo(() => {
    const list = [...threads];

    if (sortMode === "unanswered") {
      return list
        .filter((thread) => getReplyCount(thread) === 0)
        .sort(
          (a, b) =>
            getLatestActivity(b).getTime() - getLatestActivity(a).getTime(),
        );
    }

    if (sortMode === "top") {
      return list.sort((a, b) => {
        const replyDiff = getReplyCount(b) - getReplyCount(a);
        if (replyDiff !== 0) return replyDiff;
        return getLatestActivity(b).getTime() - getLatestActivity(a).getTime();
      });
    }

    return list.sort(
      (a, b) => getLatestActivity(b).getTime() - getLatestActivity(a).getTime(),
    );
  }, [threads, sortMode]);
  const filteredThreads = useMemo(() => {
    return sortedThreads.filter((thread) => {
      if (activeFilter === "all") return true;
      if (activeFilter === "mostActive") return getReplyCount(thread) >= 5;
      if (activeFilter === "solved") return Boolean((thread as { isSolved?: boolean }).isSolved);
      if (activeFilter === "following") {
        if (!currentUserId) return false;
        const bookmarks = (thread as { bookmarks?: unknown[] }).bookmarks || [];
        return hasUserInIdList(bookmarks, currentUserId);
      }
      if (activeFilter === "unread") {
        if (!lastVisitAt) return false;
        return getLatestActivity(thread).getTime() > lastVisitAt;
      }
      if (activeFilter === "forYou") {
        const category = String(thread.category || "").toLowerCase();
        if (viewedCategories.some((item) => item.toLowerCase() === category)) {
          return true;
        }
        if (!currentUserId) return false;
        const bookmarks = (thread as { bookmarks?: unknown[] }).bookmarks || [];
        const likes = (thread as { likes?: unknown[] }).likes || [];
        return (
          hasUserInIdList(bookmarks, currentUserId) ||
          hasUserInIdList(likes, currentUserId)
        );
      }
      return true;
    });
  }, [sortedThreads, activeFilter, currentUserId, lastVisitAt, viewedCategories]);
  const hasAnyThreads = threads.length > 0;
  const communityMetrics = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    ).getTime();
    const totalTopics = allThreads.length;
    const totalReplies = allThreads.reduce(
      (sum, thread) => sum + getReplyCount(thread),
      0,
    );
    const unansweredTopics = allThreads.filter(
      (thread) => getReplyCount(thread) === 0,
    ).length;
    const newToday = allThreads.filter(
      (thread) => new Date(thread.createdAt).getTime() >= startOfToday,
    ).length;
    const activeUsers = new Set<string>();
    for (const thread of allThreads) {
      if (thread.userId?.email) activeUsers.add(thread.userId.email);
      if (thread.latestReplyUser?.email)
        activeUsers.add(thread.latestReplyUser.email);
    }
    return {
      totalTopics,
      totalReplies,
      unansweredTopics,
      activeUsersCount: activeUsers.size,
      newToday,
    };
  }, [allThreads]);

  const fetchBannerAd = async () => {
    try {
      const res = await api.get<{ ads: Ad[]; message: string }>("/ads", {
        params: { status: "active", type: "banner" },
      });
      const activeBanners = res.data.ads.filter((ad) => ad.budget >= ad.cpc);
      if (activeBanners.length > 0) {
        const randomIndex = Math.floor(Math.random() * activeBanners.length);
        const selectedBanner = activeBanners[randomIndex];
        setBannerAd(selectedBanner);
        await api.get(`/ads/impression/${selectedBanner._id}`);
      } else {
        setBannerAd(null);
      }
    } catch (err) {
      console.error("Banner fetch error:", err);
      setBannerAd(null);
    }
  };

  const fetchSidebarAds = async () => {
    try {
      const res = await api.get<{ ads: Ad[]; message: string }>("/ads", {
        params: { status: "active", type: "sidebar" },
      });
      const activeSidebars = res.data.ads.filter((ad) => ad.budget >= ad.cpc);
      if (activeSidebars.length > 0) {
        const shuffled = activeSidebars.sort(() => 0.5 - Math.random());
        const selectedSidebars = shuffled.slice(
          0,
          Math.min(4, shuffled.length),
        );
        setSidebarAds(selectedSidebars);
        await Promise.all(
          selectedSidebars.map((ad) => api.get(`/ads/impression/${ad._id}`)),
        );
      } else {
        setSidebarAds([]);
      }
    } catch (err) {
      console.error("Sidebar fetch error:", err);
      setSidebarAds([]);
    }
  };

  const trackClick = async (adId: string) => {
    try {
      await api.post(`/ads/click/${adId}`);
    } catch (err) {
      console.error("Click track error:", err);
    }
  };

  // Auto-shuffle sidebar ads every 15 seconds
  useEffect(() => {
    if (isPremium) return; // No shuffling for premium users

    const interval = setInterval(() => {
      fetchSidebarAds();
    }, 120000); // 2 minutes

    return () => clearInterval(interval); // Cleanup on unmount
  }, [isPremium]);

  useEffect(() => {
    const savedSearches = localStorage.getItem("recentSearches");
    if (savedSearches) setRecentSearches(JSON.parse(savedSearches));
    const cachedViewedCategories = localStorage.getItem("homeViewedCategories");
    if (cachedViewedCategories) {
      try {
        setViewedCategories(JSON.parse(cachedViewedCategories));
      } catch {
        setViewedCategories([]);
      }
    }
    const cachedLastVisit = Number(localStorage.getItem("homeLastVisitAt") || "0");
    setLastVisitAt(Number.isFinite(cachedLastVisit) ? cachedLastVisit : 0);
    localStorage.setItem("homeLastVisitAt", String(Date.now()));
  }, []);

  useEffect(() => {
    setSortMode(parseSortMode(searchParams.get("sort")));
  }, [searchParams]);

  const fetchThreads = useCallback(async (page = 1, append = false) => {
    try {
      if (append) setIsLoadingMore(true);
      else setIsLoadingThreads(true);
      const res = await api.get<{
        threads: Thread[];
        message?: string;
        pagination?: { page?: number; totalPages?: number; hasNext?: boolean };
      }>("/threads", {
        params: { page, pageSize: 20 },
      });
      const rows = res.data.threads || [];
      const nextPage = Number(res.data.pagination?.page || page);
      setThreadsPage(nextPage);
      setHasMoreThreads(Boolean(res.data.pagination?.hasNext));
      if (append) {
        setAllThreads((prev) => {
          const seen = new Set(prev.map((thread) => thread._id));
          const merged = [...prev];
          for (const row of rows) {
            if (!seen.has(row._id)) merged.push(row);
          }
          return merged;
        });
        setThreads((prev) => {
          const seen = new Set(prev.map((thread) => thread._id));
          const merged = [...prev];
          for (const row of rows) {
            if (!seen.has(row._id)) merged.push(row);
          }
          return merged;
        });
      } else {
        setAllThreads(rows);
        setThreads(rows);
      }
      setMessage(res.data.message || "");
    } catch (err: unknown) {
      if (isAxiosError(err)) {
        setMessage(getAxiosMessage(err, "Fetch scatter o!"));
      } else {
        setMessage("No gist yet—drop your own!");
      }
    } finally {
      if (append) setIsLoadingMore(false);
      else setIsLoadingThreads(false);
    }
  }, []);

  useEffect(() => {
    const checkPremiumAndAds = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const res = await api.get("/users/me", {
            headers: { Authorization: `Bearer ${token}` },
          });
          setIsPremium(res.data.isPremium);
          setCurrentUserId(res.data._id || null);
          setIsProfileCompleted(
            typeof res.data.profileCompleted === "boolean"
              ? res.data.profileCompleted
              : null,
          );
          setIsLoggedIn(true);
          if (!res.data.isPremium) {
            await fetchBannerAd();
            await fetchSidebarAds();
          }
        } catch (err) {
          console.error("User check error:", err);
          clearStoredAuth();
          setIsLoggedIn(false);
          setMessage("Token scatter—abeg login again!");
          setTimeout(() => router.push("/login"), 1000);
          return;
        }
      } else {
        setCurrentUserId(null);
        setIsProfileCompleted(null);
        await fetchBannerAd();
        await fetchSidebarAds();
      }
      fetchThreads(1, false);
    };
    checkPremiumAndAds();
  }, [router, fetchThreads]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    setSelectedCategory(null);
    setActiveFilter("all");
    try {
      setIsLoadingThreads(true);
      const res = await api.get<SearchResponse>(`/threads/search?q=${query}`);
      setThreads(res.data.threads || []);
      setMessage(res.data.message);
      setHasMoreThreads(false);

      if (query.trim()) {
        const updatedSearches = [
          query,
          ...recentSearches.filter((s) => s !== query),
        ].slice(0, 5);
        setRecentSearches(updatedSearches);
        localStorage.setItem("recentSearches", JSON.stringify(updatedSearches));
      }
    } catch (err: unknown) {
      if (isAxiosError(err)) {
        setMessage(getAxiosMessage(err, "Search scatter o!"));
      } else {
        setMessage("No gist match—try another search!");
      }
    } finally {
      setIsLoadingThreads(false);
    }
  };

  const handleSubmitThread = async (
    title: string,
    body: string,
    category: string,
  ) => {
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
      await fetchThreads();
    } catch (err: unknown) {
      if (isAxiosError<{ message?: string }>(err)) {
        const errorMsg = err.response?.data?.message || "Thread scatter o!";
        setMessage(errorMsg);
        if (err.response?.status === 401) {
          setMessage("Token don expire—abeg login again!");
          clearStoredAuth();
          setTimeout(() => router.push("/login"), 1000);
        } else if (
          err.response?.status === 403 &&
          (err.response?.data?.message || "").toLowerCase().includes("banned")
        ) {
          setMessage("You don dey banned—appeal now!");
          setTimeout(() => router.push("/appeal"), 1000);
        }
      } else {
        setMessage("Thread scatter o!");
      }
    }
  };

  const handleLogout = () => {
    clearStoredAuth();
    setIsLoggedIn(false);
    setCurrentUserId(null);
    router.push("/login");
  };

  const handleCategoryFilter = (category: string | null) => {
    setSelectedCategory(category);
    setActiveFilter("all");
    setSearchQuery("");
    if (!category) {
      setThreads(allThreads);
      setMessage("");
    } else {
      const filtered = allThreads.filter(
        (thread) => thread.category.toLowerCase() === category.toLowerCase(),
      );
      setThreads(filtered);
      setMessage(
        filtered.length
          ? `${filtered.length} thread${
              filtered.length > 1 ? "s" : ""
            } in ${category}`
          : `No threads in ${category} yet—start one!`,
      );
    }
  };

  const handleLoadMore = async () => {
    if (!hasMoreThreads || isLoadingMore || isLoadingThreads || searchQuery.trim()) {
      return;
    }
    await fetchThreads(threadsPage + 1, true);
  };

  const trackThreadView = (thread: Thread) => {
    const category = String(thread.category || "").trim();
    if (!category) return;
    setViewedCategories((prev) => {
      const next = [category, ...prev.filter((item) => item.toLowerCase() !== category.toLowerCase())].slice(0, 8);
      localStorage.setItem("homeViewedCategories", JSON.stringify(next));
      return next;
    });
  };

  const handleSortChange = (nextSort: SortMode) => {
    setSortMode(nextSort);
    const nextParams = new URLSearchParams(searchParams.toString());
    if (nextSort === "latest") {
      nextParams.delete("sort");
    } else {
      nextParams.set("sort", nextSort);
    }
    const query = nextParams.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  };

  const sortOptions: Array<{
    id: SortMode;
    label: string;
    icon: typeof Clock3;
  }> = [
    { id: "latest", label: "Latest", icon: Clock3 },
    { id: "top", label: "Top", icon: Flame },
    { id: "unanswered", label: "Unanswered", icon: MessagesSquare },
  ];

  return (
    <div className="min-h-screen bg-slate-100 px-3 pb-20 pt-3 md:px-5 md:pt-5">
      <div className="mx-auto mb-4 max-w-7.5xl">
        <Header
          title="NaijaTalk Forum"
          isLoggedIn={isLoggedIn}
          onLogout={handleLogout}
          compact
          secondaryLink={{ href: "/premium", label: "Premium" }}
        />
        {!isLoggedIn && (
          <div className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold text-emerald-900">
                  New to NaijaTalk?
                </p>
                <p className="mt-1 text-sm text-emerald-800">
                  Join to post threads, save marketplace listings, enter contests, and access wallet tools.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/login"
                  onClick={() => trackEvent("home_guest_cta_click", { target: "login" })}
                  className="inline-flex items-center gap-1 rounded-md bg-green-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-800"
                >
                  <LogIn className="h-4 w-4" />
                  Login
                </Link>
                <Link
                  href="/signup"
                  onClick={() => trackEvent("home_guest_cta_click", { target: "signup" })}
                  className="inline-flex items-center gap-1 rounded-md border border-emerald-300 bg-white px-3 py-1.5 text-sm font-medium text-emerald-800 hover:bg-emerald-100"
                >
                  <PenSquare className="h-4 w-4" />
                  Sign Up
                </Link>
              </div>
            </div>
          </div>
        )}
        {isLoggedIn && (
          <div className="mt-2 rounded-lg border border-sky-200 bg-sky-50 p-4 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold text-sky-900">
                  Welcome back. Continue from where you stopped.
                </p>
                <p className="mt-1 text-xs text-sky-800">
                  Jump to your most-used areas and recent interests.
                </p>
                {isProfileCompleted === false && (
                  <p className="mt-2 text-xs font-medium text-amber-700">
                    Profile setup still pending. Complete onboarding to unlock full features.
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/threads"
                  onClick={() => trackEvent("home_continue_click", { target: "threads" })}
                  className="rounded-md border border-sky-300 bg-white px-3 py-1.5 text-xs font-medium text-sky-800 hover:bg-sky-100"
                >
                  Continue Threads
                </Link>
                <Link
                  href="/marketplace"
                  onClick={() => trackEvent("home_continue_click", { target: "marketplace" })}
                  className="rounded-md border border-sky-300 bg-white px-3 py-1.5 text-xs font-medium text-sky-800 hover:bg-sky-100"
                >
                  Continue Marketplace
                </Link>
                {isProfileCompleted === false && (
                  <Link
                    href="/onboarding/profile"
                    onClick={() => trackEvent("home_continue_click", { target: "onboarding_profile" })}
                    className="rounded-md bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700"
                  >
                    Complete Profile
                  </Link>
                )}
              </div>
            </div>
            {(recentSearches.length > 0 || viewedCategories.length > 0) && (
              <div className="mt-3 border-t border-sky-200 pt-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-sky-700">
                  Recent interests
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {recentSearches.slice(0, 3).map((item) => (
                    <button
                      key={`recent-${item}`}
                      onClick={() => {
                        trackEvent("home_recent_interest_click", { kind: "search", value: item });
                        handleSearch(item);
                      }}
                      className="rounded-full border border-sky-300 bg-white px-2.5 py-1 text-[11px] text-sky-800 hover:bg-sky-100"
                    >
                      Search: {item}
                    </button>
                  ))}
                  {viewedCategories.slice(0, 3).map((item) => (
                    <button
                      key={`viewed-${item}`}
                      onClick={() => {
                        trackEvent("home_recent_interest_click", { kind: "category", value: item });
                        handleCategoryFilter(item);
                      }}
                      className="rounded-full border border-sky-300 bg-white px-2.5 py-1 text-[11px] text-sky-800 hover:bg-sky-100"
                    >
                      Category: {item}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        <div className="mt-2 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <SearchBar
            onSearch={handleSearch}
            recentSearches={recentSearches}
            trendingTopics={trendingTopics}
          />
        </div>
        <section className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-4">
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm transition-transform hover:-translate-y-0.5">
            <p className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              <MessageCircle className="h-3.5 w-3.5" />
              Topics
            </p>
            <p className="mt-1 text-xl font-semibold text-slate-900">
              {communityMetrics.totalTopics}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm transition-transform hover:-translate-y-0.5">
            <p className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              <Activity className="h-3.5 w-3.5" />
              Replies
            </p>
            <p className="mt-1 text-xl font-semibold text-slate-900">
              {communityMetrics.totalReplies}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm transition-transform hover:-translate-y-0.5">
            <p className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              <UserRound className="h-3.5 w-3.5" />
              Active Users
            </p>
            <p className="mt-1 text-xl font-semibold text-slate-900">
              {communityMetrics.activeUsersCount}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm transition-transform hover:-translate-y-0.5">
            <p className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              <CalendarPlus className="h-3.5 w-3.5" />
              New Today
            </p>
            <p className="mt-1 text-xl font-semibold text-slate-900">
              {communityMetrics.newToday}
            </p>
          </div>
        </section>
      </div>

      <div className="mx-auto grid max-w-7.5xl grid-cols-1 gap-4 lg:grid-cols-[220px_minmax(0,1fr)_260px]">
        <div className="w-full">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm lg:sticky lg:top-20">
            <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <FolderTree className="h-3.5 w-3.5" />
              Categories
            </h2>
            <ul className="space-y-0">
              <li>
                <button
                  onClick={() => handleCategoryFilter(null)}
                  className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors ${
                    !selectedCategory
                      ? "bg-green-50 text-green-800 font-semibold border border-green-200"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent"
                  }`}
                >
                  <span>All Categories</span>
                  <span className="text-xs text-slate-500">
                    {allThreads.length}
                  </span>
                </button>
              </li>
              {HOME_CATEGORIES.map((cat) => (
                <li key={cat}>
                  <button
                    onClick={() => handleCategoryFilter(cat)}
                    className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors ${
                      selectedCategory === cat
                        ? "bg-green-50 text-green-800 font-semibold border border-green-200"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent"
                    }`}
                  >
                    <span>{cat}</span>
                    <span className="text-xs text-slate-500">
                      {categoryCounts[cat] || 0}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="w-full min-w-0">
          {!isPremium && bannerAd && (
            <SponsoredAdCard
              ad={bannerAd}
              onClick={trackClick}
              className="mb-2"
            />
          )}

          {message && (
            <p className="text-center text-sm text-slate-600 mb-2 bg-white border border-slate-200 p-2 rounded-lg">
              {message}
              {searchQuery ? `: "${searchQuery}"` : ""}
            </p>
          )}

          <div className="sticky top-20 z-20 mb-2 flex flex-col gap-2 rounded-lg border border-slate-200 bg-white/95 px-3 py-2 backdrop-blur md:flex-row md:items-center md:justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
              <MessageCircle className="h-4 w-4" />
              Latest Discussions
            </h2>
            <div className="flex items-center gap-2">
              {sortOptions.map((option) => {
                const Icon = option.icon;
                const isActive = sortMode === option.id;
                return (
                  <button
                    key={option.id}
                    onClick={() => handleSortChange(option.id)}
                    className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-semibold uppercase tracking-wide transition-colors ${
                      isActive
                        ? "border-green-200 bg-green-50 text-green-700"
                        : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {option.label}
                  </button>
                );
              })}
              <span className="text-xs text-slate-500">
                {filteredThreads.length} topics
              </span>
            </div>
          </div>
          <div className="mb-2 flex flex-wrap gap-2">
            {[
              { id: "all", label: "All", icon: Tag },
              { id: "forYou", label: "For You", icon: Sparkles },
              { id: "unread", label: "Unread", icon: Clock3 },
              { id: "following", label: "Following", icon: Gem },
              { id: "solved", label: "Solved", icon: CheckCircle2 },
              { id: "mostActive", label: "Most Active", icon: Activity },
            ].map((option) => {
              const Icon = option.icon;
              const isActive = activeFilter === (option.id as ActiveFilter);
              return (
                <button
                  key={option.id}
                  onClick={() => setActiveFilter(option.id as ActiveFilter)}
                  className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                    isActive
                      ? "border-green-600 bg-green-600 text-white"
                      : "border-slate-300 bg-white text-slate-600 hover:border-green-400 hover:text-green-700"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {option.label}
                </button>
              );
            })}
          </div>

          {isLoadingThreads ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="h-20 animate-pulse rounded-lg border border-slate-200 bg-white"
                />
              ))}
            </div>
          ) : filteredThreads.length ? (
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
              <div className="hidden md:flex bg-slate-50 px-3 py-2 justify-between text-[11px] font-semibold uppercase tracking-wide text-slate-500 border-b border-slate-200">
                <span className="w-2/5">Thread</span>
                <span className="w-1/5 text-center">Replies</span>
                <span className="w-2/5 text-right">Last Post</span>
              </div>
              {filteredThreads.map((thread, index) => {
                const latestReplyMeta = getLatestReplyMeta(thread);
                const latestReplyName = getEmailHandle(latestReplyMeta?.email);
                const isSolved = Boolean((thread as { isSolved?: boolean }).isSolved);
                const isSticky = Boolean((thread as { isSticky?: boolean }).isSticky);
                const isLocked = Boolean((thread as { isLocked?: boolean }).isLocked);
                const isHot = getReplyCount(thread) >= 10;

                return (
                  <div key={thread._id}>
                    <div className="border-b border-slate-200 px-3 py-3 transition-all hover:-translate-y-[1px] hover:bg-slate-50 flex flex-col md:flex-row gap-2 md:gap-0 md:justify-between md:items-center">
                      <div className="w-full md:w-2/5">
                        <div className="flex items-start gap-2">
                          <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green-100 text-xs font-semibold text-green-800">
                            {getHandleInitial(thread.userId?.email || null)}
                          </span>
                          <div className="min-w-0">
                            <Link
                              href={`/threads/${thread._id}`}
                              onClick={() => trackThreadView(thread)}
                              className="line-clamp-2 text-slate-900 font-semibold hover:text-green-800"
                            >
                              {thread.title}
                            </Link>
                            <div className="mt-1 flex flex-wrap items-center gap-1 text-[11px] text-slate-500">
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-700">
                                {thread.category || "General"}
                              </span>
                              <span>Started by</span>
                              {thread.userId?._id ? (
                                <Link
                                  href={`/users/${thread.userId._id}`}
                                  className="font-medium text-blue-700 hover:underline"
                                >
                                  {getEmailHandle(thread.userId?.email || null)}
                                </Link>
                              ) : (
                                <span className="font-medium">
                                  {getEmailHandle(thread.userId?.email || null)}
                                </span>
                              )}
                              {thread.userId?.flair && (
                                <span
                                  className={`inline-block rounded px-1 text-xs text-white ${
                                    thread.userId.flair === "Oga at the Top"
                                      ? "bg-yellow-500"
                                      : "bg-green-500"
                                  }`}
                                >
                                  {thread.userId.flair}
                                </span>
                              )}
                              {isSticky && (
                                <span className="inline-flex items-center gap-0.5 rounded bg-amber-100 px-1 text-[10px] font-semibold text-amber-700">
                                  <Pin className="h-3 w-3" />
                                  Pinned
                                </span>
                              )}
                              {isLocked && (
                                <span className="inline-flex items-center gap-0.5 rounded bg-slate-200 px-1 text-[10px] font-semibold text-slate-700">
                                  <ShieldAlert className="h-3 w-3" />
                                  Locked
                                </span>
                              )}
                              {isSolved && (
                                <span className="inline-flex items-center gap-0.5 rounded bg-emerald-100 px-1 text-[10px] font-semibold text-emerald-700">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Solved
                                </span>
                              )}
                              {isHot && (
                                <span className="inline-flex items-center gap-0.5 rounded bg-rose-100 px-1 text-[10px] font-semibold text-rose-700">
                                  <Flame className="h-3 w-3" />
                                  Hot
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="w-full md:w-1/5 text-left md:text-center">
                        <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-medium">
                          {getReplyCount(thread)}
                        </span>
                      </div>
                      <div className="w-full md:w-2/5 text-left md:text-right text-[11px] text-slate-500">
                        {formatDate(getLatestActivity(thread).toISOString())}
                        {getReplyCount(thread) > 0 && latestReplyMeta && (
                          <span className="inline-flex items-center gap-1 font-medium text-slate-600 md:float-right">
                            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-semibold text-emerald-800">
                              {getHandleInitial(latestReplyMeta.email)}
                            </span>
                            <span>by {latestReplyName}</span>
                            {latestReplyMeta.flair && (
                              <span
                                className={`ml-1 inline-block text-white px-1 rounded text-xs ${
                                  latestReplyMeta.flair === "Oga at the Top"
                                    ? "bg-yellow-500"
                                    : "bg-green-500"
                                }`}
                              >
                                {latestReplyMeta.flair}
                              </span>
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                    {!isPremium && bannerAd && index > 0 && index % 7 === 0 && (
                      <div className="border-b border-slate-200 p-4 bg-slate-50">
                        <SponsoredAdCard
                          ad={bannerAd}
                          onClick={trackClick}
                          compact
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 text-center">
              <p className="text-slate-600 mb-4 text-lg">
                {hasAnyThreads
                  ? "No threads match this sort/filter yet."
                  : "No threads yet—na you go start di party!"}
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
                  <PenSquare className="mr-1 h-4 w-4" />
                  Start a New Thread
                </button>
              ) : (
                <button
                  onClick={() => router.push("/login")}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center mx-auto"
                >
                  <LogIn className="mr-1 h-4 w-4" />
                  Login to Post
                </button>
              )}
            </div>
          )}
          {!searchQuery.trim() && hasMoreThreads && (
            <div className="mt-3 flex justify-center">
              <button
                onClick={handleLoadMore}
                disabled={isLoadingMore || isLoadingThreads}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoadingMore ? "Loading more..." : "Load More Threads"}
              </button>
            </div>
          )}
        </div>

        <div className="w-full">
          <div className="mb-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-transform hover:-translate-y-0.5">
            <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <Activity className="h-3.5 w-3.5" />
              Community Pulse
            </h2>
            <div className="space-y-2 text-sm">
              <p className="flex items-center justify-between rounded-md bg-slate-50 px-2 py-1 text-slate-700">
                <span>Unanswered</span>
                <span className="font-semibold text-slate-900">
                  {communityMetrics.unansweredTopics}
                </span>
              </p>
              <p className="flex items-center justify-between rounded-md bg-slate-50 px-2 py-1 text-slate-700">
                <span>New Today</span>
                <span className="font-semibold text-slate-900">
                  {communityMetrics.newToday}
                </span>
              </p>
            </div>
            <button
              onClick={() => handleSortChange("unanswered")}
              className="mt-3 inline-flex w-full items-center justify-center gap-1 rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700"
            >
              <MessagesSquare className="h-4 w-4" />
              Review Unanswered
            </button>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm lg:sticky lg:top-20">
            <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <Megaphone className="h-3.5 w-3.5" />
              Sponsored
            </h2>
            {!isPremium && sidebarAds.length > 0 ? (
              <div className="space-y-4">
                {sidebarAds.map((ad) => (
                  <SponsoredAdCard
                    key={ad._id}
                    ad={ad}
                    onClick={trackClick}
                    compact
                  />
                ))}
              </div>
            ) : (
              !isPremium && (
                <p className="text-slate-500 text-sm">
                  Ads dey load—abeg wait small!
                </p>
              )
            )}
          </div>
        </div>
      </div>

      <NewThreadButton
        isLoggedIn={isLoggedIn}
        onSubmit={handleSubmitThread}
        buttonRef={newThreadButtonRef}
      />
    </div>
  );
}

function HomeLoading() {
  return <div className="min-h-screen bg-slate-100 p-4 md:p-6">Loading homepage...</div>;
}

export default function Home() {
  return (
    <Suspense fallback={<HomeLoading />}>
      <HomeContent />
    </Suspense>
  );
}
