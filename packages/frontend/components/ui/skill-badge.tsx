import { getSkillIcon } from "@/lib/constants/skills";

interface SkillBadgeProps {
  name: string;
  className?: string;
}

export function SkillBadge({ name, className = "" }: SkillBadgeProps) {
  const Icon = getSkillIcon(name);

  return (
    <span
      className={`text-xs flex flex-nowrap items-center gap-1 text-neutral-500 border border-neutral-700 px-1.5 py-0.5 ${className}`}
    >
      {Icon && <Icon className="w-3 h-3" />}
      {name}
    </span>
  );
}
