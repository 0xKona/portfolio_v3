export function ProjectCardSkeleton() {
  return (
    <div className="w-full min-w-[280px] max-w-[480px] border border-neutral-700 p-4 space-y-2 animate-pulse">
      {/* Image placeholder */}
      <div className="aspect-video bg-neutral-800" />

      {/* Title */}
      <div className="h-4 bg-neutral-800 w-3/4" />

      {/* Description */}
      <div className="space-y-1 min-h-[2lh]">
        <div className="h-3 bg-neutral-800 w-full" />
        <div className="h-3 bg-neutral-800 w-2/3" />
      </div>

      {/* Skills */}
      <div className="flex gap-1">
        <div className="h-5 w-16 bg-neutral-800" />
        <div className="h-5 w-12 bg-neutral-800" />
        <div className="h-5 w-14 bg-neutral-800" />
      </div>
    </div>
  );
}
