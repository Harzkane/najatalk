"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useParams } from "next/navigation";
import Link from "next/link";
import ListingCard from "@/components/marketplace/ListingCard";
import TrustBadge from "@/components/marketplace/TrustBadge";

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

  const formatDate = (dateString) => {
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
      <div className="min-h-screen bg-slate-100 p-6">
        <div className="mx-auto max-w-7xl rounded-lg border border-slate-200 bg-white p-6 text-slate-600">
          Loading profile...
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-100 p-6">
        <div className="mx-auto max-w-7xl rounded-lg border border-slate-200 bg-white p-6 text-slate-600">
          {message || "Profile unavailable."}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4 pb-20 md:p-6">
      <div className="mx-auto mb-4 max-w-7xl">
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-3">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.displayName}
                    className="h-12 w-12 rounded-full border border-slate-200 object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-lg font-bold text-white">
                    {(user.displayName || "U").charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">{user.displayName}</h1>
                  <p className="text-sm text-slate-600">{user.maskedEmail}</p>
                  {user.location && (
                    <p className="text-xs text-slate-500">Location: {user.location}</p>
                  )}
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                    {user.flair && (
                      <span className="rounded bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-700">
                        {user.flair}
                      </span>
                    )}
                    {user.isPremium && (
                      <span className="rounded bg-amber-100 px-2 py-0.5 font-semibold text-amber-700">
                        Premium
                      </span>
                    )}
                  </div>
                  {user.bio && (
                    <p className="mt-2 max-w-2xl text-sm text-slate-700">{user.bio}</p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href="/"
                  className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                >
                  Home
                </Link>
                <Link
                  href="/marketplace"
                  className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                >
                  Marketplace
                </Link>
                {isOwnerProfile && (
                  <Link
                    href={`/users/${id}/wallet`}
                    className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    My Wallet
                  </Link>
                )}
              </div>
            </div>
          </div>

          <div className="p-5">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
              <div className="rounded-lg border border-slate-200 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">Total Listings</p>
                <p className="text-lg font-semibold text-slate-900">{sellerStats?.totalListings || 0}</p>
              </div>
              <div className="rounded-lg border border-slate-200 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">Active</p>
                <p className="text-lg font-semibold text-slate-900">{sellerStats?.activeListings || 0}</p>
              </div>
              <div className="rounded-lg border border-slate-200 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">Sold</p>
                <p className="text-lg font-semibold text-slate-900">{sellerStats?.soldListings || 0}</p>
              </div>
              <div className="rounded-lg border border-slate-200 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">Completed Deals</p>
                <p className="text-lg font-semibold text-slate-900">{sellerStats?.completedDeals || 0}</p>
              </div>
              <div className="rounded-lg border border-slate-200 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">Avg Response</p>
                <p className="text-lg font-semibold text-slate-900">
                  {sellerStats?.avgResponseHours !== null &&
                  sellerStats?.avgResponseHours !== undefined
                    ? `${sellerStats.avgResponseHours}h`
                    : "--"}
                </p>
              </div>
            </div>

            <div className="mt-3">
              <TrustBadge sellerStats={sellerStats || {}} />
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl">
        {message && (
          <p className="mb-4 rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-600">
            {message}
          </p>
        )}

        <div className="mb-4 flex flex-wrap gap-2">
          {TABS.map((tab) => {
            const isActive = activeTab === tab;
            const label = tab === "all" ? "All" : tab.charAt(0).toUpperCase() + tab.slice(1);
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded-md border px-3 py-1.5 text-sm ${
                  isActive
                    ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                    : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {filteredListings.length > 0 ? (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
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
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-slate-600">
        No listings in this tab yet.
      </div>
    )}
      </div>
    </div >
  );
}
