// frontend/src/app/(authenticated)/threads/page.tsx
"use client";

import { useState, useEffect, FormEvent } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Thread = {
  _id: string;
  title: string;
  body: string;
  userId: { email: string } | null;
  category: string;
  createdAt: string;
  replies?: { length: number }; // Optional for now
};

export default function Threads() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [title, setTitle] = useState<string>("");
  const [body, setBody] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
    fetchThreads();
  }, []);

  const fetchThreads = async () => {
    try {
      const res = await axios.get<Thread[]>("/api/threads");
      // Fetch reply count for each thread
      const threadsWithReplies = await Promise.all(
        res.data.map(async (thread) => {
          const replyRes = await axios.get(`/api/threads/${thread._id}`);
          return {
            ...thread,
            replies: { length: replyRes.data.replies.length },
          };
        })
      );
      setThreads(threadsWithReplies);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setMessage(err.response?.data?.message || "Fetch scatter o!");
      } else {
        setMessage("No gist yet—drop your own!");
      }
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn) {
      setMessage("Abeg login first!");
      setTimeout(() => router.push("/login"), 1000);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post<{ message: string; thread: Thread }>(
        "/api/threads",
        { title, body },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(res.data.message);
      setTitle("");
      setBody("");
      setThreads([{ ...res.data.thread, replies: { length: 0 } }, ...threads]);
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

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-4xl font-bold text-green-800 mb-6 text-center">
        NaijaTalk Threads—Drop Your Gist!
      </h1>

      {isLoggedIn && (
        <form onSubmit={handleSubmit} className="mb-8 max-w-2xl mx-auto">
          <input
            type="text"
            placeholder="Thread Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-3 mb-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
          />
          <textarea
            placeholder="Wetin dey your mind?"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full p-3 mb-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 h-32"
          />
          <button
            type="submit"
            className="w-full bg-green-600 text-white p-3 rounded-lg hover:bg-green-700"
          >
            Post am!
          </button>
        </form>
      )}

      {message && (
        <p className="text-center text-sm text-gray-600 mb-6">{message}</p>
      )}

      <div className="max-w-2xl mx-auto space-y-4">
        {threads.length ? (
          threads.map((thread) => (
            <div key={thread._id} className="bg-white p-4 rounded-lg shadow-md">
              <Link href={`/threads/${thread._id}`}>
                <h2 className="text-xl font-semibold text-green-800 hover:underline">
                  {thread.title}
                </h2>
              </Link>
              <p className="text-gray-700">{thread.body}</p>
              <p className="text-sm text-gray-500 mt-2">
                By: {thread.userId?.email || "Unknown Oga"} | {thread.createdAt}{" "}
                | {thread.category} | {thread.replies?.length || 0} replies
              </p>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-600">No gist yet—be the first!</p>
        )}
      </div>
    </div>
  );
}
