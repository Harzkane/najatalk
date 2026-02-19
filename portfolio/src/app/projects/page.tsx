// /app/projects/page.tsx
"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { ProjectCard } from "@/components/ProjectCard";
import { getAllProjects } from "@/data/projects";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ProjectsPage() {
  const allProjects = getAllProjects();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = ["All", "E-Commerce", "Fintech", "Social", "Mobile"];

  const filteredProjects =
    selectedCategory && selectedCategory !== "All"
      ? allProjects.filter((p) => p.category === selectedCategory)
      : allProjects;

  return (
    <main className="min-h-screen bg-white dark:bg-gray-900 pt-20 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <Link
            href="/"
            className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-6 font-medium"
          >
            <ArrowLeft size={18} className="mr-2" />
            Back to Home
          </Link>

          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-4">
            My Projects
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl">
            Explore a comprehensive collection of production-ready applications
            across different domains and technologies.
          </p>
        </motion.div>

        {/* Category Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap gap-3 mb-12"
        >
          {categories.map((category) => (
            <button
              key={category}
              onClick={() =>
                setSelectedCategory(category === "All" ? null : category)
              }
              className={`px-6 py-2 rounded-full font-medium transition-all duration-300 ${
                (selectedCategory === null && category === "All") ||
                selectedCategory === category
                  ? "bg-blue-600 text-white shadow-lg"
                  : "bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700"
              }`}
            >
              {category}
            </button>
          ))}
        </motion.div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProjects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <ProjectCard project={project} index={index} />
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {filteredProjects.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              No projects found in this category.
            </p>
          </motion.div>
        )}

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-8 text-center">
            <p className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">
              {allProjects.length}+
            </p>
            <p className="text-gray-600 dark:text-gray-400">Projects Built</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-8 text-center">
            <p className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-2">
              5+
            </p>
            <p className="text-gray-600 dark:text-gray-400">Technologies</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-8 text-center">
            <p className="text-4xl font-bold text-green-600 dark:text-green-400 mb-2">
              100%
            </p>
            <p className="text-gray-600 dark:text-gray-400">Satisfaction</p>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
