"use client";

import { useState } from "react";
import {
  TerminalInput,
  TerminalTextarea,
  TerminalSelect,
  TerminalCheckbox,
  TerminalButton,
} from "@/components/ui";
import { SkillPicker } from "@/components/manager/skill-picker";
import { ImageUploader } from "@/components/manager/image-uploader";
import type { ProjectStatus } from "@/types/schema";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ProjectFormData {
  name: string;
  desc: string;
  skills: string[];
  githubUrl: string;
  demoUrl: string;
  isFeatured: boolean;
  status: ProjectStatus;
  images: string[];
}

const EMPTY_FORM: ProjectFormData = {
  name: "",
  desc: "",
  skills: [],
  githubUrl: "",
  demoUrl: "",
  isFeatured: false,
  status: "draft",
  images: [],
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface ProjectEditorProps {
  projectId: string;
  initialData?: Partial<ProjectFormData>;
  onSave: (data: ProjectFormData) => Promise<void>;
  onCancel: () => void;
  onDelete?: () => Promise<void>;
  isSaving?: boolean;
  mode?: "create" | "edit";
}

export function ProjectEditor({
  projectId,
  initialData,
  onSave,
  onCancel,
  onDelete,
  isSaving = false,
  mode = "create",
}: ProjectEditorProps) {
  const [form, setForm] = useState<ProjectFormData>({
    ...EMPTY_FORM,
    ...initialData,
  });
  const [isDeleting, setIsDeleting] = useState(false);

  const updateField = <K extends keyof ProjectFormData>(
    key: K,
    value: ProjectFormData[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(form);
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    const confirmed = window.confirm(
      "Are you sure you want to delete this project? This cannot be undone.",
    );
    if (!confirmed) return;
    setIsDeleting(true);
    await onDelete();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="border-b border-neutral-800 pb-3 mb-6">
        <h2 className="text-neutral-300 text-sm font-mono">
          <span className="text-neutral-500">$</span>{" "}
          {mode === "create" ? "new project" : "edit project"}
        </h2>
      </div>

      {/* Name */}
      <TerminalInput
        label="name *"
        value={form.name}
        onChange={(e) => updateField("name", e.target.value)}
        placeholder="project name..."
        required
      />

      {/* Description */}
      <TerminalTextarea
        label="description"
        value={form.desc}
        onChange={(e) => updateField("desc", e.target.value)}
        placeholder="project description..."
        rows={4}
      />

      {/* Status + Featured */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TerminalSelect
          label="status *"
          value={form.status}
          onChange={(e) =>
            updateField("status", e.target.value as ProjectStatus)
          }
          options={[
            { value: "draft", label: "draft" },
            { value: "published", label: "published" },
          ]}
        />
        <div className="flex items-end pb-1">
          <TerminalCheckbox
            label="featured project"
            checked={form.isFeatured}
            onChange={(e) => updateField("isFeatured", e.target.checked)}
          />
        </div>
      </div>

      {/* Image upload */}
      <ImageUploader
        projectId={projectId}
        images={form.images}
        onImagesChange={(images) => updateField("images", images)}
      />

      {/* Skills */}
      <SkillPicker
        selected={form.skills}
        onChange={(skills) => updateField("skills", skills)}
      />

      {/* URLs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TerminalInput
          label="github url"
          value={form.githubUrl}
          onChange={(e) => updateField("githubUrl", e.target.value)}
          placeholder="https://github.com/..."
          type="url"
        />
        <TerminalInput
          label="demo url"
          value={form.demoUrl}
          onChange={(e) => updateField("demoUrl", e.target.value)}
          placeholder="https://..."
          type="url"
        />
      </div>

      {/* Action bar */}
      <div className="flex gap-3 pt-4 border-t border-neutral-800">
        <TerminalButton
          type="submit"
          variant="primary"
          disabled={isSaving || isDeleting || !form.name || form.skills.length === 0}
          prefix="$"
        >
          {isSaving ? "saving..." : "save"}
        </TerminalButton>
        <TerminalButton
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={isSaving || isDeleting}
        >
          cancel
        </TerminalButton>

        {mode === "edit" && onDelete && (
          <TerminalButton
            type="button"
            variant="ghost"
            onClick={handleDelete}
            disabled={isSaving || isDeleting}
            className="ml-auto text-red-400 hover:text-red-300"
          >
            {isDeleting ? "deleting..." : "delete"}
          </TerminalButton>
        )}
      </div>
    </form>
  );
}
