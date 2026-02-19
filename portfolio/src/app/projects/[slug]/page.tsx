// /app/projects/[slug]/page.tsx
"use client";
import React from "react";
import { motion } from "framer-motion";
import { notFound, useParams } from "next/navigation";
import { getProjectBySlug, getAllProjects } from "@/data/projects";
import { ArrowLeft, ExternalLink, Github, Code2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function ProjectDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const project = getProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-white dark:bg-gray-900 pt-20 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Link
            href="/projects"
            className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-8 font-medium"
          >
            <ArrowLeft size={18} className="mr-2" />
            Back to Projects
          </Link>
        </motion.div>

        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          {/* Thumbnail */}
          {project.thumbnail && (
            <div className="relative h-96 rounded-2xl overflow-hidden mb-8 shadow-2xl">
              <Image
                src={project.thumbnail}
                alt={project.title}
                fill
                className="object-cover"
              />
            </div>
          )}

          {/* Title and Meta */}
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-4">
              <span className="px-4 py-2 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-full text-sm font-medium">
                {project.category}
              </span>
              <span className="px-4 py-2 bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300 rounded-full text-sm font-medium">
                {project.status}
              </span>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-4">
              {project.title}
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              {project.shortDescription}
            </p>
          </div>

          {/* External Links */}
          {project.links && (
            <div className="flex flex-wrap gap-4 mb-12">
              {project.links.live && (
                <motion.a
                  href={project.links.live}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  <ExternalLink className="mr-2" size={18} />
                  View Live
                </motion.a>
              )}
              {project.links.github && (
                <motion.a
                  href={project.links.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-flex items-center px-6 py-3 bg-gray-800 hover:bg-gray-900 text-white rounded-lg font-medium transition-colors"
                >
                  <Github className="mr-2" size={18} />
                  Source Code
                </motion.a>
              )}
            </div>
          )}
        </motion.div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="md:col-span-2 space-y-8"
          >
            {/* Overview */}
            <section>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Overview
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                {project.longDescription || project.shortDescription}
              </p>
            </section>

            {/* Key Features */}
            {project.features && (
              <section>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  Key Features
                </h2>
                <ul className="space-y-3">
                  {project.features.map((feature, index) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + index * 0.05 }}
                      className="flex items-start gap-3 text-gray-600 dark:text-gray-300"
                    >
                      <span className="mt-1 w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></span>
                      {feature}
                    </motion.li>
                  ))}
                </ul>
              </section>
            )}

            {/* Challenges & Solutions */}
            {project.challenges && (
              <section>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  Challenges & Solutions
                </h2>
                <div className="space-y-4">
                  {project.challenges.map((challenge, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 + index * 0.05 }}
                      className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg"
                    >
                      <p className="text-gray-600 dark:text-gray-300">
                        {challenge}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

            {/* My Role */}
            {project.myRole && (
              <section>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  My Role
                </h2>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  {project.myRole}
                </p>
              </section>
            )}

            {/* Learnings */}
            {project.learnings && (
              <section>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  Key Learnings
                </h2>
                <ul className="space-y-3">
                  {project.learnings.map((learning, index) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + index * 0.05 }}
                      className="flex items-start gap-3 text-gray-600 dark:text-gray-300"
                    >
                      <span className="mt-1 w-2 h-2 bg-purple-600 rounded-full flex-shrink-0"></span>
                      {learning}
                    </motion.li>
                  ))}
                </ul>
              </section>
            )}
          </motion.div>

          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="space-y-6"
          >
            {/* Tech Stack */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Code2 size={20} />
                Tech Stack
              </h3>
              <div className="space-y-3">
                {Object.entries(project.techStack).map(([category, techs]) => (
                  <div key={category}>
                    <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2 capitalize">
                      {category}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {(techs as string[]).map((tech) => (
                        <span
                          key={tech}
                          className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Metrics */}
            {project.metrics && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                  Metrics
                </h3>
                <div className="space-y-3 text-sm">
                  {project.metrics.endpoints && (
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">
                        API Endpoints
                      </p>
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {project.metrics.endpoints}+
                      </p>
                    </div>
                  )}
                  {project.metrics.models && (
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">
                        Database Models
                      </p>
                      <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {project.metrics.models}+
                      </p>
                    </div>
                  )}
                  {project.metrics.components && (
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">
                        Components
                      </p>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {project.metrics.components}+
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Timeline */}
            {project.timeline && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
                <h3 className="text-sm font-bold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wider">
                  Timeline
                </h3>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {project.timeline}
                </p>
              </div>
            )}
          </motion.div>
        </div>

        {/* Related Projects */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-20 pt-12 border-t border-gray-200 dark:border-gray-800"
        >
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
            Related Projects
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {getAllProjects()
              .filter(
                (p) => p.category === project.category && p.id !== project.id
              )
              .slice(0, 3)
              .map((relatedProject, index) => (
                <motion.div
                  key={relatedProject.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                >
                  <Link
                    href={`/projects/${relatedProject.slug}`}
                    className="group block"
                  >
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 hover:shadow-lg transition-shadow">
                      <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-2">
                        {relatedProject.category}
                      </p>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {relatedProject.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                        {relatedProject.shortDescription}
                      </p>
                    </div>
                  </Link>
                </motion.div>
              ))}
          </div>
        </motion.section>
      </div>
    </main>
  );
}
