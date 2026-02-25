import Link from "next/link";

type AuthPageHeaderLinksProps = {
  rightHref: string;
  rightLabel: string;
};

export default function AuthPageHeaderLinks({
  rightHref,
  rightLabel,
}: AuthPageHeaderLinksProps) {
  return (
    <div className="mb-4 flex items-center justify-between text-sm">
      <Link href="/" className="text-slate-600 hover:text-slate-900 hover:underline">
        Return to Home
      </Link>
      <Link href={rightHref} className="text-green-700 hover:text-green-800 hover:underline">
        {rightLabel}
      </Link>
    </div>
  );
}
