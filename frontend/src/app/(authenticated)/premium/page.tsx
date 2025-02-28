// frontend/src/app/(authenticated)/premium/page.tsx
"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";

// Loading component
function PremiumLoading() {
  return (
    <div className="min-h-screen bg-gray-100 p-6 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-md p-6 max-w-md w-full">
        <h1 className="text-3xl font-bold text-green-800 mb-4">
          NaijaTalk Premium
        </h1>
        <p className="text-center text-sm text-gray-600 mb-4">Loading...</p>
      </div>
    </div>
  );
}

// Main content component that uses useSearchParams
function PremiumPageContent() {
  const [isPremium, setIsPremium] = useState(false);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const checkPremium = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No token—abeg login!");
        const res = await axios.get("/api/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setIsPremium(res.data.isPremium);
        // Handle Paystack callback
        const reference = searchParams.get("reference");
        if (reference && !res.data.isPremium) {
          await verifyPayment(reference);
        }
      } catch (err) {
        console.error("Check Premium Error:", err);
        router.push("/login");
      }
    };
    checkPremium();
  }, [router, searchParams]);

  const handleSubscribe = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        "/api/premium/initiate",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log("Initiate Response:", res.data);
      window.location.href = res.data.paymentLink;
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setMessage(err.response?.data?.message || "Payment scatter o!");
      } else {
        setMessage("Payment scatter o!");
      }
      setIsLoading(false);
    }
  };

  const verifyPayment = async (reference: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `/api/premium/verify?reference=${reference}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log("Verify Response:", res.data);
      if (res.data.message.includes("activated")) {
        setIsPremium(true);
        setMessage("Premium activated—enjoy the VIP vibes!");
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setMessage(err.response?.data?.message || "Verification scatter o!");
      } else {
        setMessage("Verification scatter o!");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-md p-6 max-w-md w-full">
        <h1 className="text-3xl font-bold text-green-800 mb-4">
          NaijaTalk Premium
        </h1>
        {message && (
          <p className="text-center text-sm text-gray-600 mb-4">{message}</p>
        )}
        {isPremium ? (
          <div className="text-center">
            <p className="text-lg text-green-600 mb-4">You be Premium Oga!</p>
            <p className="text-sm text-gray-600 mb-4">
              Enjoy ad-free vibes and VIP gist lounge!
            </p>
            <span className="inline-block bg-yellow-500 text-white px-2 py-1 rounded text-sm">
              Oga at the Top
            </span>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-lg text-gray-700 mb-4">
              Upgrade to Premium for ₦500/month!
            </p>
            <ul className="text-sm text-gray-600 mb-4 text-left">
              <li>Ad-free experience</li>
              <li>Custom flair (e.g., &quot;Oga at the Top&quot;)</li>
              <li>VIP Gist Lounge access</li>
            </ul>
            <button
              onClick={handleSubscribe}
              disabled={isLoading}
              className="w-full bg-green-600 text-white p-3 rounded-lg hover:bg-green-700 disabled:bg-green-400"
            >
              {isLoading ? "Loading..." : "Subscribe Now"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Main component that provides the suspense boundary
export default function PremiumPage() {
  return (
    <Suspense fallback={<PremiumLoading />}>
      <PremiumPageContent />
    </Suspense>
  );
}
