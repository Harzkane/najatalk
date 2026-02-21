// frontend/src/app/tip/success/page.tsx
"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import api from "@/utils/api";

function LoadingComponent() {
  return (
    <div className="min-h-screen bg-slate-100 p-6 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 max-w-md w-full">
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

function TipSuccessContent() {
  const [isProcessing, setIsProcessing] = useState(true);
  const [message, setMessage] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();

  const verifyTip = useCallback(
    async (reference: string, receiverId: string) => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.error("No token found—abeg login!");
          router.push("/login");
          return;
        }
        console.log("Verifying tip:", { reference, receiverId });
        const res = await api.post(
          "/users/verifyTip",
          { reference, receiverId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log("Verify Response:", res.data);
        setMessage(res.data.message || "Tip landed—gist too sweet!");
        setTimeout(() => router.push("/threads"), 3000);
      } catch (err: any) {
        if (err.isAxiosError) {
          console.error("Verify Error:", err.response?.data || err.message);
          setMessage(err.response?.data?.message || "Tip scatter o—try again!");
        } else {
          console.error("Verify Error:", err);
          setMessage("Tip scatter o—try again!");
        }
        setIsProcessing(false);
      }
    },
    [router]
  );

  useEffect(() => {
    const reference = searchParams.get("reference");
    const receiverId = searchParams.get("receiverId");
    console.log("Search Params:", { reference, receiverId });

    if (reference && receiverId) {
      setTimeout(() => verifyTip(reference, receiverId), 3000); // Delay for Paystack
    } else {
      console.error("Missing reference or receiverId in search params");
      setMessage("Tip failed or incomplete—abeg try again!");
      setIsProcessing(false);
    }
  }, [searchParams, verifyTip]);

  return (
    <div className="min-h-screen bg-slate-100 p-6 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 max-w-md w-full">
        <h1 className="text-3xl font-bold text-green-800 mb-4">
          {isProcessing ? "Processing Tip..." : "Tip Result"}
        </h1>
        {isProcessing ? (
          <p className="text-center text-sm text-gray-600 mb-4">
            Abeg wait small—your tip dey process!
          </p>
        ) : (
          <>
            <p className="text-center text-sm text-gray-600 mb-4">{message}</p>
            <div className="text-center mt-4">
              <Link
                href="/threads"
                className="text-blue-600 hover:underline text-sm"
              >
                Back to Threads
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function TipSuccess() {
  return (
    <Suspense fallback={<LoadingComponent />}>
      <TipSuccessContent />
    </Suspense>
  );
}
