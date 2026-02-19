// frontend/src/app/marketplace/wallet/page.jsx
"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function PlatformWallet() {
  const [balance, setBalance] = useState(0);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [message, setMessage] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setMessage("Abeg login first!");
      setTimeout(() => router.push("/login"), 1000);
      return;
    }
    fetchWallet(token);
    checkAdmin(token);
  }, [router]);

  const fetchWallet = async (token) => {
    try {
      const res = await axios.get("/api/marketplace/wallet", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBalance(res.data.balance / 100);
      setLastUpdated(res.data.lastUpdated);
      setTransactions(res.data.transactions || []);
      setMessage(res.data.message);
      console.log("Wallet Response:", res.data);
    } catch (err) {
      setMessage(err.response?.data?.message || "Wallet load scatter o!");
      console.error("Wallet Error:", err.response?.data);
      if (err.response?.status === 403) {
        setTimeout(() => router.push("/marketplace"), 1000);
      }
    }
  };

  const checkAdmin = async (token) => {
    try {
      const res = await axios.get("/api/users/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setIsAdmin(res.data.role === "admin");
    } catch (err) {
      setIsAdmin(false);
    }
  };

  const handleWithdraw = () => {
    setMessage("Withdrawal coming soon—abeg hold on!");
    // Stub for future payment API
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    router.push("/login");
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

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-100 p-6 flex items-center justify-center">
        <p className="text-red-600 text-lg">
          {message || "Admins only—abeg comot!"}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-5xl mx-auto mb-3">
        <div className="bg-green-800 text-white p-4 rounded-t-lg shadow-md">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">NaijaTalk Platform Wallet</h1>
            <div className="flex items-center space-x-4">
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
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700 text-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto">
        {message && (
          <p className="text-center text-sm text-gray-600 mb-4 bg-white p-2 rounded-lg">
            {message}
          </p>
        )}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-green-800 mb-4">
            Platform Earnings
          </h2>
          <div className="text-gray-800">
            <p className="text-2xl font-bold">₦{balance.toLocaleString()}</p>
            <p className="text-sm">Last Updated: {formatDate(lastUpdated)}</p>
          </div>
          <button
            onClick={handleWithdraw}
            className="mt-4 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            Withdraw Funds
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-green-800 mb-4">
            Transaction History
          </h2>
          {transactions.length > 0 ? (
            <div className="space-y-4">
              {transactions.map((tx, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg shadow">
                  <p className="text-gray-800 font-semibold">
                    +₦{tx.amount / 100}
                  </p>
                  <p className="text-xs text-gray-600">
                    From: {tx.listingTitle}
                  </p>
                  <p className="text-xs text-gray-600">
                    Date: {formatDate(tx.date)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">
              No transactions yet—abeg keep selling!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
