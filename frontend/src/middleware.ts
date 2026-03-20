import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const isProtectedPath = (pathname: string) => {
  if (/^\/(premium|admin)(\/|$)/.test(pathname)) return true;
  if (pathname === "/wallet") return true;
  if (pathname === "/marketplace/wallet") return true;
  if (/^\/users\/[^/]+\/wallet(\/|$)/.test(pathname)) return true;
  if (pathname === "/onboarding/profile") return true;
  return false;
};

const isPublicAuthPath = (pathname: string) =>
  /^\/(login|signup|verify|forgot-password|reset-password)(\/|$)/.test(pathname);

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const hasAuthCookie = req.cookies.get("nt_auth")?.value === "1";

  if (isProtectedPath(pathname) && !hasAuthCookie) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(`${pathname}${search || ""}`)}`;
    return NextResponse.redirect(url);
  }

  const isVerificationPath = pathname === "/verify" || pathname.startsWith("/verify/");
  if (isPublicAuthPath(pathname) && hasAuthCookie && !isVerificationPath) {
    const url = req.nextUrl.clone();
    url.pathname = "/marketplace";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
