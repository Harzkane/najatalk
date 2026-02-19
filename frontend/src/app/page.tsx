// frontend/src/app/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import api from "@/utils/api";
import axios from "axios"; // Keep for isAxiosError check
import Link from "next/link";
import SearchBar from "@/components/threads/SearchBar";
import NewThreadButton from "@/components/threads/NewThreadButton";
import Header from "@/components/Header"; // New import
import formatDate from "@/utils/formatDate";

type Reply = {
  _id: string;
  body: string;
  userId: { email: string; flair?: string } | null;
  createdAt: string;
};

type Thread = {
  _id: string;
  title: string;
  body: string;
  userId: { email: string; flair?: string } | null;
  category: string;
  createdAt: string;
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
  budget: number; // Added
  cpc: number; // Added
  status?: "pending" | "active" | "expired"; // Optional, added for consistency
};

export default function Home() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [allThreads, setAllThreads] = useState<Thread[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [bannerAd, setBannerAd] = useState<Ad | null>(null);
  const [message, setMessage] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [ads, setAds] = useState<Ad[]>([]);

  const router = useRouter();
  const newThreadButtonRef = useRef<HTMLButtonElement>(null);

  const trendingTopics = [
    "Suya joints",
    "NYSC camp",
    "Lagos traffic",
    "Best jollof",
  ];
  const categories = ["General", "Gist", "Politics", "Romance"];

  // Update useEffect to call fetchBannerAd on every mount
  useEffect(() => {
    const checkPremiumAndAds = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        const res = await api.get("/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setIsPremium(res.data.isPremium);
        if (!res.data.isPremium) await fetchBannerAd(); // Fetch fresh each time
      } else {
        await fetchBannerAd(); // Non-logged-in users see ads too
      }
      fetchThreads();
      fetchAds();
    };
    checkPremiumAndAds();
  }, []); // Still runs once, but fetchBannerAd randomizes

  const fetchBannerAd = async () => {
    try {
      const res = await api.get<{ ads: Ad[]; message: string }>("/ads", {
        params: { status: "active", type: "banner" },
      });
      console.log("Banner Ads Fetched:", res.data.ads);
      const activeBanners = res.data.ads.filter(
        (ad) => ad.type === "banner" && ad.budget >= ad.cpc
      );
      if (activeBanners.length > 0) {
        // Randomize: Pick one from active banners
        const randomIndex = Math.floor(Math.random() * activeBanners.length);
        const selectedBanner = activeBanners[randomIndex];
        setBannerAd(selectedBanner);
        console.log("Selected Banner:", selectedBanner);
        console.log("Tracking Banner Impression:", selectedBanner._id);
        await api.get(`/ads/impression/${selectedBanner._id}`);
      } else {
        console.log("No valid banner ads found.");
        setBannerAd(null);
      }
    } catch (err) {
      console.error("Banner fetch error:", err);
      setBannerAd(null);
    }
  };

  const trackBannerClick = async (adId: string) => {
    try {
      console.log("Tracking Banner Click:", adId);
      await api.post(`/ads/click/${adId}`);
      console.log("Banner click tracked successfully.");
    } catch (err) {
      console.error("Banner click error:", err);
    }
  };

  useEffect(() => {
    const savedSearches = localStorage.getItem("recentSearches");
    if (savedSearches) {
      setRecentSearches(JSON.parse(savedSearches));
    }

    const token = localStorage.getItem("token");
    if (token) {
      checkUserStatus(token);
    } else {
      setIsLoggedIn(false);
    }
    fetchThreads();
    fetchAds();
  }, []);

  const checkUserStatus = async (token: string) => {
    try {
      await api.get("/threads", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setIsLoggedIn(true);
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.status === 403) {
        if (err.response.data.message.includes("banned")) {
          setMessage("You don dey banned—appeal now!");
          setTimeout(() => router.push("/appeal"), 1000);
          return;
        }
      }
      localStorage.removeItem("token");
      setIsLoggedIn(false);
      setMessage("Token scatter—abeg login again!");
      setTimeout(() => router.push("/login"), 1000);
    }
  };

  const fetchThreads = async () => {
    try {
      const res = await api.get("/threads");
      const threads = res.data.threads || [];
      const threadsWithReplies = await Promise.all(
        threads.map(async (thread: Thread) => {
          try {
            const replyRes = await api.get(`/threads/${thread._id}`);
            return replyRes.data;
          } catch (err) {
            console.error(`Failed to fetch thread ${thread._id}:`, err);
            return { ...thread, replies: [] };
          }
        })
      );
      setAllThreads(threadsWithReplies);
      setThreads(threadsWithReplies);
      setMessage(res.data.message || "");
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setMessage(err.response?.data?.message || "Fetch scatter o!");
      } else {
        setMessage("No gist yet—drop your own!");
      }
    }
  };

  const fetchAds = async () => {
    try {
      const res = await api.get<{ ads: Ad[]; message: string }>("/ads", {
        params: { status: "active", type: "sidebar" }, // Filter server-side
      });
      console.log("Sidebar Ads Fetched:", res.data.ads);
      setAds(res.data.ads); // No client-side filter needed
    } catch (err) {
      console.error("Failed to fetch ads:", err);
      setMessage("Ads no dey load—abeg check later!");
      setAds([]);
    }
  };

  const trackImpression = async (adId: string) => {
    try {
      await api.get(`/ads/impression/${adId}`);
    } catch (err) {
      console.error("Impression track failed:", err);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    setSelectedCategory(null);
    try {
      const res = await api.get<SearchResponse>(
        `/threads/search?q=${query}`
      );
      const threadsWithReplies = await Promise.all(
        res.data.threads.map(async (thread) => {
          try {
            const replyRes = await api.get<Thread>(
              `/threads/${thread._id}`
            );
            return replyRes.data;
          } catch (err: unknown) {
            console.error(`Failed to fetch thread ${thread._id}:`, err);
            return { ...thread, replies: [] };
          }
        })
      );
      setThreads(threadsWithReplies);
      setMessage(res.data.message);

      if (query.trim()) {
        const updatedSearches = [
          query,
          ...recentSearches.filter((s) => s !== query),
        ].slice(0, 5);
        setRecentSearches(updatedSearches);
        localStorage.setItem("recentSearches", JSON.stringify(updatedSearches));
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setMessage(err.response?.data?.message || "Search scatter o!");
      } else {
        setMessage("No gist match—try another search!");
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
      const res = await api.post<{ message: string; thread: Thread }>(
        "/threads",
        { title, body, category },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(res.data.message);
      await fetchThreads();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const errorMsg = err.response?.data?.message || "Thread scatter o!";
        setMessage(errorMsg);
        if (err.response?.status === 401) {
          setMessage("Token don expire—abeg login again!");
          localStorage.removeItem("token");
          setTimeout(() => router.push("/login"), 1000);
        } else if (
          err.response?.status === 403 &&
          err.response.data.message.includes("banned")
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
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    router.push("/login");
  };

  const handleCategoryFilter = (category: string | null) => {
    setSelectedCategory(category);
    setSearchQuery("");
    if (!category) {
      setThreads(allThreads);
      setMessage("");
    } else {
      const filtered = allThreads.filter(
        (thread) => thread.category.toLowerCase() === category.toLowerCase()
      );
      setThreads(filtered);
      setMessage(
        filtered.length
          ? `${filtered.length} thread${filtered.length > 1 ? "s" : ""
          } in ${category}`
          : `No threads in ${category} yet—start one!`
      );
    }
  };

  const getLatestActivity = (thread: Thread) => {
    if (!thread.replies || thread.replies.length === 0) {
      return thread.createdAt;
    }
    const replyDates = thread.replies.map((reply) => new Date(reply.createdAt));
    return new Date(Math.max(...replyDates.map((d) => d.getTime())));
  };

  return (
    <div className="min-h-screen bg-gray-200 p-6 pb-20">
      <div className="max-w-7xl mx-auto mb-3">
        <Header
          title="NaijaTalk Forum—Wetin Dey Happen?"
          isLoggedIn={isLoggedIn}
          onLogout={handleLogout}
        />
        <div className="bg-white p-4 rounded-b-lg shadow-md">
          <SearchBar
            onSearch={handleSearch}
            recentSearches={recentSearches}
            trendingTopics={trendingTopics}
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto flex gap-1">
        <div className="w-[15%]">
          <div className="bg-white rounded-lg shadow-md p-4">
            <h2 className="text-lg font-semibold text-green-800 mb-3">
              Categories
            </h2>
            <ul className="space-y-1">
              <li>
                <button
                  onClick={() => handleCategoryFilter(null)}
                  className={`w-full text-left text-blue-600 hover:underline text-sm ${!selectedCategory ? "font-bold text-blue-800" : ""
                    }`}
                >
                  All Categories
                </button>
              </li>
              {categories.map((cat) => (
                <li key={cat}>
                  <button
                    onClick={() => handleCategoryFilter(cat)}
                    className={`w-full text-left text-blue-600 hover:underline text-sm ${selectedCategory === cat ? "font-bold text-blue-800" : ""
                      }`}
                  >
                    {cat}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="w-[70%]">
          {!isPremium && bannerAd && (
            <div className="bg-yellow-100 p-4 mb-1 rounded-lg shadow text-center">
              <a
                href={bannerAd.link}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackBannerClick(bannerAd._id)}
                className="text-blue-600 font-bold hover:underline"
              >
                {bannerAd.brand}: {bannerAd.text}
              </a>
            </div>
          )}

          {message && (
            <p className="text-center text-sm text-gray-600 mb-1 bg-white p-2 rounded-xs">
              {message}
              {searchQuery ? `: "${searchQuery}"` : ""}
            </p>
          )}

          {threads.length ? (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="bg-gray-100 p-3 flex justify-between text-sm font-medium text-gray-600 border-b border-gray-200">
                <span className="w-2/5">Thread</span>
                <span className="w-1/5 text-center">Replies</span>
                <span className="w-2/5 text-right">Last Post</span>
              </div>
              {threads.map((thread) => (
                <div
                  key={thread._id}
                  className="p-3 border-b border-gray-200 hover:bg-gray-50 flex justify-between items-center"
                >
                  <div className="w-2/5">
                    <Link
                      href={`/threads/${thread._id}`}
                      className="text-green-800 font-medium hover:underline"
                    >
                      {thread.title}
                    </Link>
                    <p className="text-xs text-gray-600 mt-1">
                      Started by{" "}
                      <span className="font-medium">
                        {thread.userId?.email?.split("@")[0] || "Unknown Oga"}
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
                    </p>
                  </div>
                  <div className="w-1/5 text-center">
                    <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-medium">
                      {thread.replies?.length || 0}
                    </span>
                  </div>
                  <div className="w-2/5 text-right text-xs text-gray-500">
                    {formatDate(getLatestActivity(thread).toString())}
                    {thread.replies && thread.replies.length > 0 && (
                      <span className="block text-gray-600 font-medium">
                        by{" "}
                        {thread.replies[
                          thread.replies.length - 1
                        ].userId?.email?.split("@")[0] || "Unknown"}
                        {thread.replies[thread.replies.length - 1].userId
                          ?.flair && (
                            <span
                              className={`ml-1 inline-block text-white px-1 rounded text-xs ${thread.replies[thread.replies.length - 1].userId
                                ?.flair === "Oga at the Top"
                                ? "bg-yellow-500"
                                : "bg-green-500"
                                }`}
                            >
                              {
                                thread.replies[thread.replies.length - 1].userId
                                  ?.flair
                              }
                            </span>
                          )}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <p className="text-gray-600 mb-4 text-lg">
                No threads yet—na you go start di party!
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

        <div className="w-[15%]">
          <div className="bg-white rounded-lg shadow-md p-4">
            <h2 className="text-lg font-semibold text-green-800 mb-3">Ads</h2>
            {!isPremium && (
              <div>
                {ads.length > 0 ? (
                  ads.map((ad) => (
                    <div
                      key={ad._id}
                      className="mb-4"
                      ref={(el) => {
                        if (el) {
                          const observer = new IntersectionObserver(
                            ([entry]) => {
                              if (entry.isIntersecting) {
                                trackImpression(ad._id);
                                observer.disconnect(); // Track once per load
                              }
                            },
                            { threshold: 0.5 } // 50% visible
                          );
                          observer.observe(el);
                        }
                      }}
                    >
                      <a
                        href={ad.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                        onClick={async () => {
                          try {
                            await api.post(`/ads/click/${ad._id}`);
                          } catch (err) {
                            console.error("Click track failed:", err);
                          }
                        }}
                      >
                        <strong>{ad.brand}</strong>: {ad.text}
                      </a>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-600 text-sm">
                    Ads dey load—abeg wait small!
                  </p>
                )}
              </div>
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
