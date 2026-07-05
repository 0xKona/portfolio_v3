"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { TerminalLink } from "@/components/ui/link";
import { SocialLink } from "@/components/ui/link";
import { NAV_LINKS } from "@/lib/constants/navigation";
import { SOCIAL_LINKS } from "@/lib/constants/social-links";
import { BurgerMenu } from "./burger-menu";
import { MobileNav } from "./mobile-nav";

export function MainNavBar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <header className="sticky top-0 z-50 bg-black/90 backdrop-blur border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <TerminalLink
                key={link.name}
                href={link.route}
                isActive={pathname === link.route}
              >
                {link.displayText}
              </TerminalLink>
            ))}
          </nav>

          {/* Social icons */}
          <div className="hidden md:flex items-center gap-2">
            {SOCIAL_LINKS.map((link) => (
              <SocialLink
                key={link.name}
                displayText={link.displayText}
                url={link.url}
                icon={link.icon}
              />
            ))}
          </div>

          {/* Mobile burger */}
          <BurgerMenu
            isOpen={mobileOpen}
            onClick={() => setMobileOpen(!mobileOpen)}
          />
        </div>
      </header>

      <MobileNav isOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  );
}
