// frontend/src/app/(auth)/signup/page.tsx
"use client";

import { useState, FormEvent } from "react";
import api from "@/utils/api";
import { trackEvent } from "@/utils/analytics";
import { getAuthErrorMessage, getAuthErrorStatus } from "@/utils/authErrorMessage";
import Link from "next/link";
import AuthPageHeaderLinks from "@/components/auth/AuthPageHeaderLinks";

export default function Signup() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [didSignup, setDidSignup] = useState(false);
  const [lastSignupEmail, setLastSignupEmail] = useState("");

  const handleSignup = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage("");
    try {
      const res = await api.post<{ message: string }>("/auth/signup", {
        email,
        password,
      });
      setMessage(res.data.message);
      setDidSignup(true);
      setLastSignupEmail(email.trim().toLowerCase());
      setPassword("");
      trackEvent("auth_signup_success");
    } catch (err: unknown) {
      setMessage(getAuthErrorMessage(err, "Signup scatter o!"));
      trackEvent("auth_signup_failed", { status: getAuthErrorStatus(err) });
      setDidSignup(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendVerification = async () => {
    if (!lastSignupEmail) return;
    try {
      setIsResending(true);
      const res = await api.post<{ message: string }>("/auth/resend-verification", {
        email: lastSignupEmail,
      });
      setMessage(res.data.message || "Verification mail don resend.");
      trackEvent("auth_resend_verification", { source: "signup" });
    } catch (err: unknown) {
      setMessage(getAuthErrorMessage(err, "Resend scatter o!"));
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-200 w-full max-w-md">
        <AuthPageHeaderLinks rightHref="/login" rightLabel="Sign in" />
        <h1 className="text-3xl font-bold text-green-800 mb-6">
          Join NaijaTalk
        </h1>
        <p className="mb-4 text-sm text-slate-600">
          Create your account, then verify your email before login.
        </p>
        <form onSubmit={handleSignup}>
          <div className="mb-4">
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 text-gray-800"
              required
              autoComplete="email"
            />
          </div>
          <div className="mb-6">
            <input
              type="password"
              placeholder="Set your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 text-gray-800"
              required
              minLength={8}
              autoComplete="new-password"
            />
            <p className="mt-1 text-xs text-slate-500">
              Use at least 8 characters.
            </p>
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-green-600 text-white p-3 rounded-lg hover:bg-green-700 disabled:bg-green-400"
          >
            {isSubmitting ? "Creating account..." : "Sign Up"}
          </button>
        </form>
        {message && (
          <p className="mt-4 text-center text-sm text-gray-600">{message}</p>
        )}
        {didSignup && (
          <div className="mt-4 space-y-2">
            <button
              type="button"
              onClick={handleResendVerification}
              disabled={isResending}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              {isResending ? "Resending..." : "Resend Verification Email"}
            </button>
            <Link
              href="/login"
              className="block w-full rounded-lg bg-green-700 px-3 py-2 text-center text-sm text-white hover:bg-green-800"
            >
              Go to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
