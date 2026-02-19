// /app/privacy-policy/page.tsx
"use client";
import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-gray-900 pt-20 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link
            href="/"
            className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-8 font-medium"
          >
            <ArrowLeft size={18} className="mr-2" />
            Back to Home
          </Link>

          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-8">
            Privacy Policy
          </h1>

          <div className="prose prose-invert max-w-none text-gray-600 dark:text-gray-300 space-y-6">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                1. Introduction
              </h2>
              <p>
                This Privacy Policy explains how Haruna Kane (&quot;I&quot;, &quot;me&quot;, or
                &quot;my&quot;) collects, uses, discloses, and safeguards your information
                when you visit this website (the &quot;Site&quot;).
              </p>
              <p>
                Please read this Privacy Policy carefully. If you do not agree
                with my policies and practices, please do not use the Site.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                2. Information I Collect
              </h2>
              <p>
                <strong>Contact Form Information:</strong> When you submit the
                contact form, I collect your name, email address, subject, and
                message.
              </p>
              <p>
                <strong>Analytics Data:</strong> I may use analytics tools to
                understand how visitors interact with the Site. This may include
                your IP address, browser type, pages visited, and time spent on
                the Site.
              </p>
              <p>
                <strong>Cookies:</strong> The Site may use cookies and similar
                tracking technologies to track activity and hold certain
                information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                3. Use of Information
              </h2>
              <p>
                I use the information I collect or receive for the following
                purposes:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  To respond to your inquiries and provide customer service
                </li>
                <li>
                  To generate a personal profile for you to make future visits
                  to the Site easier
                </li>
                <li>To increase the efficiency and operation of the Site</li>
                <li>
                  To monitor and analyze usage and trends to improve your
                  experience
                </li>
                <li>To notify you about changes to the Site</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                4. Disclosure of Information
              </h2>
              <p>
                I do not sell, trade, or rent your personal information to third
                parties. However, I may disclose information when required by
                law or when necessary to protect my rights or the safety of
                others.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                5. Security of Information
              </h2>
              <p>
                I use administrative, technical, and physical security measures
                to protect your personal information. However, no method of
                transmission over the Internet or electronic storage is
                completely secure.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                6. Third-Party Links
              </h2>
              <p>
                The Site may contain links to third-party websites. I am not
                responsible for the privacy practices of these external sites.
                Please review their privacy policies before providing any
                personal information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                7. Contact Me
              </h2>
              <p>
                If you have questions or concerns about this Privacy Policy,
                please contact me at:
              </p>
              <ul className="list-none space-y-2 ml-4">
                <li>Email: condewithharz@gmail.com</li>
                <li>Location: Ibadan, Nigeria</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                8. Changes to This Privacy Policy
              </h2>
              <p>
                I may update this Privacy Policy from time to time. I will
                notify you of any changes by posting the new Privacy Policy on
                the Site.
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Last Updated: October 2025
              </p>
            </section>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
