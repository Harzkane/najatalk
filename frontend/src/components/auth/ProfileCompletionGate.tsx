"use client";

import { ReactNode, useEffect } from "react";
import axios from "axios";
import { usePathname, useRouter } from "next/navigation";

const EXEMPT_PATHS = ["/login", "/signup", "/appeal", "/onboarding/profile"];

export default function ProfileCompletionGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) return;

    if (!pathname) return;

    if (
      EXEMPT_PATHS.some((route) => pathname === route || pathname.startsWith(`${route}/`)) ||
      pathname.startsWith("/verify/")
    ) {
      return;
    }

    const checkProfile = async () => {
      try {
        const res = await axios.get("/api/users/me/profile-completeness", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.data?.profileCompleted) {
          router.replace("/onboarding/profile");
        }
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("userId");
          router.replace("/login");
        }
      }
    };

    checkProfile();
  }, [pathname, router]);

  return <>{children}</>;
}
