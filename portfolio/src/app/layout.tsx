import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Haruna Kane | Full-Stack Developer",
  description:
    "Full-Stack Developer specializing in e-commerce platforms, payment systems, and cross-platform applications. Expert in Node.js, React, Next.js, Vue.js, and MongoDB.",
  keywords: [
    "Full-Stack Developer",
    "Node.js",
    "React",
    "Next.js",
    "Vue.js",
    "E-Commerce",
    "Payment Integration",
    "Fintech",
  ],
  authors: [{ name: "Haruna Kane" }],
  openGraph: {
    title: "Haruna Kane | Full-Stack Developer",
    description: "Building scalable e-commerce platforms and payment systems",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={inter.className}>
        <Navbar />
        <main className="min-h-screen">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
