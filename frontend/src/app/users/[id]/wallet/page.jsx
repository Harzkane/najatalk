// frontend/src/app/users/[id]/wallet/page.jsx
"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

export default function SellerWallet() {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
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
      const res = await axios.get(`/api/users/${id}/wallet`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBalance(res.data.balance / 100);
      setTransactions(res.data.transactions || []);
      setMessage(res.data.message);
    } catch (err) {
      setMessage(err.response?.data?.message || "Wallet load scatter o!");
      if (err.response?.status === 403) {
        setTimeout(() => router.push("/marketplace"), 1000);
      }
    }
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

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-5xl mx-auto mb-3">
        <div className="bg-green-800 text-white p-4 rounded-t-lg shadow-md">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">Seller Wallet</h1>
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

      <div className="max-w-5xl mx-auto">
        {message && (
          <p className="text-center text-sm text-gray-600 mb-4 bg-white p-2 rounded-lg">
            {message}
          </p>
        )}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-green-800 mb-4">
            Your Earnings
          </h2>
          <div className="text-gray-800">
            <p className="text-2xl font-bold">₦{balance.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-green-800 mb-4">
            Sales History
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
            <p className="text-gray-600">No sales yet—abeg keep selling!</p>
          )}
        </div>
      </div>
    </div>
  );
}
