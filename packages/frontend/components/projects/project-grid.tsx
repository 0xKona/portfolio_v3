"use client";

import type { Project } from "@/types/schema";
import { ProjectCard } from "./project-card";
import { ProjectCardSkeleton } from "./project-card-skeleton";

interface ProjectGridProps {
  projects: Project[];
  variant?: "public" | "manager";
  isLoading?: boolean;
  skeletonCount?: number;
  onProjectClick?: (id: string) => void;
  className?: string;
}

export function ProjectGrid({
  projects,
  variant = "public",
  isLoading = false,
  skeletonCount = 6,
  onProjectClick,
  className = "",
}: ProjectGridProps) {
  if (isLoading) {
    return (
      <div
        className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-7xl mx-auto w-full ${className}`}
      >
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <ProjectCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className={`max-w-7xl mx-auto w-full font-mono ${className}`}>
        <p className="text-neutral-500 text-sm">
          <span className="text-neutral-300">$</span> ls projects/{" "}
          <span className="text-neutral-600">→</span> no projects found
        </p>
      </div>
    );
  }

  return (
    <div
      className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-7xl mx-auto w-full ${className}`}
    >
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          variant={variant}
          onClick={onProjectClick ? () => onProjectClick(project.id) : undefined}
        />
      ))}
    </div>
  );
}
