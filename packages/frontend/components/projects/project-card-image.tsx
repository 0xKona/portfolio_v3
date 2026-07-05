import { getProjectImageUrl } from "@/lib/api";

interface ProjectCardImageProps {
  projectId: string;
  imageId: string | undefined;
  projectName: string;
  className?: string;
}

export function ProjectCardImage({
  projectId,
  imageId,
  projectName,
  className = "",
}: ProjectCardImageProps) {
  if (!imageId) {
    return (
      <div className={`relative aspect-video overflow-hidden ${className}`}>
        <div className="absolute inset-0 bg-neutral-800 flex items-center justify-center font-mono text-neutral-600 text-xs">
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

  const url = getProjectImageUrl(projectId, "thumbnail", imageId);

  return (
    <div className={`relative aspect-video overflow-hidden ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={projectName}
        className="w-full h-full object-cover relative z-10"
        onError={(e) => {
          e.currentTarget.style.display = "none";
          const fallback = e.currentTarget.nextElementSibling as HTMLElement | null;
          if (fallback) fallback.style.display = "flex";
        }}
      />
      <div
        className="absolute inset-0 bg-neutral-800 items-center justify-center font-mono text-neutral-600 text-xs hidden"
      >
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
