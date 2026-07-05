import Link from "next/link";
import { SocialLink } from "@/components/ui/link";
import { NAV_LINKS } from "@/lib/constants/navigation";
import { SOCIAL_LINKS } from "@/lib/constants/social-links";
import { CONTENT } from "@/lib/constants/content";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-neutral-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Navigation */}
          <div>
            <h3 className="text-neutral-500 text-xs font-mono mb-3">
              {CONTENT.footer.headings.navigation}
            </h3>
            <nav className="flex flex-col gap-2">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.name}
                  href={link.route}
                  className="text-neutral-400 text-sm font-mono hover:text-cyan-400 transition-colors"
                >
                  {link.displayText}
                </Link>
              ))}
            </nav>
          </div>

          {/* Social */}
          <div>
            <h3 className="text-neutral-500 text-xs font-mono mb-3">
              {CONTENT.footer.headings.connect}
            </h3>
            <div className="flex gap-2">
              {SOCIAL_LINKS.map((link) => (
                <SocialLink
                  key={link.name}
                  displayText={link.displayText}
                  url={link.url}
                  icon={link.icon}
                />
              ))}
            </div>
          </div>

          {/* Built with */}
          <div>
            <p className="text-neutral-600 text-xs font-mono">
              {CONTENT.footer.builtWith}
            </p>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-neutral-800 pt-4">
          <p className="text-neutral-600 text-xs font-mono">
            © {year} {CONTENT.footer.copyright}
          </p>
        </div>
      </div>
    </footer>
  );
}
