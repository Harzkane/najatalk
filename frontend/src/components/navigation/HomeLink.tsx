import Link from "next/link";
import { House } from "lucide-react";

type HomeLinkProps = {
  className?: string;
};

export default function HomeLink({ className = "" }: HomeLinkProps) {
  return (
    <Link
      href="/"
      className={`inline-flex items-center gap-2 rounded-md border border-green-300 bg-green-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-green-200 ${className}`.trim()}
    >
      <House size={16} aria-hidden="true" />
      <span>Home</span>
    </Link>
  );
}
