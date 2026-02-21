// frontend/src/app/users/[id]/wallet/page.jsx
"use client";

import { useState, useEffect } from "react";
import api from "../../../../utils/api";
import axios from "axios";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import WalletBalanceCards from "../../../../components/wallet/WalletBalanceCards";
import WalletActivityList from "../../../../components/wallet/WalletActivityList";

export default function SellerWallet() {
  const [balance, setBalance] = useState(0);
  const [availableBalance, setAvailableBalance] = useState(0);
  const [heldBalance, setHeldBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [isSelf, setIsSelf] = useState(false);
  const [summary, setSummary] = useState({
    totalCredits: 0,
    totalDebits: 0,
    pendingEscrowOut: 0,
  });
  const [payoutAmount, setPayoutAmount] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [isSubmittingPayout, setIsSubmittingPayout] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [isDownloadingSignedPdf, setIsDownloadingSignedPdf] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();
  const { id } = useParams();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setMessage("Abeg login first!");
      setTimeout(() => router.push("/login"), 1000);
      return;
    }

    const currentUserId = localStorage.getItem("userId");
    setIsSelf(currentUserId === id);
    fetchWallet(token);
  }, [router, id]);

  const fetchWallet = async (token) => {
    try {
      const currentUserId = localStorage.getItem("userId");
      const selfView = currentUserId === id;

      if (selfView) {
        const res = await api.get("/users/me/wallet-ledger", {
          params: { includePending: true, limit: 100 },
          headers: { Authorization: `Bearer ${token}` },
        });

        setBalance((res.data.balance || 0) / 100);
        setAvailableBalance((res.data.availableBalance ?? res.data.balance ?? 0) / 100);
        setHeldBalance((res.data.heldBalance || 0) / 100);
        setSummary(
          res.data.summary || { totalCredits: 0, totalDebits: 0, pendingEscrowOut: 0 }
        );
        setTransactions(res.data.entries || []);
        setMessage(res.data.message || "");
        return;
      }

      const res = await api.get(`/users/${id}/wallet`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBalance(res.data.balance / 100);
      setAvailableBalance((res.data.availableBalance ?? res.data.balance ?? 0) / 100);
      setHeldBalance((res.data.heldBalance || 0) / 100);
      setSummary({ totalCredits: 0, totalDebits: 0, pendingEscrowOut: 0 });
      setTransactions(res.data.transactions || []);
      setMessage(res.data.message || "");
    } catch (err) {
      setMessage(err.response?.data?.message || "Wallet load scatter o!");
      if (err.response?.status === 403) {
        setTimeout(() => router.push("/marketplace"), 1000);
      }
    }
  };

  const handlePayoutRequest = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) {
      setMessage("Abeg login first!");
      return;
    }

    setIsSubmittingPayout(true);
    try {
      const parsedAmount = Number(String(payoutAmount || "").replace(/,/g, ""));
      const res = await api.post(
        "/users/me/wallet/payouts/request",
        {
          amount: parsedAmount,
          payoutDetails: {
            accountName: accountName.trim(),
            accountNumber: accountNumber.trim(),
            bankName: bankName.trim(),
          },
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(res.data.message || "Payout request submitted.");
      setPayoutAmount("");
      setAccountName("");
      setAccountNumber("");
      setBankName("");
      await fetchWallet(token);
    } catch (err) {
      setMessage(err.response?.data?.message || "Payout request scatter o!");
    } finally {
      setIsSubmittingPayout(false);
    }
  };

  const handlePayoutAmountChange = (value) => {
    const digitsOnly = String(value || "").replace(/[^\d]/g, "");
    if (!digitsOnly) {
      setPayoutAmount("");
      return;
    }
    const normalized = parseInt(digitsOnly, 10);
    if (!Number.isFinite(normalized)) {
      setPayoutAmount("");
      return;
    }
    setPayoutAmount(normalized.toLocaleString("en-NG"));
  };

  const formatDate = (dateString = "") => {
    if (!dateString) return "No date";
    const date = new Date(dateString);
    const time = date
      .toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "numeric",
        hour12: true,
        timeZone: "Africa/Lagos",
      })
      .toLowerCase();
    const month = date.toLocaleString("en-US", { month: "short" });
    const day = date.getDate();
    const year = date.getFullYear();
    return `${time} • ${month} ${day}, ${year}`;
  };

  const applyActivityFilters = (items) => {
    return (items || []).filter((tx) => {
      if (filterStatus !== "all") {
        const status = String(tx.status || "completed").toLowerCase();
        if (status !== filterStatus) return false;
      }
      if (filterDateFrom) {
        const txDate = new Date(tx.date);
        const fromDate = new Date(filterDateFrom);
        if (!isNaN(txDate.getTime()) && txDate < fromDate) return false;
      }
      if (filterDateTo) {
        const txDate = new Date(tx.date);
        const toDate = new Date(filterDateTo);
        toDate.setHours(23, 59, 59, 999);
        if (!isNaN(txDate.getTime()) && txDate > toDate) return false;
      }
      return true;
    });
  };

  const filteredTransactions = applyActivityFilters(transactions);

  const exportTransactionsCsv = () => {
    if (!filteredTransactions.length) {
      setMessage("No wallet activity to export for selected filters.");
      return;
    }
    const headers = [
      "Date",
      "Type",
      "Status",
      "Amount_NGN",
      "Counterparty",
      "Destination",
      "Listing",
      "Reference",
    ];
    const rows = filteredTransactions.map((tx) => [
      tx.date || "",
      tx.entryKind || tx.type || "activity",
      tx.status || "completed",
      (Math.abs((tx.walletEffect ?? tx.amount ?? 0) / 100)).toFixed(2),
      tx.counterparty || "",
      tx.recipientId || "",
      tx.listingTitle || "",
      tx.reference || "",
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
    a.download = `wallet-statement-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportTransactionsPdf = () => {
    const reportDate = new Date().toLocaleString("en-NG", {
      dateStyle: "medium",
      timeStyle: "short",
    });
    const tableRows = filteredTransactions
      .map(
        (tx) => `
          <tr>
            <td>${new Date(tx.date || Date.now()).toLocaleString("en-NG")}</td>
            <td>${(tx.entryKind || tx.type || "activity").replaceAll("_", " ")}</td>
            <td>${tx.status || "completed"}</td>
            <td>₦${Math.abs((tx.walletEffect ?? tx.amount ?? 0) / 100).toLocaleString("en-NG")}</td>
            <td>${tx.counterparty || "-"}</td>
            <td>${tx.listingTitle || "-"}</td>
          </tr>
        `
      )
      .join("");

    const html = `
      <html>
        <head>
          <title>Wallet Statement</title>
          <style>
            body { font-family: 'Helvetica', sans-serif; padding: 30px; color: #1e293b; }
            .top { border-bottom: 3px solid #166534; margin-bottom: 20px; padding-bottom: 10px; }
            h1 { margin: 0; color: #166534; font-size: 28px; }
            p { margin: 5px 0; font-size: 13px; color: #64748b; }
            .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin: 25px 0; }
            .stat { border: 1px solid #e2e8f0; border-radius: 12px; padding: 15px; background: #f8fafc; }
            .label { font-size: 11px; font-weight: bold; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
            .value { font-size: 18px; font-weight: 800; margin-top: 5px; color: #0f172a; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
            th { border-bottom: 2px solid #e2e8f0; padding: 12px 10px; text-align: left; background: #f1f5f9; font-weight: bold; color: #334155; }
            td { border-bottom: 1px solid #f1f5f9; padding: 12px 10px; color: #475569; }
            .footer { margin-top: 30px; font-size: 11px; text-align: center; color: #94a3b8; border-top: 1px dashed #e2e8f0; pt: 15px; }
          </style>
        </head>
        <body>
          <div class="top">
            <h1>NaijaTalk Wallet Statement</h1>
            <p>Generated: ${reportDate}</p>
            <p>Filters: ${filterStatus} | Range: ${filterDateFrom || "Start"} to ${filterDateTo || "Now"}</p>
          </div>
          <div class="summary">
            <div class="stat"><div class="label">Total Balance</div><div class="value">₦${balance.toLocaleString("en-NG")}</div></div>
            <div class="stat"><div class="label">Available</div><div class="value">₦${availableBalance.toLocaleString("en-NG")}</div></div>
            <div class="stat"><div class="label">Held in Escrow</div><div class="value">₦${heldBalance.toLocaleString("en-NG")}</div></div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Date</th><th>Entry Kind</th><th>Status</th><th>Amount (₦)</th><th>Counterparty</th><th>Listing</th>
              </tr>
            </thead>
            <tbody>${tableRows || "<tr><td colspan='6' style='text-align:center;padding:30px;'>No transactions found for these filters.</td></tr>"}</tbody>
          </table>
          <p class="footer">Thank you for using NaijaTalk Marketplace. Stay safe!</p>
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

  const downloadSignedServerPdf = async () => {
    if (!isSelf) {
      setMessage("Signed statement is available only for your own wallet.");
      return;
    }
    const token = localStorage.getItem("token");
    if (!token) {
      setMessage("Abeg login first!");
      return;
    }
    setIsDownloadingSignedPdf(true);
    try {
      const res = await api.get("/users/me/wallet-statement/pdf", {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          status: filterStatus,
          dateFrom: filterDateFrom || undefined,
          dateTo: filterDateTo || undefined,
        },
        responseType: "blob",
      });

      const statementId = res.headers["x-statement-id"] || "wallet-statement";
      const signature = res.headers["x-statement-signature"] || "";
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${statementId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      setMessage(
        signature
          ? `Signed PDF downloaded. ID: ${statementId}. Sig: ${signature.slice(0, 16)}...`
          : `Signed PDF downloaded. ID: ${statementId}.`
      );
    } catch (err) {
      setMessage(err.response?.data?.message || "Signed PDF download scatter o!");
    } finally {
      setIsDownloadingSignedPdf(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-6 pb-20">
      <div className="max-w-7xl mx-auto mb-4">
        <div className="bg-green-800 text-white p-5 rounded-t-xl shadow-md overflow-hidden relative">
          <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center relative z-10">
            <div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight">
                Wallet Ledger
              </h1>
              <p className="text-green-100 text-xs font-medium uppercase tracking-widest mt-1">
                {isSelf ? "My Personal Wallet" : "User Payment Account"}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/"
                className="rounded-lg bg-green-700/50 backdrop-blur-sm px-4 py-2 text-xs font-bold text-white hover:bg-green-700 transition-colors"
              >
                Home
              </Link>
              <Link
                href="/marketplace"
                className="rounded-lg bg-green-700/50 backdrop-blur-sm px-4 py-2 text-xs font-bold text-white hover:bg-green-700 transition-colors"
              >
                Marketplace
              </Link>
              <Link
                href={`/users/${id}`}
                className="rounded-lg bg-green-700/50 backdrop-blur-sm px-4 py-2 text-xs font-bold text-white hover:bg-green-700 transition-colors"
              >
                Profile
              </Link>
            </div>
          </div>
          <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-green-700/20 blur-3xl" />
        </div>

        <div className="bg-white border-x border-b border-slate-200 rounded-b-xl p-5 shadow-sm">
          {message && (
            <div className="mb-6 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              {message}
            </div>
          )}

          <WalletBalanceCards
            total={balance}
            available={availableBalance}
            held={heldBalance}
            summary={summary}
          />

          {isSelf && (
            <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                  <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                </svg>
                Request Payout
              </h2>
              <form onSubmit={handlePayoutRequest} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="md:col-span-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Amount (₦)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={payoutAmount}
                    onChange={(e) => handlePayoutAmountChange(e.target.value)}
                    placeholder="e.g. 5,000"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-green-600"
                    required
                  />
                </div>
                <div className="md:col-span-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Bank Name</label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="e.g. Zenith Bank"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-green-600"
                  />
                </div>
                <div className="md:col-span-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Account Number</label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="10 digits"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-green-600"
                  />
                </div>
                <div className="md:col-span-1 flex items-end">
                  <button
                    type="submit"
                    disabled={isSubmittingPayout || !payoutAmount}
                    className="w-full bg-green-700 text-white rounded-lg px-4 py-2.5 text-sm font-bold hover:bg-green-800 disabled:opacity-50 shadow-md transition-all active:scale-95"
                  >
                    {isSubmittingPayout ? "Processing..." : "Request Fund"}
                  </button>
                </div>
              </form>
              <p className="mt-3 text-[10px] text-slate-400 font-medium">
                * Note: Minimum payout is ₦500. Submissions are reviewed within 24 hours.
              </p>
            </div>
          )}

          <div className="mt-8 border-t border-slate-100 pt-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">Wallet Activity</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={exportTransactionsCsv}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-bold text-slate-600 hover:bg-slate-50 transition-colors uppercase tracking-tight"
                  >
                    CSV
                  </button>
                  <button
                    onClick={exportTransactionsPdf}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-bold text-slate-600 hover:bg-slate-50 transition-colors uppercase tracking-tight"
                  >
                    PDF
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-4 lg:grid-cols-5">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700 bg-white outline-none focus:ring-2 focus:ring-green-600"
                >
                  <option value="all">ANY STATUS</option>
                  <option value="pending">PENDING</option>
                  <option value="completed">COMPLETED</option>
                  <option value="failed">FAILED</option>
                </select>
                <div className="flex items-center gap-2 group">
                  <span className="text-[10px] font-bold text-slate-400">FROM</span>
                  <input
                    type="date"
                    value={filterDateFrom}
                    onChange={(e) => setFilterDateFrom(e.target.value)}
                    className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-700 outline-none focus:ring-2 focus:ring-green-600"
                  />
                </div>
                <div className="flex items-center gap-2 group">
                  <span className="text-[10px] font-bold text-slate-400">TO</span>
                  <input
                    type="date"
                    value={filterDateTo}
                    onChange={(e) => setFilterDateTo(e.target.value)}
                    className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-700 outline-none focus:ring-2 focus:ring-green-600"
                  />
                </div>
                <button
                  onClick={() => {
                    setFilterStatus("all");
                    setFilterDateFrom("");
                    setFilterDateTo("");
                  }}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
                >
                  RESET
                </button>
                {isSelf && (
                  <button
                    onClick={downloadSignedServerPdf}
                    disabled={isDownloadingSignedPdf}
                    className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-black disabled:opacity-50 transition-all active:scale-95 shadow-sm"
                  >
                    {isDownloadingSignedPdf ? "PLEASE WAIT..." : "DOWNLOAD SIGNED PDF"}
                  </button>
                )}
              </div>
            </div>

            <div className="mt-6">
              <WalletActivityList transactions={filteredTransactions} formatDate={formatDate} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
