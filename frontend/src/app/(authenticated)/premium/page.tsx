"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/utils/api";
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

interface AdsResponse {
  ads: Ad[];
  message: string;
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

type Ad = {
  _id: string;
  // userId: { _id: string; email: string }; // Nested user object
  userId: string; // Changed to string to match DB
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
};

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
  const [tipPage, setTipPage] = useState(1);
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

  const fetchPendingAds = async () => {
    try {
      const token = localStorage.getItem("token");
      const [userRes, adsRes] = await Promise.all([
        api.get<{
          _id: string;
          email: string;
          isPremium: boolean;
          flair?: string;
        }>("/users/me", { headers: { Authorization: `Bearer ${token}` } }),
        api.get<{ ads: Ad[]; message: string }>("/ads", {
          headers: { Authorization: `Bearer ${token}` },
          params: { status: "pending" },
        }),
      ]);
      const userId = userRes.data._id;
      const filteredAds = adsRes.data.ads.filter((ad) => ad.userId === userId);
      console.log("User ID:", userId);
      console.log("Fetched Ads:", adsRes.data.ads);
      console.log("Filtered Pending Ads:", filteredAds);
      setPendingAds(filteredAds);
    } catch (err) {
      console.error("Failed to fetch pending ads:", err);
      setMessage("Pending ads no dey load—check later!");
    }
  };

  const fetchBillingHistory = useCallback(async (status: string, page = 1) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get<PremiumBillingResponse>("/api/premium/my-payments", {
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
        const [walletLedgerRes, adsRes] = await Promise.all([
          axios.get<WalletLedgerResponse>("/api/users/me/wallet-ledger", {
            headers: { Authorization: `Bearer ${token}` },
            params: { includePending: false, limit: 100 },
          }),
          api.get<{ sent: Tip[]; received: Tip[] }>(
            "/premium/tip-history",
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          ),
          api.get<{ ads: Ad[]; message: string }>("/ads", {
            headers: { Authorization: `Bearer ${token}` },
            params: { status: "pending" },
          }),
        ]);
        const userId = userRes.data._id;
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
        console.log("Initial User Ads:", adsRes.data.ads);
        setUserAds(adsRes.data.ads);
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

  useEffect(() => {
    fetchBillingHistory(billingStatusFilter, billingPage);
  }, [billingStatusFilter, billingPage, fetchBillingHistory]);

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
        user?: { flair?: string };
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
      const res = await axios.post<{ message: string }>(
        "/api/users/flair",
        { flair: normalized },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
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
      console.log("Creating Ad:", {
        brand: adBrand,
        text: adText,
        link: adLink,
        type: adType,
        budget: budgetInKobo,
        cpc: cpcInKobo,
      });
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
      fetchPendingAds();
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

  const exportBillingCsv = () => {
    if (!billingRows.length) {
      setMessage("No billing rows to export.");
      return;
    }
    const headers = [
      "Reference",
      "Amount",
      "Currency",
      "Status",
      "Source",
      "Attempts",
      "FailureReason",
      "CreatedAt",
      "VerifiedAt",
    ];
    const rows = billingRows.map((row) => [
      row.reference,
      (row.amount / 100).toFixed(2),
      row.currency,
      row.status,
      row.verificationSource || "",
      String(row.verifyAttempts || 0),
      row.failureReason || "",
      row.createdAt,
      row.verifiedAt || "",
    ]);
    const csv = [headers, ...rows]
      .map((line) => line.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `premium-billing-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportBillingPdf = () => {
    const reportDate = new Date().toLocaleString("en-NG", {
      dateStyle: "medium",
      timeStyle: "short",
    });
    const tableRows = billingRows
      .map(
        (row) => `
          <tr>
            <td>${row.reference}</td>
            <td>${row.currency} ${(row.amount / 100).toLocaleString("en-NG")}</td>
            <td>${row.status}</td>
            <td>${row.verificationSource || "-"}</td>
            <td>${row.verifyAttempts}</td>
            <td>${new Date(row.createdAt).toLocaleString("en-NG")}</td>
          </tr>
        `
      )
      .join("");

    const html = `
      <html>
        <head>
          <title>Premium Billing History</title>
          <style>
            body { font-family: Georgia, serif; padding: 24px; color: #0f172a; }
            .top { border-bottom: 2px solid #14532d; margin-bottom: 16px; padding-bottom: 10px; }
            h1 { margin: 0; color: #14532d; font-size: 24px; }
            p { margin: 4px 0; font-size: 12px; color: #334155; }
            .cards { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; margin: 16px 0; }
            .card { border: 1px solid #cbd5e1; border-radius: 8px; padding: 8px; }
            .label { font-size: 11px; color: #64748b; text-transform: uppercase; }
            .value { font-size: 14px; font-weight: 700; margin-top: 2px; }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 11px; }
            th, td { border: 1px solid #cbd5e1; padding: 6px; text-align: left; }
            th { background: #f1f5f9; }
            .footer { margin-top: 14px; font-size: 10px; color: #64748b; }
          </style>
        </head>
        <body>
          <div class="top">
            <h1>NaijaTalk Premium Billing History</h1>
            <p>Generated: ${reportDate}</p>
            <p>Status Filter: ${billingStatusFilter}</p>
          </div>
          <div class="cards">
            <div class="card"><div class="label">Total</div><div class="value">${billingSummary.total}</div></div>
            <div class="card"><div class="label">Completed</div><div class="value">${billingSummary.completedCount}</div></div>
            <div class="card"><div class="label">Failed</div><div class="value">${billingSummary.failedCount}</div></div>
            <div class="card"><div class="label">Processing</div><div class="value">${billingSummary.processingCount}</div></div>
            <div class="card"><div class="label">Initiated</div><div class="value">${billingSummary.initiatedCount}</div></div>
          </div>
          <table>
            <thead>
              <tr><th>Reference</th><th>Amount</th><th>Status</th><th>Source</th><th>Attempts</th><th>Date</th></tr>
            </thead>
            <tbody>${tableRows || "<tr><td colspan='6'>No billing rows.</td></tr>"}</tbody>
          </table>
          <p class="footer">Tip: use browser print and choose "Save as PDF".</p>
        </body>
      </html>
    `;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      setMessage("Popup blocked. Allow popups to export PDF.");
      return;
    }
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  const tipEvents = [
    ...tipHistory.sent.map((tip) => ({
      direction: "sent" as const,
      amount: tip.amount,
      counterpart: tip.to || "someone",
      date: tip.date,
    })),
    ...tipHistory.received.map((tip) => ({
      direction: "received" as const,
      amount: tip.amount,
      counterpart: tip.from || "someone",
      date: tip.date,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const tipPageSize = 10;
  const tipTotalPages = Math.max(1, Math.ceil(tipEvents.length / tipPageSize));
  const safeTipPage = Math.min(tipPage, tipTotalPages);
  const pagedTipEvents = tipEvents.slice(
    (safeTipPage - 1) * tipPageSize,
    safeTipPage * tipPageSize
  );

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
              className={`rounded-md px-3 py-1.5 text-sm font-semibold ${
                activeTab === "subscription"
                  ? "bg-green-700 text-white"
                  : "border border-slate-300 text-slate-700 hover:bg-slate-50"
              }`}
            >
              Subscription
            </button>
            <button
              onClick={() => setActiveTab("benefits")}
              className={`rounded-md px-3 py-1.5 text-sm font-semibold ${
                activeTab === "benefits"
                  ? "bg-green-700 text-white"
                  : "border border-slate-300 text-slate-700 hover:bg-slate-50"
              }`}
            >
              Benefits
            </button>
            <button
              onClick={() => setActiveTab("billing")}
              className={`rounded-md px-3 py-1.5 text-sm font-semibold ${
                activeTab === "billing"
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

  {
    activeTab === "benefits" && (
      <div>
        <ul className="text-sm text-slate-700 mb-4 list-disc pl-5 space-y-1">
          <li>Ad-free reading experience across core pages.</li>
          <li>Custom flair identity (Verified G / Oga at the Top).</li>
          <li>Ad creation and performance dashboard.</li>
          <li>Premium-only billing and subscription visibility.</li>
        </ul>
        {isPremium && (
          <>
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-green-800 mb-3">
                Your Ads
              </h3>
              {userAds.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-slate-700">
                    <thead>
                      <tr className="bg-slate-100">
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
                          className="border-b border-slate-200 hover:bg-slate-50"
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
                          <td className="p-2 text-center">{ad.impressions}</td>
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
                <p className="text-sm text-slate-500 text-center">
                  No ads yet—create one to start!
                </p>
              )}
            </div>

            <div className="mt-6">
              <p className="text-sm font-semibold text-slate-700 text-center mb-2">
                Tip History
              </p>
              {tipEvents.length > 0 ? (
                <>
                  <div className="overflow-x-auto rounded-lg border border-slate-200">
                    <table className="w-full text-sm text-slate-700">
                      <thead className="bg-slate-100">
                        <tr>
                          <th className="p-2 text-left">Type</th>
                          <th className="p-2 text-left">Counterparty</th>
                          <th className="p-2 text-left">Amount</th>
                          <th className="p-2 text-left">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pagedTipEvents.map((event, idx) => (
                          <tr key={`${event.direction}-${event.date}-${idx}`} className="border-t border-slate-200">
                            <td className="p-2">
                              <span
                                className={`inline-flex rounded px-2 py-0.5 text-xs font-semibold ${event.direction === "received"
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-slate-100 text-slate-700"
                                  }`}
                              >
                                {event.direction === "received" ? "Received" : "Sent"}
                              </span>
                            </td>
                            <td className="p-2">{event.counterpart}</td>
                            <td className="p-2">₦{event.amount.toLocaleString("en-NG")}</td>
                            <td className="p-2">{new Date(event.date).toLocaleString("en-NG")}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-slate-600">
                    <p>
                      Page {safeTipPage} of {tipTotalPages} ({tipEvents.length} total)
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setTipPage((prev) => Math.max(prev - 1, 1))}
                        disabled={safeTipPage <= 1}
                        className="rounded-md border border-slate-300 bg-white px-2 py-1 disabled:opacity-50"
                      >
                        Prev
                      </button>
                      <button
                        onClick={() =>
                          setTipPage((prev) => Math.min(prev + 1, tipTotalPages))
                        }
                        disabled={safeTipPage >= tipTotalPages}
                        className="rounded-md border border-slate-300 bg-white px-2 py-1 disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-xs text-slate-500 text-center">
                  No tips yet—start tipping!
                </p>
              )}
            </div>
          </>
        )}
      </div>
    )
  }

  {
    activeTab === "billing" && (
      <div>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <select
            value={billingStatusFilter}
            onChange={(e) => {
              setBillingStatusFilter(
                e.target.value as "all" | "initiated" | "processing" | "completed" | "failed"
              );
              setBillingPage(1);
            }}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700"
          >
            <option value="all">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="processing">Processing</option>
            <option value="initiated">Initiated</option>
          </select>
        <button
          onClick={() => fetchBillingHistory(billingStatusFilter, billingPage)}
          className="rounded-md bg-green-700 px-3 py-2 text-sm font-medium text-white hover:bg-green-800"
        >
          Refresh
        </button>
        <button
          onClick={exportBillingCsv}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Export CSV
        </button>
        <button
          onClick={exportBillingPdf}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Export PDF
        </button>
              </div>
              <div className="mb-3 grid grid-cols-1 gap-2 text-xs text-slate-600 md:grid-cols-5">
                <p>Total: {billingSummary.total}</p>
                <p>Completed: {billingSummary.completedCount}</p>
                <p>Failed: {billingSummary.failedCount}</p>
                <p>Processing: {billingSummary.processingCount}</p>
                <p>Initiated: {billingSummary.initiatedCount}</p>
              </div>
              {billingRows.length > 0 ? (
                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <table className="w-full text-sm text-slate-700">
                    <thead className="bg-slate-100">
                      <tr>
                        <th className="p-2 text-left">Reference</th>
                        <th className="p-2 text-left">Amount</th>
                        <th className="p-2 text-left">Status</th>
                        <th className="p-2 text-left">Source</th>
                        <th className="p-2 text-left">Attempts</th>
                        <th className="p-2 text-left">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {billingRows.map((row) => (
                        <tr key={row._id} className="border-t border-slate-200">
                          <td className="p-2 text-xs">{row.reference}</td>
                          <td className="p-2">
                            {row.currency} {(row.amount / 100).toLocaleString("en-NG")}
                          </td>
                          <td className="p-2">{row.status}</td>
                          <td className="p-2">{row.verificationSource || "-"}</td>
                          <td className="p-2">{row.verifyAttempts}</td>
                          <td className="p-2">{new Date(row.createdAt).toLocaleString("en-NG")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-slate-500 text-center">No premium payment records yet.</p>
              )}
              <div className="mt-3 flex items-center justify-between text-xs text-slate-600">
                <p>
                  Rows per page: 10 | Page {billingPagination.page} of {billingPagination.totalPages} (
                  {billingPagination.total} total)
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setBillingPage((prev) => Math.max(prev - 1, 1))}
                    disabled={!billingPagination.hasPrev}
                    className="rounded-md border border-slate-300 bg-white px-2 py-1 disabled:opacity-50"
                  >
                    Prev
                  </button>
                  <button
                    onClick={() =>
                      setBillingPage((prev) =>
                        Math.min(prev + 1, billingPagination.totalPages || 1)
                      )
                    }
                    disabled={!billingPagination.hasNext}
                    className="rounded-md border border-slate-300 bg-white px-2 py-1 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div >
            </div >
          )
  }
  <Link
    href="/threads"
    className="block text-center text-blue-600 hover:underline text-sm mt-4"
  >
    Back to Threads
  </Link>
        </div >
      </div >

    {/* ad modal */ }
  {
    isAdModalOpen && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 w-80 md:w-96">
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
    )
  }
    </div >
  );
}

export default function PremiumPage() {
  return (
    <Suspense fallback={<PremiumLoading />}>
      <PremiumPageContent />
    </Suspense>
  );
}
