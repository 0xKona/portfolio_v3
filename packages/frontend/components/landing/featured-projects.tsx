"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFeaturedProjects } from "@/lib/hooks/use-projects";
import { ProjectGrid } from "@/components/projects/project-grid";
import { CONTENT } from "@/lib/constants/content";

export function FeaturedProjects() {
  const { data: projects, isLoading } = useFeaturedProjects();
  const router = useRouter();
  const { heading, subtitle, command, viewAllText } =
    CONTENT.landing.featuredProjects;

  return (
    <section id="featured-section" className="w-full max-w-4xl mx-auto px-4 py-12">
      <div className="font-mono text-neutral-500 text-sm mb-4">
        <span className="text-green-400">{command.charAt(0)}</span>
        {command.slice(1)}
      </div>

      <div className="mb-6">
        <h2 className="text-green-400 font-mono text-2xl mb-2">{heading}</h2>
        <p className="text-neutral-500 text-sm font-mono">{subtitle}</p>
      </div>

      <ProjectGrid
        projects={projects}
        isLoading={isLoading}
        skeletonCount={3}
        onProjectClick={(id) => router.push(`/projects/${id}`)}
      />

      <div className="text-center mt-8">
        <Link
          href="/projects"
          className="border border-neutral-700 px-6 py-2 text-neutral-300 hover:border-cyan-400 hover:text-cyan-400 transition-colors font-mono text-sm inline-block"
        >
          {viewAllText}
        </Link>
      </div>
    </section>
  );
}
