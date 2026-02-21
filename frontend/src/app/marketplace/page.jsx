"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import api from "@/utils/api";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ListingCard from "@/components/marketplace/ListingCard";
import ConfirmModal from "@/components/ConfirmModal";

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
      const res = await axios.get("/api/marketplace/listings", {
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
      const res = await axios.get("/api/marketplace/favorites", {
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
      const res = await axios.get("/api/marketplace/me/policy", {
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
      const res = await axios.get("/api/users/me/wallet-ledger", {
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
      const res = await axios.get("/api/marketplace/categories");
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

      const res = await axios({
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
      const res = await axios.post(
        `/api/marketplace/favorites/${listingId}`,
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
      const res = await axios.post(
        `/api/marketplace/buy/${pendingBuyListingId}`,
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
      const res = await axios.post(
        `/api/marketplace/ship/${id}`,
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
        const res = await axios.post(
          `/api/marketplace/listings/${selectedBoostListingId}/boost`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        showMessage(res.data.message || "Listing boosted.", "success");
        setWalletModalOpen(false);
        setShowBoostSuccessModal(true);
        setTimeout(() => setShowBoostSuccessModal(false), 1200);
      } else {
        const res = await axios.post(
          "/api/premium/subscribe-with-wallet",
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
                <Link href="/" className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50">
                  Home
                </Link>
                {isLoggedIn && currentUserId && (
                  <Link
                    href={`/users/${currentUserId}`}
                    className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    My Profile
                  </Link>
                )}
                {isLoggedIn && currentUserId && (
                  <Link
                    href="/wallet"
                    className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    My Wallet
                  </Link>
                )}
                {isAdmin && (
                  <Link
                    href="/marketplace/wallet"
                    className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
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
                      ? `${sellerPendingOrdersCount} waiting buyer confirmation`
                      : buyerPendingOrdersCount > 0
                        ? `${buyerPendingOrdersCount} awaiting your delivery confirmation`
                        : "Pending confirmations",
                },
                { key: "saved", label: "Saved", value: savedListingIds.length, sub: "Favorite items" },
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => setActiveView(item.key)}
                  className={`rounded-lg border p-3 text-left ${activeView === item.key
                    ? "border-green-300 bg-green-50"
                    : "border-slate-200 bg-white"
                    }`}
                >
                  <p className="text-xs uppercase tracking-wide text-slate-500">{item.label}</p>
                  <p className="text-lg font-semibold text-slate-900">{item.value}</p>
                  <p className="text-xs text-slate-600">{item.sub}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        {isLoggedIn && sellerPendingOrdersCount > 0 && activeView !== "orders" && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            You have {sellerPendingOrdersCount} pending order
            {sellerPendingOrdersCount === 1 ? "" : "s"} in escrow. Open the
            Orders tab to track delivery confirmation.
          </div>
        )
        }

        {
          message && (
            <div className={`mb-4 rounded-lg border p-3 text-sm ${messageClass}`}>
              <p>{message}</p>
              {isTierLimitMessage && (
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={handleUpgradeFromMarketplace}
                    className="inline-flex rounded-md bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700"
                  >
                    Upgrade to Premium
                  </button>
                </div>
              )}
            </div>
          )
        }

        {
          activeView === "sell" && isLoggedIn && (
            <div className="mb-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              {marketplacePolicy && (
                <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-500">Seller Policy</p>
                      <p className="text-sm font-semibold text-slate-900">
                        {marketplacePolicy.tier === "premium" ? "Premium Seller" : "Free Seller"}
                      </p>
                    </div>
                    <div className="text-right text-xs text-slate-600">
                      <p>Commission: {marketplacePolicy.commissionPercent}%</p>
                      <p>
                        Boost: {marketplacePolicy.boostCostLabel} / {marketplacePolicy.boostHours}h
                      </p>
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="mb-1 flex items-center justify-between text-xs text-slate-600">
                      <span>Active Listings</span>
                      <span>
                        {marketplacePolicy.activeListingCount}/{marketplacePolicy.activeListingLimit}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded bg-slate-200">
                      <div
                        className="h-full bg-emerald-500"
                        style={{ width: `${listingUsagePercent}%` }}
                      />
                    </div>
                  </div>
                  {marketplacePolicy.tier === "free" && (
                    <p className="mt-2 text-xs text-slate-600">
                      Premium sellers get higher listing limits and lower marketplace fees.
                    </p>
                  )}
                </div>
              )}
              <h2 className="mb-4 text-lg font-semibold text-slate-900">
                {editId ? "Edit Listing" : "Post New Listing"}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-3">
                <input
                  type="text"
                  placeholder="Item title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2 text-slate-800"
                  required
                />
                <textarea
                  placeholder="Describe item condition, accessories, and pickup details"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="h-24 w-full rounded-lg border border-slate-300 p-2 text-slate-800"
                  required
                />

                <div className="rounded-lg border border-slate-200 p-3">
                  <p className="mb-2 text-sm font-medium text-slate-700">Listing Images (up to 8)</p>
                  <div className="mb-2 flex flex-wrap gap-2">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="text-sm"
                    />
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
                      className="min-w-[220px] flex-1 rounded-md border border-slate-300 px-2 py-1 text-sm text-slate-800"
                    />
                    <button
                      type="button"
                      onClick={handleAddManualImage}
                      className="rounded-md border border-slate-300 px-3 py-1 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      Add URL
                    </button>
                  </div>
                  {isUploadingImages && (
                    <p className="mb-2 text-xs text-slate-500">Uploading images...</p>
                  )}
                  {imageUrls.length > 0 && (
                    <div className="grid grid-cols-4 gap-2 md:grid-cols-8">
                      {imageUrls.map((url, index) => (
                        <div key={`${url}-${index}`} className="relative overflow-hidden rounded border border-slate-200">
                          <img
                            src={getImageSrc(url)}
                            alt={`Listing ${index + 1}`}
                            className="h-16 w-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeImageAt(index)}
                            className="absolute right-1 top-1 rounded bg-black/60 px-1 text-[10px] text-white"
                          >
                            x
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <input
                    type="number"
                    placeholder="Price (₦)"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="rounded-lg border border-slate-300 p-2 text-slate-800"
                    min="1"
                    required
                  />
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="rounded-lg border border-slate-300 p-2 text-slate-800"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    className="rounded-lg bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700"
                  >
                    {editId ? "Save Changes" : "Publish Listing"}
                  </button>
                </div>
              </form>
            </div>
          )
        }

        {
          activeView === "sell" && !isLoggedIn && (
            <div className="mb-4 rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm">
              Login to create or edit listings.
              <Link href="/login" className="ml-1 font-semibold text-green-700 hover:underline">
                Go to login
              </Link>
            </div>
          )
        }

        <div className="mb-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-6">
            <input
              type="text"
              placeholder="Search title or description"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="rounded-lg border border-slate-300 p-2 text-sm text-slate-800 lg:col-span-2"
            />

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="rounded-lg border border-slate-300 p-2 text-sm text-slate-800"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="rounded-lg border border-slate-300 p-2 text-sm text-slate-800"
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status === "all" ? "All Status" : status[0].toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>

            <select
              value={selectedFlair}
              onChange={(e) => setSelectedFlair(e.target.value)}
              className="rounded-lg border border-slate-300 p-2 text-sm text-slate-800"
            >
              <option value="all">All Sellers</option>
              <option value="Verified G">Verified G</option>
              <option value="Oga at the Top">Oga at the Top</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-lg border border-slate-300 p-2 text-sm text-slate-800"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-4">
            <input
              type="number"
              placeholder="Min ₦"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="rounded-lg border border-slate-300 p-2 text-sm text-slate-800"
              min="0"
            />
            <input
              type="number"
              placeholder="Max ₦"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="rounded-lg border border-slate-300 p-2 text-sm text-slate-800"
              min="0"
            />
            <button
              onClick={resetFilters}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              Reset Filters
            </button>
            <p className="self-center text-sm text-slate-500">
              {filteredListings.length} result{filteredListings.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        {
          filteredListings.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
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
            <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-slate-600">
              No listings match this filter set. Try adjusting search, price, or status.
            </div>
          )
        }
      </div >

      <ConfirmModal
        open={Boolean(pendingDeleteListingId)}
        title="Delete Listing?"
        description="This action cannot be undone. The listing will be removed from the marketplace."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        danger
        onCancel={() => setPendingDeleteListingId(null)}
        onConfirm={async () => {
          if (!pendingDeleteListingId) return;
          const targetId = pendingDeleteListingId;
          setPendingDeleteListingId(null);
          await handleDelete(targetId);
        }}
      />
      {
        pendingBuyListingId && (
          <div className="fixed inset-0 z-[55] flex items-center justify-center bg-slate-900/50 p-4">
            <div className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-5 shadow-xl">
              <div className="mb-3">
                <h3 className="text-lg font-semibold text-slate-900">Delivery Details</h3>
                <p className="text-sm text-slate-600">
                  Only you and the seller can see this address after checkout.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
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
                  placeholder="Delivery note (landmark, preferred time)"
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
                    setPendingBuyListingId(null);
                    resetOrderDetails();
                  }}
                  className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSubmittingBuyOrder}
                  onClick={confirmBuyOrder}
                  className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmittingBuyOrder ? "Placing Order..." : "Place Order with Escrow"}
                </button>
              </div>
            </div>
          </div>
        )
      }

      <ConfirmModal
        open={Boolean(pendingBoostListingId)}
        title="Boost Listing?"
        description={`This will charge ${marketplacePolicy?.boostCostLabel || "your wallet"} and keep the listing boosted for ${marketplacePolicy?.boostHours || 72}h.`}
        confirmLabel={isBoosting ? "Opening Wallet..." : "Continue to Wallet"}
        cancelLabel="Cancel"
        confirmDisabled={isBoosting}
        cancelDisabled={isBoosting}
        onCancel={() => {
          if (isBoosting) return;
          setPendingBoostListingId(null);
          setSelectedBoostListingId(null);
        }}
        onConfirm={confirmBoost}
      />

      {
        walletModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
            <div className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-5 shadow-xl">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    {walletModalContext === "premium" ? "Upgrade via Wallet" : "Boost via Wallet"}
                  </h3>
                  <p className="text-sm text-slate-600">
                    Stay on marketplace, pay from wallet, and watch activity update live.
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
                  Charge now: <span className="font-semibold">{formatKobo(actionCostKobo)}</span>
                </p>
                {!hasEnoughWalletForAction && (
                  <p className="mt-1 text-xs text-red-700">
                    Insufficient available balance. Fund your wallet and try again.
                  </p>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={executeWalletAction}
                    disabled={
                      isWalletActionLoading ||
                      isWalletLoading ||
                      !hasEnoughWalletForAction ||
                      !isBoostActionReady
                    }
                    className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isWalletActionLoading ? "Processing..." : actionCtaLabel}
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
                                  effect >= 0 ? "font-semibold text-emerald-700" : "font-semibold text-red-700"
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
            </div >
          </div >
        )
      }

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
