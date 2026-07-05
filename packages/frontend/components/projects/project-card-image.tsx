import { getProjectImageUrl } from "@/lib/api";

interface ProjectCardImageProps {
  projectId: string;
  projectName: string;
  className?: string;
}

export function ProjectCardImage({
  projectId,
  projectName,
  className = "",
}: ProjectCardImageProps) {
  const url = getProjectImageUrl(projectId, "thumbnail");

  return (
    <div className={`relative aspect-video overflow-hidden ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={projectName}
        className="w-full h-full object-cover"
        onError={(e) => {
          // Hide broken image and show fallback
          (e.currentTarget.parentElement as HTMLElement).classList.add("show-fallback");
          e.currentTarget.style.display = "none";
        }}
      />
      <div className="absolute inset-0 bg-neutral-800 flex items-center justify-center font-mono text-neutral-600 text-xs fallback-placeholder">
        <pre className="select-none text-center leading-tight">
{`┌─────────────┐
│  ░░░░░░░░░  │
│  ░ IMAGE ░  │
│  ░░░░░░░░░  │
└─────────────┘`}
        </pre>
      </div>
    </div>
  );
}
