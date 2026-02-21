export default function TrustBadge({ sellerStats = {}, className = "" }) {
  const stats = {
    completedDeals: sellerStats?.completedDeals || 0,
    activeListings: sellerStats?.activeListings || 0,
    avgResponseHours:
      typeof sellerStats?.avgResponseHours === "number"
        ? sellerStats.avgResponseHours
        : null,
    trustTier: sellerStats?.trustTier || "New Seller",
  };

  return (
    <div className={`flex flex-wrap gap-1 text-xs ${className}`.trim()}>
      <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-emerald-700">
        {stats.trustTier}
      </span>
      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-700">
        {stats.completedDeals} deals
      </span>
      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-700">
        {stats.activeListings} active
      </span>
      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-700">
        {stats.avgResponseHours !== null
          ? `${stats.avgResponseHours}h avg`
          : "new seller"}
      </span>
    </div>
  );
}
