"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import axios, { AxiosError } from "axios";

// Loading component
function VerifyLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
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
  const { token } = useParams<{ token: string }>();
  const [message, setMessage] = useState<string>("Verifying your email...");

  useEffect(() => {
    if (token) {
      axios
        .get<{ message: string }>(`/api/auth/verify/${token}`)
        .then((res) => setMessage(res.data.message))
        .catch((err: AxiosError<{ message: string }>) =>
          setMessage(err.response?.data?.message || "Verification scatter o!")
        );
    }
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
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
