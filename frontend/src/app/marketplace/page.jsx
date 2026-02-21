"use client";

import { useEffect, useMemo, useState } from "react";
import api from "../../utils/api";
import axios from "axios";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ListingCard from "../../components/marketplace/ListingCard";
import ConfirmModal from "../../components/ConfirmModal";

const STATUS_OPTIONS = ["all", "active", "pending", "sold"];
const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price_low", label: "Price: Low to High" },
  { value: "price_high", label: "Price: High to Low" },
  { value: "recent_update", label: "Recently Updated" },
];
const PREMIUM_PRICE_KOBO = 50000;

const toDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const normalizeManualImageUrl = (rawUrl = "") => {
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("data:image/")) return trimmed;

  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  try {
    const parsed = new URL(withProtocol);
    if (!["http:", "https:"].includes(parsed.protocol)) return null;
    return parsed.toString();
  } catch {
    return null;
  }
};

const getImageSrc = (url = "") => {
  if (!url) return "";
  if (url.startsWith("data:") || url.startsWith("/")) return url;
  if (/^https?:\/\//i.test(url)) {
    return `/api/marketplace/image-proxy?url=${encodeURIComponent(url)}`;
  }
  return url;
};

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

const formatKobo = (amount = 0) =>
  `₦${(Number(amount || 0) / 100).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

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

export default function Marketplace() {
  const [listings, setListings] = useState([]);
  const [categories, setCategories] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedFlair, setSelectedFlair] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("Others");
  const [imageUrls, setImageUrls] = useState([]);
  const [manualImageUrl, setManualImageUrl] = useState("");
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [editId, setEditId] = useState(null);

  const [activeView, setActiveView] = useState("browse");
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState("neutral");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [savedListingIds, setSavedListingIds] = useState([]);
  const [pendingDeleteListingId, setPendingDeleteListingId] = useState(null);
  const [pendingBuyListingId, setPendingBuyListingId] = useState(null);
  const [isSubmittingBuyOrder, setIsSubmittingBuyOrder] = useState(false);
  const [saveDeliveryAsDefault, setSaveDeliveryAsDefault] = useState(true);
  const [defaultDeliveryAddress, setDefaultDeliveryAddress] = useState(null);
  const [pendingBoostListingId, setPendingBoostListingId] = useState(null);
  const [selectedBoostListingId, setSelectedBoostListingId] = useState(null);
  const [isBoosting, setIsBoosting] = useState(false);
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [walletModalContext, setWalletModalContext] = useState("boost");
  const [walletData, setWalletData] = useState(null);
  const [isWalletLoading, setIsWalletLoading] = useState(false);
  const [isWalletActionLoading, setIsWalletActionLoading] = useState(false);
  const [showBoostSuccessModal, setShowBoostSuccessModal] = useState(false);
  const [marketplacePolicy, setMarketplacePolicy] = useState(null);
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

  const router = useRouter();

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    setIsLoggedIn(Boolean(token));

    fetchListings();
    fetchCategories();

    if (token) {
      fetchCurrentUser(token);
      fetchFavorites(token);
      fetchMarketplacePolicy(token);
    }
  }, []);

  const showMessage = (text, tone = "neutral") => {
    setMessage(text || "");
    setMessageTone(tone);
  };

  const fetchCurrentUser = async (token) => {
    try {
      const res = await api.get("/users/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCurrentUserId(res.data._id);
      setIsAdmin(res.data.role === "admin");
      setDefaultDeliveryAddress(
        res.data.defaultDeliveryAddress
          ? normalizeDeliveryAddress(res.data.defaultDeliveryAddress)
          : null
      );
      localStorage.setItem("userId", res.data._id);
      setIsLoggedIn(true);
    } catch (err) {
      console.error("Fetch user error:", err.response?.data || err.message);
      setIsLoggedIn(false);
      setIsAdmin(false);
      localStorage.removeItem("token");
      localStorage.removeItem("userId");
    }
  };

  const fetchListings = async () => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const res = await api.get("/marketplace/listings", {
        params: { includeSold: true },
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      setListings(res.data.listings || []);
      showMessage(res.data.message || "", "neutral");
    } catch (err) {
      showMessage(err.response?.data?.message || "Market load scatter o!", "error");
    }
  };

  const fetchFavorites = async (token) => {
    try {
      const res = await api.get("/marketplace/favorites", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSavedListingIds((res.data.savedListingIds || []).map((id) => id.toString()));
    } catch (err) {
      console.error("Favorites load error:", err.response?.data || err.message);
      setSavedListingIds([]);
    }
  };

  const fetchMarketplacePolicy = async (token) => {
    try {
      const res = await api.get("/marketplace/me/policy", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMarketplacePolicy(res.data || null);
    } catch (err) {
      console.error("Marketplace policy load error:", err.response?.data || err.message);
      setMarketplacePolicy(null);
    }
  };

  const fetchWalletData = async (token) => {
    try {
      setIsWalletLoading(true);
      const res = await api.get("/users/me/wallet-ledger", {
        params: { limit: 12, includePending: true },
        headers: { Authorization: `Bearer ${token}` },
      });
      setWalletData(res.data || null);
    } catch (err) {
      showMessage(err.response?.data?.message || "Wallet load scatter o!", "error");
      setWalletData(null);
    } finally {
      setIsWalletLoading(false);
    }
  };

  const openWalletModal = async (context) => {
    const token = localStorage.getItem("token");
    if (!token) {
      showMessage("Abeg login first!", "warning");
      setTimeout(() => router.push("/login"), 1000);
      return;
    }
    setWalletModalContext(context);
    setWalletModalOpen(true);
    await fetchWalletData(token);
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get("/marketplace/categories");
      setCategories(res.data.categories || []);
    } catch (err) {
      showMessage(err.response?.data?.message || "Categories load scatter o!", "error");
      setCategories(["Electronics", "Fashion", "Home", "Food", "Services", "Others"]);
    }
  };

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedCategory("all");
    setSelectedStatus("all");
    setSelectedFlair("all");
    setSortBy("newest");
    setMinPrice("");
    setMaxPrice("");
  };

  const filteredListings = useMemo(() => {
    let filtered = [...listings];

    if (activeView === "saved") {
      filtered = filtered.filter((listing) =>
        savedListingIds.includes(listing._id?.toString())
      );
    }

    if (selectedCategory !== "all") {
      filtered = filtered.filter((listing) => listing.category === selectedCategory);
    }

    if (selectedStatus !== "all") {
      filtered = filtered.filter((listing) => listing.status === selectedStatus);
    }

    if (selectedFlair !== "all") {
      filtered = filtered.filter((listing) => listing.userId?.flair === selectedFlair);
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (listing) =>
          listing.title.toLowerCase().includes(term) ||
          listing.description.toLowerCase().includes(term)
      );
    }

    if (minPrice) {
      filtered = filtered.filter((listing) => listing.price / 100 >= Number(minPrice));
    }

    if (maxPrice) {
      filtered = filtered.filter((listing) => listing.price / 100 <= Number(maxPrice));
    }

    if (sortBy === "price_low") {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price_high") {
      filtered.sort((a, b) => b.price - a.price);
    } else if (sortBy === "recent_update") {
      filtered.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    } else {
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    if (activeView === "my_listings") {
      filtered = filtered.filter(
        (listing) => toId(listing.userId) === currentUserId
      );
    }

    if (activeView === "orders") {
      filtered = filtered.filter(
        (listing) =>
          toId(listing.buyerId) === currentUserId ||
          (toId(listing.userId) === currentUserId && listing.status === "pending")
      );
    }

    return filtered;
  }, [
    listings,
    selectedCategory,
    selectedStatus,
    selectedFlair,
    searchTerm,
    minPrice,
    maxPrice,
    sortBy,
    activeView,
    currentUserId,
    savedListingIds,
  ]);

  const myListingsCount = listings.filter(
    (listing) => toId(listing.userId) === currentUserId
  ).length;
  const myPendingOrdersCount = listings.filter(
    (listing) =>
      toId(listing.buyerId) === currentUserId ||
      (toId(listing.userId) === currentUserId && listing.status === "pending")
  ).length;
  const sellerPendingOrdersCount = listings.filter(
    (listing) =>
      toId(listing.userId) === currentUserId && listing.status === "pending"
  ).length;
  const buyerPendingOrdersCount = listings.filter(
    (listing) => toId(listing.buyerId) === currentUserId && listing.status === "pending"
  ).length;
  const listingUsagePercent = marketplacePolicy?.activeListingLimit
    ? Math.min(
      100,
      Math.round(
        ((marketplacePolicy.activeListingCount || 0) / marketplacePolicy.activeListingLimit) *
        100
      )
    )
    : 0;

  const handleImageUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    setIsUploadingImages(true);
    try {
      const encodedImages = await Promise.all(files.map((file) => toDataUrl(file)));
      setImageUrls((prev) => [...prev, ...encodedImages].slice(0, 8));
    } catch (err) {
      showMessage("Image upload scatter—try again.", "error");
    } finally {
      setIsUploadingImages(false);
      event.target.value = "";
    }
  };

  const handleAddManualImage = () => {
    const normalizedUrl = normalizeManualImageUrl(manualImageUrl);
    if (!normalizedUrl) {
      showMessage("Enter a valid image URL (http/https).", "warning");
      return;
    }

    if (imageUrls.length >= 8) {
      showMessage("Maximum 8 images per listing.", "warning");
      return;
    }

    if (imageUrls.includes(normalizedUrl)) {
      showMessage("This image URL is already added.", "warning");
      return;
    }

    setImageUrls((prev) => [...prev, normalizedUrl]);
    setManualImageUrl("");
  };

  const removeImageAt = (index) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) {
      showMessage("Abeg login first!", "warning");
      setTimeout(() => router.push("/login"), 1000);
      return;
    }

    try {
      const url = editId
        ? `/marketplace/listings/${editId}`
        : "/marketplace/listings";
      const method = editId ? "put" : "post";

      const res = await api({
        method,
        url,
        data: { title, description, price: Number(price), category, imageUrls },
        headers: { Authorization: `Bearer ${token}` },
      });

      showMessage(res.data.message, "success");
      setTitle("");
      setDescription("");
      setPrice("");
      setCategory("Others");
      setImageUrls([]);
      setManualImageUrl("");
      setEditId(null);
      setActiveView("browse");
      fetchListings();
      fetchMarketplacePolicy(token);
    } catch (err) {
      const serverMessage = err.response?.data?.message;
      if (err.response?.status === 403 && err.response?.data?.upgradeSuggested) {
        showMessage(
          `${serverMessage} Upgrade on Premium page to increase your seller limit.`,
          "warning"
        );
      } else {
        showMessage(serverMessage || "Listing scatter o!", "error");
      }
    }
  };

  const handleToggleFavorite = async (listingId) => {
    const token = localStorage.getItem("token");
    if (!token) {
      showMessage("Login to save listings.", "warning");
      setTimeout(() => router.push("/login"), 1000);
      return;
    }

    try {
      const res = await api.post(
        `/marketplace/favorites/${listingId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSavedListingIds((res.data.savedListings || []).map((id) => id.toString()));
    } catch (err) {
      showMessage(err.response?.data?.message || "Save listing scatter o!", "error");
    }
  };

  const handleEdit = (listing) => {
    setEditId(listing._id);
    setTitle(listing.title);
    setDescription(listing.description);
    setPrice(String(listing.price / 100));
    setCategory(listing.category);
    setImageUrls(listing.imageUrls || []);
    setActiveView("sell");
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

  const handleDelete = async (id) => {
    const token = localStorage.getItem("token");
    const listing = listings.find((item) => item._id === id);
    const listingOwnerId = toId(listing?.userId);
    const isOwner = listingOwnerId === currentUserId;
    const canDelete = isOwner;

    if (!canDelete) {
      showMessage("No be your item—abeg comot!", "warning");
      return;
    }

    try {
      const res = await api.delete(`/marketplace/listings/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showMessage(res.data.message, "success");
      fetchListings();
      fetchMarketplacePolicy(token);
    } catch (err) {
      showMessage(err.response?.data?.message || "Delete scatter o!", "error");
    }
  };

  const requestDelete = (id) => {
    const listing = listings.find((item) => item._id === id);
    const listingOwnerId = toId(listing?.userId);
    if (listingOwnerId !== currentUserId) {
      showMessage("No be your item—abeg comot!", "warning");
      return;
    }
    setPendingDeleteListingId(id);
  };

  const handleBuy = async (id) => {
    if (defaultDeliveryAddress) {
      setOrderDetails((prev) => ({
        ...prev,
        ...normalizeDeliveryAddress(defaultDeliveryAddress),
      }));
    }
    setPendingBuyListingId(id);
  };

  const confirmBuyOrder = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      showMessage("Abeg login first!", "warning");
      setTimeout(() => router.push("/login"), 1000);
      return;
    }
    if (!pendingBuyListingId) return;

    try {
      setIsSubmittingBuyOrder(true);
      const res = await api.post(
        `/marketplace/buy/${pendingBuyListingId}`,
        { orderDetails },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (saveDeliveryAsDefault) {
        const normalizedAddress = normalizeDeliveryAddress(orderDetails);
        try {
          await api.patch(
            "/users/me/profile",
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
      showMessage(res.data.message, "success");
      setPendingBuyListingId(null);
      resetOrderDetails();
      fetchListings();
    } catch (err) {
      showMessage(err.response?.data?.message || "Buy scatter o!", "error");
    } finally {
      setIsSubmittingBuyOrder(false);
    }
  };

  const handleShipOrder = async (id) => {
    const token = localStorage.getItem("token");
    if (!token) {
      showMessage("Abeg login first!", "warning");
      setTimeout(() => router.push("/login"), 1000);
      return;
    }
    try {
      const res = await api.post(
        `/marketplace/ship/${id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showMessage(res.data.message || "Order marked shipped.", "success");
      fetchListings();
    } catch (err) {
      showMessage(err.response?.data?.message || "Ship update scatter o!", "error");
    }
  };

  const handleRelease = async (id) => {
    const token = localStorage.getItem("token");
    if (!token) {
      showMessage("Abeg login first!", "warning");
      setTimeout(() => router.push("/login"), 1000);
      return;
    }

    try {
      const res = await api.post(
        `/marketplace/release/${id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showMessage(res.data.message, "success");
      fetchListings();
    } catch (err) {
      showMessage(err.response?.data?.message || "Release scatter o!", "error");
    }
  };

  const handleBoost = (id) => {
    setSelectedBoostListingId(id);
    setPendingBoostListingId(id);
  };

  const confirmBoost = async () => {
    if (!pendingBoostListingId && !selectedBoostListingId) return;
    setIsBoosting(true);
    setPendingBoostListingId(null);
    await openWalletModal("boost");
    setIsBoosting(false);
  };

  const executeWalletAction = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      showMessage("Abeg login first!", "warning");
      setTimeout(() => router.push("/login"), 1000);
      return;
    }

    try {
      setIsWalletActionLoading(true);
      if (walletModalContext === "boost") {
        if (!selectedBoostListingId) {
          showMessage("Select a listing to boost first.", "warning");
          return;
        }
        const res = await api.post(
          `/marketplace/listings/${selectedBoostListingId}/boost`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        showMessage(res.data.message || "Listing boosted.", "success");
        setWalletModalOpen(false);
        setShowBoostSuccessModal(true);
        setTimeout(() => setShowBoostSuccessModal(false), 1200);
      } else {
        const res = await api.post(
          "/premium/subscribe-with-wallet",
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        showMessage(res.data.message || "Premium activated from wallet.", "success");
      }

      await Promise.all([
        fetchListings(),
        fetchMarketplacePolicy(token),
        fetchCurrentUser(token),
        fetchWalletData(token),
      ]);
    } catch (err) {
      showMessage(err.response?.data?.message || "Wallet action scatter o!", "error");
    } finally {
      setIsWalletActionLoading(false);
      setIsBoosting(false);
    }
  };

  const handleUpgradeFromMarketplace = async () => {
    await openWalletModal("premium");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    setIsLoggedIn(false);
    setCurrentUserId(null);
    setIsAdmin(false);
    setSavedListingIds([]);
    router.push("/login");
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

  const isTierLimitMessage = message.toLowerCase().includes("tier limit reached");
  const boostCostKobo = Number(marketplacePolicy?.boostCostKobo || 0);
  const walletAvailable = Number(walletData?.availableBalance || 0);
  const walletHeld = Number(walletData?.heldBalance || 0);
  const walletTotal = Number(walletData?.balance || walletAvailable + walletHeld);
  const walletEntries = Array.isArray(walletData?.entries) ? walletData.entries.slice(0, 8) : [];
  const actionCostKobo = walletModalContext === "premium" ? PREMIUM_PRICE_KOBO : boostCostKobo;
  const actionCtaLabel =
    walletModalContext === "premium"
      ? `Pay ${formatKobo(PREMIUM_PRICE_KOBO)} and Activate Premium`
      : `Pay ${formatKobo(boostCostKobo)} and Start Boost`;
  const hasEnoughWalletForAction = walletAvailable >= actionCostKobo;
  const isBoostActionReady = walletModalContext !== "boost" || Boolean(selectedBoostListingId);
  const messageClass =
    messageTone === "error"
      ? "border-red-200 bg-red-50 text-red-700"
      : messageTone === "warning"
        ? "border-amber-200 bg-amber-50 text-amber-800"
        : messageTone === "success"
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-slate-200 bg-white text-slate-600";

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-6 pb-20">
      <div className="max-w-7xl mx-auto mb-4">
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Marketplace</h1>
                <p className="text-sm text-slate-600">
                  Buy trusted listings, sell quickly, and settle safely with escrow.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href="/"
                  className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Home
                </Link>
                {isLoggedIn && currentUserId && (
                  <Link
                    href={`/users/${currentUserId}`}
                    className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    My Profile
                  </Link>
                )}
                {isLoggedIn && (
                  <Link
                    href="/wallet"
                    className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    My Wallet
                  </Link>
                )}
                {isAdmin && (
                  <Link
                    href="/marketplace/wallet"
                    className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Platform Wallet
                  </Link>
                )}
                {isLoggedIn ? (
                  <button
                    onClick={handleLogout}
                    className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
                  >
                    Logout
                  </button>
                ) : (
                  <Link
                    href="/login"
                    className="rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700"
                  >
                    Login
                  </Link>
                )}
              </div>
            </div>
          </div>

          <div className="p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {[
                { key: "browse", label: "Browse", value: listings.length, sub: "All listings" },
                { key: "sell", label: "Sell", value: "Quick Post", sub: "Create or edit listing" },
                { key: "my_listings", label: "My Listings", value: myListingsCount, sub: "Seller inventory" },
                {
                  key: "orders",
                  label: "Orders",
                  value: myPendingOrdersCount,
                  sub:
                    sellerPendingOrdersCount > 0
                      ? `${sellerPendingOrdersCount} response needed`
                      : buyerPendingOrdersCount > 0
                        ? `${buyerPendingOrdersCount} waiting for delivery`
                        : "No active orders",
                },
                { key: "saved", label: "Saved", value: savedListingIds.length, sub: "Favorite items" },
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => setActiveView(item.key)}
                  className={`rounded-lg border p-3 text-left transition-colors ${activeView === item.key
                    ? "border-green-600 bg-green-50 shadow-sm"
                    : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                >
                  <p className="text-xs uppercase font-bold tracking-wider text-slate-500">{item.label}</p>
                  <p className="text-xl font-bold text-slate-900">{item.value}</p>
                  <p className="text-xs text-slate-600 truncate">{item.sub}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl">
        {message && (
          <div className={`mb-4 rounded-lg border p-3 text-sm shadow-sm flex flex-col gap-2 ${messageClass}`}>
            <p className="font-medium">{message}</p>
            {isTierLimitMessage && (
              <div>
                <button
                  type="button"
                  onClick={handleUpgradeFromMarketplace}
                  className="rounded-md bg-amber-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-700"
                >
                  Upgrade to Premium
                </button>
              </div>
            )}
          </div>
        )}

        {isLoggedIn && sellerPendingOrdersCount > 0 && activeView !== "orders" && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 shadow-sm">
            <span className="font-bold">Gist:</span> You have {sellerPendingOrdersCount} pending order{sellerPendingOrdersCount === 1 ? "" : "s"} in escrow. Open the
            <button onClick={() => setActiveTab("orders")} className="mx-1 font-bold underline">Orders tab</button>
            to confirm shipping.
          </div>
        )}

        {activeView === "sell" && isLoggedIn && (
          <div className="mb-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            {marketplacePolicy && (
              <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-xs uppercase font-bold text-slate-500">Seller Policy</p>
                    <p className="text-sm font-bold text-slate-900">
                      {marketplacePolicy.tier === "premium" ? "Premium Seller" : "Free Seller"}
                    </p>
                  </div>
                  <div className="text-right text-xs text-slate-600">
                    <p>Commission: <span className="font-bold">{marketplacePolicy.commissionPercent}%</span></p>
                    <p>
                      Boost: <span className="font-bold">{marketplacePolicy.boostCostLabel}</span> / {marketplacePolicy.boostHours}h
                    </p>
                  </div>
                </div>
                <div className="mt-2">
                  <div className="mb-1 flex items-center justify-between text-xs text-slate-600">
                    <span>Active Listings</span>
                    <span className="font-bold">
                      {marketplacePolicy.activeListingCount}/{marketplacePolicy.activeListingLimit}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded bg-slate-200">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-500"
                      style={{ width: `${listingUsagePercent}%` }}
                    />
                  </div>
                </div>
                {marketplacePolicy.tier === "free" && (
                  <p className="mt-2 text-xs text-slate-600 font-medium italic">
                    Upgrade to Premium for higher limits and lower fees!
                  </p>
                )}
              </div>
            )}
            <h2 className="mb-4 text-lg font-bold text-slate-900">
              {editId ? "Edit Your Listing" : "Post a New Item"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Title</label>
                <input
                  type="text"
                  placeholder="e.g. Clean iPhone 13 Pro Max"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2 text-slate-800 outline-none focus:ring-2 focus:ring-green-600"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  placeholder="Tell us about the condition, accessories, and location..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="h-24 w-full rounded-lg border border-slate-300 p-2 text-slate-800 outline-none focus:ring-2 focus:ring-green-600"
                  required
                />
              </div>

              <div className="rounded-lg border border-slate-200 p-3 bg-slate-50/50">
                <p className="mb-2 text-sm font-bold text-slate-700">Images (Max 8)</p>
                <div className="mb-3 flex flex-wrap items-center gap-3">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="text-xs file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-green-100 file:text-green-800 hover:file:bg-green-200"
                  />
                  <div className="flex-1 flex gap-1">
                    <input
                      type="text"
                      placeholder="Or paste image URL"
                      value={manualImageUrl}
                      onChange={(e) => setManualImageUrl(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddManualImage();
                        }
                      }}
                      className="flex-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-green-600"
                    />
                    <button
                      type="button"
                      onClick={handleAddManualImage}
                      className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
                    >
                      Add
                    </button>
                  </div>
                </div>
                {isUploadingImages && (
                  <p className="mb-2 text-xs text-slate-500 animate-pulse">Uploading...</p>
                )}
                {imageUrls.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 md:grid-cols-8">
                    {imageUrls.map((url, index) => (
                      <div key={`${url}-${index}`} className="group relative aspect-square overflow-hidden rounded border border-slate-200 bg-white">
                        <img
                          src={getImageSrc(url)}
                          alt={`Listing ${index + 1}`}
                          className="h-full w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeImageAt(index)}
                          className="absolute right-1 top-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          X
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Price (₦)</label>
                  <input
                    type="number"
                    placeholder="Enter amount"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2 text-slate-800 outline-none focus:ring-2 focus:ring-green-600"
                    min="1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2 text-slate-800 outline-none focus:ring-2 focus:ring-green-600 bg-white"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full rounded-lg bg-green-700 px-4 py-2 font-bold text-white hover:bg-green-800 shadow-sm transition-transform active:scale-95"
                  >
                    {editId ? "Update Listing" : "Post Item Now"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {activeView === "sell" && !isLoggedIn && (
          <div className="mb-4 rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
            <p className="text-slate-600 mb-4 font-medium">You need to login to start selling on NaijaTalk.</p>
            <Link
              href="/login"
              className="inline-block rounded-md bg-green-700 px-6 py-2.5 text-sm font-bold text-white hover:bg-green-800 shadow-md"
            >
              Login to Sell
            </Link>
          </div>
        )}

        <div className="mb-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-6">
            <div className="lg:col-span-2">
              <input
                type="text"
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-green-600"
              />
            </div>
            <div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-green-600 bg-white"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-green-600 bg-white"
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status === "all" ? "Any Status" : status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <select
                value={selectedFlair}
                onChange={(e) => setSelectedFlair(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-green-600 bg-white"
              >
                <option value="all">All Sellers</option>
                <option value="Verified G">Verified G</option>
                <option value="Oga at the Top">Oga at the Top</option>
              </select>
            </div>
            <div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-green-600 bg-white"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-4 py-2 border-t border-slate-100 pt-4">
            <div className="flex gap-2 items-center">
              <span className="text-xs font-bold text-slate-500 uppercase">Price Range:</span>
              <input
                type="number"
                placeholder="Min ₦"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-24 rounded-lg border border-slate-300 p-1.5 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-green-600"
              />
              <span className="text-slate-400">—</span>
              <input
                type="number"
                placeholder="Max ₦"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-24 rounded-lg border border-slate-300 p-1.5 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-green-600"
              />
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={resetFilters}
                className="text-xs font-bold text-slate-500 hover:text-slate-700 underline underline-offset-4"
              >
                Clear Filters
              </button>
              <p className="text-sm font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full">
                {filteredListings.length} item{filteredListings.length === 1 ? "" : "s"} found
              </p>
            </div>
          </div>
        </div>

        {filteredListings.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredListings.map((listing) => (
              <ListingCard
                key={listing._id}
                listing={listing}
                currentUserId={currentUserId}
                isLoggedIn={isLoggedIn}
                isSaved={savedListingIds.includes(listing._id?.toString())}
                onToggleFavorite={handleToggleFavorite}
                onBuy={handleBuy}
                onEdit={handleEdit}
                onDelete={requestDelete}
                onRelease={handleRelease}
                onShip={handleShipOrder}
                onBoost={handleBoost}
                getImageSrc={getImageSrc}
                formatDate={formatDate}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-16 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 text-slate-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <p className="text-lg font-bold text-slate-900">No items found</p>
            <p className="text-slate-500">Try adjusting your search or filters to see more listings.</p>
            <button
              onClick={resetFilters}
              className="mt-6 rounded-md bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      <ConfirmModal
        open={Boolean(pendingDeleteListingId)}
        title="Delete Listing?"
        description="This action comot the item from marketplace forever. You sure say you wan delete am?"
        confirmLabel="Yes, Delete"
        cancelLabel="Abeg comot"
        danger
        onCancel={() => setPendingDeleteListingId(null)}
        onConfirm={async () => {
          if (!pendingDeleteListingId) return;
          const targetId = pendingDeleteListingId;
          setPendingDeleteListingId(null);
          await handleDelete(targetId);
        }}
      />

      {pendingBuyListingId && (
        <div className="fixed inset-0 z-[55] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Delivery Information</h3>
                <p className="text-sm text-slate-600">Secure escrow payment: funds only comot when you confirm delivery.</p>
              </div>
              <button onClick={() => setPendingBuyListingId(null)} className="text-slate-400 hover:text-slate-600 text-2xl">×</button>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={orderDetails.fullName}
                  onChange={(e) => updateOrderDetail("fullName", e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Phone Number *</label>
                <input
                  type="text"
                  placeholder="e.g. 08012345678"
                  value={orderDetails.phone}
                  onChange={(e) => updateOrderDetail("phone", e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Delivery Address *</label>
                <input
                  type="text"
                  placeholder="Street address, building, etc."
                  value={orderDetails.addressLine1}
                  onChange={(e) => updateOrderDetail("addressLine1", e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="md:col-span-2">
                <input
                  type="text"
                  placeholder="Landmark, apartment number (optional)"
                  value={orderDetails.addressLine2}
                  onChange={(e) => updateOrderDetail("addressLine2", e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">City *</label>
                <input
                  type="text"
                  placeholder="Lagos, Abuja, etc."
                  value={orderDetails.city}
                  onChange={(e) => updateOrderDetail("city", e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">State *</label>
                <input
                  type="text"
                  placeholder="State"
                  value={orderDetails.state}
                  onChange={(e) => updateOrderDetail("state", e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Special Note for Rider</label>
                <textarea
                  placeholder="e.g. Call before you comot, drop am with security, etc."
                  value={orderDetails.deliveryNote}
                  onChange={(e) => updateOrderDetail("deliveryNote", e.target.value)}
                  className="h-20 w-full rounded-lg border border-slate-300 p-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 md:col-span-2 select-none cursor-pointer">
                <input
                  type="checkbox"
                  checked={saveDeliveryAsDefault}
                  onChange={(e) => setSaveDeliveryAsDefault(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                Use this as my default address for next time
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-5">
              <button
                type="button"
                onClick={() => {
                  if (isSubmittingBuyOrder) return;
                  setPendingBuyListingId(null);
                  resetOrderDetails();
                }}
                className="rounded-lg border border-slate-300 bg-white px-5 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                No be now
              </button>
              <button
                type="button"
                disabled={isSubmittingBuyOrder}
                onClick={confirmBuyOrder}
                className="rounded-lg bg-emerald-600 px-6 py-2 text-sm font-bold text-white hover:bg-emerald-700 shadow-lg disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
              >
                {isSubmittingBuyOrder ? "Just a sec..." : "Confirm Buy & Pay Escrow"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={Boolean(pendingBoostListingId)}
        title="Boost Dis Item?"
        description={`This one go charge ${marketplacePolicy?.boostCostLabel || "your wallet"} and make the item show for top for ${marketplacePolicy?.boostHours || 72}h. Business go grow!`}
        confirmLabel={isBoosting ? "Checking Wallet..." : "Show Me Wallet"}
        cancelLabel="Maybe Later"
        confirmDisabled={isBoosting}
        cancelDisabled={isBoosting}
        onCancel={() => {
          if (isBoosting) return;
          setPendingBoostListingId(null);
          setSelectedBoostListingId(null);
        }}
        onConfirm={confirmBoost}
      />

      {walletModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-3 mb-5">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  {walletModalContext === "premium" ? "Activate Premium via Wallet" : "Listing Boost via Wallet"}
                </h3>
                <p className="text-sm text-slate-600">No need to comot from marketplace—pay sharp sharp from your balance.</p>
              </div>
              <button
                type="button"
                onClick={() => !isWalletActionLoading && setWalletModalOpen(false)}
                className="rounded-full bg-slate-100 p-1.5 text-slate-500 hover:bg-slate-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs uppercase font-bold text-slate-500">Total Balance</p>
                <p className="text-lg font-bold text-slate-900">{formatKobo(walletTotal)}</p>
              </div>
              <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3">
                <p className="text-xs uppercase font-bold text-emerald-600">Available</p>
                <p className="text-lg font-bold text-emerald-700">{formatKobo(walletAvailable)}</p>
              </div>
              <div className="rounded-lg border border-amber-100 bg-amber-50 p-3">
                <p className="text-xs uppercase font-bold text-amber-600">Held (Escrow)</p>
                <p className="text-lg font-bold text-amber-700">{formatKobo(walletHeld)}</p>
              </div>
            </div>

            <div className="mt-6 rounded-lg border border-blue-100 bg-blue-50 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-blue-900">Total to Charge:</p>
                <p className="text-lg font-black text-blue-900">{formatKobo(actionCostKobo)}</p>
              </div>
              {!hasEnoughWalletForAction && (
                <p className="mt-2 text-xs font-bold text-red-700 flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Abeg fund your wallet—balance no reach.
                </p>
              )}
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
              <Link href="/wallet" className="text-sm font-bold text-slate-500 hover:text-slate-800 underline underline-offset-4">
                Manage My Wallet
              </Link>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setWalletModalOpen(false)}
                  className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={executeWalletAction}
                  disabled={isWalletActionLoading || isWalletLoading || !hasEnoughWalletForAction || !isBoostActionReady}
                  className="rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 shadow-md disabled:cursor-not-allowed disabled:opacity-50 transition-all active:scale-95"
                >
                  {isWalletActionLoading ? "Processing..." : actionCtaLabel}
                </button>
              </div>
            </div>

            <div className="mt-8 border-t border-slate-100 pt-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Recent Wallet Gists</h4>
              {isWalletLoading ? (
                <div className="flex items-center justify-center p-8 space-x-2">
                  <div className="h-2 w-2 bg-slate-300 rounded-full animate-bounce" />
                  <div className="h-2 w-2 bg-slate-300 rounded-full animate-bounce [animation-delay:-.15s]" />
                  <div className="h-2 w-2 bg-slate-300 rounded-full animate-bounce [animation-delay:-.3s]" />
                </div>
              ) : walletEntries.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-400 italic">No activity yet—wallet is clean!</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                  {walletEntries.map((entry) => {
                    const effect = Number(entry.walletEffect || 0);
                    return (
                      <div key={entry._id || entry.reference} className="flex items-center justify-between rounded-md bg-slate-50 p-2.5">
                        <div>
                          <p className="text-xs font-bold text-slate-800 truncate max-w-[180px]">
                            {entry.entryKind?.replace(/_/g, " ").toUpperCase() || "TRANSACTION"}
                          </p>
                          <p className="text-[10px] text-slate-500">{new Date(entry.date || Date.now()).toLocaleDateString("en-NG")}</p>
                        </div>
                        <p className={`text-xs font-black ${effect >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                          {effect >= 0 ? "+" : ""}{formatKobo(effect)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showBoostSuccessModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-xs scale-in rounded-2xl border border-emerald-200 bg-white p-8 text-center shadow-2xl">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-lg font-black text-emerald-900">Boost Activated!</p>
            <p className="mt-2 text-sm font-medium text-slate-600">Your item is now trending on the front page.</p>
          </div>
        </div>
      )}
    </div>
  );
}
