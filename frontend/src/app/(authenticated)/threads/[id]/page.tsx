// frontend/src/app/(authenticated)/threads/[id]/page.tsx
"use client";

import { useState, useEffect, FormEvent } from "react";
import axios from "axios";
import { useParams } from "next/navigation";

type Thread = {
  _id: string;
  title: string;
  body: string;
  userId: { email: string } | null;
  category: string;
  createdAt: string;
  replies: Reply[];
};

type Reply = {
  _id: string;
  body: string;
  userId: { email: string } | null;
  createdAt: string;
};

export default function ThreadDetail() {
  const [thread, setThread] = useState<Thread | null>(null);
  const [replyBody, setReplyBody] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const { id } = useParams<{ id: string }>();

  useEffect(() => {
    const fetchThread = async () => {
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
    };

    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
    fetchThread();
  }, [id]);

  const handleReply = async (e: FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn) {
      setMessage("Abeg login first!");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post<{ message: string; reply: Reply }>(
        `/api/threads/${id}/replies`,
        { body: replyBody },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(res.data.message);
      setReplyBody("");
      setThread((prev) =>
        prev ? { ...prev, replies: [res.data.reply, ...prev.replies] } : null
      );
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setMessage(err.response?.data?.message || "Reply scatter o!");
        if (err.response?.status === 401) {
          setMessage("Token don expire—abeg login again!");
          localStorage.removeItem("token");
          setTimeout(() => (window.location.href = "/login"), 1000);
        }
      } else {
        setMessage("Reply scatter o!");
      }
    }
  };

  if (!thread && !message)
    return <p className="text-center">Loading gist...</p>;

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-4xl font-bold text-green-800 mb-6 text-center">
        {thread?.title || "Thread Details"}
      </h1>
      {message && <p className="text-center text-gray-600 mb-4">{message}</p>}
      {thread && (
        <div className="max-w-2xl mx-auto bg-white p-4 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-semibold text-green-800">
            {thread.title}
          </h2>
          <p className="text-gray-700 mt-2">{thread.body}</p>
          <p className="text-sm text-gray-500 mt-2">
            By: {thread.userId?.email || "Unknown Oga"} | {thread.createdAt} |{" "}
            {thread.category}
          </p>
        </div>
      )}

      {isLoggedIn && thread && (
        <form onSubmit={handleReply} className="max-w-2xl mx-auto mb-6">
          <textarea
            placeholder="Drop your reply..."
            value={replyBody}
            onChange={(e) => setReplyBody(e.target.value)}
            className="w-full p-3 mb-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 h-24"
          />
          <button
            type="submit"
            className="w-full bg-green-600 text-white p-3 rounded-lg hover:bg-green-700"
          >
            Reply am!
          </button>
        </form>
      )}

      {thread?.replies?.length ? (
        <div className="max-w-2xl mx-auto space-y-4">
          {thread.replies.map((reply) => (
            <div
              key={reply._id}
              className="bg-gray-50 p-4 rounded-lg shadow-sm"
            >
              <p className="text-gray-700">{reply.body}</p>
              <p className="text-sm text-gray-500 mt-2">
                By: {reply.userId?.email || "Unknown Oga"} | {reply.createdAt}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-600">
          No replies yet—be the first!
        </p>
      )}
    </div>
  );
}
