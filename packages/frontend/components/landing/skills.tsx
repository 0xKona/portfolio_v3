import { CONTENT } from "@/lib/constants/content";
import { CORE_SKILLS, getSkillIcon } from "@/lib/constants/skills";

export function Skills() {
  const { heading, command } = CONTENT.landing.skills;

  return (
    <section id="skills-section" className="w-full max-w-4xl mx-auto px-4 py-12">
      <div className="font-mono text-neutral-500 text-sm mb-4">
        <span className="text-green-400">{command.charAt(0)}</span>
        {command.slice(1)}
      </div>

      <div className="border border-neutral-800 p-6">
        <h2 className="text-green-400 font-mono text-lg mb-4">{heading}</h2>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
          {CORE_SKILLS.map((skill) => {
            const Icon = getSkillIcon(skill);
            return (
              <div
                key={skill}
                className="flex flex-col items-center gap-2 p-3 border border-neutral-700 hover:border-cyan-400 transition-colors group"
                title={skill}
              >
                <div className="text-cyan-400 w-8 h-8 flex items-center justify-center group-hover:scale-110 transition-transform">
                  {Icon && <Icon className="w-8 h-8" />}
                </div>
                <span className="text-neutral-400 text-xs font-mono text-center capitalize">
                  {skill.replace(/^aws-/, "")}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
