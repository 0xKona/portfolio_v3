"use client";

import Link from "next/link";
import { PixelArrowLeft } from "@/components/ui/icons";

interface BackLinkProps {
  href: string;
  label?: string;
  className?: string;
}

export function BackLink({
  href,
  label = "back",
  className = "",
}: BackLinkProps) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2 text-neutral-400 hover:text-cyan-400 transition-colors font-mono text-sm ${className}`}
    >
      <PixelArrowLeft size={14} />
      <span>{label}</span>
    </Link>
  );
}
