// /app/about/page.tsx
"use client";
import React from "react";
import { motion } from "framer-motion";
import { Award, Briefcase, Code2, Target, Users, Zap } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function AboutPage() {
  const skills = [
    {
      category: "Frontend",
      items: ["React", "Next.js", "Vue.js", "TypeScript", "Tailwind CSS"],
    },
    {
      category: "Backend",
      items: ["Node.js", "Express.js", "MongoDB", "PostgreSQL", "REST APIs"],
    },
    {
      category: "Mobile",
      items: ["React Native", "SwiftUI", "iOS Development"],
    },
    {
      category: "Payments",
      items: ["Paystack", "Flutterwave", "Orange Money", "Escrow Systems"],
    },
  ];

  const experience = [
    {
      title: "Full-Stack Developer",
      company: "Self-Employed",
      period: "2023 - Present",
      description:
        "Building scalable e-commerce platforms, fintech solutions, and community applications across Africa.",
    },
    {
      title: "iOS Developer",
      company: "Mobile Projects",
      period: "2024",
      description:
        "Developed native iOS applications with SwiftUI and Firebase integration.",
    },
  ];

  const values = [
    {
      icon: Zap,
      title: "Performance",
      description: "Building fast, responsive applications that scale.",
    },
    {
      icon: Users,
      title: "User-Centric",
      description: "Designing experiences that solve real problems.",
    },
    {
      icon: Code2,
      title: "Clean Code",
      description: "Writing maintainable, well-structured code.",
    },
    {
      icon: Target,
      title: "Results-Driven",
      description: "Focused on delivering measurable business value.",
    },
  ];

  return (
    <main className="min-h-screen bg-white dark:bg-gray-900 pt-20 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-20"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
                Hi, I&apos;m Haruna Kane
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                A full-stack developer from Nigeria, passionate about building
                scalable digital solutions that empower businesses and
                communities across Africa.
              </p>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
                With expertise in e-commerce platforms, fintech solutions, and
                mobile applications, I specialize in turning complex ideas into
                elegant, production-ready systems.
              </p>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button href="/contact" size="lg">
                  Let&apos;s Work Together
                </Button>
              </motion.div>
            </div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-2 gap-6"
            >
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6">
                <p className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                  7+
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  Projects Completed
                </p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-6">
                <p className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                  2+
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  Years Experience
                </p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6">
                <p className="text-4xl font-bold text-green-600 dark:text-green-400 mb-2">
                  50+
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  API Endpoints Built
                </p>
              </div>
              <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-6">
                <p className="text-4xl font-bold text-orange-600 dark:text-orange-400 mb-2">
                  100%
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  Client Satisfaction
                </p>
              </div>
            </motion.div>
          </div>
        </motion.section>

        {/* Core Values */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-20"
        >
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-12 text-center">
            My Core Values
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => {
              const IconComponent = value.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 hover:shadow-lg transition-shadow"
                >
                  <IconComponent
                    className="text-blue-600 dark:text-blue-400 mb-4"
                    size={32}
                  />
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                    {value.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {value.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </motion.section>

        {/* Experience */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-20"
        >
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-12 text-center">
            Professional Experience
          </h2>
          <div className="space-y-8">
            {experience.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-gray-50 dark:bg-gray-800 rounded-xl p-8 border-l-4 border-blue-600"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {item.title}
                    </h3>
                    <p className="text-blue-600 dark:text-blue-400 font-medium">
                      {item.company}
                    </p>
                  </div>
                  <span className="px-4 py-2 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-full text-sm font-medium">
                    {item.period}
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-300">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Skills */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-20"
        >
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-12 text-center">
            Technical Skills
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {skills.map((skillGroup, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6"
              >
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Code2 size={20} className="text-blue-600" />
                  {skillGroup.category}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {skillGroup.items.map((skill) => (
                    <span
                      key={skill}
                      className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-lg text-sm font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* CTA */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12"
        >
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Build Something Amazing?
          </h2>
          <p className="text-blue-100 mb-8 text-lg max-w-2xl mx-auto">
            Whether you need a scalable e-commerce platform, fintech solution,
            or mobile app, let&apos;s collaborate to create something
            exceptional.
          </p>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link
              href="/contact"
              className="inline-flex items-center px-8 py-3 bg-white text-blue-600 rounded-lg font-bold hover:bg-blue-50 transition-colors"
            >
              Get In Touch
            </Link>
          </motion.div>
        </motion.section>
      </div>
    </main>
  );
}
