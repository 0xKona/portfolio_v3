"use client";

import useSWR from "swr";
import { getProject } from "@/lib/api";
import { useUrlId } from "@/lib/hooks/use-url-id";
import { BackLink } from "@/components/navigation/back-link";
import { ImageCarousel } from "@/components/projects/image-carousel";
import { SkillBadge } from "@/components/ui/skill-badge";
import { TerminalLoading } from "@/components/ui";
import type { Project } from "@/types/schema";

export function ProjectDetail() {
  const id = useUrlId("projects");

  const { data: project, error, isLoading } = useSWR<Project>(
    id ? `project-${id}` : null,
    () => getProject(id!),
  );

  if (isLoading || id === null) {
    return (
      <main className="min-h-screen flex items-center justify-center pt-20 pb-12">
        <TerminalLoading message="loading project..." />
      </main>
    );
  }

  if (error || !project) {
    return (
      <main className="min-h-screen pt-20 pb-12">
        <div className="mb-6">
          <BackLink href="/projects" label="back to projects" />
        </div>
        <div className="border border-red-900/50 bg-red-950/20 p-8 text-center">
          <p className="text-red-400 text-sm font-mono mb-2">
            project not found
          </p>
          <p className="text-neutral-500 text-xs font-mono">
            {error?.message ?? `could not load project "${id}"`}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen pt-20 pb-12">
      <div className="mb-6">
        <BackLink href="/projects" label="back to projects" />
      </div>

      {/* Header */}
      <header className="mb-8 border-b border-neutral-800 pb-6">
        <div className="flex items-center gap-3 mb-2">
          {project.isFeatured && (
            <span className="text-xs text-cyan-400 font-mono">★ featured</span>
          )}
          <span
            className={`text-xs font-mono ${
              project.status === "published"
                ? "text-green-400"
                : "text-neutral-500"
            }`}
          >
            [{project.status}]
          </span>
        </div>

        <h1 className="text-neutral-300 text-2xl font-mono mb-2">
          <span className="text-neutral-500">$</span> {project.name}
        </h1>

        {project.desc && (
          <p className="text-neutral-400 text-sm font-mono max-w-2xl">
            {project.desc}
          </p>
        )}
      </header>

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Image carousel */}
        <div className="lg:col-span-2">
          <ImageCarousel
            projectId={project.id}
            images={project.images ?? []}
            projectName={project.name}
          />
        </div>

        {/* Right: Sidebar */}
        <div className="space-y-6">
          {/* Technologies */}
          {project.skills.length > 0 && (
            <div className="border border-neutral-800 p-4">
              <h2 className="text-neutral-500 text-xs font-mono mb-3">
                technologies
              </h2>
              <div className="flex flex-wrap gap-2">
                {project.skills.map((skill) => (
                  <SkillBadge key={skill} name={skill} />
                ))}
              </div>
            </div>
          )}

          {/* Links */}
          {(project.githubUrl || project.demoUrl) && (
            <div className="border border-neutral-800 p-4">
              <h2 className="text-neutral-500 text-xs font-mono mb-3">
                links
              </h2>
              <div className="space-y-2">
                {project.githubUrl && (
                  <a
                    href={project.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm font-mono text-neutral-400 hover:text-cyan-400 transition-colors"
                  >
                    <span className="text-neutral-600">&gt;</span>
                    github
                  </a>
                )}
                {project.demoUrl && (
                  <a
                    href={project.demoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm font-mono text-neutral-400 hover:text-cyan-400 transition-colors"
                  >
                    <span className="text-neutral-600">&gt;</span>
                    live demo
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="border border-neutral-800 p-4">
            <h2 className="text-neutral-500 text-xs font-mono mb-3">
              metadata
            </h2>
            <div className="space-y-1 text-xs font-mono text-neutral-600">
              <p>
                created:{" "}
                {new Date(project.createdAt).toLocaleDateString("en-GB", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </p>
              <p>
                updated:{" "}
                {new Date(project.updatedAt).toLocaleDateString("en-GB", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
