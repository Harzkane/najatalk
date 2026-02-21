// frontend/src/app/(authenticated)/premium/page.tsx
"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import api from "../../../utils/api";
import axios from "axios"; // Keep for isAxiosError check
import Link from "next/link";
import Header from "../../../components/Header";

// Define response types
interface UserResponse {
  _id: string;
  email: string;
  isPremium: boolean;
  premiumStatus?: "inactive" | "active" | "expired" | "canceled" | "legacy";
  premiumPlan?: "monthly" | null;
  premiumStartedAt?: string | null;
  premiumExpiresAt?: string | null;
  nextBillingAt?: string | null;
  cancelAtPeriodEnd?: boolean;
  flair?: string | null;
}

interface Ad {
  _id: string;
  userId: string;
  brand: string;
  text: string;
  link: string;
  type: "sidebar" | "banner" | "popup";
  budget: number; // kobo
  cpc: number; // kobo
  status: "pending" | "active" | "paused" | "expired";
  clicks: number;
  impressions: number;
  createdAt: string;
  updatedAt: string;
}

interface WalletLedgerEntry {
  _id: string;
  status: "pending" | "completed" | "failed";
  entryKind: string;
  walletEffect: number;
  amount: number;
  counterparty: string;
  date: string;
}

interface WalletLedgerResponse {
  balance: number;
  availableBalance?: number;
  heldBalance?: number;
  entries: WalletLedgerEntry[];
}

interface PremiumBillingRow {
  _id: string;
  reference: string;
  status: "initiated" | "processing" | "completed" | "failed";
  amount: number;
  currency: string;
  verificationSource: "manual" | "webhook" | null;
  verifyAttempts: number;
  failureReason: string | null;
  createdAt: string;
  verifiedAt: string | null;
}

interface PremiumBillingResponse {
  summary: {
    total: number;
    completedCount: number;
    failedCount: number;
    processingCount: number;
    initiatedCount: number;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasPrev: boolean;
    hasNext: boolean;
  };
  rows: PremiumBillingRow[];
}

function PremiumLoading() {
  return (
    <div className="min-h-screen bg-slate-100 p-6 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 max-w-md w-full">
        <h1 className="text-3xl font-bold text-green-800 mb-4">
          NaijaTalk Premium
        </h1>
        <p className="text-center text-sm text-gray-600 mb-4">Loading...</p>
      </div>
    </div>
  );
}

function PremiumPageContent() {
  const [activeTab, setActiveTab] = useState<"subscription" | "benefits" | "billing">(
    "subscription"
  );
  const [isPremium, setIsPremium] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [premiumStatus, setPremiumStatus] = useState<UserResponse["premiumStatus"]>("inactive");
  const [premiumExpiresAt, setPremiumExpiresAt] = useState<string | null>(null);
  const [userAds, setUserAds] = useState<Ad[]>([]);
  const [flair, setFlair] = useState<string | null>(null);

  interface Tip {
    amount: number;
    date: string;
    from?: string;
    to?: string;
  }
  const [tipHistory, setTipHistory] = useState<{
    sent: Tip[];
    received: Tip[];
  }>({
    sent: [],
    received: [],
  });

  const [billingRows, setBillingRows] = useState<PremiumBillingRow[]>([]);
  const [billingSummary, setBillingSummary] = useState<PremiumBillingResponse["summary"]>({
    total: 0,
    completedCount: 0,
    failedCount: 0,
    processingCount: 0,
    initiatedCount: 0,
  });
  const [billingStatusFilter, setBillingStatusFilter] = useState<
    "all" | "initiated" | "processing" | "completed" | "failed"
  >("all");
  const [billingPage, setBillingPage] = useState(1);
  const [billingPagination, setBillingPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    hasPrev: false,
    hasNext: false,
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

  const fetchBillingHistory = useCallback(async (status: string, page = 1) => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.get<PremiumBillingResponse>("/premium/my-payments", {
        headers: { Authorization: `Bearer ${token}` },
        params: { status, page, limit: 10 },
      });
      setBillingRows(res.data.rows || []);
      setBillingPagination(
        res.data.pagination || {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 1,
          hasPrev: false,
          hasNext: false,
        }
      );
      setBillingSummary(
        res.data.summary || {
          total: 0,
          completedCount: 0,
          failedCount: 0,
          processingCount: 0,
          initiatedCount: 0,
        }
      );
    } catch (err) {
      console.error("Failed to fetch billing history:", err);
      setMessage("Billing history no load. Try again.");
    }
  }, []);

  const fetchUserAds = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.get<{ ads: Ad[]; message: string }>("/ads", {
        headers: { Authorization: `Bearer ${token}` },
        params: { status: "pending" }, // Only show pending ads in the dashboard for now
      });
      setUserAds(res.data.ads || []);
    } catch (err) {
      console.error("Failed to fetch user ads:", err);
    }
  }, []);

  useEffect(() => {
    const checkPremiumAndWallet = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No token—abeg login!");

        // Fetch user data first
        const userRes = await api.get<UserResponse>("/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Then fetch everything else
        const [walletLedgerRes, adsRes] = await Promise.all([
          api.get<WalletLedgerResponse>("/users/me/wallet-ledger", {
            headers: { Authorization: `Bearer ${token}` },
            params: { includePending: false, limit: 100 },
          }),
          api.get<{ ads: Ad[]; message: string }>("/ads", {
            headers: { Authorization: `Bearer ${token}` },
            params: { status: "pending" },
          }),
        ]);

        setIsPremium(userRes.data.isPremium);
        setPremiumStatus(userRes.data.premiumStatus || (userRes.data.isPremium ? "active" : "inactive"));
        setPremiumExpiresAt(userRes.data.premiumExpiresAt || null);
        setFlair(userRes.data.flair || null);

        setWalletBalance(
          walletLedgerRes.data.availableBalance ?? walletLedgerRes.data.balance ?? 0
        );

        const entries = walletLedgerRes.data.entries || [];
        setTipHistory({
          sent: entries
            .filter((entry) => entry.entryKind === "tip_external" && entry.status === "completed")
            .map((entry) => ({
              amount: entry.amount / 100,
              date: entry.date,
              to: entry.counterparty,
            })),
          received: entries
            .filter((entry) => entry.entryKind === "tip_received" && entry.status === "completed")
            .map((entry) => ({
              amount: Math.max(0, entry.walletEffect) / 100,
              date: entry.date,
              from: entry.counterparty,
            })),
        });

        setUserAds(adsRes.data.ads || []);
        await fetchBillingHistory(billingStatusFilter, 1);

        const reference = searchParams.get("reference");
        if (reference && !userRes.data.isPremium)
          await verifyPayment(reference);
      } catch (err) {
        console.error("Check Error:", err);
        router.push("/login");
      }
    };
    checkPremiumAndWallet();
  }, [router, searchParams, fetchBillingHistory, billingStatusFilter]);

  const handleSubscribe = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await api.post<{ paymentLink: string }>(
        "/premium/initiate",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
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
      const res = await api.get<{
        message: string;
        user?: { flair?: string; premiumStatus?: any; premiumExpiresAt?: any };
      }>(`/premium/verify?reference=${reference}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.message.includes("activated")) {
        setIsPremium(true);
        setPremiumStatus(res.data.user?.premiumStatus || "active");
        setPremiumExpiresAt(res.data.user?.premiumExpiresAt || null);
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
    const normalized = newFlair || null;
    if ((flair || null) === normalized) {
      setMessage("You already dey use this flair.");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const res = await api.post<{ message: string }>(
        "/users/flair",
        { flair: normalized },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(res.data.message);
      setFlair(normalized);
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
    const minCpc = { sidebar: 50, banner: 75, popup: 100 }; // Naira
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
      const res = await api.post<{ message: string; ad: Ad }>(
        "/ads",
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
        setMessage(err.response?.data?.message || "Ad creation scatter o!");
      } else {
        setMessage("Ad creation scatter o!");
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto mb-4">
        <Header
          title="NaijaTalk Premium"
          isLoggedIn={true}
          onLogout={handleLogout}
          secondaryLink={{ href: "/threads", label: "Threads" }}
        />
        <div className="bg-white rounded-b-lg shadow-sm border border-slate-200 border-t-0 p-6">
          {message && (
            <p className="text-center text-sm text-slate-600 mb-4">{message}</p>
          )}

          <div className="mb-4 flex flex-wrap gap-2">
            <button
              onClick={() => setActiveTab("subscription")}
              className={`rounded-md px-3 py-1.5 text-sm font-semibold ${activeTab === "subscription"
                  ? "bg-green-700 text-white"
                  : "border border-slate-300 text-slate-700 hover:bg-slate-50"
                }`}
            >
              Subscription
            </button>
            <button
              onClick={() => setActiveTab("benefits")}
              className={`rounded-md px-3 py-1.5 text-sm font-semibold ${activeTab === "benefits"
                  ? "bg-green-700 text-white"
                  : "border border-slate-300 text-slate-700 hover:bg-slate-50"
                }`}
            >
              Benefits
            </button>
            <button
              onClick={() => setActiveTab("billing")}
              className={`rounded-md px-3 py-1.5 text-sm font-semibold ${activeTab === "billing"
                  ? "bg-green-700 text-white"
                  : "border border-slate-300 text-slate-700 hover:bg-slate-50"
                }`}
            >
              Billing History
            </button>
          </div>

          {activeTab === "subscription" && (
            <>
              {isPremium ? (
                <div className="mx-auto max-w-3xl rounded-lg border border-slate-200 bg-white p-5">
                  <p className="text-lg font-semibold text-green-700 mb-1 text-center">
                    You be {flair ? flair : "Oga"}!
                  </p>
                  <p className="text-xs text-slate-600 mb-5 text-center">
                    Status: {premiumStatus || "active"}
                    {premiumExpiresAt
                      ? ` | Expires: ${new Date(premiumExpiresAt).toLocaleDateString("en-NG")}`
                      : ""}
                  </p>
                  <div className="mx-auto max-w-md rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <label className="block text-slate-700 text-sm font-semibold mb-2">
                      Pick Your Shine, Oga
                    </label>
                    <select
                      value={flair || ""}
                      onChange={(e) => handleFlairChange(e.target.value)}
                      className="w-full max-w-md p-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-green-600 bg-white"
                    >
                      <option value="">No Flair</option>
                      <option value="Verified G">Verified G</option>
                      <option value="Oga at the Top">Oga at the Top</option>
                    </select>
                  </div>
                  <div className="mt-5 mx-auto max-w-md rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-slate-700 text-center mb-3">
                      Wallet Balance: ₦
                      {(walletBalance / 100).toLocaleString("en-NG")}
                    </p>
                    <div className="flex justify-center">
                      <button
                        onClick={() => setIsAdModalOpen(true)}
                        className="inline-flex min-w-40 justify-center bg-green-700 text-white px-4 py-2 rounded-md hover:bg-green-800 text-sm"
                      >
                        Create Ad
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mx-auto max-w-2xl rounded-lg border border-slate-200 bg-white p-6 text-center">
                  <p className="text-lg font-semibold text-slate-800 mb-2">
                    Upgrade to Premium for ₦500/month!
                  </p>
                  <p className="text-sm text-slate-600 mb-5">
                    Activate monthly premium to remove ads and unlock identity perks.
                  </p>
                  <div className="flex justify-center">
                    <button
                      onClick={handleSubscribe}
                      disabled={isLoading}
                      className="inline-flex min-w-44 justify-center bg-green-700 text-white px-5 py-3 rounded-md hover:bg-green-800 disabled:bg-green-400"
                    >
                      {isLoading ? "Loading..." : "Subscribe Now"}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === "benefits" && (
            <div className="mx-auto max-w-2xl">
              <ul className="text-sm text-slate-700 mb-4 list-disc pl-5 space-y-2">
                <li>Ad-free reading experience across core pages.</li>
                <li>Custom flair identity (Verified G / Oga at the Top).</li>
                <li>Ad creation and performance dashboard.</li>
                <li>Premium-only billing and subscription visibility.</li>
              </ul>
            </div>
          )}

          {activeTab === "billing" && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-4 items-center justify-between">
                <div className="flex flex-wrap gap-2">
                  {["all", "initiated", "processing", "completed", "failed"].map((status) => (
                    <button
                      key={status}
                      onClick={() => {
                        setBillingStatusFilter(status as any);
                        setBillingPage(1);
                      }}
                      className={`rounded-full border px-3 py-1 text-xs font-semibold ${billingStatusFilter === status
                          ? "border-green-600 bg-green-600 text-white"
                          : "border-slate-300 bg-white text-slate-600 hover:border-green-400"
                        }`}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="p-3 font-semibold text-slate-700">Reference</th>
                      <th className="p-3 font-semibold text-slate-700">Amount</th>
                      <th className="p-3 font-semibold text-slate-700">Status</th>
                      <th className="p-3 font-semibold text-slate-700">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {billingRows.length > 0 ? (
                      billingRows.map((row) => (
                        <tr key={row._id} className="hover:bg-slate-50">
                          <td className="p-3 font-mono text-xs">{row.reference}</td>
                          <td className="p-3">₦{(row.amount / 100).toLocaleString("en-NG")}</td>
                          <td className="p-3">
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${row.status === "completed" ? "bg-green-100 text-green-700" :
                                row.status === "failed" ? "bg-red-100 text-red-700" :
                                  "bg-yellow-100 text-yellow-700"
                              }`}>
                              {row.status}
                            </span>
                          </td>
                          <td className="p-3 text-slate-500">{new Date(row.createdAt).toLocaleDateString("en-NG")}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="p-6 text-center text-slate-500">No billing history found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {isAdModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="bg-green-800 text-white p-4">
              <h3 className="text-xl font-bold">Create New Ad</h3>
            </div>
            <form onSubmit={handleCreateAd} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Brand Name</label>
                <input
                  type="text"
                  value={adBrand}
                  onChange={(e) => setAdBrand(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-green-600 outline-none text-gray-800"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Ad Gist (Text)</label>
                <textarea
                  value={adText}
                  onChange={(e) => setAdText(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-green-600 outline-none h-20 text-gray-800"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Destination URL</label>
                <input
                  type="url"
                  value={adLink}
                  onChange={(e) => setAdLink(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-green-600 outline-none text-gray-800"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Ad Type</label>
                  <select
                    value={adType}
                    onChange={(e) => setAdType(e.target.value as any)}
                    className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-green-600 outline-none bg-white text-gray-800"
                  >
                    <option value="sidebar">Sidebar (₦50 CPC)</option>
                    <option value="banner">Banner (₦75 CPC)</option>
                    <option value="popup">Popup (₦100 CPC)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Budget (₦)</label>
                  <input
                    type="number"
                    value={adBudget}
                    onChange={(e) => setAdBudget(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-green-600 outline-none text-gray-800"
                    placeholder="e.g. 5000"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">CPC (₦) — Min ₦50+</label>
                <input
                  type="number"
                  value={adCpc}
                  onChange={(e) => setAdCpc(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-green-600 outline-none text-gray-800"
                  placeholder="e.g. 60"
                  required
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdModalOpen(false)}
                  className="flex-1 bg-slate-200 text-slate-800 py-2 rounded-md hover:bg-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-green-700 text-white py-2 rounded-md hover:bg-green-800 font-semibold"
                >
                  Sumbit for Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Premium() {
  return (
    <Suspense fallback={<PremiumLoading />}>
      <PremiumPageContent />
    </Suspense>
  );
}
