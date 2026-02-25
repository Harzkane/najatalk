"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import api from "@/utils/api";
import { trackEvent } from "@/utils/analytics";
import { getAuthErrorMessage, getAuthErrorStatus } from "@/utils/authErrorMessage";

export default function ResetPasswordPage() {
  const router = useRouter();
  const { token } = useParams<{ token: string }>();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setMessage("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setMessage("Passwords no match.");
      return;
    }
    try {
      setIsSubmitting(true);
      const res = await api.post<{ message: string }>(
        `/auth/reset-password/${token}`,
        { password },
      );
      setMessage(res.data.message || "Password reset successful.");
      trackEvent("auth_reset_password_success");
      setPassword("");
      setConfirmPassword("");
      setTimeout(() => router.push("/login"), 1200);
    } catch (err: unknown) {
      setMessage(getAuthErrorMessage(err, "Password reset scatter o!"));
      trackEvent("auth_reset_password_failed", { status: getAuthErrorStatus(err) });
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
          Reset Password
        </h1>
        <p className="mb-4 text-sm text-slate-600">
          Set a new password for your account.
        </p>

        <form onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 text-gray-800"
            minLength={8}
            required
            autoComplete="new-password"
          />
          <input
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="mt-3 w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 text-gray-800"
            minLength={8}
            required
            autoComplete="new-password"
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-4 w-full bg-green-600 text-white p-3 rounded-lg hover:bg-green-700 disabled:bg-green-400"
          >
            {isSubmitting ? "Updating..." : "Update Password"}
          </button>
        </form>

        {message && (
          <p className="mt-4 text-center text-sm text-gray-600">{message}</p>
        )}
      </div>
    </div>
  );
}
