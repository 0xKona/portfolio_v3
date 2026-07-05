"use client";

import { useRouter } from "next/navigation";
import { useProjects } from "@/lib/hooks/use-projects";
import { ProjectGrid } from "@/components/projects/project-grid";
import { CONTENT } from "@/lib/constants/content";

const ASCII_TITLE = `███╗   ███╗██╗   ██╗    ██████╗ ██████╗  ██████╗      ██╗███████╗ ██████╗████████╗███████╗
████╗ ████║╚██╗ ██╔╝    ██╔══██╗██╔══██╗██╔═══██╗     ██║██╔════╝██╔════╝╚══██╔══╝██╔════╝
██╔████╔██║ ╚████╔╝     ██████╔╝██████╔╝██║   ██║     ██║█████╗  ██║        ██║   ███████╗
██║╚██╔╝██║  ╚██╔╝      ██╔═══╝ ██╔══██╗██║   ██║██   ██║██╔══╝  ██║        ██║   ╚════██║
██║ ╚═╝ ██║   ██║       ██║     ██║  ██║╚██████╔╝╚█████╔╝███████╗╚██████╗   ██║   ███████║
╚═╝     ╚═╝   ╚═╝       ╚═╝     ╚═╝  ╚═╝ ╚═════╝  ╚════╝ ╚══════╝ ╚═════╝   ╚═╝   ╚══════╝`;

export default function ProjectsPage() {
  const { data: projects, isLoading, error } = useProjects();
  const router = useRouter();

  // Sort: featured first, then newest
  const sorted = [...(projects ?? [])].sort((a, b) => {
    if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <main className="min-h-screen flex flex-col items-center pt-20 pb-12">
      <div className="overflow-hidden w-full mb-8">
        <h1 className="sr-only">{CONTENT.projects.title}</h1>
        <pre
          className="text-neutral-300 text-[6px] leading-none select-none sm:text-xs md:text-sm lg:text-base mx-auto w-fit text-center"
          aria-hidden="true"
        >
          {ASCII_TITLE}
        </pre>
      </div>

      <p className="text-neutral-500 text-sm font-mono mb-10 text-center">
        <span className="text-green-400">
          {CONTENT.projects.command.charAt(0)}
        </span>
        {CONTENT.projects.command.slice(1)}
      </p>

      <div className="w-full max-w-6xl px-4">
        {error ? (
          <div className="border border-red-900/50 bg-red-950/20 p-6 text-center">
            <p className="text-red-400 text-sm font-mono mb-2">error loading projects</p>
            <p className="text-neutral-500 text-xs font-mono">{error.message}</p>
          </div>
        ) : (
          <ProjectGrid
            projects={sorted}
            isLoading={isLoading}
            onProjectClick={(id) => router.push(`/projects/${id}`)}
          />
        )}
      </div>
    </main>
  );
}
