// components/FeaturedProjects.tsx
"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { ProjectCard } from "./ProjectCard";
import { Button } from "./ui/Button";
import { ArrowRight } from "lucide-react";
import { getFeaturedProjects } from "@/data/projects";

export const FeaturedProjects: React.FC = () => {
  const allProjects = getFeaturedProjects();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = ["E-Commerce", "Fintech", "Social", "Mobile"];

  const filteredProjects = selectedCategory
    ? allProjects.filter((p) => p.category === selectedCategory)
    : allProjects;

  return (
    <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Decorative background blobs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100 dark:bg-blue-900/20 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-10 -z-10"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-100 dark:bg-purple-900/20 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-10 -z-10"></div>

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

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Featured Projects
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            A showcase of production platforms I&apos;ve built - from e-commerce
            ecosystems to fintech solutions and community platforms.
          </p>
        </motion.div>

        {/* Category Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap justify-center gap-3 mb-12"
        >
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-6 py-2 rounded-full font-medium transition-all duration-300 ${
              selectedCategory === null
                ? "bg-blue-600 text-white shadow-lg"
                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
            }`}
          >
            All Projects
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-6 py-2 rounded-full font-medium transition-all duration-300 ${
                selectedCategory === category
                  ? "bg-blue-600 text-white shadow-lg"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
              }`}
            >
              {category}
            </button>
          ))}
        </motion.div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {filteredProjects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: index * 0.15, duration: 0.5 }}
            >
              <ProjectCard project={project} index={index} />
            </motion.div>
          ))}
        </div>

        {/* Empty state */}
        {filteredProjects.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              No projects found in this category.
            </p>
          </motion.div>
        )}

        {/* View All Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="text-center"
        >
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
            <Button href="/projects" size="lg" variant="outline">
              View All Projects
              <ArrowRight className="ml-2" size={20} />
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
