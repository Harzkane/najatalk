// frontend/src/app/(banned)/appeal/page.tsx
"use client";

import { useState, useEffect, Suspense } from "react";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

// Loading component that will be shown while the main content is loading
function AppealLoading() {
  return (
    <div className="min-h-screen bg-slate-100 p-6 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 max-w-md w-full">
        <h1 className="text-3xl font-bold text-green-800 mb-4">Appeal Ban</h1>
        <p className="text-center text-sm text-gray-600 mb-4">Loading...</p>
      </div>
    </div>
  );
}

// Main content component that uses search params
function AppealContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [appealStatus, setAppealStatus] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const fromBan = searchParams.get("fromBan");
    if (!fromBan) {
      setMessage("Abeg, login first to appeal!");
      setTimeout(() => router.push("/login"), 1000);
      return;
    }

    const checkAppealStatus = async () => {
      if (email && password) {
        try {
          const res = await axios.post<{ message: string }>(
            "/api/users/appeal",
            { email, password, reason: "" }
          );
          setMessage(res.data.message);
          if (res.data.message.includes("pending")) {
            setAppealStatus("pending");
          } else if (res.data.message.includes("approved")) {
            setAppealStatus("approved");
            setTimeout(() => router.push("/login"), 2000); // Redirect if approved
          } else if (res.data.message.includes("rejected")) {
            setAppealStatus("rejected");
          }
        } catch (err: unknown) {
          if (axios.isAxiosError(err)) {
            setMessage(
              err.response?.data?.message || "Appeal check scatter o!"
            );
            if (err.response?.data?.message.includes("approved")) {
              setAppealStatus("approved");
              setTimeout(() => router.push("/login"), 2000);
            }
          }
        }
      }
    };
    checkAppealStatus();
  }, [email, password, router, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (appealStatus === "pending") return;
    setIsSubmitting(true);
    try {
      const res = await axios.post<{ message: string }>("/api/users/appeal", {
        email,
        password,
        reason,
      });
      setMessage(res.data.message);
      if (res.data.message.includes("sent")) {
        setAppealStatus("pending");
        setTimeout(() => router.push("/login"), 2000); // Redirect after submit
      } else if (res.data.message.includes("approved")) {
        setAppealStatus("approved");
        setEmail(""); // Clear form
        setPassword("");
        setReason("");
        setTimeout(() => router.push("/login"), 2000); // Redirect if already approved
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setMessage(err.response?.data?.message || "Appeal scatter o!");
        if (err.response?.data?.message.includes("approved")) {
          setAppealStatus("approved");
          setEmail(""); // Clear form
          setPassword("");
          setReason("");
          setTimeout(() => router.push("/login"), 2000);
        }
      } else {
        setMessage("Appeal scatter o!");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-6 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 max-w-md w-full">
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
              disabled={appealStatus === "pending"}
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting || appealStatus === "pending"}
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

// Main component that provides the suspense boundary
export default function AppealPage() {
  return (
    <Suspense fallback={<AppealLoading />}>
      <AppealContent />
    </Suspense>
  );
}
