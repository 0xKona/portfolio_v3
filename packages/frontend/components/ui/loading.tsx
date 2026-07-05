interface TerminalLoadingProps {
  message?: string;
  className?: string;
}

export function TerminalLoading({
  message = "loading...",
  className = "",
}: TerminalLoadingProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-12 ${className}`}
    >
      <div className="relative w-24 h-24 mb-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/running.gif"
          alt="Loading"
          className="w-full h-full object-contain"
        />
      </div>
      <div className="text-neutral-500 text-sm font-mono">
        <span className="text-neutral-600">$</span> {message}
      </div>
    </div>
  );
}
