// /app/contact/page.tsx
"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Mail,
  Phone,
  MapPin,
  Send,
  Github,
  Linkedin,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const contactMethods = [
    {
      icon: Mail,
      label: "Email",
      value: "condewithharz@gmail.com",
      href: "mailto:condewithharz@gmail.com",
    },
    {
      icon: Phone,
      label: "Phone",
      value: "+234 (0) 810 7060 160",
      href: "tel:+2348107060160",
    },
    { icon: MapPin, label: "Location", value: "Ibadan, Nigeria", href: "#" },
  ];

  const socialLinks = [
    {
      icon: Github,
      label: "GitHub",
      href: "https://github.com/harzjunior",
      color: "hover:text-gray-900 dark:hover:text-white",
    },
    {
      icon: Linkedin,
      label: "LinkedIn",
      href: "https://linkedin.com/in/hbah",
      color: "hover:text-blue-600",
    },
    {
      icon: Mail,
      label: "Email",
      href: "mailto:condewithharz@gmail.com",
      color: "hover:text-red-600",
    },
  ];

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("https://formspree.io/f/mwprzbrw", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          subject: formData.subject,
          message: formData.message,
        }),
      });

      if (response.ok) {
        setSubmitted(true);
        setFormData({ name: "", email: "", subject: "", message: "" });

        // Reset success message after 5 seconds
        setTimeout(() => setSubmitted(false), 5000);
      } else {
        setError("Failed to send message. Please try again.");
      }
    } catch (err) {
      setError("An error occurred. Please try again later.");
      console.error("Form submission error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white dark:bg-gray-900 pt-20 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-4">
            Let&apos;s Connect
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Have a project in mind? Let&apos;s discuss how I can help bring your
            vision to life.
          </p>
        </motion.section>

        {/* Contact Methods */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16"
        >
          {contactMethods.map((method, index) => {
            const IconComponent = method.icon;
            return (
              <motion.a
                key={index}
                href={method.href}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                className="bg-gray-50 dark:bg-gray-800 rounded-xl p-8 text-center hover:shadow-lg transition-shadow"
              >
                <IconComponent
                  className="text-blue-600 dark:text-blue-400 mx-auto mb-4"
                  size={32}
                />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  {method.label}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {method.value}
                </p>
              </motion.a>
            );
          })}
        </motion.section>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-16">
          {/* Contact Form */}
          <motion.section
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
                Send Me a Message
              </h2>

              {submitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-12"
                >
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageSquare
                      className="text-green-600 dark:text-green-400"
                      size={32}
                    />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Message Sent!
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Thank you for reaching out. I&apos;ll get back to you as
                    soon as possible.
                  </p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg"
                    >
                      {error}
                    </motion.div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition"
                        placeholder="Your name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition"
                        placeholder="your.email@example.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Subject
                    </label>
                    <input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition"
                      placeholder="What's this about?"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Message
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={6}
                      className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition resize-none"
                      placeholder="Tell me about your project..."
                    />
                  </div>

                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Sending..." : <>Send Message</>}
                    {!loading && <Send size={18} />}
                  </motion.button>
                </form>
              )}
            </div>
          </motion.section>

          {/* Sidebar */}
          <motion.section
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-8"
          >
            {/* Social Links */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-8">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
                Connect With Me
              </h3>
              <div className="space-y-3">
                {socialLinks.map((social, index) => {
                  const IconComponent = social.icon;
                  return (
                    <motion.a
                      key={index}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ x: 5 }}
                      className={`flex items-center gap-3 text-gray-700 dark:text-gray-300 ${social.color} transition-colors`}
                    >
                      <IconComponent size={20} />
                      <span>{social.label}</span>
                    </motion.a>
                  );
                })}
              </div>
            </div>

            {/* Response Time */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/10 rounded-2xl p-8 border border-blue-200 dark:border-blue-800">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                Response Time
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                I typically respond within 24 hours
              </p>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Available for projects
                </span>
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-8">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Quick Links
              </h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/projects"
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                  >
                    View My Work
                  </Link>
                </li>
                <li>
                  <Link
                    href="/about"
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                  >
                    Learn About Me
                  </Link>
                </li>
                <li>
                  <a
                    href="/Haruna_Kane_Resume.pdf"
                    download="Haruna_Kane_Resume.pdf"
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                  >
                    Download Resume
                  </a>
                </li>
              </ul>
            </div>
          </motion.section>
        </div>
      </div>
    </main>
  );
}
