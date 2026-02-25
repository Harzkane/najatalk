// frontend/src/components/Header.tsx
"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
  const router = useRouter();
  const [myProfileHref, setMyProfileHref] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");
    if (token && userId) {
      setMyProfileHref(`/users/${userId}`);
      return;
    }
    setMyProfileHref(null);
  }, []);

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
    if (onLogout) onLogout();
    else {
      localStorage.removeItem("token");
      router.push("/login");
    }
  };

  return (
    <div
      className={`bg-green-800 text-white shadow-md ${
        compact ? "rounded-lg px-4 py-3" : "rounded-t-lg p-4"
      }`}
    >
      <div className="flex flex-col gap-3 md:flex-row md:justify-between md:items-center">
        <div className="text-center md:text-left">
          <h1
            className="font-bold break-words text-2xl md:text-3xl"
          >
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 text-sm text-green-100">
              {subtitle}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-center md:justify-end gap-3 md:gap-4">
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
          {isLoggedIn && (
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700 text-sm"
            >
              Logout
            </button>
          )}
          {!isLoggedIn && loginHref && (
            <Link
              href={loginHref}
              className="bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 text-sm"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
