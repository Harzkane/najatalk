"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import api from "@/utils/api";
import { trackEvent } from "@/utils/analytics";
import { getAuthErrorMessage, getAuthErrorStatus } from "@/utils/authErrorMessage";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setMessage("");
      const res = await api.post<{ message: string }>("/auth/forgot-password", {
        email,
      });
      setMessage(
        res.data.message || "If this account exists, reset instructions don send.",
      );
      trackEvent("auth_forgot_password_requested");
    } catch (err: unknown) {
      setMessage(getAuthErrorMessage(err, "Reset request scatter o!"));
      trackEvent("auth_forgot_password_failed", { status: getAuthErrorStatus(err) });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-200 w-full max-w-md">
        <div className="mb-4 flex items-center justify-between text-sm">
          <Link href="/" className="text-slate-600 hover:text-slate-900 hover:underline">
            Return to Home
          </Link>
          <Link href="/login" className="text-green-700 hover:text-green-800 hover:underline">
            Back to Login
          </Link>
        </div>
        <h1 className="text-3xl font-bold text-green-800 mb-4">
          Forgot Password
        </h1>
        <p className="mb-4 text-sm text-slate-600">
          Enter your account email and we will send reset instructions.
        </p>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 text-gray-800"
            required
            autoComplete="email"
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-4 w-full bg-green-600 text-white p-3 rounded-lg hover:bg-green-700 disabled:bg-green-400"
          >
            {isSubmitting ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        {message && (
          <p className="mt-4 text-center text-sm text-gray-600">{message}</p>
        )}
      </div>
    </div>
  );
}
