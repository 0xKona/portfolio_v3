import Link from "next/link";
import type { PixelIconComponent } from "@/types/ui";

// ---------------------------------------------------------------------------
// TerminalLink — internal navigation link with prefix character
// ---------------------------------------------------------------------------

interface TerminalLinkProps {
  href: string;
  children: React.ReactNode;
  prefix?: string;
  isActive?: boolean;
  className?: string;
  onClick?: () => void;
}

export function TerminalLink({
  href,
  children,
  prefix = ">",
  isActive = false,
  className = "",
  onClick,
}: TerminalLinkProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`group flex items-center gap-2 px-2 py-1 transition-colors duration-150 ${isActive ? "text-green-400" : "text-neutral-300 hover:text-cyan-400"} ${className}`}
    >
      <span
        className={`transition-colors duration-150 ${isActive ? "text-green-400" : "text-neutral-500 group-hover:text-cyan-400"}`}
      >
        {prefix}
      </span>
      <span>{children}</span>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// SocialLink — external link with pixel icon
// ---------------------------------------------------------------------------

interface SocialLinkProps {
  displayText: string;
  url: string;
  icon: PixelIconComponent;
  className?: string;
}

export function SocialLink({
  displayText,
  url,
  icon: Icon,
  className = "",
}: SocialLinkProps) {
  return (
    <Link
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`group inline-flex items-center justify-center w-8 h-8 text-neutral-500 hover:text-cyan-400 transition-colors duration-150 ${className}`}
      aria-label={displayText}
      title={displayText}
    >
      <Icon size={24} />
    </Link>
  );
}
