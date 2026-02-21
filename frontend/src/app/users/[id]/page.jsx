"use client";

import { useEffect, useMemo, useState } from "react";
import api from "../../../utils/api";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import ListingCard from "../../../components/marketplace/ListingCard";
import TrustBadge from "../../../components/marketplace/TrustBadge";

const TABS = ["all", "active", "pending", "sold"];

const getImageSrc = (url = "") => {
  if (!url) return "";
  if (url.startsWith("data:") || url.startsWith("/")) return url;
  if (/^https?:\/\//i.test(url)) {
    return `/api/marketplace/image-proxy?url=${encodeURIComponent(url)}`;
  }
  return url;
};

export default function UserProfile() {
  const [user, setUser] = useState(null);
  const [listings, setListings] = useState([]);
  const [sellerStats, setSellerStats] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [isOwnerProfile, setIsOwnerProfile] = useState(false);

  const { id } = useParams();
  const router = useRouter();

  useEffect(() => {
    fetchProfile();
  }, [id]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsOwnerProfile(localStorage.getItem("userId") === id);
    }
  }, [id]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/users/${id}`);
      setUser(res.data.user);
      setSellerStats(res.data.sellerStats || null);
      setListings(res.data.listings || []);
      setMessage(res.data.message || "");
    } catch (err) {
      setMessage(err.response?.data?.message || "Profile load scatter o!");
      setUser(null);
      setListings([]);
      setSellerStats(null);
    } finally {
      setLoading(false);
    }
  };

  const filteredListings = useMemo(() => {
    if (activeTab === "all") return listings;
    return listings.filter((listing) => listing.status === activeTab);
  }, [listings, activeTab]);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 p-6 flex items-center justify-center">
        <div className="max-w-md w-full rounded-lg border border-slate-200 bg-white p-6 text-center text-slate-600">
          Loading profile...
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-100 p-6 flex items-center justify-center">
        <div className="max-w-md w-full rounded-lg border border-slate-200 bg-white p-6 text-center text-slate-600">
          {message || "Profile unavailable."}
          <div className="mt-4">
            <Link href="/marketplace" className="text-green-600 font-bold underline">Back to Marketplace</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4 pb-20 md:p-6">
      <div className="mx-auto mb-4 max-w-7xl">
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="bg-green-800 h-24 hidden md:block" />
          <div className="p-5 relative">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="flex items-start gap-4">
                <div className="md:-mt-12">
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.displayName}
                      className="h-24 w-24 rounded-full border-4 border-white shadow-md object-cover"
                    />
                  ) : (
                    <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-white bg-slate-900 text-3xl font-bold text-white shadow-md">
                      {(user.displayName || "U").charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="pt-2">
                  <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    {user.displayName}
                    {user.flair && (
                      <span className={`text-[10px] uppercase px-1.5 py-0.5 rounded font-black text-white ${user.flair === "Oga at the Top" ? "bg-amber-500" : "bg-green-500"}`}>
                        {user.flair}
                      </span>
                    )}
                  </h1>
                  <p className="text-sm text-slate-500">{user.maskedEmail}</p>
                  {user.location && (
                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                      {user.location}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pb-2">
                <Link
                  href="/"
                  className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Home
                </Link>
                <Link
                  href="/marketplace"
                  className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Marketplace
                </Link>
                {isOwnerProfile && (
                  <Link
                    href={`/wallet`}
                    className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                  >
                    My Wallet
                  </Link>
                )}
              </div>
            </div>

            {user.bio && (
              <div className="mt-6 border-t border-slate-100 pt-4">
                <p className="max-w-3xl text-sm leading-relaxed text-slate-600">{user.bio}</p>
              </div>
            )}
          </div>

          <div className="bg-slate-50/50 p-5 border-t border-slate-100">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
              <div className="rounded-lg border border-slate-200 bg-white p-3">
                <p className="text-[10px] uppercase font-bold text-slate-400">Total Items</p>
                <p className="text-xl font-bold text-slate-900">{sellerStats?.totalListings || 0}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-3">
                <p className="text-[10px] uppercase font-bold text-slate-400">On Sale</p>
                <p className="text-xl font-bold text-slate-900">{sellerStats?.activeListings || 0}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-3">
                <p className="text-[10px] uppercase font-bold text-slate-400">Sold Already</p>
                <p className="text-xl font-bold text-slate-900">{sellerStats?.soldListings || 0}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-3">
                <p className="text-[10px] uppercase font-bold text-slate-400">Completed</p>
                <p className="text-xl font-bold text-slate-900">{sellerStats?.completedDeals || 0}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-3">
                <p className="text-[10px] uppercase font-bold text-slate-400">Response</p>
                <p className="text-xl font-bold text-slate-900">
                  {sellerStats?.avgResponseHours !== null && sellerStats?.avgResponseHours !== undefined
                    ? `${sellerStats.avgResponseHours}h`
                    : "--"}
                </p>
              </div>
            </div>

            <div className="mt-4">
              <TrustBadge sellerStats={sellerStats || {}} />
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl">
        {message && (
          <div className="mb-4 rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-600 shadow-sm">
            {message}
          </div>
        )}

        <div className="mb-4 flex flex-wrap gap-2 border-b border-slate-200 pb-2">
          {TABS.map((tab) => {
            const isActive = activeTab === tab;
            const label = tab === "all" ? "All Items" : tab.charAt(0).toUpperCase() + tab.slice(1);
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-2 text-sm font-bold transition-colors relative ${isActive
                    ? "text-green-700"
                    : "text-slate-500 hover:text-slate-700"
                  }`}
              >
                {label}
                {isActive && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-600" />}
              </button>
            );
          })}
        </div>

        {filteredListings.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredListings.map((listing) => (
              <ListingCard
                key={listing._id}
                listing={listing}
                showSeller={false}
                showActions={false}
                showSave={false}
                getImageSrc={getImageSrc}
                formatDate={formatDate}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">
            No items to show for "{activeTab === "all" ? "All Items" : activeTab}".
          </div>
        )}
      </div>
    </div>
  );
}
