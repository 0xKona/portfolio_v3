"use client";

import { useRouter } from "next/navigation";
import useSWR from "swr";
import { getAllProjects } from "@/lib/api";
import { useAuth } from "@/lib/hooks/use-auth";
import { ProjectGrid } from "@/components/projects/project-grid";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { TerminalButton, TerminalLoading } from "@/components/ui";
import type { Project } from "@/types/schema";

export default function ManagerDashboardPage() {
  const router = useRouter();
  const { userEmail, getToken } = useAuth();
  const { data: projects, isLoading, error } = useSWR<Project[]>(
    "manager-projects",
    async () => {
      const token = await getToken();
      return getAllProjects(token);
    },
  );

  const sorted = [...(projects ?? [])].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );

  return (
    <main className="min-h-screen pt-20 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 border-b border-neutral-800 pb-4">
        <div>
          <h1 className="text-neutral-300 text-sm font-mono">
            <span className="text-neutral-500">$</span> ls ~/manager/projects
          </h1>
          <p className="text-neutral-600 text-xs font-mono mt-1">
            {userEmail && (
              <span className="text-neutral-500">{userEmail} · </span>
            )}
            {projects ? `${sorted.length} project${sorted.length !== 1 ? "s" : ""} found` : "loading..."}
          </p>
        </div>
        <div className="flex gap-3">
          <TerminalButton
            variant="primary"
            onClick={() => router.push("/manager/new")}
            prefix="+"
          >
            new project
          </TerminalButton>
          <SignOutButton />
        </div>
      </div>

      {/* Content */}
      {error ? (
        <div className="border border-red-900/50 bg-red-950/20 p-6 text-center">
          <p className="text-red-400 text-sm font-mono mb-2">
            error loading projects
          </p>
          <p className="text-neutral-500 text-xs font-mono">
            {error.message}
          </p>
        </div>
      ) : isLoading ? (
        <div className="flex justify-center py-12">
          <TerminalLoading message="loading projects..." />
        </div>
      ) : (
        <ProjectGrid
          projects={sorted}
          variant="manager"
          isLoading={false}
          onProjectClick={(id) => router.push(`/manager/${id}`)}
        />
      )}
    </main>
  );
}
