import Link from "next/link";
import { NAV_LINKS } from "@/lib/constants/navigation";
import { SOCIAL_LINKS } from "@/lib/constants/social-links";
import { PixelArrowRight } from "@/components/ui/icons";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-neutral-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
          {/* Navigation */}
          <div>
            <h3 className="text-green-400 font-mono text-sm mb-3">
              NAVIGATION
            </h3>
            <nav className="flex flex-col gap-2">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.name}
                  href={link.route}
                  className="text-neutral-400 hover:text-cyan-400 font-mono text-xs transition-colors"
                >
                  {link.displayText}
                </Link>
              ))}
            </nav>
          </div>

          {/* Connect */}
          <div>
            <h3 className="text-green-400 font-mono text-sm mb-3">
              CONNECT
            </h3>
            <div className="flex flex-col gap-2">
              {SOCIAL_LINKS.map((social) => (
                <a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-neutral-400 hover:text-cyan-400 font-mono text-xs transition-colors"
                >
                  {social.displayText} <PixelArrowRight size={10} />
                </a>
              ))}
            </div>
          </div>

          {/* About */}
          <div>
            <h3 className="text-green-400 font-mono text-sm mb-3">
              ABOUT
            </h3>
            <p className="text-neutral-500 font-mono text-xs leading-relaxed">
              Full-stack developer specializing in TypeScript, React, and AWS cloud architecture.
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-neutral-800 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-neutral-600 font-mono text-xs">
            © {year} Connor Robinson. All rights reserved.
          </p>
          <div className="flex gap-4">
            <a
              href="https://github.com/0xKona/portfolio_v3"
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-600 hover:text-cyan-400 font-mono text-xs transition-colors"
            >
              Source Code
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
