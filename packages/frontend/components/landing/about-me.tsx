import { getSkillIcon } from "@/lib/constants/skills";
import { CONTENT } from "@/lib/constants/content";

const MY_SKILLS: Record<string, string[]> = {
  frontend: [
    "react",
    "nextjs",
    "react-native",
    "typescript",
    "javascript",
    "tailwindcss",
  ],
  backend: [
    "nodejs",
    "aws-cdk",
    "mysql",
    "dynamodb",
    "golang"
  ],
  "ai tools": ["kiro-cli", "kiro-ide"],
  additional: ["python", "java"],
};

export function AboutMe() {
  return (
    <section className="w-full max-w-4xl mx-auto px-4 py-20 relative">
      {/* Terminal header */}
      <div className="font-mono text-neutral-500 text-sm mb-6">
        <span className="text-green-400">$</span> {CONTENT.about.bio.command.slice(2)}
      </div>

      {/* About content */}
      <div className="space-y-8 relative">
        <div className="relative">
          <h1 className="font-mono text-3xl text-green-400">
            {CONTENT.about.bio.heading}
          </h1>
          <div className="absolute bottom-0 left-40 pointer-events-none -mb-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/laptop_edge.gif"
              alt="Chibi character sitting on laptop edge"
              width={72}
              height={72}
              className="h-24 w-auto opacity-90"
            />
          </div>
        </div>

        <div className="space-y-6 text-neutral-300 font-mono text-sm">
          {/* Bio paragraphs */}
          <div className="space-y-4">
            {CONTENT.about.bio.paragraphs.map((paragraph, index) => (
              <p key={index} className="text-neutral-400">
                <span className="text-cyan-400">{">"}</span> {paragraph}
              </p>
            ))}
          </div>

          {/* Skills section */}
          <div className="space-y-4 pt-4 border-t border-neutral-800">
            <h2 className="text-lg text-green-400">
              <span className="text-neutral-600">#</span>{" "}
              {CONTENT.about.skills.heading}
            </h2>
            <div className="space-y-4 pl-4 border-l-2 border-neutral-700">
              {Object.entries(MY_SKILLS).map(([category, skills]) => (
                <div key={category}>
                  <div className="flex items-center gap-2 mb-3">
                    <p className="text-cyan-400 uppercase text-xs tracking-wide">
                      {category}
                    </p>
                    {category === "additional" && (
                      <p className="text-neutral-500 text-xs">
                        {CONTENT.about.skills.additionalDisclaimer}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    {skills.map((skill) => {
                      const Icon = getSkillIcon(skill);
                      return (
                        <div
                          key={skill}
                          className="flex items-center gap-2 px-3 py-2 border border-neutral-700 bg-neutral-900 hover:bg-neutral-800 hover:border-cyan-400 transition-colors"
                        >
                          {Icon && (
                            <div className="shrink-0 text-cyan-400 w-4 h-4">
                              <Icon className="w-4 h-4" />
                            </div>
                          )}
                          <span className="text-neutral-300 text-xs capitalize">
                            {skill.replace(/\./g, "")}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
