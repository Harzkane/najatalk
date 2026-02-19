// components/TechStack.tsx
"use client";
import React from "react";
import { motion } from "framer-motion";
import {
  Code2,
  Server,
  Smartphone,
  CreditCard,
  Wrench,
  Lightbulb,
} from "lucide-react";

export const TechStack: React.FC = () => {
  const techCategories = [
    {
      title: "Frontend",
      icon: Code2,
      color: "from-blue-500 to-cyan-500",
      technologies: [
        "React",
        "Next.js 15",
        "Vue.js 3",
        "TypeScript",
        "Tailwind CSS",
        "SCSS",
      ],
    },
    {
      title: "Backend",
      icon: Server,
      color: "from-purple-500 to-pink-500",
      technologies: [
        "Node.js",
        "Express.js",
        "MongoDB",
        "PostgreSQL",
        "Firebase",
        "REST APIs",
      ],
    },
    {
      title: "Mobile",
      icon: Smartphone,
      color: "from-green-500 to-emerald-500",
      technologies: ["React Native", "SwiftUI", "iOS Development"],
    },
    {
      title: "Payment & Fintech",
      icon: CreditCard,
      color: "from-orange-500 to-red-500",
      technologies: [
        "Paystack",
        "Flutterwave",
        "Orange Money",
        "PayDunya",
        "Escrow Systems",
      ],
    },
    {
      title: "Tools & DevOps",
      icon: Wrench,
      color: "from-indigo-500 to-purple-500",
      technologies: [
        "Git",
        "GitHub",
        "Vercel",
        "Netlify",
        "Postman",
        "Turborepo",
      ],
    },
  ];

  const learningTechs = ["Go", "Advanced System Design", "Cloud Architecture"];

  return (
    <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-100 overflow-hidden">
      {/* Decorative background blobs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-100 dark:bg-blue-900/20 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-10 -z-10"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-100 dark:bg-purple-900/20 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-10 -z-10"></div>

      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          {/* Accent line */}
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="h-1 w-20 bg-gradient-to-r from-blue-600 to-purple-600 mx-auto mb-6"
          ></motion.div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white dark:text-gray-600 mb-4">
            Tech Stack
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Modern technologies I use to build scalable, high-performance
            applications
          </p>
        </motion.div>

        {/* Tech Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {techCategories.map((category, categoryIndex) => {
            const IconComponent = category.icon;
            return (
              <motion.div
                key={category.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: categoryIndex * 0.1, duration: 0.5 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300"
              >
                {/* Category Header with Icon */}
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={`p-3 rounded-lg bg-gradient-to-br ${category.color}`}
                  >
                    <IconComponent size={24} className="text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {category.title}
                  </h3>
                </div>

                {/* Technologies */}
                <div className="flex flex-wrap gap-2">
                  {category.technologies.map((tech, techIndex) => (
                    <motion.span
                      key={tech}
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{
                        delay: categoryIndex * 0.1 + techIndex * 0.05,
                        duration: 0.3,
                      }}
                      whileHover={{ scale: 1.1, y: -2 }}
                      className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-lg text-sm font-medium hover:bg-blue-200 dark:hover:bg-blue-800 transition-all duration-200 cursor-default shadow-sm"
                    >
                      {tech}
                    </motion.span>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Currently Learning Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="max-w-2xl mx-auto"
        >
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="p-3 rounded-lg bg-amber-100 dark:bg-amber-900 flex-shrink-0"
              >
                <Lightbulb
                  className="text-amber-600 dark:text-amber-300"
                  size={24}
                />
              </motion.div>
              <div>
                <h4 className="text-lg font-bold text-white dark:text-gray-600 mb-3">
                  Currently Learning
                </h4>
                <div className="flex flex-wrap gap-2">
                  {learningTechs.map((tech, index) => (
                    <motion.span
                      key={tech}
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{
                        delay: 0.5 + index * 0.1,
                        duration: 0.3,
                      }}
                      whileHover={{ scale: 1.05 }}
                      className="px-3 py-1.5 bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 rounded-lg text-sm font-medium hover:bg-amber-300 dark:hover:bg-amber-700 transition-all duration-200"
                    >
                      {tech}
                    </motion.span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
