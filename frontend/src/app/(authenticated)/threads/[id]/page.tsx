// frontend/src/app/(authenticated)/threads/[id]/page.tsx
"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import axios from "axios";
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
};

type Reply = {
  _id: string;
  body: string;
  userId: { _id: string; email: string; flair?: string } | null; // Add flair
  createdAt: string;
};

function ThreadDetailLoading() {
  return <p className="text-center p-10">Loading gist...</p>;
}

function ThreadDetailContent() {
  const [thread, setThread] = useState<Thread | null>(null);
  const [message, setMessage] = useState<string>("");
  const { id } = useParams();
  const router = useRouter();

  const fetchThread = useCallback(async () => {
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
  }, [id]);

  useEffect(() => {
    fetchThread();
  }, [fetchThread]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  if (!thread && !message)
    return <p className="text-center p-10">Loading gist...</p>;

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto mb-3">
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

      <div className="max-w-7xl mx-auto">
        {message && (
          <p className="text-center text-sm text-gray-600 mb-3 bg-white p-2 rounded-lg">
            {message}
          </p>
        )}

        {thread && (
          <>
            <ThreadCard
              thread={thread}
              formatDate={formatDate}
              showReplies={false}
              onReplyAdded={fetchThread}
            />

            {thread.replies.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-green-800 mb-2">
                  Replies
                </h3>
                {thread.replies.map((reply) => (
                  <ThreadCard
                    key={reply._id}
                    thread={reply}
                    formatDate={formatDate}
                    isReply={true}
                    originalTitle={thread.title}
                    showReplies={false}
                    onReplyAdded={fetchThread}
                  />
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

export default function ThreadDetail() {
  return (
    <Suspense fallback={<ThreadDetailLoading />}>
      <ThreadDetailContent />
    </Suspense>
  );
}
