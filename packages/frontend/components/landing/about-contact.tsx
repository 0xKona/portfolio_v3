import { SOCIAL_LINKS } from "@/lib/constants/social-links";
import { CONTENT } from "@/lib/constants/content";

export function AboutContact() {
  const github = SOCIAL_LINKS.find((l) => l.name === "github");
  const linkedin = SOCIAL_LINKS.find((l) => l.name === "linkedin");

  return (
    <section className="w-full max-w-4xl mx-auto px-4 py-20 border-t border-neutral-800">
      {/* Terminal header */}
      <div className="font-mono text-neutral-500 text-sm mb-6">
        <span className="text-green-400">$</span> {CONTENT.about.contact.command.slice(2)}
      </div>

      {/* Contact content */}
      <div className="space-y-8">
        <h2 className="font-mono text-3xl text-green-400">
          {CONTENT.about.contact.heading}
        </h2>

        <div className="space-y-4 text-neutral-300 font-mono text-sm">
          <p>
            <span className="text-cyan-400">{">"}</span>{" "}
            {CONTENT.about.contact.intro}
          </p>

          <div className="space-y-2 pl-4 border-l-2 border-neutral-700">
            {github && (
              <p>
                <span className="text-cyan-400">GITHUB:</span>{" "}
                <a
                  href={github.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-neutral-400 hover:text-green-400 transition-colors underline"
                >
                  {github.url}
                </a>
              </p>
            )}
            {linkedin && (
              <p>
                <span className="text-cyan-400">LINKEDIN:</span>{" "}
                <a
                  href={linkedin.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-neutral-400 hover:text-green-400 transition-colors underline"
                >
                  {linkedin.url}
                </a>
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
