// frontend/src/components/Header.tsx
"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";

type HeaderLink = {
  href: string;
  label: string;
};

interface HeaderProps {
  title: string;
  subtitle?: string;
  isLoggedIn?: boolean; // Optional, for pages needing logout
  onLogout?: () => void; // Optional, for logout action
  compact?: boolean;
  links?: HeaderLink[];
  extraLinks?: HeaderLink[];
  includeDefaultLinks?: boolean;
  includeProfileLink?: boolean;
  loginHref?: string;
  rightActions?: ReactNode;
  secondaryLink?: {
    href: string;
    label: string;
  };
}

export default function Header({
  title,
  subtitle,
  isLoggedIn,
  onLogout,
  compact = false,
  links,
  extraLinks = [],
  includeDefaultLinks = true,
  includeProfileLink = true,
  loginHref,
  rightActions,
  secondaryLink = { href: "/premium", label: "Premium" },
}: HeaderProps) {
  const auth = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const effectiveIsLoggedIn = isLoggedIn ?? auth.isLoggedIn;
  const myProfileHref = auth.userId ? `/users/${auth.userId}` : null;

  const baseLinks = [
    { href: "/", label: "Home" },
    { href: "/threads", label: "Threads" },
    { href: "/marketplace", label: "Marketplace" },
    { href: "/wallet", label: "Wallet" },
    { href: "/premium", label: "Premium" },
    { href: "/contests", label: "Contests" },
  ];

  const autoLinks = [
    ...(includeDefaultLinks ? baseLinks : []),
    ...(includeProfileLink && myProfileHref
      ? [{ href: myProfileHref, label: "My Profile" }]
      : []),
    ...(secondaryLink ? [secondaryLink] : []),
    ...extraLinks,
  ];

  const dedupedAutoLinks = autoLinks.filter(
    (link, index, all) =>
      index === all.findIndex((candidate) => candidate.href === link.href)
  );

  const navLinks = links ?? dedupedAutoLinks;

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
      return;
    }
    auth.logout("/login");
  };

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <div
      className={`bg-green-800 text-white shadow-md ${
        compact ? "rounded-lg px-3 py-3 md:px-4" : "rounded-t-lg p-4"
      }`}
    >
      <div className="flex items-start justify-between gap-3 md:items-center">
        <div className="min-w-0 flex-1 text-left">
          <h1
            className="break-words text-2xl font-bold md:text-3xl"
          >
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 text-sm text-green-100">
              {subtitle}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          className="inline-flex items-center justify-center rounded-md border border-green-600/70 bg-green-700/50 p-2 text-green-100 hover:bg-green-700 md:hidden"
          aria-expanded={mobileMenuOpen}
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
        >
          {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>

        <div className="hidden flex-wrap items-center justify-end gap-3 md:flex md:gap-4">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-green-100 hover:text-white font-medium text-sm"
            >
              {link.label}
            </Link>
          ))}
          {rightActions}
          {effectiveIsLoggedIn && (
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700 text-sm"
            >
              Logout
            </button>
          )}
          {!effectiveIsLoggedIn && loginHref && (
            <Link
              href={loginHref}
              className="bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 text-sm"
            >
              Login
            </Link>
          )}
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="mt-3 space-y-2 rounded-lg border border-green-700 bg-green-900/40 p-3 md:hidden">
          <div className="grid grid-cols-2 gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-md border border-green-700 bg-green-800/30 px-3 py-2 text-center text-sm font-medium text-green-100 hover:bg-green-700/60"
              >
                {link.label}
              </Link>
            ))}
          </div>
          {rightActions}
          <div className="pt-1">
            {effectiveIsLoggedIn ? (
              <button
                onClick={handleLogout}
                className="w-full rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Logout
              </button>
            ) : (
              loginHref && (
                <Link
                  href={loginHref}
                  className="block w-full rounded-lg bg-green-600 px-3 py-2 text-center text-sm font-medium text-white hover:bg-green-700"
                >
                  Login
                </Link>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}
