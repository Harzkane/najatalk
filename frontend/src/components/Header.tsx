// frontend/src/components/Header.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface HeaderProps {
  title: string;
  isLoggedIn?: boolean; // Optional, for pages needing logout
  onLogout?: () => void; // Optional, for logout action
  compact?: boolean;
  secondaryLink?: {
    href: string;
    label: string;
  };
}

export default function Header({
  title,
  isLoggedIn,
  onLogout,
  compact = false,
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

  const linksWithProfile = myProfileHref
    ? [...baseLinks, { href: myProfileHref, label: "My Profile" }]
    : baseLinks;

  const navLinks = secondaryLink
    ? [...linksWithProfile, secondaryLink].filter(
        (link, index, all) =>
          index === all.findIndex((candidate) => candidate.href === link.href)
      )
    : linksWithProfile;

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
        <h1
          className={`font-bold text-center md:text-left break-words ${
            compact ? "text-xl md:text-2xl" : "text-2xl md:text-3xl"
          }`}
        >
          {title}
        </h1>
        <div className="flex flex-wrap items-center justify-center md:justify-end gap-3 md:gap-4">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-green-100 hover:text-white font-medium ${
                compact ? "text-xs md:text-sm" : "text-sm"
              }`}
            >
              {link.label}
            </Link>
          ))}
          {isLoggedIn && (
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700 text-sm"
            >
              Logout
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
