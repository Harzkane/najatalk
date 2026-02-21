// frontend/src/app/users/[id]/wallet/page.jsx
"use client";

import { useState, useEffect } from "react";
import api from "@/utils/api";
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
    fetchWallet(token);
  }, [router, id]);

  const fetchWallet = async (token) => {
    try {
      const currentUserId = localStorage.getItem("userId");
      const selfView = currentUserId === id;
      setIsSelf(selfView);

      if (selfView) {
        const res = await api.get("/users/me/wallet-ledger", {
          headers: { Authorization: `Bearer ${token}` },
          params: { includePending: true, limit: 100 },
        });

        setBalance((res.data.balance || 0) / 100);
        setAvailableBalance((res.data.availableBalance ?? res.data.balance ?? 0) / 100);
        setHeldBalance((res.data.heldBalance || 0) / 100);
        setSummary(
          res.data.summary || { totalCredits: 0, totalDebits: 0, pendingEscrowOut: 0 }
        );
        setTransactions(res.data.entries || []);
        setMessage(res.data.message);
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
      setMessage(res.data.message);
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
    const normalized = Number.parseInt(digitsOnly, 10);
    if (!Number.isFinite(normalized)) {
      setPayoutAmount("");
      return;
    }
    setPayoutAmount(normalized.toLocaleString("en-NG"));
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Never";
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
    return `${time} On ${month} ${day}, ${year}`;
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
        if (!Number.isNaN(txDate.getTime()) && txDate < fromDate) return false;
      }
      if (filterDateTo) {
        const txDate = new Date(tx.date);
        const toDate = new Date(filterDateTo);
        toDate.setHours(23, 59, 59, 999);
        if (!Number.isNaN(txDate.getTime()) && txDate > toDate) return false;
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
            <td>${new Date(tx.date).toLocaleString("en-NG")}</td>
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
            body { font-family: 'Georgia', serif; padding: 24px; color: #0f172a; }
            .top { border-bottom: 2px solid #14532d; margin-bottom: 16px; padding-bottom: 10px; }
            h1 { margin: 0; color: #14532d; font-size: 24px; }
            p { margin: 4px 0; font-size: 12px; color: #334155; }
            .cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin: 16px 0; }
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
            <h1>NaijaTalk Wallet Statement</h1>
            <p>Generated: ${reportDate}</p>
            <p>Date Range: ${filterDateFrom || "N/A"} - ${filterDateTo || "N/A"}</p>
            <p>Status Filter: ${filterStatus}</p>
          </div>
          <div class="cards">
            <div class="card"><div class="label">Total</div><div class="value">₦${balance.toLocaleString("en-NG")}</div></div>
            <div class="card"><div class="label">Available</div><div class="value">₦${availableBalance.toLocaleString("en-NG")}</div></div>
            <div class="card"><div class="label">Held</div><div class="value">₦${heldBalance.toLocaleString("en-NG")}</div></div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Date</th><th>Type</th><th>Status</th><th>Amount</th><th>Counterparty</th><th>Listing</th>
              </tr>
            </thead>
            <tbody>${tableRows || "<tr><td colspan='6'>No wallet rows for selected filters.</td></tr>"}</tbody>
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
          ? `Signed PDF downloaded. Statement ID: ${statementId}. Signature: ${signature.slice(
            0,
            16
          )}...`
          : `Signed PDF downloaded. Statement ID: ${statementId}.`
      );
    } catch (err) {
      setMessage(err.response?.data?.message || "Signed PDF download scatter o!");
    } finally {
      setIsDownloadingSignedPdf(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-7xl mx-auto mb-3">
        <div className="bg-green-800 text-white p-4 rounded-t-lg shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:justify-between md:items-center">
            <h1 className="text-2xl md:text-3xl font-bold text-center md:text-left break-words">
              Seller Wallet
            </h1>
            <div className="flex flex-wrap items-center justify-center md:justify-end gap-3 md:gap-4">
              <Link
                href="/"
                className="text-green-100 hover:text-white text-sm font-medium"
              >
                Home
              </Link>
              <Link
                href="/marketplace"
                className="text-green-100 hover:text-white text-sm font-medium"
              >
                Marketplace
              </Link>
              <Link
                href={`/users/${id}`}
                className="text-green-100 hover:text-white text-sm font-medium"
              >
                Profile
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        {message && (
          <p className="text-center text-sm text-gray-600 mb-4 bg-white border border-slate-200 p-2 rounded-lg">
            {message}
          </p>
        )}
        <WalletBalanceCards
          total={balance}
          available={availableBalance}
          held={heldBalance}
          summary={summary}
        />

        {isSelf && (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-6">
            <h2 className="text-xl font-semibold text-green-800 mb-4">
              Request Payout
            </h2>
            <form onSubmit={handlePayoutRequest} className="grid gap-3 md:grid-cols-2">
              <input
                type="text"
                inputMode="numeric"
                value={payoutAmount}
                onChange={(e) => handlePayoutAmountChange(e.target.value)}
                placeholder="Amount (NGN)"
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 bg-white"
                required
              />
              <input
                type="text"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="Account Name (optional)"
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 bg-white"
              />
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="Account Number (optional)"
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 bg-white"
              />
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="Bank Name (optional)"
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 bg-white"
              />
              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={isSubmittingPayout}
                  className="bg-green-700 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-green-800 disabled:opacity-60"
                >
                  {isSubmittingPayout ? "Submitting..." : "Submit Payout Request"}
                </button>
              </div>
            </form>
            <p className="mt-3 text-xs text-slate-500">
              Minimum payout is ₦500. Payout requests are reviewed by admin.
            </p>
          </div>
        )}

        <div className="mb-4 rounded-lg border border-slate-200 bg-white p-3">
          <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
            <input
              type="date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700"
            />
            <input
              type="date"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700"
            />
            <button
              onClick={() => {
                setFilterStatus("all");
                setFilterDateFrom("");
                setFilterDateTo("");
              }}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Reset Filters
            </button>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              onClick={exportTransactionsCsv}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Export CSV
            </button>
            <button
              onClick={exportTransactionsPdf}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Download PDF Statement
            </button>
            {isSelf && (
              <button
                onClick={downloadSignedServerPdf}
                disabled={isDownloadingSignedPdf}
                className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                {isDownloadingSignedPdf ? "Preparing Signed PDF..." : "Download Signed PDF"}
              </button>
            )}
          </div>
        </div>

        <WalletActivityList transactions={filteredTransactions} formatDate={formatDate} />
      </div>
    </div>
  );
}
