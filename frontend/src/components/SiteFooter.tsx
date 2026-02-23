import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white/90">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-5 text-sm text-slate-600 md:flex-row md:items-center md:justify-between">
        <p>© {new Date().getFullYear()} NaijaTalk. Community-first forum for real conversations.</p>
        <nav className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <Link href="/terms" className="transition hover:text-slate-900">
            Terms of Service
          </Link>
          <Link href="/privacy" className="transition hover:text-slate-900">
            Privacy Policy
          </Link>
          <Link href="/moderation" className="transition hover:text-slate-900">
            Moderation & Appeals
          </Link>
          <Link href="/contests/terms" className="transition hover:text-slate-900">
            Contest Terms
          </Link>
          <Link href="/contests/policy" className="transition hover:text-slate-900">
            Contest Policy
          </Link>
        </nav>
      </div>
    </footer>
  );
}
