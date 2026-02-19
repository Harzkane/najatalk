// components/Hero.tsx
"use client";

import React from "react";
import { Button } from "./ui/Button";
import { ArrowRight, Download } from "lucide-react";
import { motion } from "framer-motion";

export const Hero: React.FC = () => {
  return (
    <section className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 text-sm font-medium mb-6"
          >
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
            Available for opportunities
          </motion.div>

          {/* Main Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white mb-6"
          >
            <span className="text-gray-600 dark:text-gray-300 ">
              Hi, I&apos;m
            </span>
            <span className="text-blue-600 dark:text-blue-400">
              Haruna Kane
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-xl sm:text-2xl md:text-3xl text-gray-600 dark:text-gray-300 mb-8 max-w-4xl mx-auto"
          >
            Full-Stack Developer building scalable{" "}
            <span className="text-blue-600 dark:text-blue-400 font-semibold">
              e-commerce platforms
            </span>
            ,{" "}
            <span className="text-purple-600 dark:text-purple-400 font-semibold">
              payment systems
            </span>
            , and{" "}
            <span className="text-green-600 dark:text-green-400 font-semibold">
              cross-platform applications
            </span>
          </motion.p>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-lg text-gray-600 dark:text-gray-400 mb-12 max-w-2xl mx-auto"
          >
            Specialized in Node.js, React, Next.js, Vue.js, and MongoDB. I
            architect complete platforms from backend APIs to modern frontend
            interfaces, with expertise in payment integrations and fintech
            solutions.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Button href="/projects" size="lg" className="w-full sm:w-auto">
              View My Work
              <ArrowRight className="ml-2" size={20} />
            </Button>
            <motion.a
              href="/Haruna_Kane_Resume.pdf"
              download="Haruna_Kane_Resume.pdf"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center justify-center px-6 py-3 border-2 cursor-pointer border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg font-semibold text-base transition-all w-full sm:w-auto gap-2"
            >
              <Download size={20} />
              Download Resume
            </motion.a>
          </motion.div>

          {/* Tech Stack Preview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="mt-16"
          >
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 uppercase tracking-wider">
              Technologies I Work With
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              {[
                "Node.js",
                "React",
                "Next.js",
                "Vue.js",
                "TypeScript",
                "MongoDB",
                "Express",
                "Tailwind",
              ].map((tech) => (
                <span
                  key={tech}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-blue-100 dark:hover:bg-blue-900 hover:text-blue-600 dark:hover:text-blue-300 transition-colors"
                >
                  {tech}
                </span>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
      {/* Decorative Elements */}
      <div className="absolute top-1/4 left-0 w-72 h-72 bg-blue-200 dark:bg-blue-900 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-20 animate-blob"></div>
      <div className="absolute top-1/3 right-0 w-72 h-72 bg-purple-200 dark:bg-purple-900 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-20 animate-blob delay-2000"></div>
      <div className="absolute bottom-1/4 left-1/2 w-72 h-72 bg-green-200 dark:bg-green-900 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-20 animate-blob delay-4000"></div>{" "}
    </section>
  );
};
