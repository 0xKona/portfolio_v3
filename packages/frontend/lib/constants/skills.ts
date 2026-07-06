import { IconType } from "react-icons";
import {
  FaReact,
  FaNode,
  FaAws,
  FaGolang,
  FaPython,
  FaJs,
  FaTerminal,
  FaLaptopCode,
  FaJava,
} from "react-icons/fa6";
import {
  SiNextdotjs,
  SiTypescript,
  SiTailwindcss,
  SiGraphql,
  SiMysql,
} from "react-icons/si";
import { TbLambda } from "react-icons/tb";
import { IoLogoAmplify } from "react-icons/io5";

// ---------------------------------------------------------------------------
// Icon registry — maps skill name → react-icons component
// ---------------------------------------------------------------------------

export const SKILL_ICONS: Record<string, IconType> = {
  typescript: SiTypescript,
  javascript: FaJs,
  react: FaReact,
  "react-native": FaReact,
  nextjs: SiNextdotjs,
  "next.js": SiNextdotjs,
  nodejs: FaNode,
  node: FaNode,
  tailwindcss: SiTailwindcss,
  tailwind: SiTailwindcss,
  graphql: SiGraphql,
  mysql: SiMysql,
  aws: FaAws,
  "aws-amplify": IoLogoAmplify,
  amplify: IoLogoAmplify,
  "aws-lambda": TbLambda,
  lambda: TbLambda,
  "aws-cdk": FaAws,
  "aws-dynamodb": FaAws,
  dynamodb: FaAws,
  go: FaGolang,
  golang: FaGolang,
  python: FaPython,
  "kiro-cli": FaTerminal,
  "kiro-ide": FaLaptopCode,
  java: FaJava
};

// ---------------------------------------------------------------------------
// Core skills displayed on the home page
// ---------------------------------------------------------------------------

export const CORE_SKILLS: string[] = [
  "typescript",
  "react",
  "nextjs",
  "nodejs",
  "aws",
  "aws-amplify",
  "tailwindcss",
  "kiro-cli",
  "kiro-ide",
  "graphql",
  "mysql",
  "aws-lambda",
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function getSkillIcon(name: string): IconType | null {
  return SKILL_ICONS[name.toLowerCase()] ?? null;
}
