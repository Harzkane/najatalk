// frontend/src/app/(auth)/login/page.tsx
"use client";

import { Suspense, useState, FormEvent } from "react";
import { isAxiosError } from "axios";
import api from "@/utils/api";
import { useRouter, useSearchParams } from "next/navigation";
import { setStoredAuth } from "@/utils/authStorage";
import { trackEvent } from "@/utils/analytics";
import { getAuthErrorMessage, getAuthErrorStatus } from "@/utils/authErrorMessage";
import Link from "next/link";

function LoginContent() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [showResendVerification, setShowResendVerification] = useState(false);
  const [isResendingVerification, setIsResendingVerification] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setShowResendVerification(false);
    try {
      const res = await api.post<{
        token: string;
        userId: string;
        message: string;
      }>("/auth/login", { email, password });
      setMessage(res.data.message);
      setStoredAuth(res.data.token, res.data.userId);
      trackEvent("auth_login_success", { destination: "marketplace_or_onboarding" });
      console.log("Logged in User ID:", res.data.userId);
      setEmail("");
      setPassword("");
      const nextPath = searchParams.get("next");
      let destination = "/marketplace";
      try {
        const completenessRes = await api.get("/users/me/profile-completeness", {
          headers: { Authorization: `Bearer ${res.data.token}` },
        });
        if (completenessRes.data?.profileCompleted) {
          destination =
            nextPath && nextPath.startsWith("/") && !nextPath.startsWith("//")
              ? nextPath
              : "/marketplace";
        } else {
          destination = "/onboarding/profile";
        }
      } catch {
        destination = "/marketplace";
      }
      setTimeout(() => router.push(destination), 800);
    } catch (err: unknown) {
      if (isAxiosError<{ message?: string }>(err)) {
        const errorMsg = getAuthErrorMessage(err, "Login wahala o!");
        setMessage(errorMsg);
        trackEvent("auth_login_failed", { status: getAuthErrorStatus(err) });
        if (err.response?.status === 403 && /verify your email/i.test(errorMsg)) {
          setShowResendVerification(true);
        }
        if (err.response?.status === 403 && errorMsg.includes("banned")) {
          // Pass ban signal via query param
          setTimeout(() => router.push("/appeal?fromBan=true"), 1000);
        }
      } else {
        setMessage(getAuthErrorMessage(err, "Login wahala o!"));
        trackEvent("auth_login_failed", { status: getAuthErrorStatus(err) });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email.trim()) {
      setMessage("Enter your email first to resend verification.");
      return;
    }
    try {
      setIsResendingVerification(true);
      const res = await api.post<{ message: string }>("/auth/resend-verification", {
        email: email.trim(),
      });
      setMessage(res.data.message || "Verification email resent.");
      trackEvent("auth_resend_verification", { source: "login" });
    } catch (err: unknown) {
      if (isAxiosError<{ message?: string }>(err)) {
        setMessage(err.response?.data?.message || "Resend verification wahala o!");
      } else {
        setMessage("Resend verification wahala o!");
      }
    } finally {
      setIsResendingVerification(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-200 w-full max-w-md">
        <div className="mb-4 flex items-center justify-between text-sm">
          <Link href="/" className="text-slate-600 hover:text-slate-900 hover:underline">
            Return to Home
          </Link>
          <Link href="/signup" className="text-green-700 hover:text-green-800 hover:underline">
            Create account
          </Link>
        </div>
        <h1 className="text-3xl font-bold text-green-800 mb-6">
          Login to NaijaTalk
        </h1>
        {message && (
          <p className="mt-4 text-center text-sm text-gray-600">{message}</p>
        )}
        {showResendVerification && (
          <button
            type="button"
            onClick={handleResendVerification}
            disabled={isResendingVerification}
            className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            {isResendingVerification ? "Resending..." : "Resend Verification Email"}
          </button>
        )}
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 text-gray-800"
              required
            />
          </div>
          <div className="mb-6">
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 text-gray-800"
              required
            />
            <div className="mt-2 text-right">
              <Link
                href="/forgot-password"
                className="text-xs text-green-700 hover:text-green-800 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-green-600 text-white p-3 rounded-lg hover:bg-green-700 disabled:bg-green-400"
          >
            {isSubmitting ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function Login() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-100">
          <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-200 w-full max-w-md">
            <h1 className="text-3xl font-bold text-green-800 mb-6">
              Login to NaijaTalk
            </h1>
            <p className="text-sm text-slate-600">Loading login...</p>
          </div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
