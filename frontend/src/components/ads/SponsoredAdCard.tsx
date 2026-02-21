"use client";

type Ad = {
  _id: string;
  brand: string;
  text: string;
  link: string;
};

type SponsoredAdCardProps = {
  ad: Ad;
  onClick: (adId: string) => void | Promise<void>;
  compact?: boolean;
  className?: string;
};

export default function SponsoredAdCard({
  ad,
  onClick,
  compact = false,
  className = "",
}: SponsoredAdCardProps) {
  return (
    <div
      className={`rounded-lg border border-slate-200 bg-white p-3 shadow-sm ${className}`}
    >
      <span className="mb-2 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
        Sponsored
      </span>
      <a
        href={ad.link}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => onClick(ad._id)}
        className="block text-slate-700 hover:text-slate-900"
      >
        <strong className="text-slate-900">{ad.brand}</strong>
        <p className={`${compact ? "text-xs" : "text-sm"} mt-1 leading-relaxed`}>
          {ad.text}
        </p>
      </a>
    </div>
  );
}
