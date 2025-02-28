// frontend/src/app/premium/success/page.tsx
"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import axios from "axios";

function LoadingComponent() {
  return (
    <div className="min-h-screen bg-gray-100 p-6 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-md p-6 max-w-md w-full">
        <h1 className="text-3xl font-bold text-green-800 mb-4">
          Processing Payment...
        </h1>
        <p className="text-center text-sm text-gray-600">
          Abeg wait small—your premium dey process!
        </p>
      </div>
    </div>
  );
}

function PremiumSuccessContent() {
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState("");
  const [manualActivationAvailable, setManualActivationAvailable] =
    useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const verifyPayment = useCallback(
    async (reference: string) => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.error("No token found—abeg login!");
          router.push("/login");
          return;
        }
        console.log("Sending reference to verify:", reference);
        const res = await axios.post(
          "/api/premium/verify",
          { reference }, // Paystack uses "reference"
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log("Verify Response:", res.data);
        if (res.data.message.includes("activated")) {
          router.push("/?premium=success");
        } else {
          setError(
            "Automatic verification failed. Please use manual activation."
          );
          setManualActivationAvailable(true);
          setIsProcessing(false);
        }
      } catch (err) {
        if (axios.isAxiosError(err)) {
          console.error("Verify Error:", err.response?.data || err.message);
        } else {
          console.error("Verify Error:", err);
        }
        setError("Verification failed. Please try manual activation.");
        setManualActivationAvailable(true);
        setIsProcessing(false);
      }
    },
    [router]
  );

  const completePayment = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found—abeg login!");
        router.push("/login");
        return;
      }
      setIsProcessing(true);
      const res = await axios.post(
        "/api/premium/complete",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log("Manual Complete Response:", res.data);
      if (res.data.success) {
        router.push("/?premium=success");
      } else {
        setError("Manual activation failed. Please contact support.");
        setIsProcessing(false);
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        console.error("Completion Error:", err.response?.data || err.message);
      } else {
        console.error("Completion Error:", err);
      }
      setError("Unknown error during manual activation. Please try again.");
      setIsProcessing(false);
    }
  }, [router]);

  useEffect(() => {
    const reference = searchParams.get("reference");
    console.log("Search Params:", { reference });

    if (reference) {
      setTimeout(() => verifyPayment(reference), 3000); // Delay for Paystack
    } else {
      console.error("No reference found in search params");
      setError("Payment failed or incomplete. Try manual activation.");
      setManualActivationAvailable(true);
      setIsProcessing(false);
    }
  }, [searchParams, verifyPayment]);

  return (
    <div className="min-h-screen bg-gray-100 p-6 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-md p-6 max-w-md w-full">
        <h1 className="text-3xl font-bold text-green-800 mb-4">
          {isProcessing ? "Processing Payment..." : "Payment Completed"}
        </h1>
        {isProcessing ? (
          <p className="text-center text-sm text-gray-600 mb-4">
            Abeg wait small—your premium dey process!
          </p>
        ) : error ? (
          <>
            <p className="text-center text-sm text-red-600 mb-4">{error}</p>
            {manualActivationAvailable && (
              <button
                onClick={completePayment}
                className="w-full bg-green-600 text-white p-3 rounded-lg hover:bg-green-700 mb-4"
              >
                Complete Premium Activation Manually
              </button>
            )}
            <div className="text-center mt-4">
              <Link
                href="/premium"
                className="text-blue-600 hover:underline text-sm"
              >
                Back to Premium Page
              </Link>
            </div>
          </>
        ) : (
          <p className="text-center text-sm text-gray-600 mb-4">
            Your premium features have been activated!
          </p>
        )}
      </div>
    </div>
  );
}

export default function PremiumSuccess() {
  return (
    <Suspense fallback={<LoadingComponent />}>
      <PremiumSuccessContent />
    </Suspense>
  );
}
