"use client";

import { useEffect, useState, Suspense } from "react";
import { isAxiosError } from "axios";
import { useParams, useRouter } from "next/navigation";
import api from "@/utils/api";
import AuthPageHeaderLinks from "@/components/auth/AuthPageHeaderLinks";

// Loading component
function VerifyLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-200 w-full max-w-md">
        <AuthPageHeaderLinks rightHref="/login" rightLabel="Back to Login" />
        <h1 className="text-3xl font-bold text-green-800 mb-6">
          Verify Your Email
        </h1>
        <p className="text-center text-gray-600">Loading verification...</p>
      </div>
    </div>
  );
}

// Main content component that uses useParams
function VerifyContent() {
  const router = useRouter();
  const params = useParams<{ token: string }>();
  const token = params?.token;
  const [message, setMessage] = useState<string>("Verifying your email...");

  useEffect(() => {
    if (token) {
      api
        .get<{ message: string }>(`/auth/verify/${token}`)
        .then((res) => setMessage(res.data.message))
        .catch((err: unknown) => {
          setMessage(
            isAxiosError<{ message?: string }>(err)
              ? err.response?.data?.message || "Verification scatter o!"
              : "Verification scatter o!"
          );
        });
    }
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-200 w-full max-w-md">
        <AuthPageHeaderLinks rightHref="/login" rightLabel="Back to Login" />
        <h1 className="text-3xl font-bold text-green-800 mb-6">
          Verify Your Email
        </h1>
        <p className="text-center text-gray-600">{message}</p>
        {message.includes("verified") && (
          <button
            onClick={() => router.push("/login")}
            className="mt-6 w-full bg-green-600 text-white p-3 rounded-lg hover:bg-green-700"
          >
            Go to Login
          </button>
        )}
      </div>
    </div>
  );
}

// Main component that provides the suspense boundary
export default function Verify() {
  return (
    <Suspense fallback={<VerifyLoading />}>
      <VerifyContent />
    </Suspense>
  );
}
