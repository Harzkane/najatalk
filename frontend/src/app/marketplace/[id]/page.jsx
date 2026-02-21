"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import ConfirmModal from "@/components/ConfirmModal";

const toId = (value) => {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    if (typeof value._id === "string") return value._id;
    if (value._id && typeof value._id.toString === "function") {
      return value._id.toString();
    }
    if (typeof value.toString === "function") return value.toString();
  }
  return String(value);
};

const getImageSrc = (url = "") => {
  if (!url) return "";
  if (url.startsWith("data:") || url.startsWith("/")) return url;
  if (/^https?:\/\//i.test(url)) {
    return `/api/marketplace/image-proxy?url=${encodeURIComponent(url)}`;
  }
  return url;
};

const maskEmail = (email = "") => {
  const [local = "", domain = ""] = String(email).split("@");
  if (!local || !domain) return "seller";
  if (local.length <= 2) return `${local[0] || "*"}***@${domain}`;
  return `${local.slice(0, 2)}***@${domain}`;
};

const formatKobo = (amount = 0) =>
  `₦${(Number(amount || 0) / 100).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatBoostDate = (value) =>
  new Intl.DateTimeFormat("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));

const normalizeDeliveryAddress = (input = {}) => ({
  fullName: String(input.fullName || "").trim(),
  phone: String(input.phone || "").trim(),
  addressLine1: String(input.addressLine1 || "").trim(),
  addressLine2: String(input.addressLine2 || "").trim(),
  city: String(input.city || "").trim(),
  state: String(input.state || "").trim(),
  postalCode: String(input.postalCode || "").trim(),
  deliveryNote: String(input.deliveryNote || "").trim(),
});

export default function ListingDetailPage() {
  const [listing, setListing] = useState(null);
  const [message, setMessage] = useState("");
  const [currentUserId, setCurrentUserId] = useState(null);
  const [savedListingIds, setSavedListingIds] = useState([]);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showBoostModal, setShowBoostModal] = useState(false);
  const [isBoosting, setIsBoosting] = useState(false);
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [isWalletLoading, setIsWalletLoading] = useState(false);
  const [isWalletActionLoading, setIsWalletActionLoading] = useState(false);
  const [walletData, setWalletData] = useState(null);
  const [showBoostSuccessModal, setShowBoostSuccessModal] = useState(false);
  const [marketplacePolicy, setMarketplacePolicy] = useState(null);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [isSubmittingBuyOrder, setIsSubmittingBuyOrder] = useState(false);
  const [saveDeliveryAsDefault, setSaveDeliveryAsDefault] = useState(true);
  const [defaultDeliveryAddress, setDefaultDeliveryAddress] = useState(null);
  const [orderDetails, setOrderDetails] = useState({
    fullName: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    deliveryNote: "",
  });

  const { id } = useParams();
  const router = useRouter();

  useEffect(() => {
    fetchListing();
    fetchCurrentUser();
  }, [id]);

  const fetchCurrentUser = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const [userRes, savedRes, policyRes] = await Promise.all([
        axios.get("/api/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("/api/marketplace/favorites", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("/api/marketplace/me/policy", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setCurrentUserId(userRes.data._id);
      setDefaultDeliveryAddress(
        userRes.data.defaultDeliveryAddress
          ? normalizeDeliveryAddress(userRes.data.defaultDeliveryAddress)
          : null
      );
      setSavedListingIds((savedRes.data.savedListingIds || []).map((x) => x.toString()));
      setMarketplacePolicy(policyRes.data || null);
    } catch (err) {
      console.error("Current user load error:", err.response?.data || err.message);
    }
  };

  const fetchListing = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`/api/marketplace/listings/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      setListing(res.data.listing);
      setMessage(res.data.message || "");
      setSelectedImage(0);
    } catch (err) {
      setMessage(err.response?.data?.message || "Listing load scatter o!");
    }
  };

  const fetchWalletData = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      setIsWalletLoading(true);
      const res = await axios.get("/api/users/me/wallet-ledger", {
        params: { limit: 12, includePending: true },
        headers: { Authorization: `Bearer ${token}` },
      });
      setWalletData(res.data || null);
    } catch (err) {
      setMessage(err.response?.data?.message || "Wallet load scatter o!");
      setWalletData(null);
    } finally {
      setIsWalletLoading(false);
    }
  };

  const handleBuy = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setMessage("Abeg login first!");
      setTimeout(() => router.push("/login"), 1000);
      return;
    }
    if (defaultDeliveryAddress) {
      setOrderDetails((prev) => ({
        ...prev,
        ...normalizeDeliveryAddress(defaultDeliveryAddress),
      }));
    }
    setShowBuyModal(true);
  };

  const updateOrderDetail = (key, value) => {
    setOrderDetails((prev) => ({ ...prev, [key]: value }));
  };

  const resetOrderDetails = () => {
    setOrderDetails({
      fullName: "",
      phone: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      postalCode: "",
      deliveryNote: "",
    });
  };

  const confirmBuyOrder = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setMessage("Abeg login first!");
      setTimeout(() => router.push("/login"), 1000);
      return;
    }
    try {
      setIsSubmittingBuyOrder(true);
      const res = await axios.post(
        `/api/marketplace/buy/${listing._id}`,
        { orderDetails },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (saveDeliveryAsDefault) {
        const normalizedAddress = normalizeDeliveryAddress(orderDetails);
        try {
          await axios.patch(
            "/api/users/me/profile",
            { defaultDeliveryAddress: normalizedAddress },
            { headers: { Authorization: `Bearer ${token}` } }
          );
        } catch (saveErr) {
          console.error(
            "Save default delivery address error:",
            saveErr.response?.data || saveErr.message
          );
        }
        setDefaultDeliveryAddress(normalizedAddress);
      }
      setMessage(res.data.message);
      setShowBuyModal(false);
      resetOrderDetails();
      fetchListing();
    } catch (err) {
      setMessage(err.response?.data?.message || "Buy scatter o!");
    } finally {
      setIsSubmittingBuyOrder(false);
    }
  };

  const handleToggleFavorite = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setMessage("Login to save listings.");
      setTimeout(() => router.push("/login"), 1000);
      return;
    }

    try {
      const res = await axios.post(
        `/api/marketplace/favorites/${listing._id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSavedListingIds((res.data.savedListings || []).map((x) => x.toString()));
    } catch (err) {
      setMessage(err.response?.data?.message || "Save listing scatter o!");
    }
  };

  const handleConfirmDelivery = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setMessage("Abeg login first!");
      setTimeout(() => router.push("/login"), 1000);
      return;
    }

    try {
      const res = await axios.post(
        `/api/marketplace/release/${listing._id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(res.data.message);
      fetchListing();
    } catch (err) {
      setMessage(err.response?.data?.message || "Release scatter o!");
    }
  };

  const handleMarkShipped = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setMessage("Abeg login first!");
      setTimeout(() => router.push("/login"), 1000);
      return;
    }

    try {
      const res = await axios.post(
        `/api/marketplace/ship/${listing._id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(res.data.message || "Order marked as shipped.");
      fetchListing();
    } catch (err) {
      setMessage(err.response?.data?.message || "Ship status scatter o!");
    }
  };

  const handleDelete = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setMessage("Abeg login first!");
      setTimeout(() => router.push("/login"), 1000);
      return;
    }

    if (!isOwner) {
      setMessage("No be your item—abeg comot!");
      return;
    }

    try {
      const res = await axios.delete(`/api/marketplace/listings/${listing._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage(res.data.message);
      setTimeout(() => router.push("/marketplace"), 700);
    } catch (err) {
      setMessage(err.response?.data?.message || "Delete scatter o!");
    }
  };

  const handleBoost = async () => {
    setShowBoostModal(true);
  };

  const confirmBoost = async () => {
    setIsBoosting(true);
    setShowBoostModal(false);
    setWalletModalOpen(true);
    await fetchWalletData();
    setIsBoosting(false);
  };

  const executeBoostFromWallet = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setMessage("Abeg login first!");
      setTimeout(() => router.push("/login"), 1000);
      return;
    }

    try {
      setIsWalletActionLoading(true);
      const res = await axios.post(
        `/api/marketplace/listings/${listing._id}/boost`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(res.data.message || "Listing boosted.");
      await Promise.all([fetchListing(), fetchCurrentUser(), fetchWalletData()]);
      setWalletModalOpen(false);
      setShowBoostSuccessModal(true);
      setTimeout(() => setShowBoostSuccessModal(false), 1200);
    } catch (err) {
      setMessage(err.response?.data?.message || "Boost scatter o!");
    } finally {
      setIsWalletActionLoading(false);
    }
  };

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

  const images = useMemo(() => listing?.imageUrls || [], [listing]);
  const currentImage = images[selectedImage] || null;

  if (!listing) {
    return (
      <div className="min-h-screen bg-slate-100 p-6">
        <div className="mx-auto max-w-4xl rounded-lg border border-slate-200 bg-white p-6 text-slate-600">
          {message || "Loading listing..."}
        </div>
      </div>
    );
  }

  const ownerId = toId(listing.userId);
  const buyerId = toId(listing.buyerId);
  const isOwner = ownerId === currentUserId;
  const canDelete = isOwner;
  const isBuyer = buyerId === currentUserId;
  const isBuyerPending = listing.status === "pending" && buyerId === currentUserId;
  const isSellerPending = listing.status === "pending" && isOwner;
  const isOrderShipped = listing.fulfillmentStatus === "shipped";
  const canSellerShip = isSellerPending && !isOrderShipped;
  const showOrderDetails = isOwner || isBuyer;
  const isSaved = savedListingIds.includes(listing._id?.toString());
  const walletAvailable = Number(walletData?.availableBalance || 0);
  const walletHeld = Number(walletData?.heldBalance || 0);
  const walletTotal = Number(walletData?.balance || walletAvailable + walletHeld);
  const boostCostKobo = Number(marketplacePolicy?.boostCostKobo || 0);
  const hasEnoughForBoost = walletAvailable >= boostCostKobo;
  const walletEntries = Array.isArray(walletData?.entries) ? walletData.entries.slice(0, 8) : [];
  const boostExpiryMs = listing?.boostExpiresAt ? new Date(listing.boostExpiresAt).getTime() : 0;
  const isBoostCurrentlyActive = Number.isFinite(boostExpiryMs) && boostExpiryMs > Date.now();
  const boostLevel = Number(listing?.boostLevel || 0);
  const boostsPurchased = Number(listing?.boostsPurchased || 0);

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-6 pb-20">
      <div className="mx-auto max-w-6xl space-y-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h1 className="text-2xl font-bold text-slate-900">Listing Detail</h1>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/marketplace"
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
              >
                Back to Marketplace
              </Link>
              <Link
                href={`/users/${ownerId}`}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
              >
                Seller Profile
              </Link>
            </div>
          </div>
        </div>

        {message && (
          <p className="rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-600">{message}</p>
        )}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
              {currentImage ? (
                <img
                  src={getImageSrc(currentImage)}
                  alt={listing.title}
                  className="h-80 w-full object-cover"
                />
              ) : (
                <div className="flex h-80 items-center justify-center text-slate-400">No image</div>
              )}
            </div>

            {images.length > 1 && (
              <div className="mb-4 grid grid-cols-4 gap-2 md:grid-cols-6">
                {images.map((img, idx) => (
                  <button
                    key={`${img}-${idx}`}
                    onClick={() => setSelectedImage(idx)}
                    className={`overflow-hidden rounded border ${
                      selectedImage === idx ? "border-green-500" : "border-slate-200"
                    }`}
                  >
                    <img
                      src={getImageSrc(img)}
                      alt={`Preview ${idx + 1}`}
                      className="h-14 w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-xl font-semibold text-slate-900">{listing.title}</h2>
              <span
                className={`rounded-full px-2 py-1 text-xs font-semibold ${
                  listing.status === "active"
                    ? "bg-emerald-100 text-emerald-700"
                    : listing.status === "pending"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-slate-200 text-slate-700"
                }`}
              >
                {listing.status[0].toUpperCase() + listing.status.slice(1)}
              </span>
            </div>

            <p className="mb-4 text-3xl font-bold text-slate-900">₦{(listing.price / 100).toLocaleString()}</p>

            <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm leading-relaxed text-slate-700">{listing.description}</p>
            </div>

            <div className="grid grid-cols-1 gap-2 text-sm text-slate-600 md:grid-cols-2">
              <p>
                <span className="font-medium text-slate-800">Category:</span> {listing.category}
              </p>
              <p>
                <span className="font-medium text-slate-800">Posted:</span> {formatDate(listing.createdAt)}
              </p>
              <p>
                <span className="font-medium text-slate-800">Updated:</span> {formatDate(listing.updatedAt)}
              </p>
              <p>
                <span className="font-medium text-slate-800">Delivery Flow:</span> Escrow protected
              </p>
              {listing.status === "pending" && (
                <p>
                  <span className="font-medium text-slate-800">Order stage:</span>{" "}
                  {isOrderShipped ? "Shipped" : "Awaiting seller shipment"}
                </p>
              )}
              {isOwner && (
                <>
                  <p>
                    <span className="font-medium text-slate-800">Boost Status:</span>{" "}
                    {isBoostCurrentlyActive ? "Active" : "Inactive"}
                  </p>
                  {listing?.boostExpiresAt && (
                    <p>
                      <span className="font-medium text-slate-800">Boost Expires:</span>{" "}
                      {formatBoostDate(listing.boostExpiresAt)}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Seller Trust</h3>
            <p className="text-sm text-slate-700">
              <span className="font-medium">Seller:</span>{" "}
              {listing.userId?.username || maskEmail(listing.userId?.email)}
            </p>
            {listing.userId?.flair && (
              <p className="mt-1 text-sm text-slate-700">
                <span className="font-medium">Badge:</span>{" "}
                <span className="rounded bg-slate-200 px-1.5 py-0.5 text-xs font-semibold text-slate-700">
                  {listing.userId.flair}
                </span>
              </p>
            )}

            <div className="mt-2 flex flex-wrap gap-1 text-xs">
              <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-emerald-700">
                {listing.sellerStats?.trustTier || "New Seller"}
              </span>
              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-700">
                {listing.sellerStats?.completedDeals || 0} deals
              </span>
              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-700">
                {listing.sellerStats?.activeListings || 0} active listings
              </span>
              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-700">
                {listing.sellerStats?.avgResponseHours !== null
                  ? `${listing.sellerStats.avgResponseHours}h avg response`
                  : "new seller"}
              </span>
            </div>

            {marketplacePolicy && isOwner && (
              <div className="mt-3 rounded border border-slate-200 bg-slate-50 p-2 text-xs text-slate-600">
                <p>
                  Your seller tier:{" "}
                  <span className="font-semibold text-slate-800">
                    {marketplacePolicy.tier === "premium" ? "Premium" : "Free"}
                  </span>
                </p>
                <p>
                  Commission {marketplacePolicy.commissionPercent}% • Boost{" "}
                  {marketplacePolicy.boostCostLabel}/{marketplacePolicy.boostHours}h
                </p>
                <p>
                  Boost level {Math.max(boostLevel, isBoostCurrentlyActive ? 1 : 0)} • purchased{" "}
                  {boostsPurchased} time{boostsPurchased === 1 ? "" : "s"}
                </p>
              </div>
            )}

            <div className="mt-4 space-y-2">
              <button
                onClick={handleToggleFavorite}
                className={`w-full rounded-md px-3 py-2 text-sm font-medium ${
                  isSaved
                    ? "bg-slate-800 text-white hover:bg-slate-900"
                    : "border border-slate-300 text-slate-700 hover:bg-slate-50"
                }`}
              >
                {isSaved ? "Saved" : "Save Listing"}
              </button>

              {listing.status === "active" && !isOwner && (
                <button
                  onClick={handleBuy}
                  className="w-full rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700"
                >
                  Buy Now
                </button>
              )}

              {listing.status === "active" && isOwner && (
                <button
                  onClick={handleBoost}
                  className="w-full rounded-md bg-amber-500 px-3 py-2 text-sm font-medium text-white hover:bg-amber-600"
                >
                  {isBoostCurrentlyActive ? "Extend Boost" : "Boost Listing"}
                </button>
              )}

              {isBuyerPending && (
                <button
                  onClick={handleConfirmDelivery}
                  disabled={!isOrderShipped}
                  className="w-full rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                >
                  {isOrderShipped ? "Confirm Delivery" : "Waiting for Seller Shipment"}
                </button>
              )}
              {canSellerShip && (
                <button
                  onClick={handleMarkShipped}
                  className="w-full rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  Mark Shipped
                </button>
              )}

              {isOwner && (
                <Link
                  href="/marketplace"
                  className="block w-full rounded-md border border-slate-300 px-3 py-2 text-center text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Edit from Seller Desk
                </Link>
              )}

              {canDelete && (
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="w-full rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
                >
                  Delete Listing
                </button>
              )}
            </div>
          </div>
        </div>

        {showOrderDetails && listing?.orderDetails && (
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Delivery Details
            </h3>
            <div className="grid grid-cols-1 gap-2 text-sm text-slate-700 md:grid-cols-2">
              <p>
                <span className="font-medium text-slate-800">Name:</span>{" "}
                {listing.orderDetails.fullName || "-"}
              </p>
              <p>
                <span className="font-medium text-slate-800">Phone:</span>{" "}
                {listing.orderDetails.phone || "-"}
              </p>
              <p className="md:col-span-2">
                <span className="font-medium text-slate-800">Address:</span>{" "}
                {[
                  listing.orderDetails.addressLine1,
                  listing.orderDetails.addressLine2,
                  listing.orderDetails.city,
                  listing.orderDetails.state,
                  listing.orderDetails.postalCode,
                ]
                  .filter(Boolean)
                  .join(", ") || "-"}
              </p>
              {listing.orderDetails.deliveryNote && (
                <p className="md:col-span-2">
                  <span className="font-medium text-slate-800">Note:</span>{" "}
                  {listing.orderDetails.deliveryNote}
                </p>
              )}
              {listing.shippedAt && (
                <p>
                  <span className="font-medium text-slate-800">Shipped At:</span>{" "}
                  {new Date(listing.shippedAt).toLocaleString("en-NG")}
                </p>
              )}
              {listing.buyerConfirmedAt && (
                <p>
                  <span className="font-medium text-slate-800">Delivered At:</span>{" "}
                  {new Date(listing.buyerConfirmedAt).toLocaleString("en-NG")}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        open={showDeleteModal}
        title="Delete Listing?"
        description="This action cannot be undone. The listing will be removed from the marketplace."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        danger
        onCancel={() => setShowDeleteModal(false)}
        onConfirm={async () => {
          setShowDeleteModal(false);
          await handleDelete();
        }}
      />
      <ConfirmModal
        open={showBoostModal}
        title="Boost Listing?"
        description={`This will charge ${marketplacePolicy?.boostCostLabel || "your wallet"} and keep the listing boosted for ${marketplacePolicy?.boostHours || 72}h. If already boosted, another boost extends the active boost window.`}
        confirmLabel={isBoosting ? "Opening Wallet..." : "Continue to Wallet"}
        cancelLabel="Cancel"
        confirmDisabled={isBoosting}
        cancelDisabled={isBoosting}
        onCancel={() => {
          if (isBoosting) return;
          setShowBoostModal(false);
        }}
        onConfirm={confirmBoost}
      />

      {showBuyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-5 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">Checkout Delivery Details</h3>
            <p className="mt-1 text-sm text-slate-600">
              Payment moves to escrow now, and seller ships to this address.
            </p>
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              <input
                type="text"
                placeholder="Full name *"
                value={orderDetails.fullName}
                onChange={(e) => updateOrderDetail("fullName", e.target.value)}
                className="rounded-lg border border-slate-300 p-2 text-slate-800"
              />
              <input
                type="text"
                placeholder="Phone number *"
                value={orderDetails.phone}
                onChange={(e) => updateOrderDetail("phone", e.target.value)}
                className="rounded-lg border border-slate-300 p-2 text-slate-800"
              />
              <input
                type="text"
                placeholder="Address line 1 *"
                value={orderDetails.addressLine1}
                onChange={(e) => updateOrderDetail("addressLine1", e.target.value)}
                className="rounded-lg border border-slate-300 p-2 text-slate-800 md:col-span-2"
              />
              <input
                type="text"
                placeholder="Address line 2"
                value={orderDetails.addressLine2}
                onChange={(e) => updateOrderDetail("addressLine2", e.target.value)}
                className="rounded-lg border border-slate-300 p-2 text-slate-800 md:col-span-2"
              />
              <input
                type="text"
                placeholder="City *"
                value={orderDetails.city}
                onChange={(e) => updateOrderDetail("city", e.target.value)}
                className="rounded-lg border border-slate-300 p-2 text-slate-800"
              />
              <input
                type="text"
                placeholder="State *"
                value={orderDetails.state}
                onChange={(e) => updateOrderDetail("state", e.target.value)}
                className="rounded-lg border border-slate-300 p-2 text-slate-800"
              />
              <input
                type="text"
                placeholder="Postal code"
                value={orderDetails.postalCode}
                onChange={(e) => updateOrderDetail("postalCode", e.target.value)}
                className="rounded-lg border border-slate-300 p-2 text-slate-800"
              />
              <textarea
                placeholder="Delivery note"
                value={orderDetails.deliveryNote}
                onChange={(e) => updateOrderDetail("deliveryNote", e.target.value)}
                className="h-20 rounded-lg border border-slate-300 p-2 text-slate-800 md:col-span-2"
              />
              <label className="flex items-center gap-2 text-sm text-slate-700 md:col-span-2">
                <input
                  type="checkbox"
                  checked={saveDeliveryAsDefault}
                  onChange={(e) => setSaveDeliveryAsDefault(e.target.checked)}
                />
                Save this as my default delivery address
              </label>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  if (isSubmittingBuyOrder) return;
                  setShowBuyModal(false);
                  resetOrderDetails();
                }}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmBuyOrder}
                disabled={isSubmittingBuyOrder}
                className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmittingBuyOrder ? "Placing Order..." : "Place Order with Escrow"}
              </button>
            </div>
          </div>
        </div>
      )}

      {walletModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Boost via Wallet</h3>
                <p className="text-sm text-slate-600">
                  Pay from wallet and stay on listing detail page.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (isWalletActionLoading) return;
                  setWalletModalOpen(false);
                }}
                className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">Total</p>
                <p className="text-base font-semibold text-slate-900">{formatKobo(walletTotal)}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">Available</p>
                <p className="text-base font-semibold text-emerald-700">
                  {formatKobo(walletAvailable)}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">Held</p>
                <p className="text-base font-semibold text-amber-700">{formatKobo(walletHeld)}</p>
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-sm text-slate-700">
                Charge now: <span className="font-semibold">{formatKobo(boostCostKobo)}</span>
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Multiple boosts extend your boost duration by {marketplacePolicy?.boostHours || 72}h each.
              </p>
              {!hasEnoughForBoost && (
                <p className="mt-1 text-xs text-red-700">
                  Insufficient available balance. Fund your wallet and try again.
                </p>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={executeBoostFromWallet}
                  disabled={isWalletActionLoading || isWalletLoading || !hasEnoughForBoost}
                  className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isWalletActionLoading
                    ? "Processing..."
                    : `Pay ${formatKobo(boostCostKobo)} and Start Boost`}
                </button>
                <Link
                  href="/wallet"
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                >
                  Open Wallet Page
                </Link>
              </div>
            </div>

            <div className="mt-4">
              <h4 className="text-sm font-semibold text-slate-900">Recent Wallet Activity</h4>
              <div className="mt-2 max-h-56 overflow-y-auto rounded-lg border border-slate-200">
                {isWalletLoading ? (
                  <p className="p-3 text-sm text-slate-500">Loading wallet activity...</p>
                ) : walletEntries.length === 0 ? (
                  <p className="p-3 text-sm text-slate-500">No wallet activity yet.</p>
                ) : (
                  <div className="divide-y divide-slate-200">
                    {walletEntries.map((entry) => {
                      const effect = Number(entry.walletEffect || 0);
                      return (
                        <div key={entry._id || entry.reference} className="p-3 text-sm">
                          <div className="flex items-center justify-between gap-3">
                            <p className="font-medium text-slate-800">
                              {entry.entryKind || entry.type || "activity"}
                            </p>
                            <p
                              className={
                                effect >= 0
                                  ? "font-semibold text-emerald-700"
                                  : "font-semibold text-red-700"
                              }
                            >
                              {effect >= 0 ? "+" : "-"}
                              {formatKobo(Math.abs(effect))}
                            </p>
                          </div>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {new Date(entry.date || Date.now()).toLocaleString("en-NG")}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showBoostSuccessModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-xs rounded-xl border border-emerald-200 bg-white p-6 text-center shadow-xl">
            <div className="mx-auto mb-3 h-12 w-12 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin" />
            <p className="text-sm font-semibold text-emerald-700">Boost Activated</p>
            <p className="mt-1 text-xs text-slate-500">Updating listing visibility...</p>
          </div>
        </div>
      )}
    </div>
  );
}
