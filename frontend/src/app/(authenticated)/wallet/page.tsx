"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function WalletHubRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");
    if (!token || !userId) {
      router.replace("/login");
      return;
    }
    router.replace(`/users/${userId}/wallet`);
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-100 p-6 flex items-center justify-center">
      <p className="text-slate-600 text-sm">Loading wallet hub...</p>
    </div>
  );
}
