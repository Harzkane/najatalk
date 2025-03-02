// frontend/src/app/(authenticated)/premium/page.tsx
"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import Link from "next/link";

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

function PremiumPageContent() {
  const [isPremium, setIsPremium] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [flair, setFlair] = useState<string | null>(null); // New state for flair
  interface Tip {
    amount: number;
    date: string;
    from?: string; // Optional for received tips
    to?: string; // Optional for sent tips
  }
  const [tipHistory, setTipHistory] = useState<{
    sent: Tip[];
    received: Tip[];
  }>({ sent: [], received: [] });
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const checkPremiumAndWallet = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No token—abeg login!");
        const [userRes, walletRes, tipHistoryRes] = await Promise.all([
          axios.get("/api/users/me", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get("/api/premium/wallet", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get("/api/premium/tip-history", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        setIsPremium(userRes.data.isPremium);
        setFlair(userRes.data.flair); // Fetch flair from user profile
        setWalletBalance(walletRes.data.balance);
        setTipHistory(tipHistoryRes.data);
        const reference = searchParams.get("reference");
        if (reference && !userRes.data.isPremium) {
          await verifyPayment(reference);
        }
      } catch (err) {
        console.error("Check Error:", err);
        router.push("/login");
      }
    };
    checkPremiumAndWallet();
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
        setFlair(res.data.user?.flair || null); // Update flair if returned
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

  const handleFlairChange = async (newFlair: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        "/api/users/flair",
        { flair: newFlair || null }, // Send null to clear flair
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(res.data.message);
      setFlair(newFlair || null); // Update local flair state
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setMessage(err.response?.data?.message || "Flair update scatter o!");
      } else {
        setMessage("Flair update scatter o!");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-md p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-green-800">
            NaijaTalk Premium
            {isPremium && flair && (
              <span
                className={`ml-2 inline-block text-white px-2 py-1 rounded text-sm ${
                  flair === "Oga at the Top" ? "bg-yellow-500" : "bg-green-500"
                }`}
              >
                {flair}
              </span>
            )}
          </h1>
          <Link
            href="/threads"
            className="text-blue-600 hover:underline text-sm"
          >
            Back to Threads
          </Link>
        </div>
        {message && (
          <p className="text-center text-sm text-gray-600 mb-4">{message}</p>
        )}
        {isPremium ? (
          <div className="text-center">
            <p className="text-lg text-green-600 mb-4">
              You be {flair ? flair : "Oga"}!
            </p>
            <p className="text-sm text-gray-600 mb-4">
              Enjoy ad-free vibes and VIP gist lounge!
            </p>
            {/* Flair Display */}
            {flair ? (
              <span
                className={`inline-block text-white px-2 py-1 rounded text-sm mb-4 ${
                  flair === "Oga at the Top" ? "bg-yellow-500" : "bg-green-500"
                }`}
              >
                {flair}
              </span>
            ) : (
              <span className="inline-block text-gray-500 text-sm mb-4">
                No flair yet—pick one!
              </span>
            )}
            {/* Flair Picker */}
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-semibold mb-2">
                Pick Your Shine, Oga!
              </label>
              <select
                value={flair || ""}
                onChange={(e) => handleFlairChange(e.target.value)}
                className="w-full p-2 border rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-600"
              >
                <option value="">No Flair</option>
                <option value="Verified G">Verified G</option>
                <option value="Oga at the Top">Oga at the Top</option>
              </select>
            </div>
            {/* Wallet and Tip History */}
            <div className="mt-4">
              <p className="text-sm font-semibold text-gray-700">
                Wallet Balance: ₦{walletBalance}
              </p>
              <p className="text-xs text-gray-500 mt-2">Tip History:</p>
              {tipHistory.sent.length > 0 || tipHistory.received.length > 0 ? (
                <ul className="text-xs text-gray-600 text-left mt-1 max-h-40 overflow-y-auto">
                  {tipHistory.sent.map((tip, idx) => (
                    <li key={idx}>
                      Sent ₦{tip.amount} to {tip.to || "someone"} on{" "}
                      {new Date(tip.date).toLocaleString()}
                    </li>
                  ))}
                  {tipHistory.received.map((tip, idx) => (
                    <li key={idx}>
                      Received ₦{tip.amount} from {tip.from || "someone"} on{" "}
                      {new Date(tip.date).toLocaleString()}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-gray-500">
                  No tips yet—start tipping!
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-lg text-gray-700 mb-4">
              Upgrade to Premium for ₦500/month!
            </p>
            <ul className="text-sm text-gray-600 mb-4 text-left">
              <li>Ad-free experience</li>
              <li>Custom flair (e.g., “Oga at the Top”)</li>
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

export default function PremiumPage() {
  return (
    <Suspense fallback={<PremiumLoading />}>
      <PremiumPageContent />
    </Suspense>
  );
}
