// frontend/src/app/page.tsx
"use client"; // Add this for client-side logic

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    // Check if token exists in localStorage
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token); // True if token exists
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token"); // Clear token
    setIsLoggedIn(false);
    router.push("/login"); // Redirect to login
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-green-100">
      <h1 className="text-4xl font-bold text-green-800 mb-6">
        NaijaTalk—Di Buka Dey Open!
      </h1>
      {isLoggedIn ? (
        <div className="space-x-4">
          <p className="text-lg text-gray-700 mb-4">Welcome back, Oga!</p>
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      ) : (
        <div className="space-x-4">
          <Link href="/signup" className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700">
            Sign Up
          </Link>
          <Link href="/login" className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700">
            Login
          </Link>
        </div>
      )}
    </div>
  );
}