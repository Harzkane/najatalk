import Link from "next/link";
import TrustBadge from "./TrustBadge";

const statusClass = (status) => {
  if (status === "active") return "bg-emerald-100 text-emerald-700";
  if (status === "pending") return "bg-amber-100 text-amber-700";
  if (status === "sold") return "bg-slate-200 text-slate-700";
  return "bg-slate-100 text-slate-600";
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

const maskEmail = (email = "") => {
  const [local = "", domain = ""] = String(email).split("@");
  if (!local || !domain) return "seller";
  if (local.length <= 2) return `${local[0] || "*"}***@${domain}`;
  return `${local.slice(0, 2)}***@${domain}`;
};

const formatBoostDate = (date) =>
  new Intl.DateTimeFormat("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);

export default function ListingCard({
  listing,
  currentUserId = null,
  isLoggedIn = false,
  isSaved = false,
  onToggleFavorite,
  onBuy,
  onEdit,
  onDelete,
  onRelease,
  onShip,
  onBoost,
  getImageSrc = (url) => url,
  formatDate = (value) => value,
  showSeller = true,
  showActions = true,
  showSave = true,
}) {
  const listingUserId = toId(listing?.userId);
  const buyerId = toId(listing?.buyerId);

  const isOwner = Boolean(currentUserId && listingUserId === currentUserId);
  const isBuyerPending =
    listing?.status === "pending" &&
    Boolean(currentUserId && buyerId === currentUserId);
  const isSellerPending =
    listing?.status === "pending" &&
    Boolean(currentUserId && isOwner);
  const canSellerShip = isSellerPending && listing?.fulfillmentStatus !== "shipped";
  const boostExpiry = listing?.boostExpiresAt ? new Date(listing.boostExpiresAt) : null;
  const isBoosted = Boolean(
    boostExpiry && Number.isFinite(boostExpiry.getTime()) && boostExpiry > new Date()
  );
  const boostLevel = Number(listing?.boostLevel || 0);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
        {listing.imageUrls?.length > 0 ? (
          <img
            src={getImageSrc(listing.imageUrls[0])}
            alt={listing.title}
            className="h-44 w-full object-cover"
          />
        ) : (
          <div className="flex h-44 items-center justify-center text-sm text-slate-400">
            No image
          </div>
        )}
      </div>

      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <Link
            href={`/marketplace/${listing._id}`}
            className="text-base font-semibold text-slate-900 hover:text-green-700"
          >
            {listing.title}
          </Link>
          <p className="text-xs text-slate-500">{listing.category}</p>
        </div>
        <span
          className={`rounded-full px-2 py-1 text-xs font-semibold ${statusClass(
            listing.status
          )}`}
        >
          {listing.status?.[0]?.toUpperCase() + listing.status?.slice(1)}
        </span>
      </div>

      {isBoosted && (
        <div className="mb-2 flex flex-wrap items-center gap-1 text-[11px]">
          <span className="inline-flex rounded bg-amber-100 px-2 py-0.5 font-semibold text-amber-700">
            Boosted
          </span>
          {isOwner && (
            <>
              <span className="rounded bg-slate-100 px-2 py-0.5 text-slate-600">
                Level {Math.max(1, boostLevel)}
              </span>
              <span className="text-slate-500">
                till {formatBoostDate(boostExpiry)}
              </span>
            </>
          )}
        </div>
      )}

      <p className="mb-3 line-clamp-2 text-sm text-slate-600">{listing.description}</p>
      <p className="mb-2 text-xl font-bold text-slate-900">
        ₦{((listing.price || 0) / 100).toLocaleString()}
      </p>

      <div className="mb-3 space-y-1 text-xs text-slate-500">
        {showSeller && (
          <p>
            Seller:{" "}
            {listingUserId ? (
              <Link
                href={`/users/${listingUserId}`}
                className="font-medium text-slate-700 hover:text-slate-900"
              >
                {listing.userId?.username || maskEmail(listing.userId?.email)}
              </Link>
            ) : (
              <span className="font-medium text-slate-700">Seller</span>
            )}
            {listing.userId?.flair && (
              <span className="ml-1 rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700">
                {listing.userId.flair}
              </span>
            )}
          </p>
        )}

        {showSeller && <TrustBadge sellerStats={listing.sellerStats} />}
        <p>Protected by escrow</p>
        {listing?.status === "pending" && (
          <p>
            Order stage: {listing?.fulfillmentStatus === "shipped" ? "Shipped" : "Awaiting seller"}
          </p>
        )}
        {isSellerPending && (
          <p className="rounded bg-amber-50 px-2 py-1 text-amber-700">
            {listing?.fulfillmentStatus === "shipped"
              ? "Buyer payment secured. Waiting for buyer delivery confirmation."
              : "Buyer payment secured. Mark as shipped once item is dispatched."}
          </p>
        )}
        {isBuyerPending && (
          <p className="rounded bg-emerald-50 px-2 py-1 text-emerald-700">
            Payment is in escrow. Confirm delivery once item reaches you.
          </p>
        )}
        {listing?.status === "sold" && (
          <p className="rounded bg-slate-100 px-2 py-1 text-slate-700">
            Order completed.
          </p>
        )}
        <p>Updated {formatDate(listing.updatedAt)}</p>
      </div>

      {showActions && (
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/marketplace/${listing._id}`}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            View
          </Link>

          {isLoggedIn && showSave && typeof onToggleFavorite === "function" && (
            <button
              onClick={() => onToggleFavorite(listing._id)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                isSaved
                  ? "bg-slate-800 text-white hover:bg-slate-900"
                  : "border border-slate-300 text-slate-700 hover:bg-slate-50"
              }`}
            >
              {isSaved ? "Saved" : "Save"}
            </button>
          )}

          {listing.status === "active" && isLoggedIn && !isOwner && typeof onBuy === "function" && (
            <button
              onClick={() => onBuy(listing._id)}
              className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700"
            >
              Buy Now
            </button>
          )}

          {listing.status === "active" &&
            isLoggedIn &&
            isOwner &&
            typeof onEdit === "function" &&
            typeof onDelete === "function" && (
              <>
                {typeof onBoost === "function" && (
                  <button
                    onClick={() => onBoost(listing._id)}
                    className="rounded-md bg-amber-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-600"
                  >
                    Boost
                  </button>
                )}
                <button
                  onClick={() => onEdit(listing)}
                  className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete(listing._id)}
                  className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
                >
                  Delete
                </button>
              </>
            )}

          {isBuyerPending && typeof onRelease === "function" && (
            <button
              onClick={() => onRelease(listing._id)}
              className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
            >
              Confirm Delivery
            </button>
          )}

          {canSellerShip && typeof onShip === "function" && (
            <button
              onClick={() => onShip(listing._id)}
              className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
            >
              Mark Shipped
            </button>
          )}

          {isSellerPending && (
            <span className="rounded-md border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700">
              Awaiting Buyer Confirmation
            </span>
          )}
        </div>
      )}
    </div>
  );
}
