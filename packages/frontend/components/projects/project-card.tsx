"use client";

import type { Project } from "@/types/schema";
import { SkillBadge } from "@/components/ui";
import { ProjectCardImage } from "./project-card-image";

interface ProjectCardProps {
  project: Project;
  variant?: "public" | "manager";
  onClick?: () => void;
  className?: string;
}

export function ProjectCard({
  project,
  variant = "public",
  onClick,
  className = "",
}: ProjectCardProps) {
  const { id, name, desc, status, isFeatured, skills } = project;
  const displayedSkills = skills.slice(0, 5);
  const overflowCount = skills.length - displayedSkills.length;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={name}
      className={`w-full min-w-[280px] max-w-[480px] text-left border border-neutral-700 p-4 space-y-2 hover:border-cyan-400 focus:border-cyan-400 focus:outline-none transition-colors duration-150 font-mono cursor-pointer ${className}`}
    >
      {variant === "manager" && (
        <div className="flex items-center justify-between">
          <span
            className={`text-xs ${status === "published" ? "text-green-400" : "text-neutral-500"}`}
          >
            [{status}]
          </span>
          {isFeatured && (
            <span className="text-xs text-cyan-400">★ featured</span>
          )}
        </div>
      )}

      <ProjectCardImage projectId={id} projectName={name} />

      <h3 className="text-neutral-300 text-sm">
        <span className="text-neutral-500">&gt;</span> {name}
      </h3>

      <div className="min-h-[2lh]">
        {desc && (
          <p className="text-neutral-500 text-xs line-clamp-2">{desc}</p>
        )}
      </div>

      <div className="flex flex-wrap gap-1">
        {displayedSkills.map((skill) => (
          <SkillBadge key={skill} name={skill} />
        ))}
        {overflowCount > 0 && (
          <span className="text-xs text-neutral-600">+{overflowCount}</span>
        )}
      </div>
    </button>
  );
}
