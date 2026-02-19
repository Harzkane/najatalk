// components/Navbar.tsx
"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/projects", label: "Projects" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  const mobileMenuVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 },
    },
    exit: {
      opacity: 0,
      y: -10,
      transition: { duration: 0.2 },
    },
  };

  const mobileMenuItemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: { delay: i * 0.05, duration: 0.3 },
    }),
  };

  return (
    <nav
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/90 dark:bg-gray-900/80 shadow-md"
          : "bg-white/70 dark:bg-gray-900/50"
      } backdrop-blur-xl border-b border-gray-200 dark:border-gray-800`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            whileHover={{ scale: 1.05 }}
          >
            <Link
              href="/"
              className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent hover:opacity-80 transition-opacity"
            >
              HK
            </Link>
          </motion.div>

          {/* Desktop Navigation */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="hidden md:flex items-center gap-2"
          >
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="relative group px-4 py-2"
              >
                <span
                  className={`text-sm font-medium transition-colors ${
                    isActive(link.href)
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400"
                  }`}
                >
                  {link.label}
                </span>

                {/* Animated underline */}
                <motion.div
                  layoutId={isActive(link.href) ? "activeNav" : undefined}
                  className={`absolute bottom-1 left-4 right-4 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full ${
                    isActive(link.href)
                      ? "opacity-100"
                      : "opacity-0 group-hover:opacity-50"
                  }`}
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              </Link>
            ))}
          </motion.div>

          {/* Desktop CTA Button */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="hidden md:block"
          >
            <motion.a
              href="/contact"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full font-semibold text-sm transition-all shadow-lg hover:shadow-blue-500/25 group"
            >
              Let&apos;s Talk
              <ArrowRight
                className="ml-2 group-hover:translate-x-1 transition-transform"
                size={16}
              />
            </motion.a>
          </motion.div>

          {/* Mobile Menu Button */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-900 dark:text-white"
            aria-label={isOpen ? "Close menu" : "Open menu"}
          >
            <motion.div
              animate={{ rotate: isOpen ? 90 : 0 }}
              transition={{ duration: 0.3 }}
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </motion.div>
          </motion.button>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              variants={mobileMenuVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="md:hidden pb-6 border-t border-gray-200 dark:border-gray-800"
            >
              <div className="space-y-2 pt-4">
                {navLinks.map((link, i) => (
                  <motion.div
                    key={link.href}
                    custom={i}
                    variants={mobileMenuItemVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <Link
                      href={link.href}
                      className={`block px-4 py-3 rounded-lg font-medium transition-all ${
                        isActive(link.href)
                          ? "bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                      }`}
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                ))}

                {/* Mobile CTA Button */}
                <motion.div
                  custom={navLinks.length}
                  variants={mobileMenuItemVariants}
                  initial="hidden"
                  animate="visible"
                  className="pt-4 border-t border-gray-200 dark:border-gray-800"
                >
                  <Link
                    href="/contact"
                    className="flex items-center justify-center px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-semibold transition-all shadow-lg hover:shadow-blue-500/25 group"
                  >
                    Let&apos;s Talk
                    <ArrowRight
                      className="ml-2 group-hover:translate-x-1 transition-transform"
                      size={16}
                    />
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
};
