"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { TerminalLink } from "@/components/ui/link";
import { NAV_LINKS } from "@/lib/constants/navigation";
import { CONTENT } from "@/lib/constants/content";

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const pathname = usePathname();

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 bg-black/95 md:hidden flex flex-col items-center justify-center gap-6">
      <div className="text-neutral-600 text-xs font-mono mb-4">
        {CONTENT.navigation.mobile.header}
      </div>

      <nav className="flex flex-col items-center gap-4">
        {NAV_LINKS.map((link) => (
          <TerminalLink
            key={link.name}
            href={link.route}
            isActive={pathname === link.route}
            onClick={onClose}
            className="text-lg"
          >
            {link.displayText}
          </TerminalLink>
        ))}
      </nav>

      <div className="text-neutral-600 text-xs font-mono mt-8">
        {CONTENT.navigation.mobile.closeInstruction}
      </div>
    </div>
  );
}
