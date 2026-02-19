// frontend/src/app/(authenticated)/premium/page.tsx
"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import Link from "next/link";
import Header from "../../../components/Header";

// Define response types
interface UserResponse {
  _id: string;
  email: string;
  isPremium: boolean;
  flair?: string | null;
}

interface WalletResponse {
  balance: number;
}

interface TipHistoryResponse {
  sent: Tip[];
  received: Tip[];
}

interface AdsResponse {
  ads: Ad[];
  message: string;
}

type Ad = {
  _id: string;
  userId: string;
  brand: string;
  text: string;
  link: string;
  type: "sidebar" | "banner" | "popup";
  budget: number; // kobo
  cpc: number; // kobo
  status: "pending" | "active" | "expired";
  clicks: number;
  impressions: number;
  createdAt: string;
  updatedAt: string;
};

type Tip = {
  amount: number;
  date: string;
  from?: string;
  to?: string;
};

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
  const [userAds, setUserAds] = useState<Ad[]>([]);
  const [flair, setFlair] = useState<string | null>(null);
  const [tipHistory, setTipHistory] = useState<{
    sent: Tip[];
    received: Tip[];
  }>({
    sent: [],
    received: [],
  });
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAdModalOpen, setIsAdModalOpen] = useState(false);
  const [adBrand, setAdBrand] = useState("");
  const [adText, setAdText] = useState("");
  const [adLink, setAdLink] = useState("");
  const [adType, setAdType] = useState<"sidebar" | "banner" | "popup">(
    "sidebar"
  );
  const [adBudget, setAdBudget] = useState("");
  const [adCpc, setAdCpc] = useState("");

  const router = useRouter();
  const searchParams = useSearchParams();

  const fetchUserAds = async () => {
    try {
      const token = localStorage.getItem("token");
      const userRes = await axios.get<UserResponse>("/api/users/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const adsRes = await axios.get<AdsResponse>("/api/ads", {
        headers: { Authorization: `Bearer ${token}` },
        params: { userId: userRes.data._id },
      });
      console.log("Fetched User Ads:", adsRes.data.ads);
      setUserAds(adsRes.data.ads);
    } catch (err) {
      console.error("Failed to fetch user ads:", err);
      setMessage("Ads no dey load—check later!");
    }
  };

  useEffect(() => {
    const checkPremiumAndWallet = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No token—abeg login!");

        // Fetch user data first
        const userRes = await axios.get<UserResponse>("/api/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Then fetch everything else with userId
        const [walletRes, tipHistoryRes, adsRes] = await Promise.all([
          axios.get<WalletResponse>("/api/premium/wallet", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get<TipHistoryResponse>("/api/premium/tip-history", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get<AdsResponse>("/api/ads", {
            headers: { Authorization: `Bearer ${token}` },
            params: { userId: userRes.data._id },
          }),
        ]);

        setIsPremium(userRes.data.isPremium);
        setFlair(userRes.data.flair || null);
        setWalletBalance(walletRes.data.balance);
        setTipHistory(tipHistoryRes.data);
        console.log("Initial User Ads:", adsRes.data.ads);
        setUserAds(adsRes.data.ads);

        const reference = searchParams.get("reference");
        if (reference && !userRes.data.isPremium)
          await verifyPayment(reference);
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
      const res = await axios.post<{ paymentLink: string }>(
        "/api/premium/initiate",
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
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
      if (res.data.message.includes("activated")) {
        setIsPremium(true);
        setFlair(res.data.user?.flair || null);
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
      const res = await axios.post<{ message: string }>(
        "/api/users/flair",
        { flair: newFlair || null },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setMessage(res.data.message);
      setFlair(newFlair || null);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setMessage(err.response?.data?.message || "Flair update scatter o!");
      } else {
        setMessage("Flair update scatter o!");
      }
    }
  };

  const handleCreateAd = async (e: React.FormEvent) => {
    e.preventDefault();
    const budgetInKobo = parseFloat(adBudget) * 100;
    const cpcInKobo = parseFloat(adCpc) * 100;
    const minCpc = { sidebar: 50, banner: 75, popup: 100 };
    if (cpcInKobo < minCpc[adType] * 100) {
      setMessage(`CPC too low—minimum ₦${minCpc[adType]} for ${adType}!`);
      return;
    }
    if (walletBalance < budgetInKobo) {
      setMessage("Wallet no reach—fund am for Premium!");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      console.log("Creating Ad:", {
        brand: adBrand,
        text: adText,
        link: adLink,
        type: adType,
        budget: budgetInKobo,
        cpc: cpcInKobo,
      });
      const res = await axios.post<{ message: string; ad: Ad }>(
        "/api/ads",
        {
          brand: adBrand,
          text: adText,
          link: adLink,
          type: adType,
          budget: budgetInKobo,
          cpc: cpcInKobo,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log("Ad Creation Response:", res.data);
      setMessage(res.data.message);
      setAdBrand("");
      setAdText("");
      setAdLink("");
      setAdType("sidebar");
      setAdBudget("");
      setAdCpc("");
      setIsAdModalOpen(false);
      setWalletBalance(walletBalance - budgetInKobo);
      fetchUserAds();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        console.error("Ad creation error:", err.response?.data);
        setMessage(err.response?.data?.message || "Ad creation scatter o!");
      } else {
        setMessage("Ad creation scatter o!");
      }
    }
  };

  const handleDuplicateAd = async (ad: Ad) => {
    const newBudget = prompt("Enter new budget (₦):", "1000");
    if (!newBudget || isNaN(parseFloat(newBudget))) {
      setMessage("Invalid budget—try again!");
      return;
    }
    const budgetInKobo = parseFloat(newBudget) * 100;
    if (walletBalance < budgetInKobo) {
      setMessage("Wallet no reach—fund am for Premium!");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post<{ message: string; ad: Ad }>(
        "/api/ads",
        {
          brand: ad.brand,
          text: ad.text,
          link: ad.link,
          type: ad.type,
          budget: budgetInKobo,
          cpc: ad.cpc,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log("Duplicated Ad Response:", res.data);
      setMessage("Ad duplicated—pending approval!");
      setWalletBalance(walletBalance - budgetInKobo);
      fetchUserAds();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setMessage(err.response?.data?.message || "Duplication scatter o!");
      } else {
        setMessage("Duplication scatter o!");
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-5xl mx-auto mb-3">
        <Header
          title="NaijaTalk Premium"
          isLoggedIn={true}
          onLogout={handleLogout}
        />
        <div className="bg-white rounded-b-lg shadow-md p-6">
          {message && (
            <p className="text-center text-sm text-gray-600 mb-4">{message}</p>
          )}
          {isPremium ? (
            <div>
              <p className="text-lg text-green-600 mb-4 text-center">
                You be {flair ? flair : "Oga"}!
              </p>
              <p className="text-sm text-gray-600 mb-4 text-center">
                Enjoy ad-free vibes and VIP gist lounge!
              </p>
              {flair ? (
                <span
                  className={`block text-center text-white px-2 py-1 rounded text-sm mb-4 mx-auto w-fit ${flair === "Oga at the Top"
                      ? "bg-yellow-500"
                      : "bg-green-500"
                    }`}
                >
                  {flair}
                </span>
              ) : (
                <span className="block text-center text-gray-500 text-sm mb-4">
                  No flair yet—pick one!
                </span>
              )}
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
              <div className="mt-4">
                <p className="text-sm font-semibold text-gray-700 text-center">
                  Wallet Balance: ₦
                  {(walletBalance / 100).toLocaleString("en-NG")}
                </p>
                <button
                  onClick={() => setIsAdModalOpen(true)}
                  className="mt-4 w-full bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 text-sm"
                >
                  Create Ad
                </button>
              </div>

              {/* Ads Dashboard */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-green-800 mb-3">
                  Your Ads
                </h3>
                {userAds.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-gray-700">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="p-2 text-left">Brand</th>
                          <th className="p-2 text-left">Type</th>
                          <th className="p-2 text-right">Budget (₦)</th>
                          <th className="p-2 text-right">CPC (₦)</th>
                          <th className="p-2 text-center">Clicks</th>
                          <th className="p-2 text-center">Impressions</th>
                          <th className="p-2 text-center">Status</th>
                          <th className="p-2 text-left">Created</th>
                          <th className="p-2 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {userAds.map((ad) => (
                          <tr
                            key={ad._id}
                            className="border-b hover:bg-gray-50"
                          >
                            <td className="p-2">{ad.brand}</td>
                            <td className="p-2 capitalize">{ad.type}</td>
                            <td className="p-2 text-right">
                              {(ad.budget / 100).toLocaleString("en-NG")}
                            </td>
                            <td className="p-2 text-right">
                              {(ad.cpc / 100).toLocaleString("en-NG")}
                            </td>
                            <td className="p-2 text-center">{ad.clicks}</td>
                            <td className="p-2 text-center">
                              {ad.impressions}
                            </td>
                            <td className="p-2 text-center">
                              <span
                                className={`inline-block px-2 py-1 rounded text-xs ${ad.status === "active"
                                    ? "bg-green-500 text-white"
                                    : ad.status === "pending"
                                      ? "bg-yellow-500 text-white"
                                      : "bg-red-500 text-white"
                                  }`}
                              >
                                {ad.status}
                              </span>
                            </td>
                            <td className="p-2">
                              {new Date(ad.createdAt).toLocaleDateString()}
                            </td>
                            <td className="p-2 text-center">
                              {ad.status === "expired" && (
                                <button
                                  onClick={() => handleDuplicateAd(ad)}
                                  className="bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 text-xs"
                                >
                                  Duplicate
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center">
                    No ads yet—create one to start!
                  </p>
                )}
              </div>

              {/* Tip History */}
              <div className="mt-6">
                <p className="text-sm font-semibold text-gray-700 text-center">
                  Tip History:
                </p>
                {tipHistory.sent.length > 0 ||
                  tipHistory.received.length > 0 ? (
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
                  <p className="text-xs text-gray-500 text-center">
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
          <Link
            href="/threads"
            className="block text-center text-blue-600 hover:underline text-sm mt-4"
          >
            Back to Threads
          </Link>
        </div>
      </div>

      {/* Ad Modal */}
      {isAdModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-80 md:w-96">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-green-800">Create New Ad</h3>
              <button
                onClick={() => setIsAdModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <span className="material-icons-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleCreateAd}>
              <input
                type="text"
                placeholder="Brand Name"
                value={adBrand}
                onChange={(e) => setAdBrand(e.target.value)}
                className="w-full p-2 mb-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 text-gray-800 text-sm"
                required
              />
              <input
                type="text"
                placeholder="Ad Text"
                value={adText}
                onChange={(e) => setAdText(e.target.value)}
                className="w-full p-2 mb-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 text-gray-800 text-sm"
                required
              />
              <input
                type="url"
                placeholder="Link (e.g., https://example.com)"
                value={adLink}
                onChange={(e) => setAdLink(e.target.value)}
                className="w-full p-2 mb-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 text-gray-800 text-sm"
                required
              />
              <select
                value={adType}
                onChange={(e) =>
                  setAdType(e.target.value as "sidebar" | "banner" | "popup")
                }
                className="w-full p-2 mb-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 text-gray-800 bg-white text-sm"
              >
                <option value="sidebar">Sidebar (₦50/click)</option>
                <option value="banner">Banner (₦75/click)</option>
                <option value="popup">Popup (₦100/click)</option>
              </select>
              <input
                type="number"
                placeholder="Budget (₦)"
                value={adBudget}
                onChange={(e) => setAdBudget(e.target.value)}
                className="w-full p-2 mb-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 text-gray-800 text-sm"
                min="100"
                step="1"
                required
              />
              <div className="text-sm text-gray-600 mb-2">
                Minimum CPC: ₦
                {adType === "sidebar" ? 50 : adType === "banner" ? 75 : 100}
              </div>
              <input
                type="number"
                placeholder="Cost Per Click (₦)"
                value={adCpc}
                onChange={(e) => setAdCpc(e.target.value)}
                className="w-full p-2 mb-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 text-gray-800 text-sm"
                min={adType === "sidebar" ? 50 : adType === "banner" ? 75 : 100}
                step="1"
                required
              />
              <button
                type="submit"
                className="w-full bg-green-600 text-white p-2 rounded-lg hover:bg-green-700 text-sm"
              >
                Submit Ad
              </button>
            </form>
          </div>
        </div>
      )}
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
