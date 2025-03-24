// frontend/src/components/Header.tsx
"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";

interface HeaderProps {
  title: string;
  isLoggedIn?: boolean; // Optional, for pages needing logout
  onLogout?: () => void; // Optional, for logout action
}

export default function Header({ title, isLoggedIn, onLogout }: HeaderProps) {
  const router = useRouter();

  const handleLogout = () => {
    if (onLogout) onLogout();
    else {
      localStorage.removeItem("token");
      router.push("/login");
    }
  };

  return (
    <div className="bg-green-800 text-white p-4 rounded-t-lg shadow-md">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{title}</h1>
        <div className="flex items-center space-x-4">
          <Link
            href="/"
            className="text-green-100 hover:text-white text-sm font-medium"
          >
            Home
          </Link>
          <Link
            href="/premium"
            className="text-green-100 hover:text-white text-sm font-medium"
          >
            Wallet
          </Link>
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
