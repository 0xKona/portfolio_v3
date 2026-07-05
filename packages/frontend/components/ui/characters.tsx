// ---------------------------------------------------------------------------
// UnderConstruction — placeholder for pages not yet built
// ---------------------------------------------------------------------------

interface UnderConstructionProps {
  message?: string;
  progress?: number;
}

export function UnderConstruction({
  message = "This section is under construction",
  progress = 0,
}: UnderConstructionProps) {
  const clamped = Math.min(Math.max(progress, 0), 100);
  const totalBlocks = 10;
  const filled = Math.round((clamped / 100) * totalBlocks);
  const progressBar = "█".repeat(filled) + "░".repeat(totalBlocks - filled);

  return (
    <div className="flex flex-col items-center justify-center min-h-100 px-4">
      <div className="text-neutral-600 text-sm mb-6">
        <span className="text-neutral-500">$</span> building...
      </div>

      <div className="relative w-32 h-32 mb-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/hammering.gif"
          alt="Construction in progress"
          className="w-full h-full object-contain"
        />
      </div>

      <div className="text-center">
        <p className="text-neutral-400 font-mono text-sm mb-2">{message}</p>
        <div className="text-neutral-600 text-xs">
          [{progressBar}] {clamped}%
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// WorriedCharacter — decorative GIF for error/404 pages
// ---------------------------------------------------------------------------

interface WorriedCharacterProps {
  altText?: string;
}

export function WorriedCharacter({
  altText = "Error occurred",
}: WorriedCharacterProps) {
  return (
    <div className="relative w-32 h-32 mb-6">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/initial_worried.gif"
        alt={altText}
        className="w-full h-full object-contain"
      />
    </div>
  );
}
