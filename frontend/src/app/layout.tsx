// frontend/src/app/layout.tsx
import type { Metadata } from "next";
import type { CSSProperties } from "react";
import "./globals.css";
import PopupAdWrapper from "../components/home/PopupAdWrapper"; // New client component
import ProfileCompletionGate from "../components/auth/ProfileCompletionGate";
import { AuthProvider } from "../components/auth/AuthProvider";
import SiteFooter from "../components/SiteFooter";

export const metadata: Metadata = {
  title: {
    default: "NaijaTalk",
    template: "%s | NaijaTalk",
  },
  description:
    "NaijaTalk is a Nigerian-first public forum for news, jobs, japa plans, football, local life, and everyday gist.",
  openGraph: {
    title: "NaijaTalk",
    description:
      "Search conversations, scan hot categories, and follow what Nigerians are discussing right now.",
    siteName: "NaijaTalk",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "NaijaTalk",
    description:
      "Search conversations, scan hot categories, and follow what Nigerians are discussing right now.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/icon?family=Material+Icons+Outlined"
          rel="stylesheet"
        />
      </head>
      <body
        className="antialiased"
        style={
          {
            "--font-geist-sans":
              '"Avenir Next", "Segoe UI", "Helvetica Neue", Arial, sans-serif',
            "--font-geist-mono":
              '"SFMono-Regular", "Menlo", "Monaco", "Courier New", monospace',
          } as CSSProperties
        }
      >
        <AuthProvider>
          <ProfileCompletionGate>
            <PopupAdWrapper>
              <div className="flex min-h-screen flex-col">
                <div className="flex-1">{children}</div>
                <SiteFooter />
              </div>
            </PopupAdWrapper>
          </ProfileCompletionGate>
        </AuthProvider>
      </body>
    </html>
  );
}
