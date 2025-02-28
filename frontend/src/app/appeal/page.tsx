// frontend/src/app/appeal/page.tsx
"use client";

import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AppealPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await axios.post<{ message: string }>("/api/users/appeal", {
        email,
        password,
        reason,
      });
      setMessage(res.data.message);
      if (res.data.message.includes("sent")) {
        setTimeout(() => router.push("/login"), 2000); // Redirect after success
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setMessage(err.response?.data?.message || "Appeal scatter o!");
      } else {
        setMessage("Appeal scatter o!");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-md p-6 max-w-md w-full">
        <h1 className="text-3xl font-bold text-green-800 mb-4">Appeal Ban</h1>
        {message && (
          <p className="text-center text-sm text-gray-600 mb-4">{message}</p>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-semibold mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 text-gray-800"
              placeholder="Enter your email"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-semibold mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 text-gray-800"
              placeholder="Enter your password"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-semibold mb-2">
              Reason for Appeal
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 text-gray-800 h-24"
              placeholder="Why should we unban you?"
              required
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-green-600 text-white p-2 rounded-lg hover:bg-green-700 disabled:bg-green-400"
          >
            {isSubmitting ? "Sending..." : "Submit Appeal"}
          </button>
        </form>
        <p className="text-center text-sm text-gray-600 mt-4">
          Changed your mind?{" "}
          <Link href="/login" className="text-blue-600 hover:underline">
            Back to Login
          </Link>
        </p>
      </div>
    </div>
  );
}
