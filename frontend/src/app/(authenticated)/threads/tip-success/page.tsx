// frontend/src/app/(authenticated)/threads/tip-success/page.tsx
"use client";

import { useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";

// Loading component
function TipSuccessLoading() {
  return (
    <div className="min-h-screen bg-gray-100 p-6 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-md p-6 max-w-md w-full">
        <h1 className="text-3xl font-bold text-green-800 mb-4">
          Processing Tip...
        </h1>
        <p className="text-center text-sm text-gray-600">
          Abeg wait small—your tip dey process!
        </p>
      </div>
    </div>
  );
}

// Main content component that uses useSearchParams
function TipSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const verifyTip = useCallback(
    async (reference: string, recipientId: string) => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No token—abeg login!");
        const res = await axios.get(
          `/api/premium/tip-verify?reference=${reference}&recipientId=${recipientId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log("Verify Tip Response:", res.data);
        if (res.data.message.includes("sent")) {
          router.push("/threads?tip=success");
        }
      } catch (err) {
        if (axios.isAxiosError(err)) {
          console.error("Verify Tip Error:", err.response?.data || err.message);
        } else {
          console.error("Verify Tip Error:", err);
        }
        router.push("/threads?tip=failed");
      }
    },
    [router]
  );

  useEffect(() => {
    const reference = searchParams.get("reference");
    const recipientId = searchParams.get("recipientId");
    if (reference && recipientId) {
      verifyTip(reference, recipientId);
    } else {
      router.push("/threads?tip=failed");
    }
  }, [searchParams, verifyTip, router]);

  return (
    <div className="min-h-screen bg-gray-100 p-6 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-md p-6 max-w-md w-full">
        <h1 className="text-3xl font-bold text-green-800 mb-4">
          Processing Tip...
        </h1>
        <p className="text-center text-sm text-gray-600">
          Abeg wait small—your tip dey process!
        </p>
      </div>
    </div>
  );
}

// Main component that provides the suspense boundary
export default function TipSuccess() {
  return (
    <Suspense fallback={<TipSuccessLoading />}>
      <TipSuccessContent />
    </Suspense>
  );
}
