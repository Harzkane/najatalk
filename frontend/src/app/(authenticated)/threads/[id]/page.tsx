// frontend/src/app/(authenticated)/threads/[id]/page.tsx
"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import api from "@/utils/api";
import axios from "axios"; // Keep for isAxiosError check
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import ThreadCard from "@/components/threads/ThreadCard";
import formatDate from "@/utils/formatDate";

type Thread = {
  _id: string;
  title: string;
  body: string;
  userId: { _id: string; email: string; flair?: string } | null; // Add flair
  category: string;
  createdAt: string;
  replies: Reply[];
  likes?: string[];
  bookmarks?: string[];
  isSolved?: boolean;
  isSticky?: boolean;
  isLocked?: boolean;
};

type Reply = {
  _id: string;
  body: string;
  userId: { _id: string; email: string; flair?: string } | null; // Add flair
  createdAt: string;
  parentReplyId?: string | null;
};

function ThreadDetailLoading() {
  return <p className="text-center p-10">Loading gist...</p>;
}

function ThreadDetailContent() {
  const [thread, setThread] = useState<Thread | null>(null);
  const [message, setMessage] = useState<string>("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<
    "user" | "mod" | "admin" | null
  >(null);
  const { id } = useParams();
  const router = useRouter();

  const fetchThread = useCallback(async () => {
    try {
      const res = await api.get<Thread>(`/threads/${id}`);
      setThread(res.data);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setMessage(err.response?.data?.message || "Thread no dey!");
      } else {
        setMessage("Thread fetch scatter o!");
      }
    }
  }, [id]);

  useEffect(() => {
    fetchThread();
  }, [fetchThread]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setCurrentUserId(null);
      setCurrentUserRole(null);
      return;
    }

    const loadUser = async () => {
      try {
        const userRes = await axios.get("/api/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCurrentUserId(userRes.data._id || null);
        setCurrentUserRole((userRes.data.role as "user" | "mod" | "admin") || null);
      } catch (err) {
        console.error("Failed to load current user:", err);
        setCurrentUserId(null);
        setCurrentUserRole(null);
      }
    };

    loadUser();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  if (!thread && !message)
    return <p className="text-center p-10">Loading gist...</p>;

  return (
    <div className="min-h-screen bg-slate-100 p-6">
                <div className="max-w-7xl mx-auto mb-3">
                  <div className="bg-green-800 text-white p-4 rounded-t-lg shadow-sm">
                    <div className="flex flex-col gap-3 md:flex-row md:justify-between md:items-center">
                      <h1 className="text-2xl md:text-4xl font-bold text-gray-50 text-center md:text-left break-words">
                        {thread ? thread.title : "NaijaTalk Threads—Drop Your Gist!"}
                      </h1>
                      <div className="flex flex-wrap items-center justify-center md:justify-end gap-3 md:gap-4">
                        <Link
                          href="/"
                          className="text-green-100 hover:text-white text-sm font-medium"
                        >
                          Home
                        </Link>
                        <Link
                          href="/threads"
                          className="text-green-100 hover:text-white text-sm font-medium"
                        >
                          Threads
                        </Link>
                        <Link
                          href="/marketplace"
                          className="text-green-100 hover:text-white text-sm font-medium"
                        >
                          Marketplace
                        </Link>
                        <Link
                          href="/premium"
                          className="text-green-100 hover:text-white text-sm font-medium"
                        >
                          Premium
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
                  {message && (
                    <p className="text-center text-sm text-gray-600 mb-3 bg-white border border-slate-200 p-2 rounded-lg">
                      {message}
                    </p>
                  )}

                  {thread && (
                    <>
                      <ThreadCard
                        thread={thread}
                        formatDate={formatDate}
                        showReplies={true}
                        onReplyAdded={fetchThread}
                        currentUserId={currentUserId}
                        currentUserRole={currentUserRole}
                        onThreadUpdated={fetchThread}
                      />

            {thread.replies.length === 0 ? (
          <div className="bg-white border border-slate-200 p-4 rounded-md text-center mt-4">
            <p className="text-slate-600">No replies yet—be the first!</p>
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
      </>
    )
  }
    </div >
    </div >
  );
}

export default function ThreadDetail() {
  return (
    <Suspense fallback={<ThreadDetailLoading />}>
      <ThreadDetailContent />
    </Suspense>
  );
}
