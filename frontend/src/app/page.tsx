"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Link from "next/link";
import SearchBar from "@/components/threads/SearchBar";
import NewThreadButton from "@/components/threads/NewThreadButton";
import formatDate from "@/utils/formatDate";

type Reply = {
  _id: string;
  body: string;
  userId: { email: string } | null;
  createdAt: string;
};

type Thread = {
  _id: string;
  title: string;
  body: string;
  userId: { email: string } | null;
  category: string;
  createdAt: string;
  replies?: Reply[];
};

type SearchResponse = {
  threads: Thread[];
  message: string;
};

export default function Home() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [allThreads, setAllThreads] = useState<Thread[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [ads, setAds] = useState<
    { id: number; brand: string; text: string; link: string }[]
  >([]); // Add ads state
  const router = useRouter();
  const newThreadButtonRef = useRef<HTMLButtonElement>(null);

  const trendingTopics = [
    "Suya joints",
    "NYSC camp",
    "Lagos traffic",
    "Best jollof",
  ];
  const categories = ["General", "Gist", "Politics", "Romance"];

  useEffect(() => {
    const savedSearches = localStorage.getItem("recentSearches");
    if (savedSearches) {
      setRecentSearches(JSON.parse(savedSearches));
    }

    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
    fetchThreads();
    fetchAds(); // Fetch ads on load
  }, []);

  const fetchThreads = async () => {
    try {
      const res = await axios.get<Thread[]>("/api/threads");
      const threadsWithReplies = await Promise.all(
        res.data.map(async (thread) => {
          try {
            const replyRes = await axios.get<Thread>(
              `/api/threads/${thread._id}`
            );
            return replyRes.data;
          } catch (err: unknown) {
            console.error(`Failed to fetch thread ${thread._id}:`, err);
            return { ...thread, replies: [] };
          }
        })
      );
      setAllThreads(threadsWithReplies);
      setThreads(threadsWithReplies);
      setMessage("");
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setMessage(err.response?.data?.message || "Fetch scatter o!");
      } else {
        setMessage("No gist yet—drop your own!");
      }
    }
  };

  const fetchAds = async () => {
    try {
      const res = await axios.get<{
        ads: { id: number; brand: string; text: string; link: string }[];
        message: string;
      }>("/api/ads");
      setAds(res.data.ads);
    } catch (err) {
      console.error("Failed to fetch ads:", err);
      setMessage("Ads no dey load—abeg check later!");
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    setSelectedCategory(null);
    try {
      const res = await axios.get<SearchResponse>(
        `/api/threads/search?q=${query}`
      );
      const threadsWithReplies = await Promise.all(
        res.data.threads.map(async (thread) => {
          try {
            const replyRes = await axios.get<Thread>(
              `/api/threads/${thread._id}`
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
      const res = await axios.post<{ message: string; thread: Thread }>(
        "/api/threads",
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
          ? `${filtered.length} thread${
              filtered.length > 1 ? "s" : ""
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
      <div className="max-w-5xl mx-auto mb-3">
        <div className="bg-green-800 text-white p-4 rounded-t-lg shadow-md">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">
              NaijaTalk Forum—Wetin Dey Happen?
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

        <div className="bg-white p-4 rounded-b-lg shadow-md">
          <SearchBar
            onSearch={handleSearch}
            recentSearches={recentSearches}
            trendingTopics={trendingTopics}
          />
        </div>
      </div>

      <div className="max-w-5xl mx-auto flex gap-1">
        <div className="w-[15%]">
          <div className="bg-white rounded-lg shadow-md p-4">
            <h2 className="text-lg font-semibold text-green-800 mb-3">
              Categories
            </h2>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => handleCategoryFilter(null)}
                  className={`w-full text-left text-blue-600 hover:underline text-sm ${
                    !selectedCategory ? "font-bold text-blue-800" : ""
                  }`}
                >
                  All Categories
                </button>
              </li>
              {categories.map((cat) => (
                <li key={cat}>
                  <button
                    onClick={() => handleCategoryFilter(cat)}
                    className={`w-full text-left text-blue-600 hover:underline text-sm ${
                      selectedCategory === cat ? "font-bold text-blue-800" : ""
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
          {message && (
            <p className="text-center text-sm text-gray-600 mb-4 bg-white p-2 rounded-lg">
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
            {ads.length > 0 ? (
              ads.map((ad) => (
                <div key={ad.id} className="mb-4">
                  <a
                    href={ad.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
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
