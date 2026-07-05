"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import useSWR, { mutate } from "swr";
import {
  getProject,
  createProject,
  updateProject,
  deleteProject,
} from "@/lib/api";
import { useAuth } from "@/lib/hooks/use-auth";
import { useUrlId } from "@/lib/hooks/use-url-id";
import { BackLink } from "@/components/navigation/back-link";
import { ProjectEditor, type ProjectFormData } from "@/components/manager/project-editor";
import { TerminalLoading } from "@/components/ui";
import type { Project, CreateProjectInput, UpdateProjectInput } from "@/types/schema";

export function ProjectEditorPage() {
  const id = useUrlId("manager");
  const router = useRouter();
  const { getToken } = useAuth();
  const isNew = id === "new";

  // For existing projects, fetch data. Skip until the real id is resolved
  // from window.location (id is null on first render, "new" for creation).
  const { data: project, isLoading } = useSWR<Project>(
    id && !isNew ? `project-${id}` : null,
    () => getProject(id!),
  );

  // Generate a stable ID for new projects. Recomputed once id resolves.
  const [newProjectId] = useState(() => crypto.randomUUID());
  const projectId = isNew ? newProjectId : (id ?? "");

  const handleSave = async (form: ProjectFormData) => {
    const token = await getToken();

    if (isNew) {
      const input: CreateProjectInput = {
        id: projectId,
        name: form.name,
        skills: form.skills,
        desc: form.desc || undefined,
        githubUrl: form.githubUrl || undefined,
        demoUrl: form.demoUrl || undefined,
      };
      await createProject(token, input);

      // If status/featured/images differ from defaults, update immediately
      if (form.status !== "draft" || form.isFeatured || form.images.length > 0) {
        const update: UpdateProjectInput = {};
        if (form.status !== "draft") update.status = form.status;
        if (form.isFeatured) update.isFeatured = form.isFeatured;
        if (form.images.length > 0) update.images = form.images;
        await updateProject(token, projectId, update);
      }
    } else {
      const input: UpdateProjectInput = {
        name: form.name,
        desc: form.desc || null,
        skills: form.skills,
        githubUrl: form.githubUrl || null,
        demoUrl: form.demoUrl || null,
        isFeatured: form.isFeatured,
        status: form.status,
        images: form.images,
      };
      await updateProject(token, projectId, input);
    }

    // Invalidate project list cache
    await mutate("manager-projects");
    await mutate("projects");
    router.push("/manager");
  };

  const handleDelete = async () => {
    const token = await getToken();
    await deleteProject(token, projectId);
    await mutate("manager-projects");
    await mutate("projects");
    router.push("/manager");
  };

  const handleCancel = () => {
    router.push("/manager");
  };

  // Still resolving the id from window.location on first render.
  if (id === null) {
    return (
      <main className="min-h-screen flex items-center justify-center pt-20 pb-12">
        <TerminalLoading message="loading..." />
      </main>
    );
  }

  // Loading state for edit mode
  if (!isNew && isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center pt-20 pb-12">
        <TerminalLoading message="loading project..." />
      </main>
    );
  }

  // Error state for edit mode
  if (!isNew && !project) {
    return (
      <main className="min-h-screen pt-20 pb-12">
        <div className="mb-6">
          <BackLink href="/manager" label="back to manager" />
        </div>
        <div className="border border-red-900/50 bg-red-950/20 p-8 text-center">
          <p className="text-red-400 text-sm font-mono">project not found</p>
        </div>
      </main>
    );
  }

  // Map project to form data for edit mode
  const initialData: Partial<ProjectFormData> | undefined = project
    ? {
        name: project.name,
        desc: project.desc ?? "",
        skills: project.skills,
        githubUrl: project.githubUrl ?? "",
        demoUrl: project.demoUrl ?? "",
        isFeatured: project.isFeatured,
        status: project.status,
        images: project.images ?? [],
      }
    : undefined;

  return (
    <main className="min-h-screen pt-20 pb-12">
      <div className="mb-6">
        <BackLink href="/manager" label="back to manager" />
      </div>

      <div className="max-w-2xl mx-auto">
        <ProjectEditor
          projectId={projectId}
          initialData={initialData}
          onSave={handleSave}
          onCancel={handleCancel}
          onDelete={isNew ? undefined : handleDelete}
          mode={isNew ? "create" : "edit"}
        />
      </div>
    </main>
  );
}
