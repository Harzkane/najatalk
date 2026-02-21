// frontend/src/app/(admin)/admin/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Link from "next/link";
import formatDate from "@/utils/formatDate";

type Report = {
  _id: string;
  threadId: { _id: string; title: string };
  userId: { _id: string; email: string; flair?: string }; // Add flair
  reportedUserId: { _id: string; email: string; flair?: string }; // Add flair
  reason: string;
  createdAt: string;
};

type BannedUser = {
  _id: string;
  email: string;
  flair?: string; // Add flair
  appealReason?: string;
  appealStatus?: string;
};

type Ad = {
  _id: string;
  userId: { _id: string; email: string };
  brand: string;
  text: string;
  link: string;
  type: string;
  budget: number;
  cpc: number;
  status: string;
  clicks: number;
  impressions: number;
  createdAt: string;
};

type Payout = {
  _id: string;
  amount: number;
  status: "pending" | "completed" | "failed";
  reference: string | null;
  recipientId: string | null;
  user: {
    _id: string | null;
    email: string;
    username: string | null;
  };
  createdAt: string;
  updatedAt: string;
};

type PayoutSummary = {
  totalAmount: number;
  totalCount: number;
  pendingAmount: number;
  pendingCount: number;
  completedAmount: number;
  completedCount: number;
  failedAmount: number;
  failedCount: number;
};

type RollupBucket = {
  bucket: string;
  totalAmount: number;
  totalCount: number;
  pendingAmount: number;
  pendingCount: number;
  completedAmount: number;
  completedCount: number;
  failedAmount: number;
  failedCount: number;
};

type WalletMismatch = {
  userId: string;
  expectedEffect: number;
  ledgerEffect: number;
  delta: number;
  transactionCount: number;
  ledgerCount: number;
  severity: "low" | "medium" | "high";
};

type PremiumAuditRow = {
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
  user: {
    _id: string;
    email: string;
    username: string | null;
    isPremium: boolean;
    premiumStatus: string;
  } | null;
  hasMismatch: boolean;
  mismatchReasons: string[];
};

type PremiumAuditSummary = {
  total: number;
  mismatchCount: number;
  completedCount: number;
  failedCount: number;
  processingCount: number;
  initiatedCount: number;
};

export default function AdminDashboard() {
  const [reports, setReports] = useState<Report[]>([]);
  const [bannedUsers, setBannedUsers] = useState<BannedUser[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [payoutSummary, setPayoutSummary] = useState<PayoutSummary>({
    totalAmount: 0,
    totalCount: 0,
    pendingAmount: 0,
    pendingCount: 0,
    completedAmount: 0,
    completedCount: 0,
    failedAmount: 0,
    failedCount: 0,
  });
  const [payoutStatusFilter, setPayoutStatusFilter] = useState<
    "all" | "pending" | "completed" | "failed"
  >("pending");
  const [payoutDateFrom, setPayoutDateFrom] = useState("");
  const [payoutDateTo, setPayoutDateTo] = useState("");
  const [rollupPeriod, setRollupPeriod] = useState<"daily" | "monthly">("daily");
  const [rollupBuckets, setRollupBuckets] = useState<RollupBucket[]>([]);
  const [mismatchSummary, setMismatchSummary] = useState({
    totalUsersChecked: 0,
    mismatchedUsers: 0,
    highCount: 0,
    mediumCount: 0,
    lowCount: 0,
  });
  const [mismatches, setMismatches] = useState<WalletMismatch[]>([]);
  const [premiumAuditRows, setPremiumAuditRows] = useState<PremiumAuditRow[]>([]);
  const [premiumAuditSummary, setPremiumAuditSummary] = useState<PremiumAuditSummary>({
    total: 0,
    mismatchCount: 0,
    completedCount: 0,
    failedCount: 0,
    processingCount: 0,
    initiatedCount: 0,
  });
  const [premiumStatusFilter, setPremiumStatusFilter] = useState<
    "all" | "initiated" | "processing" | "completed" | "failed"
  >("all");
  const [premiumSourceFilter, setPremiumSourceFilter] = useState<"all" | "manual" | "webhook">(
    "all"
  );
  const [premiumMismatchOnly, setPremiumMismatchOnly] = useState(false);
  const [premiumDateFrom, setPremiumDateFrom] = useState("");
  const [premiumDateTo, setPremiumDateTo] = useState("");
  const [message, setMessage] = useState<string>("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

  const fetchPendingAds = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.get<{ ads: Ad[]; message: string }>("/ads", {
        headers: { Authorization: `Bearer ${token}` },
        params: { status: "pending" }, // Ensure this is sent
      });
      console.log("Pending Ads Response:", res.data); // Log response
      setAds(res.data.ads || []);
    } catch (err) {
      console.error("Fetch ads error:", err);
      setMessage("Ads fetch scatter o!");
    }
  }, []);

  const fetchPendingPayouts = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get<{
        payouts: Payout[];
        summary: PayoutSummary;
        message: string;
      }>(
        "/api/users/admin/payouts",
        {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            status: payoutStatusFilter,
            dateFrom: payoutDateFrom || undefined,
            dateTo: payoutDateTo || undefined,
            limit: 300,
          },
        }
      );
      setPayouts(res.data.payouts || []);
      setPayoutSummary(
        res.data.summary || {
          totalAmount: 0,
          totalCount: 0,
          pendingAmount: 0,
          pendingCount: 0,
          completedAmount: 0,
          completedCount: 0,
          failedAmount: 0,
          failedCount: 0,
        }
      );
    } catch (err) {
      console.error("Fetch payouts error:", err);
      setMessage("Payout queue fetch scatter o!");
    }
  }, [payoutStatusFilter, payoutDateFrom, payoutDateTo]);

  const fetchPayoutRollups = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get<{ buckets: RollupBucket[]; message: string }>(
        "/api/users/admin/payouts/rollups",
        {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            period: rollupPeriod,
            status: payoutStatusFilter,
            dateFrom: payoutDateFrom || undefined,
            dateTo: payoutDateTo || undefined,
          },
        }
      );
      setRollupBuckets(res.data.buckets || []);
    } catch (err) {
      console.error("Fetch payout rollups error:", err);
      setMessage("Payout rollups fetch scatter o!");
    }
  }, [rollupPeriod, payoutStatusFilter, payoutDateFrom, payoutDateTo]);

  const fetchWalletMismatches = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get<{
        summary: {
          totalUsersChecked: number;
          mismatchedUsers: number;
          highCount: number;
          mediumCount: number;
          lowCount: number;
        };
        mismatches: WalletMismatch[];
      }>("/api/users/admin/wallet-mismatches", {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 50 },
      });
      setMismatchSummary(
        res.data.summary || {
          totalUsersChecked: 0,
          mismatchedUsers: 0,
          highCount: 0,
          mediumCount: 0,
          lowCount: 0,
        }
      );
      setMismatches(res.data.mismatches || []);
    } catch (err) {
      console.error("Fetch mismatch error:", err);
      setMessage("Wallet mismatch scan scatter o!");
    }
  }, []);

  const fetchPremiumPaymentsAudit = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get<{
        summary: PremiumAuditSummary;
        rows: PremiumAuditRow[];
      }>("/api/premium/admin/payments", {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          status: premiumStatusFilter,
          source: premiumSourceFilter,
          mismatchOnly: premiumMismatchOnly ? "true" : undefined,
          dateFrom: premiumDateFrom || undefined,
          dateTo: premiumDateTo || undefined,
          limit: 150,
        },
      });
      setPremiumAuditSummary(
        res.data.summary || {
          total: 0,
          mismatchCount: 0,
          completedCount: 0,
          failedCount: 0,
          processingCount: 0,
          initiatedCount: 0,
        }
      );
      setPremiumAuditRows(res.data.rows || []);
    } catch (err) {
      console.error("Fetch premium audit error:", err);
      setMessage("Premium audit fetch scatter o!");
    }
  }, [
    premiumStatusFilter,
    premiumSourceFilter,
    premiumMismatchOnly,
    premiumDateFrom,
    premiumDateTo,
  ]);

  const decidePayout = async (payoutId: string, approve: boolean) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.put<{ message: string }>(
        `/api/users/admin/payouts/${payoutId}/decide`,
        { approve },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(res.data.message);
      fetchPendingPayouts();
    } catch (err) {
      console.error("Payout decision error:", err);
      setMessage("Payout decision scatter o!");
    }
  };

  const approveAd = async (adId: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.put<{ message: string }>(
        `/ads/${adId}`,
        { status: "active", startDate: new Date() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(res.data.message);
      setAds(ads.filter((ad) => ad._id !== adId));
    } catch (err) {
      console.error("Approve ad error:", err);
      setMessage("Ad approval scatter o!");
    }
  };

  const rejectAd = async (adId: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.delete<{ message: string }>(`/ads/${adId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage(res.data.message);
      setAds(ads.filter((ad) => ad._id !== adId));
    } catch (err) {
      console.error("Reject ad error:", err);
      setMessage("Ad rejection scatter o!");
    }
  };

  const fetchReports = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.get<{ reports: Report[]; message: string }>(
        "/threads/reports",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setReports(res.data.reports || []);
      setMessage(res.data.message);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setMessage(err.response?.data?.message || "Fetch scatter o!");
        if (err.response?.status === 401 || err.response?.status === 403) {
          localStorage.removeItem("token");
          router.push("/login");
        }
      } else {
        setMessage("Fetch scatter o!");
      }
      setReports([]);
    }
  }, [router]);

  const fetchBannedUsers = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.get<{
        bannedUsers: BannedUser[];
        message: string;
      }>("/users/banned", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBannedUsers(res.data.bannedUsers || []);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setMessage(
          err.response?.data?.message || "Fetch banned users scatter o!"
        );
      } else {
        setMessage("Fetch banned users scatter o!");
      }
      setBannedUsers([]);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
    if (token) {
      fetchReports();
      fetchBannedUsers();
      fetchPendingAds();
      fetchPendingPayouts();
      fetchPayoutRollups();
      fetchWalletMismatches();
      fetchPremiumPaymentsAudit();
    }
  }, [
    fetchReports,
    fetchBannedUsers,
    fetchPendingAds,
    fetchPendingPayouts,
    fetchPayoutRollups,
    fetchWalletMismatches,
    fetchPremiumPaymentsAudit,
  ]);

  const exportPayoutsCsv = () => {
    if (!payouts.length) {
      setMessage("No payout rows to export.");
      return;
    }
    const headers = [
      "User",
      "Amount_NGN",
      "Status",
      "Destination",
      "Reference",
      "CreatedAt",
    ];
    const rows = payouts.map((p) => [
      p.user?.username || p.user?.email || "Unknown",
      (p.amount / 100).toFixed(2),
      p.status,
      p.recipientId || "",
      p.reference || "",
      p.createdAt,
    ]);
    const csv = [headers, ...rows]
      .map((row) =>
        row
          .map((cell) => `"${String(cell || "").replaceAll('"', '""')}"`)
          .join(",")
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payout-reconciliation-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPayoutsPdf = () => {
    const reportDate = new Date().toLocaleString("en-NG", {
      dateStyle: "medium",
      timeStyle: "short",
    });
    const tableRows = payouts
      .map(
        (p) => `
          <tr>
            <td>${p.user?.username || p.user?.email || "Unknown"}</td>
            <td>₦${(p.amount / 100).toLocaleString("en-NG")}</td>
            <td>${p.status}</td>
            <td>${p.recipientId || "-"}</td>
            <td>${new Date(p.createdAt).toLocaleString("en-NG")}</td>
          </tr>
        `
      )
      .join("");

    const html = `
      <html>
        <head>
          <title>Payout Reconciliation Report</title>
          <style>
            body { font-family: 'Georgia', serif; padding: 24px; color: #0f172a; }
            .top { border-bottom: 2px solid #14532d; margin-bottom: 16px; padding-bottom: 10px; }
            h1 { margin: 0; color: #14532d; font-size: 24px; }
            p { margin: 4px 0; font-size: 12px; color: #334155; }
            .cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin: 16px 0; }
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
            <h1>NaijaTalk Payout Reconciliation</h1>
            <p>Generated: ${reportDate}</p>
            <p>Status Filter: ${payoutStatusFilter}</p>
            <p>Date Range: ${payoutDateFrom || "N/A"} - ${payoutDateTo || "N/A"}</p>
          </div>
          <div class="cards">
            <div class="card"><div class="label">Total</div><div class="value">₦${(payoutSummary.totalAmount / 100).toLocaleString("en-NG")}</div></div>
            <div class="card"><div class="label">Pending</div><div class="value">₦${(payoutSummary.pendingAmount / 100).toLocaleString("en-NG")}</div></div>
            <div class="card"><div class="label">Completed</div><div class="value">₦${(payoutSummary.completedAmount / 100).toLocaleString("en-NG")}</div></div>
            <div class="card"><div class="label">Failed</div><div class="value">₦${(payoutSummary.failedAmount / 100).toLocaleString("en-NG")}</div></div>
          </div>
          <table>
            <thead>
              <tr>
                <th>User</th><th>Amount</th><th>Status</th><th>Destination</th><th>Created At</th>
              </tr>
            </thead>
            <tbody>${tableRows || "<tr><td colspan='5'>No payout rows.</td></tr>"}</tbody>
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

  const handleDelete = async (threadId: string) => {
    if (!confirm("Sure say you wan delete this thread?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await api.delete<{ message: string }>(
        `/threads/${threadId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(res.data.message);
      setReports(reports.filter((r) => r.threadId._id !== threadId));
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setMessage(err.response?.data?.message || "Delete scatter o!");
      } else {
        setMessage("Delete scatter o!");
      }
    }
  };

  const handleDismiss = async (reportId: string) => {
    if (!confirm("Sure say you wan dismiss this report?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await api.delete<{ message: string }>(
        `/threads/reports/${reportId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(res.data.message);
      const updatedReports = reports.filter((r) => r._id !== reportId);
      setReports(updatedReports);
      if (updatedReports.length === 0) fetchReports();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setMessage(err.response?.data?.message || "Dismiss scatter o!");
      } else {
        setMessage("Dismiss scatter o!");
      }
      setReports(reports);
    }
  };

  const handleBanUser = async (userId: string, email: string) => {
    if (!confirm(`Sure say you wan ban ${email}?`)) return;
    try {
      const token = localStorage.getItem("token");
      const res = await api.put<{ message: string }>(
        `/users/${userId}/ban`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(res.data.message);
      fetchReports();
      fetchBannedUsers();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setMessage(err.response?.data?.message || "Ban scatter o!");
      } else {
        setMessage("Ban scatter o!");
      }
    }
  };

  const handleUnbanUser = async (userId: string, approve: boolean) => {
    if (
      !confirm(
        approve
          ? "Sure say you wan unban this user?"
          : "Sure say you wan reject this appeal?"
      )
    )
      return;
    try {
      const token = localStorage.getItem("token");
      const res = await api.put<{ message: string }>(
        `/users/${userId}/unban`,
        { approve },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(res.data.message);
      fetchBannedUsers();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setMessage(err.response?.data?.message || "Unban scatter o!");
      } else {
        setMessage("Unban scatter o!");
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    router.push("/login");
  };

  if (!isLoggedIn) return <p className="text-center p-10">Abeg login first!</p>;

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-7xl mx-auto mb-3">
        <div className="bg-green-800 text-white p-4 rounded-t-lg shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:justify-between md:items-center">
            <h1 className="text-2xl md:text-4xl font-bold text-center md:text-left break-words">
              Admin Dashboard—NaijaTalk
            </h1>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700 text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        {message && (
          <p className="text-center text-sm text-gray-600 mb-3 bg-white border border-slate-200 p-2 rounded-lg">
            {message}
          </p>
        )}

        {/* Reports Section */}
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-green-800 mb-3">
            Reports
          </h2>
          {reports && reports.length > 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="p-3 text-sm font-semibold text-gray-700">
                      Thread
                    </th>
                    <th className="p-3 text-sm font-semibold text-gray-700">
                      Reported By
                    </th>
                    <th className="p-3 text-sm font-semibold text-gray-700">
                      Reason
                    </th>
                    <th className="p-3 text-sm font-semibold text-gray-700">
                      Date
                    </th>
                    <th className="p-3 text-sm font-semibold text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report) => (
                    <tr key={report._id} className="border-t border-gray-100">
                      <td className="p-3">
                        <Link
                          href={`/threads/${report.threadId._id}`}
                          className="text-green-800 hover:underline"
                        >
                          {report.threadId.title}
                        </Link>
                      </td>
                      <td className="p-3 text-gray-700">
                        {report.userId.email}
                        {report.userId.flair && (
                          <span
                            className={`ml-1 inline-block text-white px-1 rounded text-xs ${report.userId.flair === "Oga at the Top"
                              ? "bg-yellow-500"
                              : "bg-green-500"
                              }`}
                          >
                            {report.userId.flair}
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-gray-700">{report.reason}</td>
                      <td className="p-3 text-gray-600">
                        {formatDate(report.createdAt)}
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => handleDelete(report.threadId._id)}
                          className="bg-red-600 text-white px-2 py-1 rounded-lg hover:bg-red-700 text-sm mr-2"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => handleDismiss(report._id)}
                          className="bg-yellow-600 text-white px-2 py-1 rounded-lg hover:bg-yellow-700 text-sm mr-2"
                        >
                          Dismiss
                        </button>
                        <button
                          onClick={() =>
                            handleBanUser(
                              report.reportedUserId._id,
                              report.reportedUserId.email
                            )
                          }
                          className="bg-purple-600 text-white px-2 py-1 rounded-lg hover:bg-purple-700 text-sm"
                        >
                          Ban{" "}
                          {report.reportedUserId.flair && (
                            <span
                              className={`inline-block text-white px-1 rounded text-xs ${report.reportedUserId.flair === "Oga at the Top"
                                ? "bg-yellow-500"
                                : "bg-green-500"
                                }`}
                            >
                              {report.reportedUserId.flair}
                            </span>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-gray-600 bg-white p-4 rounded-lg">
              No reports yet—clean slate!
            </p>
          )}
        </div>

        {/* Banned Users Section */}
        <div>
          <h2 className="text-2xl font-semibold text-green-800 mb-3">
            Banned Users
          </h2>
          {bannedUsers && bannedUsers.length > 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="p-3 text-sm font-semibold text-gray-700">
                      Email
                    </th>
                    <th className="p-3 text-sm font-semibold text-gray-700">
                      Appeal Reason
                    </th>
                    <th className="p-3 text-sm font-semibold text-gray-700">
                      Status
                    </th>
                    <th className="p-3 text-sm font-semibold text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {bannedUsers.map((user) => (
                    <tr key={user.email} className="border-t border-gray-100">
                      <td className="p-3 text-gray-700">
                        {user.email}
                        {user.flair && (
                          <span
                            className={`ml-1 inline-block text-white px-1 rounded text-xs ${user.flair === "Oga at the Top"
                              ? "bg-yellow-500"
                              : "bg-green-500"
                              }`}
                          >
                            {user.flair}
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-gray-700">
                        {user.appealReason || "No appeal yet"}
                      </td>
                      <td className="p-3 text-gray-700">
                        {user.appealStatus || "N/A"}
                      </td>
                      <td className="p-3">
                        {user.appealStatus === "pending" && (
                          <>
                            <button
                              onClick={() => handleUnbanUser(user._id, true)}
                              className="bg-green-600 text-white px-2 py-1 rounded-lg hover:bg-green-700 text-sm mr-2"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleUnbanUser(user._id, false)}
                              className="bg-red-600 text-white px-2 py-1 rounded-lg hover:bg-red-700 text-sm"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-gray-600 bg-white p-4 rounded-lg">
              No banned users yet—everybody dey behave!
            </p>
          )}
        </div>

        {/* Ads Section */}
        <div className="mt-6">
          <h2 className="text-2xl font-semibold text-green-800 mb-3">
            Pending Ads
          </h2>
          {ads.length > 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="p-3 text-sm font-semibold text-gray-700">
                      Brand
                    </th>
                    <th className="p-3 text-sm font-semibold text-gray-700">
                      Text
                    </th>
                    <th className="p-3 text-sm font-semibold text-gray-700">
                      Type
                    </th>
                    <th className="p-3 text-sm font-semibold text-gray-700">
                      Budget
                    </th>
                    <th className="p-3 text-sm font-semibold text-gray-700">
                      CPC
                    </th>
                    <th className="p-3 text-sm font-semibold text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {ads.map((ad) => (
                    <tr key={ad._id} className="border-t border-gray-100">
                      <td className="p-3 text-gray-700">{ad.brand}</td>
                      <td className="p-3 text-gray-700">{ad.text}</td>
                      <td className="p-3 text-gray-700">{ad.type}</td>
                      <td className="p-3 text-gray-700">₦{ad.budget / 100}</td>
                      <td className="p-3 text-gray-700">₦{ad.cpc / 100}</td>
                      <td className="p-3">
                        <button
                          onClick={() => approveAd(ad._id)}
                          className="bg-green-600 text-white px-2 py-1 rounded-lg hover:bg-green-700 text-sm mr-2"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => rejectAd(ad._id)}
                          className="bg-red-600 text-white px-2 py-1 rounded-lg hover:bg-red-700 text-sm"
                        >
                          Reject
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-gray-600 bg-white p-4 rounded-lg">
              No pending ads yet—advertisers dey sleep!
            </p>
          )}
        </div>

        <div className="mt-6">
          <h2 className="text-2xl font-semibold text-green-800 mb-3">
            Payout Reconciliation
          </h2>
          <div className="mb-3 rounded-lg border border-slate-200 bg-white p-3">
            <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
              <select
                value={payoutStatusFilter}
                onChange={(e) =>
                  setPayoutStatusFilter(
                    e.target.value as "all" | "pending" | "completed" | "failed"
                  )
                }
                className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700"
              >
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
                <option value="all">All</option>
              </select>
              <input
                type="date"
                value={payoutDateFrom}
                onChange={(e) => setPayoutDateFrom(e.target.value)}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700"
              />
              <input
                type="date"
                value={payoutDateTo}
                onChange={(e) => setPayoutDateTo(e.target.value)}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700"
              />
              <button
                onClick={fetchPendingPayouts}
                className="rounded-md bg-green-700 px-3 py-2 text-sm font-medium text-white hover:bg-green-800"
              >
                Apply Filters
              </button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                onClick={exportPayoutsCsv}
                className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Export CSV
              </button>
              <button
                onClick={exportPayoutsPdf}
                className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Export PDF
              </button>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-2 text-sm text-slate-700 md:grid-cols-4">
              <p>Total: ₦{(payoutSummary.totalAmount / 100).toLocaleString("en-NG")} ({payoutSummary.totalCount})</p>
              <p>Pending: ₦{(payoutSummary.pendingAmount / 100).toLocaleString("en-NG")} ({payoutSummary.pendingCount})</p>
              <p>Completed: ₦{(payoutSummary.completedAmount / 100).toLocaleString("en-NG")} ({payoutSummary.completedCount})</p>
              <p>Failed: ₦{(payoutSummary.failedAmount / 100).toLocaleString("en-NG")} ({payoutSummary.failedCount})</p>
            </div>
          </div>
          {payouts.length > 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="p-3 text-sm font-semibold text-gray-700">User</th>
                    <th className="p-3 text-sm font-semibold text-gray-700">Amount</th>
                    <th className="p-3 text-sm font-semibold text-gray-700">Status</th>
                    <th className="p-3 text-sm font-semibold text-gray-700">
                      Destination
                    </th>
                    <th className="p-3 text-sm font-semibold text-gray-700">Date</th>
                    <th className="p-3 text-sm font-semibold text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {payouts.map((payout) => (
                    <tr key={payout._id} className="border-t border-gray-100">
                      <td className="p-3 text-gray-700">
                        {payout.user?.username || payout.user?.email || "Unknown user"}
                      </td>
                      <td className="p-3 text-gray-700 font-medium">
                        ₦{(payout.amount / 100).toLocaleString("en-NG")}
                      </td>
                      <td className="p-3 text-gray-700">{payout.status}</td>
                      <td className="p-3 text-gray-700 text-sm">
                        {payout.recipientId || "No payout account details"}
                      </td>
                      <td className="p-3 text-gray-600">{formatDate(payout.createdAt)}</td>
                      <td className="p-3">
                        {payout.status === "pending" ? (
                          <>
                            <button
                              onClick={() => decidePayout(payout._id, true)}
                              className="bg-green-600 text-white px-2 py-1 rounded-lg hover:bg-green-700 text-sm mr-2"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => decidePayout(payout._id, false)}
                              className="bg-red-600 text-white px-2 py-1 rounded-lg hover:bg-red-700 text-sm"
                            >
                              Reject
                            </button>
                          </>
                        ) : (
                          <span className="text-xs text-slate-500">Processed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-gray-600 bg-white p-4 rounded-lg">
              No payouts found for selected filters.
            </p>
          )}
        </div>

        <div className="mt-6">
          <h2 className="text-2xl font-semibold text-green-800 mb-3">
            Premium Payments Audit
          </h2>
          <div className="mb-3 rounded-lg border border-slate-200 bg-white p-3">
            <div className="grid grid-cols-1 gap-2 md:grid-cols-5">
              <select
                value={premiumStatusFilter}
                onChange={(e) =>
                  setPremiumStatusFilter(
                    e.target.value as "all" | "initiated" | "processing" | "completed" | "failed"
                  )
                }
                className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700"
              >
                <option value="all">All Statuses</option>
                <option value="initiated">Initiated</option>
                <option value="processing">Processing</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
              </select>
              <select
                value={premiumSourceFilter}
                onChange={(e) =>
                  setPremiumSourceFilter(e.target.value as "all" | "manual" | "webhook")
                }
                className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700"
              >
                <option value="all">All Sources</option>
                <option value="manual">Manual Verify</option>
                <option value="webhook">Webhook</option>
              </select>
              <input
                type="date"
                value={premiumDateFrom}
                onChange={(e) => setPremiumDateFrom(e.target.value)}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700"
              />
              <input
                type="date"
                value={premiumDateTo}
                onChange={(e) => setPremiumDateTo(e.target.value)}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700"
              />
              <button
                onClick={fetchPremiumPaymentsAudit}
                className="rounded-md bg-green-700 px-3 py-2 text-sm font-medium text-white hover:bg-green-800"
              >
                Refresh Audit
              </button>
            </div>
            <label className="mt-2 inline-flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={premiumMismatchOnly}
                onChange={(e) => setPremiumMismatchOnly(e.target.checked)}
              />
              Show mismatches only
            </label>
            <div className="mt-3 grid grid-cols-1 gap-2 text-sm text-slate-700 md:grid-cols-6">
              <p>Total: {premiumAuditSummary.total}</p>
              <p>Mismatches: {premiumAuditSummary.mismatchCount}</p>
              <p>Completed: {premiumAuditSummary.completedCount}</p>
              <p>Failed: {premiumAuditSummary.failedCount}</p>
              <p>Processing: {premiumAuditSummary.processingCount}</p>
              <p>Initiated: {premiumAuditSummary.initiatedCount}</p>
            </div>
          </div>
          {premiumAuditRows.length > 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="p-3 text-sm font-semibold text-gray-700">User</th>
                    <th className="p-3 text-sm font-semibold text-gray-700">Reference</th>
                    <th className="p-3 text-sm font-semibold text-gray-700">Amount</th>
                    <th className="p-3 text-sm font-semibold text-gray-700">Status</th>
                    <th className="p-3 text-sm font-semibold text-gray-700">Source</th>
                    <th className="p-3 text-sm font-semibold text-gray-700">Mismatch</th>
                    <th className="p-3 text-sm font-semibold text-gray-700">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {premiumAuditRows.map((row) => (
                    <tr key={row._id} className="border-t border-gray-100">
                      <td className="p-3 text-gray-700">
                        {row.user?.username || row.user?.email || "Unknown"}
                      </td>
                      <td className="p-3 text-xs text-gray-700">{row.reference}</td>
                      <td className="p-3 text-gray-700">
                        {row.currency} {(row.amount / 100).toLocaleString("en-NG")}
                      </td>
                      <td className="p-3 text-gray-700">{row.status}</td>
                      <td className="p-3 text-gray-700">{row.verificationSource || "-"}</td>
                      <td className="p-3 text-gray-700 text-xs">
                        {row.hasMismatch ? row.mismatchReasons.join(", ") : "OK"}
                      </td>
                      <td className="p-3 text-gray-600">{formatDate(row.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-gray-600 bg-white p-4 rounded-lg">
              No premium payment rows for selected filters.
            </p>
          )}
        </div>

        <div className="mt-6">
          <h2 className="text-2xl font-semibold text-green-800 mb-3">
            Settlement Rollups
          </h2>
          <div className="mb-3 rounded-lg border border-slate-200 bg-white p-3">
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={rollupPeriod}
                onChange={(e) =>
                  setRollupPeriod(e.target.value as "daily" | "monthly")
                }
                className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700"
              >
                <option value="daily">Daily</option>
                <option value="monthly">Monthly</option>
              </select>
              <button
                onClick={fetchPayoutRollups}
                className="rounded-md bg-green-700 px-3 py-2 text-sm font-medium text-white hover:bg-green-800"
              >
                Refresh Rollups
              </button>
            </div>
          </div>
          {rollupBuckets.length > 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="p-3 text-sm font-semibold text-gray-700">Bucket</th>
                    <th className="p-3 text-sm font-semibold text-gray-700">Total</th>
                    <th className="p-3 text-sm font-semibold text-gray-700">Pending</th>
                    <th className="p-3 text-sm font-semibold text-gray-700">Completed</th>
                    <th className="p-3 text-sm font-semibold text-gray-700">Failed</th>
                  </tr>
                </thead>
                <tbody>
                  {rollupBuckets.map((bucket) => (
                    <tr key={bucket.bucket} className="border-t border-gray-100">
                      <td className="p-3 text-gray-700">{bucket.bucket}</td>
                      <td className="p-3 text-gray-700">
                        ₦{(bucket.totalAmount / 100).toLocaleString("en-NG")} ({bucket.totalCount})
                      </td>
                      <td className="p-3 text-gray-700">
                        ₦{(bucket.pendingAmount / 100).toLocaleString("en-NG")} ({bucket.pendingCount})
                      </td>
                      <td className="p-3 text-gray-700">
                        ₦{(bucket.completedAmount / 100).toLocaleString("en-NG")} ({bucket.completedCount})
                      </td>
                      <td className="p-3 text-gray-700">
                        ₦{(bucket.failedAmount / 100).toLocaleString("en-NG")} ({bucket.failedCount})
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-gray-600 bg-white p-4 rounded-lg">
              No rollup buckets yet for selected filters.
            </p>
          )}
        </div>

        <div className="mt-6">
          <h2 className="text-2xl font-semibold text-green-800 mb-3">
            Wallet Mismatch Alerts
          </h2>
          <div className="mb-3 rounded-lg border border-slate-200 bg-white p-3">
            <div className="grid grid-cols-1 gap-2 text-sm text-slate-700 md:grid-cols-5">
              <p>Checked Users: {mismatchSummary.totalUsersChecked}</p>
              <p>Mismatched: {mismatchSummary.mismatchedUsers}</p>
              <p>High: {mismatchSummary.highCount}</p>
              <p>Medium: {mismatchSummary.mediumCount}</p>
              <p>Low: {mismatchSummary.lowCount}</p>
            </div>
            <button
              onClick={fetchWalletMismatches}
              className="mt-3 rounded-md bg-green-700 px-3 py-2 text-sm font-medium text-white hover:bg-green-800"
            >
              Run Scan
            </button>
          </div>
          {mismatches.length > 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="p-3 text-sm font-semibold text-gray-700">User ID</th>
                    <th className="p-3 text-sm font-semibold text-gray-700">Expected</th>
                    <th className="p-3 text-sm font-semibold text-gray-700">Ledger</th>
                    <th className="p-3 text-sm font-semibold text-gray-700">Delta</th>
                    <th className="p-3 text-sm font-semibold text-gray-700">Tx/Ledger Count</th>
                    <th className="p-3 text-sm font-semibold text-gray-700">Severity</th>
                  </tr>
                </thead>
                <tbody>
                  {mismatches.map((item) => (
                    <tr key={item.userId} className="border-t border-gray-100">
                      <td className="p-3 text-xs text-gray-700">{item.userId}</td>
                      <td className="p-3 text-gray-700">₦{(item.expectedEffect / 100).toLocaleString("en-NG")}</td>
                      <td className="p-3 text-gray-700">₦{(item.ledgerEffect / 100).toLocaleString("en-NG")}</td>
                      <td className="p-3 text-gray-700">₦{(item.delta / 100).toLocaleString("en-NG")}</td>
                      <td className="p-3 text-gray-700">
                        {item.transactionCount}/{item.ledgerCount}
                      </td>
                      <td className="p-3">
                        <span
                          className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${item.severity === "high"
                              ? "bg-red-100 text-red-700"
                              : item.severity === "medium"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-slate-100 text-slate-700"
                            }`}
                        >
                          {item.severity}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-gray-600 bg-white p-4 rounded-lg">
              No wallet mismatches found in latest scan.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
