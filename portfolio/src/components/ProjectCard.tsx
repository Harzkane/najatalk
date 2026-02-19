// components/ProjectCard.tsx
"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, ExternalLink } from "lucide-react";
import { Project } from "@/types/project";
import { Badge } from "./ui/Badge";

interface ProjectCardProps {
  project: Project;
  index?: number;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  index = 0,
}) => {
  const statusVariant = {
    Live: "success" as const,
    "In Development": "warning" as const,
    Demo: "info" as const,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="group relative bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300"
    >
      {/* Thumbnail */}
      <div className="relative h-64 overflow-hidden bg-gray-100 dark:bg-gray-700">
        {project.thumbnail ? (
          <Image
            src={project.thumbnail}
            alt={project.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <span className="text-6xl">
              {project.category === "E-Commerce"
                ? "🛒"
                : project.category === "Fintech"
                ? "💰"
                : project.category === "Social"
                ? "💬"
                : project.category === "Mobile"
                ? "📱"
                : "🔧"}
            </span>
          </div>
        )}

        {/* Status Badge */}
        <div className="absolute top-4 right-4">
          <Badge variant={statusVariant[project.status]}>
            {project.status}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Category */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
            {project.category}
          </span>
          {project.links?.live && (
            <a
              href={project.links.live}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink size={18} />
            </a>
          )}
        </div>

        {/* Title */}
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {project.title}
        </h3>

        {/* Description */}
        <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
          {project.shortDescription}
        </p>

        {/* Tech Stack */}
        <div className="flex flex-wrap gap-2 mb-4">
          {Object.values(project.techStack)
            .flat()
            .slice(0, 4)
            .map((tech) => (
              <span
                key={tech}
                className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded"
              >
                {tech}
              </span>
            ))}
          {Object.values(project.techStack).flat().length > 4 && (
            <span className="text-xs px-2 py-1 text-gray-500 dark:text-gray-400">
              +{Object.values(project.techStack).flat().length - 4} more
            </span>
          )}
        </div>

        {/* Metrics */}
        {project.metrics && (
          <div className="flex flex-wrap gap-4 mb-4 text-sm text-gray-600 dark:text-gray-400">
            {project.metrics.endpoints && (
              <span>{project.metrics.endpoints}+ Endpoints</span>
            )}
            {project.metrics.models && (
              <span>{project.metrics.models}+ Models</span>
            )}
            {project.metrics.components && (
              <span>{project.metrics.components}+ Components</span>
            )}
          </div>
        )}

        {/* View Details Link */}
        <Link
          href={`/projects/${project.slug}`}
          className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium group/link"
        >
          View Details
          <ArrowRight
            className="ml-2 group-hover/link:translate-x-1 transition-transform"
            size={16}
          />
        </Link>
      </div>
    </motion.div>
  );
};
