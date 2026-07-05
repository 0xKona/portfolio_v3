"use client";

import { useRef, useState } from "react";
import { getUploadUrl, getProjectImageUrl } from "@/lib/api";
import { useAuth } from "@/lib/hooks/use-auth";
import { TerminalButton } from "@/components/ui";

interface ImageUploaderProps {
  projectId: string;
  images: string[];
  onImagesChange: (images: string[]) => void;
}

interface UploadStatus {
  imageId: string;
  status: "uploading" | "processing";
  progress: number;
  error?: string;
}

export function ImageUploader({
  projectId,
  images,
  onImagesChange,
}: ImageUploaderProps) {
  const { getToken } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploads, setUploads] = useState<UploadStatus[]>([]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!["jpg", "jpeg", "png", "webp", "gif"].includes(ext)) return;
    if (images.length >= 10) return;

    const tempId = `temp-${Date.now()}`;
    setUploads((prev) => [...prev, { imageId: tempId, status: "uploading", progress: 0 }]);

    try {
      const token = await getToken();
      const { uploadUrl, imageId } = await getUploadUrl(token, projectId, ext);

      setUploads((prev) =>
        prev.map((u) => (u.imageId === tempId ? { ...u, imageId, progress: 20 } : u)),
      );

      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      if (!uploadRes.ok) throw new Error(`Upload failed: ${uploadRes.status}`);

      setUploads((prev) =>
        prev.map((u) => (u.imageId === imageId ? { ...u, status: "processing", progress: 60 } : u)),
      );

      let attempts = 0;
      const thumbUrl = getProjectImageUrl(projectId, "thumbnail", imageId);
      while (attempts < 20) {
        await new Promise((r) => setTimeout(r, 1500));
        attempts++;
        setUploads((prev) =>
          prev.map((u) =>
            u.imageId === imageId ? { ...u, progress: 60 + Math.min(35, attempts * 2) } : u,
          ),
        );
        const checkRes = await fetch(thumbUrl, { method: "HEAD" });
        if (checkRes.ok) break;
      }

      setUploads((prev) => prev.filter((u) => u.imageId !== imageId));
      onImagesChange([...images, imageId]);
    } catch (err) {
      setUploads((prev) =>
        prev.map((u) =>
          u.imageId === tempId || u.status !== "uploading"
            ? { ...u, error: err instanceof Error ? err.message : "Upload failed" }
            : u,
        ),
      );
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemove = (imageId: string) => {
    onImagesChange(images.filter((id) => id !== imageId));
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const next = [...images];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    onImagesChange(next);
  };

  const handleMoveDown = (index: number) => {
    if (index === images.length - 1) return;
    const next = [...images];
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    onImagesChange(next);
  };

  const dismissError = (id: string) => {
    setUploads((prev) => prev.filter((u) => u.imageId !== id));
  };

  const isUploading = uploads.some((u) => !u.error);
  const totalBlocks = 10;

  return (
    <div>
      <label className="block text-neutral-500 text-xs font-mono mb-2">
        images
      </label>

      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
          {images.map((imageId, index) => (
            <div key={imageId} className="border border-neutral-700 p-2">
              <div className="relative aspect-video overflow-hidden mb-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getProjectImageUrl(projectId, "thumbnail", imageId)}
                  alt={`Image ${index + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>
              <div className="flex gap-1">
                <TerminalButton
                  type="button"
                  variant="ghost"
                  onClick={() => handleMoveUp(index)}
                  disabled={index === 0}
                  className="text-xs flex-1"
                >
                  ↑
                </TerminalButton>
                <TerminalButton
                  type="button"
                  variant="ghost"
                  onClick={() => handleMoveDown(index)}
                  disabled={index === images.length - 1}
                  className="text-xs flex-1"
                >
                  ↓
                </TerminalButton>
                <TerminalButton
                  type="button"
                  variant="ghost"
                  onClick={() => handleRemove(imageId)}
                  className="text-xs flex-1 text-red-400 hover:text-red-300"
                >
                  ×
                </TerminalButton>
              </div>
            </div>
          ))}
        </div>
      )}

      {uploads.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
          {uploads.map((upload) => (
            <div key={upload.imageId} className="border border-neutral-700 p-2">
              <div className="aspect-video bg-neutral-900 flex items-center justify-center mb-2">
                <span className="text-neutral-600 text-xs font-mono">
                  {upload.error ? "error" : "..."}
                </span>
              </div>
              {!upload.error && (
                <div className="text-neutral-500 text-xs font-mono">
                  {upload.status === "uploading" ? "uploading" : "processing"} [
                  {"█".repeat(Math.round((upload.progress / 100) * totalBlocks))}
                  {"░".repeat(totalBlocks - Math.round((upload.progress / 100) * totalBlocks))}
                  ]
                </div>
              )}
              {upload.error && (
                <div>
                  <p className="text-red-400 text-xs font-mono truncate mb-1">
                    {upload.error}
                  </p>
                  <TerminalButton
                    type="button"
                    variant="ghost"
                    onClick={() => dismissError(upload.imageId)}
                    className="text-xs"
                  >
                    dismiss
                  </TerminalButton>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileSelect}
        className="hidden"
      />

      {images.length < 10 && (
        <TerminalButton
          type="button"
          variant="secondary"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          prefix="+"
        >
          add image ({images.length}/10)
        </TerminalButton>
      )}
    </div>
  );
}
