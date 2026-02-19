// components/Footer.tsx
"use client";
import React from "react";
import { Github, Linkedin, Mail, ArrowRight, Heart } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    { icon: Github, href: "https://github.com/harzjunior", label: "GitHub" },
    {
      icon: Linkedin,
      href: "https://linkedin.com/in/hbah",
      label: "LinkedIn",
    },
    {
      icon: Mail,
      href: "mailto:mailto:condewithharz@gmail.com",
      label: "Email",
    },
  ];

  const quickLinks = [
    { href: "/", label: "Home" },
    { href: "/projects", label: "Projects" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
  ];

  const services = [
    "Full-Stack Development",
    "E-Commerce Solutions",
    "Payment Integration",
    "Mobile Apps",
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  return (
    <footer className="relative bg-gray-900 dark:bg-black text-gray-100 overflow-hidden">
      {/* Decorative gradient background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-600/10 rounded-full mix-blend-multiply filter blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full mix-blend-multiply filter blur-3xl"></div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12"
        >
          {/* Branding & CTA */}
          <motion.div variants={itemVariants} className="lg:col-span-1">
            <h3 className="text-2xl font-bold text-white mb-2">Haruna Kane</h3>
            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
              Full-Stack Developer crafting digital experiences that scale.
            </p>
            <motion.a
              href="/contact"
              whileHover={{ x: 5 }}
              className="inline-flex items-center text-blue-400 hover:text-blue-300 font-medium text-sm group"
            >
              Get in Touch
              <ArrowRight
                className="ml-2 group-hover:translate-x-1 transition-transform"
                size={16}
              />
            </motion.a>
          </motion.div>

          {/* Quick Links */}
          <motion.div variants={itemVariants}>
            <h4 className="text-lg font-bold text-white mb-6">Navigation</h4>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-blue-400 transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Services */}
          <motion.div variants={itemVariants}>
            <h4 className="text-lg font-bold text-white mb-6">Services</h4>
            <ul className="space-y-3">
              {services.map((service) => (
                <li key={service}>
                  <p className="text-gray-400 text-sm">{service}</p>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Social & Newsletter */}
          <motion.div variants={itemVariants}>
            <h4 className="text-lg font-bold text-white mb-6">Connect</h4>
            <div className="flex gap-3 mb-6">
              {socialLinks.map(({ icon: Icon, href, label }) => (
                <motion.a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.2, y: -3 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-3 rounded-lg bg-gray-800 hover:bg-blue-600 text-gray-300 hover:text-white transition-all duration-300"
                  aria-label={label}
                >
                  <Icon size={20} />
                </motion.a>
              ))}
            </div>
            <p className="text-gray-400 text-sm">
              Let&apos;s collaborate on something amazing.
            </p>
          </motion.div>
        </motion.div>

        {/* Divider */}
        <motion.div
          variants={itemVariants}
          className="my-12 h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent"
        ></motion.div>

        {/* Bottom Footer */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-gray-400"
        >
          <div className="flex items-center gap-1">
            <p>© {currentYear} Haruna Kane. Built with</p>
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Heart size={16} className="text-red-500 mx-1" />
            </motion.div>
            <p>and code.</p>
          </div>

          <div className="flex gap-6 text-xs">
            <Link
              href="/privacy-policy"
              className="hover:text-blue-400 transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="terms-of-service"
              className="hover:text-blue-400 transition-colors"
            >
              Terms of Service
            </Link>
            <Link href="#" className="hover:text-blue-400 transition-colors">
              Sitemap
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Back to top button */}
      <motion.button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        whileHover={{ scale: 1.1, y: -5 }}
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-8 right-8 p-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg transition-all duration-300 z-40"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <ArrowRight className="rotate-90" size={20} />
      </motion.button>
    </footer>
  );
};
