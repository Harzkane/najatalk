// frontend/src/app/page.tsx
"use client";

import {
  Suspense,
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
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
import { THREAD_CATEGORY_DEFINITIONS } from "../utils/threadCategories";
import { SEARCH_TAG_DEFINITIONS } from "../utils/searchTags";
import {
  Activity,
  CalendarPlus,
  Clock3,
  Compass,
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
  userId: {
    _id?: string;
    username?: string | null;
    flair?: string;
    avatarUrl?: string | null;
  } | null;
  createdAt: string;
};

type Thread = {
  _id: string;
  title: string;
  body: string;
  userId: {
    _id?: string;
    username?: string | null;
    flair?: string;
    avatarUrl?: string | null;
  } | null;
  category: string;
  createdAt: string;
  replyCount?: number;
  latestReplyAt?: string | null;
  latestReplyUser?: {
    username?: string | null;
    flair?: string | null;
    avatarUrl?: string | null;
  } | null;
  replies?: Reply[];
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
type TrendingSearchQuery = {
  query: string;
  count: number;
  lastSearchedAt?: string | null;
};

type SearchInteractionOptions = {
  origin?: "submit" | "suggestion";
  suggestionKind?: "category" | "tag" | "trending" | "recent";
};

type SortMode = "latest" | "top" | "unanswered";
type SearchSortMode = "relevance" | "latest" | "mostActive" | "unanswered";
type ActiveFilter =
  | "all"
  | "forYou"
  | "unread"
  | "following"
  | "solved"
  | "mostActive";
const HOME_CATEGORIES = THREAD_CATEGORY_DEFINITIONS.map(
  (category) => category.label,
);
const CATEGORY_METADATA = new Map(
  THREAD_CATEGORY_DEFINITIONS.map((category) => [category.label, category]),
);
const ACTIVE_FILTER_LABELS: Record<ActiveFilter, string> = {
  all: "All",
  forYou: "For You",
  unread: "Unread",
  following: "Following",
  solved: "Solved",
  mostActive: "Most Active",
};

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
  if (thread.latestReplyUser?.username || thread.latestReplyUser?.avatarUrl) {
    return {
      username: thread.latestReplyUser.username || null,
      flair: thread.latestReplyUser.flair || null,
      avatarUrl: thread.latestReplyUser.avatarUrl || null,
    };
  }
  if (thread.replies?.length) {
    const latestReply = thread.replies[0];
    return {
      username: latestReply.userId?.username || null,
      flair: latestReply.userId?.flair || null,
      avatarUrl: latestReply.userId?.avatarUrl || null,
    };
  }
  return null;
};

const getPublicHandle = (user?: {
  username?: string | null;
  avatarUrl?: string | null;
} | null) => {
  if (user?.username?.trim()) return user.username.trim();
  return "Unknown";
};

const getHandleInitial = (user?: {
  username?: string | null;
  avatarUrl?: string | null;
} | null) => {
  const handle = getPublicHandle(user);
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
  const [searchSortMode, setSearchSortMode] =
    useState<SearchSortMode>("relevance");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [trendingSearchQueries, setTrendingSearchQueries] = useState<
    TrendingSearchQuery[]
  >([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("all");
  const [isPremium, setIsPremium] = useState(false);
  const [isProfileCompleted, setIsProfileCompleted] = useState<boolean | null>(
    null,
  );
  const [lastVisitAt, setLastVisitAt] = useState<number>(0);
  const [viewedCategories, setViewedCategories] = useState<string[]>([]);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const resolvedSearchParams = searchParams ?? new URLSearchParams();
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
  const logSearchEvent = useCallback(
    (payload: {
      eventType: "search_submit" | "suggestion_click" | "result_click" | "category_filter";
      query?: string | null;
      category?: string | null;
      resultCount?: number;
      source?: string;
      threadId?: string;
    }) => {
      void api.post("/threads/search/track", payload).catch(() => {
        // Analytics should never block discovery flows.
      });
    },
    [],
  );

  const trendingTopics = useMemo(
    () => ["Suya joints", "NYSC camp", "Lagos traffic", "Best jollof"],
    [],
  );
  const effectiveTrendingTopics = useMemo(() => {
    const liveTopics = trendingSearchQueries.map((row) => row.query);
    return [...new Set([...liveTopics, ...trendingTopics])].slice(0, 8);
  }, [trendingSearchQueries, trendingTopics]);
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
  const selectedCategoryMeta = useMemo(() => {
    if (!selectedCategory) return null;
    return CATEGORY_METADATA.get(selectedCategory) || null;
  }, [selectedCategory]);
  const featuredCategories = useMemo(
    () =>
      THREAD_CATEGORY_DEFINITIONS.filter((category) =>
        ["Trending", "News", "Football", "Jobs", "Japa", "Local Life"].includes(
          category.label,
        ),
      ),
    [],
  );
  const hottestCategory = useMemo(() => {
    const ranked = [...THREAD_CATEGORY_DEFINITIONS]
      .map((category) => ({
        label: category.label,
        count: Number(categoryCounts[category.label] || 0),
      }))
      .sort((a, b) => b.count - a.count);
    return ranked[0] || null;
  }, [categoryCounts]);
  const noResultRecoveryTopics = useMemo(() => {
    if (selectedCategory) {
      return [
        `${selectedCategory} in Nigeria`,
        `Latest ${selectedCategory}`,
        `${selectedCategory} advice`,
      ];
    }
    return ["Lagos traffic", "NYSC camp", "Football transfers", "Japa advice"];
  }, [selectedCategory]);
  const sortedThreads = useMemo(() => {
    const list = [...threads];

    if (searchQuery.trim()) {
      if (searchSortMode === "unanswered") {
        return list
          .filter((thread) => getReplyCount(thread) === 0)
          .sort(
            (a, b) =>
              getLatestActivity(b).getTime() - getLatestActivity(a).getTime(),
          );
      }
      if (searchSortMode === "mostActive") {
        return list.sort((a, b) => {
          const replyDiff = getReplyCount(b) - getReplyCount(a);
          if (replyDiff !== 0) return replyDiff;
          return getLatestActivity(b).getTime() - getLatestActivity(a).getTime();
        });
      }
      if (searchSortMode === "latest") {
        return list.sort(
          (a, b) => getLatestActivity(b).getTime() - getLatestActivity(a).getTime(),
        );
      }
      return list;
    }

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
  }, [threads, sortMode, searchQuery, searchSortMode]);
  const filteredThreads = useMemo(() => {
    return sortedThreads.filter((thread) => {
      if (activeFilter === "all") return true;
      if (activeFilter === "mostActive") return getReplyCount(thread) >= 5;
      if (activeFilter === "solved")
        return Boolean((thread as { isSolved?: boolean }).isSolved);
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
  }, [
    sortedThreads,
    activeFilter,
    currentUserId,
    lastVisitAt,
    viewedCategories,
  ]);
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
    const hotTopics = allThreads.filter((thread) => getReplyCount(thread) >= 10)
      .length;
    const activeUsers = new Set<string>();
    for (const thread of allThreads) {
      if (thread.userId?.username) activeUsers.add(thread.userId.username);
      if (thread.latestReplyUser?.username) {
        activeUsers.add(thread.latestReplyUser.username);
      }
    }
    return {
      totalTopics,
      totalReplies,
      unansweredTopics,
      activeUsersCount: activeUsers.size,
      newToday,
      hotTopics,
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
    const cachedLastVisit = Number(
      localStorage.getItem("homeLastVisitAt") || "0",
    );
    setLastVisitAt(Number.isFinite(cachedLastVisit) ? cachedLastVisit : 0);
    localStorage.setItem("homeLastVisitAt", String(Date.now()));
  }, []);

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

  useEffect(() => {
    setSortMode(parseSortMode(resolvedSearchParams.get("sort")));
  }, [resolvedSearchParams]);

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

  const handleSearch = useCallback(
    async (query: string, options?: SearchInteractionOptions) => {
      setSearchQuery(query);
      setActiveFilter("all");
      try {
        setIsLoadingThreads(true);
        if (options?.origin === "suggestion") {
          logSearchEvent({
            eventType: "suggestion_click",
            query,
            category: selectedCategory || null,
            source: `home:${options.suggestionKind || "unknown"}`,
          });
        }
        trackEvent("home_search_submit", {
          query,
          category: selectedCategory || "all",
        });
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
        setHasMoreThreads(false);
        setSearchSortMode("relevance");
        logSearchEvent({
          eventType: "search_submit",
          query,
          category: selectedCategory || null,
          resultCount: (res.data.threads || []).length,
          source: "home",
        });

        if ((res.data.threads || []).length === 0) {
          trackEvent("home_search_no_results", {
            query,
            category: selectedCategory || "all",
          });
        }

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
    },
    [logSearchEvent, recentSearches, selectedCategory],
  );

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

  const handleCategoryFilter = (
    category: string | null,
    source = "home:category",
  ) => {
    setSelectedCategory(category);
    setActiveFilter("all");
    setSearchQuery("");
    if (category) {
      logSearchEvent({
        eventType: "category_filter",
        category,
        source,
      });
    }
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
    if (
      !hasMoreThreads ||
      isLoadingMore ||
      isLoadingThreads ||
      searchQuery.trim()
    ) {
      return;
    }
    await fetchThreads(threadsPage + 1, true);
  };

  const trackThreadView = (thread: Thread) => {
    const category = String(thread.category || "").trim();
    if (searchQuery.trim()) {
      logSearchEvent({
        eventType: "result_click",
        query: searchQuery,
        category: selectedCategory || category || null,
        source: "home:result",
        threadId: thread._id,
      });
    }
    if (!category) return;
    setViewedCategories((prev) => {
      const next = [
        category,
        ...prev.filter((item) => item.toLowerCase() !== category.toLowerCase()),
      ].slice(0, 8);
      localStorage.setItem("homeViewedCategories", JSON.stringify(next));
      return next;
    });
  };

  const handleSortChange = (nextSort: SortMode) => {
    setSortMode(nextSort);
    const nextParams = new URLSearchParams(resolvedSearchParams.toString());
    const safePathname = pathname || "/";
    if (nextSort === "latest") {
      nextParams.delete("sort");
    } else {
      nextParams.set("sort", nextSort);
    }
    const query = nextParams.toString();
    router.replace(query ? `${safePathname}?${query}` : safePathname, {
      scroll: false,
    });
  };
  const activeDiscoveryTags = useMemo(() => {
    const tags: Array<{ key: string; label: string; clear?: () => void }> = [];

    if (searchQuery.trim()) {
      tags.push({
        key: `search-${searchQuery}`,
        label: `Search: ${searchQuery}`,
        clear: () => {
          setSearchQuery("");
          setThreads(allThreads);
          setMessage("");
        },
      });
    }

    if (selectedCategory) {
      tags.push({
        key: `category-${selectedCategory}`,
        label: `Category: ${selectedCategory}`,
        clear: () => handleCategoryFilter(null, "home:reset"),
      });
    }

    if (activeFilter !== "all") {
      tags.push({
        key: `filter-${activeFilter}`,
        label: `View: ${ACTIVE_FILTER_LABELS[activeFilter]}`,
        clear: () => setActiveFilter("all"),
      });
    }

    if (searchQuery.trim() && searchSortMode !== "relevance") {
      tags.push({
        key: `search-sort-${searchSortMode}`,
        label: `Sort: ${
          searchSortMode === "mostActive"
            ? "Most Active"
            : searchSortMode === "latest"
              ? "Latest"
              : "Unanswered"
        }`,
        clear: () => setSearchSortMode("relevance"),
      });
    }

    if (!searchQuery.trim() && sortMode !== "latest") {
      tags.push({
        key: `sort-${sortMode}`,
        label: `Sort: ${sortMode === "top" ? "Top" : "Unanswered"}`,
        clear: () => handleSortChange("latest"),
      });
    }

    return tags;
  }, [
    activeFilter,
    allThreads,
    handleCategoryFilter,
    handleSortChange,
    searchQuery,
    searchSortMode,
    selectedCategory,
    sortMode,
  ]);

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
                  Join to post threads, save marketplace listings, enter
                  contests, and access wallet tools.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/login"
                  onClick={() =>
                    trackEvent("home_guest_cta_click", { target: "login" })
                  }
                  className="inline-flex items-center gap-1 rounded-md bg-green-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-800"
                >
                  <LogIn className="h-4 w-4" />
                  Login
                </Link>
                <Link
                  href="/signup"
                  onClick={() =>
                    trackEvent("home_guest_cta_click", { target: "signup" })
                  }
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
                    Profile setup still pending. Complete onboarding to unlock
                    full features.
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/threads"
                  onClick={() =>
                    trackEvent("home_continue_click", { target: "threads" })
                  }
                  className="rounded-md border border-sky-300 bg-white px-3 py-1.5 text-xs font-medium text-sky-800 hover:bg-sky-100"
                >
                  Continue Threads
                </Link>
                <Link
                  href="/marketplace"
                  onClick={() =>
                    trackEvent("home_continue_click", { target: "marketplace" })
                  }
                  className="rounded-md border border-sky-300 bg-white px-3 py-1.5 text-xs font-medium text-sky-800 hover:bg-sky-100"
                >
                  Continue Marketplace
                </Link>
                {isProfileCompleted === false && (
                  <Link
                    href="/onboarding/profile"
                    onClick={() =>
                      trackEvent("home_continue_click", {
                        target: "onboarding_profile",
                      })
                    }
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
                        trackEvent("home_recent_interest_click", {
                          kind: "search",
                          value: item,
                        });
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
                        trackEvent("home_recent_interest_click", {
                          kind: "category",
                          value: item,
                        });
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
        <section className="mt-2 overflow-hidden rounded-[1.25rem] border border-emerald-200 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.22),_transparent_35%),linear-gradient(135deg,_#f7fee7_0%,_#ecfccb_28%,_#ffffff_100%)] p-4 shadow-sm md:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="inline-flex items-center gap-2 rounded-full border border-emerald-300/80 bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-800">
                <Compass className="h-3.5 w-3.5" />
                Discover Nigeria In Real Time
              </p>
              <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
                Search conversations, scan hot categories, and jump straight into the gist.
              </h2>
              <p className="mt-2 max-w-xl text-sm text-slate-700 md:text-[15px]">
                From Abuja rent wahala and campus updates to jobs, japa plans,
                local life, and breaking news, NaijaTalk helps people find both
                community gist and practical answers fast.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/70 bg-white/80 px-3 py-2 shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Hot In Nigeria
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {hottestCategory?.label || "General"}
                </p>
                <p className="text-xs text-slate-500">
                  {hottestCategory?.count || 0} topics
                </p>
              </div>
              <div className="rounded-2xl border border-white/70 bg-white/80 px-3 py-2 shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Fresh Discussions
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {communityMetrics.newToday} started today
                </p>
                <p className="text-xs text-slate-500">Latest conversations worth checking</p>
              </div>
              <div className="rounded-2xl border border-white/70 bg-white/80 px-3 py-2 shadow-sm col-span-2 sm:col-span-1">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Utility + Community
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  Search + Categories
                </p>
                <p className="text-xs text-slate-500">News, jobs, gist, Abuja, and daily life</p>
              </div>
            </div>
          </div>
          {trendingSearchQueries.length > 0 && (
            <div className="mt-4 border-t border-emerald-200/80 pt-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-800">
                  Popular Now
                </span>
                {trendingSearchQueries.slice(0, 6).map((row) => (
                  <button
                    key={`popular-${row.query}`}
                    type="button"
                    onClick={() => handleSearch(row.query)}
                    className="inline-flex items-center gap-1 rounded-full border border-white/80 bg-white/85 px-3 py-1 text-xs font-semibold text-slate-800 shadow-sm hover:bg-white"
                  >
                    <Flame className="h-3.5 w-3.5 text-amber-500" />
                    {row.query}
                    <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600">
                      {row.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>
        <div className="relative mt-2 overflow-visible rounded-[1.35rem] border border-emerald-200/80 bg-[linear-gradient(135deg,_rgba(255,255,255,0.98),_rgba(248,250,252,0.96))] p-4 shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[1.35rem]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.12),transparent_32%),radial-gradient(circle_at_85%_18%,rgba(56,189,248,0.12),transparent_24%),radial-gradient(circle_at_50%_82%,rgba(250,204,21,0.08),transparent_22%)]" />
            <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(148,163,184,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.1)_1px,transparent_1px)] [background-size:28px_28px]" />
            <div className="search-float-soft absolute -left-8 top-4 h-24 w-24 rounded-full bg-emerald-300/25 blur-2xl" />
            <div className="search-float-drift absolute right-6 top-6 h-20 w-20 rounded-full bg-sky-300/25 blur-2xl" />
            <div className="search-float-soft absolute left-[12%] top-[20%] h-12 w-28 rounded-full border border-emerald-300/40 bg-white/35" />
            <div className="search-float-drift absolute right-[12%] top-[28%] h-11 w-24 rounded-full border border-sky-300/40 bg-white/35" />
            <div className="search-float-drift absolute bottom-10 left-[12%] h-12 w-28 rounded-full border border-emerald-300/40 bg-white/35" />
            <div className="search-float-soft absolute bottom-12 right-[10%] h-12 w-24 rounded-full border border-sky-300/40 bg-white/35" />
            <div className="search-float-orbit absolute left-[47%] top-[42%] h-16 w-16 rounded-full border border-emerald-300/50 bg-white/40 shadow-sm" />
            <div className="search-float-soft absolute left-[24%] top-[26%] h-2.5 w-2.5 rounded-full bg-emerald-500/70" />
            <div className="search-float-drift absolute left-[44%] top-[18%] h-2.5 w-2.5 rounded-full bg-sky-500/70" />
            <div className="search-float-soft absolute left-[68%] top-[34%] h-2.5 w-2.5 rounded-full bg-amber-500/70" />
            <div className="search-float-drift absolute left-[31%] top-[56%] h-2.5 w-2.5 rounded-full bg-teal-500/70" />
            <svg
              className="search-float-drift absolute inset-0 h-full w-full"
              viewBox="0 0 900 520"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              preserveAspectRatio="none"
            >
              <path
                d="M-40 214C82 154 192 140 302 172C400 200 488 268 594 270C708 272 802 210 940 164"
                stroke="rgba(15,118,110,0.24)"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <path
                d="M-30 330C80 284 194 260 302 286C408 312 494 384 602 386C712 388 808 340 930 296"
                stroke="rgba(37,99,235,0.18)"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <path
                d="M120 82C220 54 314 60 396 108C470 150 546 194 660 180C746 170 824 134 902 102"
                stroke="rgba(245,158,11,0.12)"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div className="relative z-10 space-y-4">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_280px] lg:items-center">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-800">
                  Discovery Engine
                </p>
                <h3 className="mt-2 text-lg font-semibold tracking-tight text-slate-900 md:text-xl">
                  Search the gist, catch the signal, and move straight into the conversation.
                </h3>
                <p className="mt-2 max-w-2xl text-sm text-slate-600">
                  Built for Nigerian browsing habits, the Search Brain connects trending talk,
                  practical advice, local questions, and category signals in one place.
                </p>
              </div>
              <div
                aria-hidden="true"
                className="min-h-[156px] overflow-hidden rounded-2xl border border-white/70 bg-white/20 shadow-sm backdrop-blur-[1.5px]"
              >
                <div className="flex h-full min-h-[156px] items-end p-4">
                  <div className="rounded-2xl border border-white/75 bg-white/58 px-4 py-3 shadow-sm backdrop-blur-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-800">
                      Search Signals
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      Categories, live queries, and local intent all meet here.
                    </p>
                    <p className="mt-1 text-xs text-slate-600">
                      Designed to feel like discovery is happening before you even type.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="rounded-[1.1rem] border border-white/65 bg-white/18 p-3 shadow-sm backdrop-blur-[1.5px] md:p-4">
              <div className="relative">
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
                <div className="mt-2 border-t border-white/60 pt-3">
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
                              : "border-emerald-200 bg-emerald-50/90 text-emerald-800 hover:border-emerald-300 hover:bg-emerald-100"
                          }`}
                        >
                          {category.label}
                          <span
                            className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                              isActive
                                ? "bg-white/20 text-white"
                                : "bg-white text-emerald-700"
                            }`}
                          >
                            {categoryCounts[category.label] || 0}
                          </span>
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
                  {selectedCategoryMeta && (
                    <p className="mt-2 text-sm text-slate-600">
                      <span className="font-semibold text-slate-900">
                        {selectedCategoryMeta.label}
                      </span>{" "}
                      : {selectedCategoryMeta.description}
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      Try tags
                    </span>
                    {SEARCH_TAG_DEFINITIONS.slice(0, 6).map((tag) => (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => handleSearch(tag.query)}
                        className="rounded-full border border-sky-200 bg-sky-50/90 px-3 py-1 text-xs font-semibold text-sky-700 hover:bg-sky-100"
                      >
                        #{tag.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
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
        <div className="hidden w-full lg:block">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm lg:sticky lg:top-10">
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
                    <span className="min-w-0">
                      <span className="block truncate">{cat}</span>
                      <span className="mt-0.5 block text-[11px] font-normal text-slate-500">
                        {CATEGORY_METADATA.get(cat)?.description ||
                          "Join the conversation."}
                      </span>
                    </span>
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

          <div className="sticky top-0 z-20 mb-2 flex flex-col gap-2 rounded-lg border border-slate-200 bg-white/95 px-3 py-2 backdrop-blur md:flex-row md:items-center md:justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
              <MessageCircle className="h-4 w-4" />
              {selectedCategory ? `${selectedCategory} Discussions` : "Fresh Discussions"}
            </h2>
            <div className="flex items-center gap-2">
              {searchQuery.trim()
                ? ([
                    { id: "relevance", label: "Relevance", icon: Sparkles },
                    { id: "latest", label: "Latest", icon: Clock3 },
                    { id: "mostActive", label: "Most Active", icon: Activity },
                    {
                      id: "unanswered",
                      label: "Unanswered",
                      icon: MessagesSquare,
                    },
                  ] as const).map((option) => {
                    const Icon = option.icon;
                    const isActive = searchSortMode === option.id;
                    return (
                      <button
                        key={option.id}
                        onClick={() => setSearchSortMode(option.id)}
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
                  })
                : sortOptions.map((option) => {
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
          {activeDiscoveryTags.length > 0 && (
            <div className="mb-2 flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Active view
              </span>
              {activeDiscoveryTags.map((tag) => (
                <button
                  key={tag.key}
                  type="button"
                  onClick={tag.clear}
                  className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-semibold text-emerald-800 hover:bg-emerald-50"
                >
                  {tag.label}
                  <span className="text-[10px] uppercase text-emerald-600">
                    Reset
                  </span>
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setActiveFilter("all");
                  setSearchSortMode("relevance");
                  handleSortChange("latest");
                  handleCategoryFilter(null, "home:reset-all");
                }}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Reset all
              </button>
            </div>
          )}
          <div className="mb-2 overflow-x-auto lg:hidden">
            <div className="flex min-w-max gap-2 pb-1">
              <button
                type="button"
                onClick={() => handleCategoryFilter(null)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  !selectedCategory
                    ? "border-green-600 bg-green-600 text-white"
                    : "border-slate-300 bg-white text-slate-600"
                }`}
              >
                All Categories
              </button>
              {HOME_CATEGORIES.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => handleCategoryFilter(category)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                    selectedCategory === category
                      ? "border-green-600 bg-green-600 text-white"
                      : "border-slate-300 bg-white text-slate-600"
                  }`}
                >
                  {category} ({categoryCounts[category] || 0})
                </button>
              ))}
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
                const latestReplyName = getPublicHandle(latestReplyMeta);
                const isSolved = Boolean(
                  (thread as { isSolved?: boolean }).isSolved,
                );
                const isSticky = Boolean(
                  (thread as { isSticky?: boolean }).isSticky,
                );
                const isLocked = Boolean(
                  (thread as { isLocked?: boolean }).isLocked,
                );
                const isHot = getReplyCount(thread) >= 10;

                return (
                  <div key={thread._id}>
                    <div className="border-b border-slate-200 px-3 py-3 transition-all hover:-translate-y-[1px] hover:bg-slate-50 flex flex-col md:flex-row gap-2 md:gap-0 md:justify-between md:items-center">
                      <div className="w-full md:w-2/5">
                        <div className="flex items-start gap-2">
                          <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green-100 text-xs font-semibold text-green-800">
                            {getHandleInitial(thread.userId)}
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
                                  {getPublicHandle(thread.userId)}
                                </Link>
                              ) : (
                                <span className="font-medium">
                                  {getPublicHandle(thread.userId)}
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
                              {getHandleInitial(latestReplyMeta)}
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
          ) : searchQuery.trim() ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-center shadow-sm">
              <p className="text-lg font-semibold text-amber-900">
                No exact match yet for &quot;{searchQuery}&quot;
              </p>
              <p className="mt-2 text-sm text-amber-800">
                Try a broader search, switch category, or jump into one of these
                popular Naija topics.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {noResultRecoveryTopics.map((topic) => (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => handleSearch(topic)}
                    className="rounded-full border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100"
                  >
                    Search: {topic}
                  </button>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {featuredCategories.slice(0, 4).map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => handleCategoryFilter(category.label)}
                    className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
                  >
                    Open {category.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    handleCategoryFilter(null);
                  }}
                  className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Reset Search
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 text-center">
              <p className="text-slate-900 mb-2 text-lg font-semibold">
                {hasAnyThreads
                  ? "Nothing matches this view yet."
                  : "No threads yet. Start the first conversation."}
              </p>
              <p className="mx-auto mb-4 max-w-xl text-sm text-slate-600">
                {hasAnyThreads
                  ? "Try switching back to fresh discussions, clearing filters, or jumping into another category."
                  : "Be the first to open the floor with news, football banter, Abuja rent gist, or practical everyday advice."}
              </p>
              <div className="mb-4 flex flex-wrap justify-center gap-2">
                {featuredCategories.slice(0, 4).map((category) => (
                  <button
                    key={`empty-${category.id}`}
                    type="button"
                    onClick={() => handleCategoryFilter(category.label)}
                    className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
                  >
                    Open {category.label}
                  </button>
                ))}
                {hasAnyThreads && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveFilter("all");
                      setSearchSortMode("relevance");
                      handleSortChange("latest");
                      handleCategoryFilter(null, "home:empty-reset");
                    }}
                    className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Back to all discussions
                  </button>
                )}
              </div>
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
                <span>Hot In Nigeria</span>
                <span className="font-semibold text-slate-900">
                  {communityMetrics.hotTopics}
                </span>
              </p>
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
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm lg:sticky lg:top-10">
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
  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-6">
      Loading homepage...
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<HomeLoading />}>
      <HomeContent />
    </Suspense>
  );
}
