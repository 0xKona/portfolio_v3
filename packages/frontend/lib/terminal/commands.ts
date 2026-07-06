import type { CommandDefinition, CommandResult } from "./types";
import type { Project } from "@/types/schema";

// ---------------------------------------------------------------------------
// Cached project data
// ---------------------------------------------------------------------------

let cachedProjects: Project[] | null = null;

function slugify(name: string): string {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function fetchProjects(): Promise<Project[]> {
  if (cachedProjects) return cachedProjects;
  try {
    const res = await fetch("/api/projects");
    if (!res.ok) throw new Error("Failed to fetch projects");
    cachedProjects = await res.json();
    return cachedProjects!;
  } catch {
    return [];
  }
}

export function getCachedProjects(): Project[] {
  return cachedProjects ?? [];
}

export function getCachedProjectSlugs(): string[] {
  return getCachedProjects().map((p) => slugify(p.name));
}

// ---------------------------------------------------------------------------
// Navigation targets
// ---------------------------------------------------------------------------

const NAV_TARGETS: Record<string, string> = {
  home: "/",
  projects: "/projects",
  about: "/about",
  signin: "/signin",
};

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

const helpCommand: CommandDefinition = {
  name: "/help",
  description: "List available commands",
  handler: () => {
    const lines = commands
      .filter((c) => !c.hidden)
      .map((c) => {
        const nameStr = c.args ? `${c.name} ${c.args}` : c.name;
        return `  ${nameStr.padEnd(24)} ${c.description}`;
      });
    return { output: "Available commands:\n\n" + lines.join("\n") };
  },
};

const cdCommand: CommandDefinition = {
  name: "cd",
  args: "<target>",
  description: "Navigate to a page (home, projects, about, signin) or project slug",
  handler: async (args) => {
    const target = args.trim().toLowerCase();

    if (!target) {
      return { output: "Usage: cd <target>\nTargets: home, projects, about, signin, projects/<slug>", isError: true };
    }

    // cd projects/<slug>
    if (target.startsWith("projects/")) {
      const slug = target.slice("projects/".length);
      const projects = await fetchProjects();
      const match = projects.find((p) => slugify(p.name) === slug);
      if (match) {
        return { output: `Navigating to project: ${match.name}`, action: { type: "navigate", path: `/projects/${match.id}` } };
      }
      return { output: `Project not found: ${slug}`, isError: true };
    }

    // cd <page>
    if (NAV_TARGETS[target]) {
      return { output: `Navigating to ${target}...`, action: { type: "navigate", path: NAV_TARGETS[target] } };
    }

    return { output: `Unknown target: ${target}\nAvailable: home, projects, about, signin, projects/<slug>`, isError: true };
  },
};

const lsCommand: CommandDefinition = {
  name: "ls",
  args: "[page]",
  description: "List pages or project entries",
  handler: async (args) => {
    const target = args.trim().toLowerCase();

    if (!target) {
      const pages = Object.keys(NAV_TARGETS).map((k) => `  ${k.padEnd(12)} ${NAV_TARGETS[k]}`);
      return { output: "Pages:\n\n" + pages.join("\n") };
    }

    if (target === "projects") {
      const projects = await fetchProjects();
      if (projects.length === 0) {
        return { output: "No projects found." };
      }
      const lines = projects.map((p) => `  ${slugify(p.name).padEnd(30)} ${p.name}`);
      return { output: `Projects (${projects.length}):\n\n` + lines.join("\n") + "\n\nUse: cd projects/<slug>" };
    }

    if (NAV_TARGETS[target]) {
      return { output: `${target} → ${NAV_TARGETS[target]}` };
    }

    return { output: `Unknown page: ${target}`, isError: true };
  },
};

const playCommand: CommandDefinition = {
  name: "play game",
  description: "Launch the platformer game",
  handler: () => {
    return { output: "Launching game...", action: { type: "openGame" } };
  },
};

const gameShortcut: CommandDefinition = {
  name: "./game",
  description: "Launch the platformer game (shortcut)",
  handler: () => {
    return { output: "Launching game...", action: { type: "openGame" } };
  },
};

const clearCommand: CommandDefinition = {
  name: "clear",
  description: "Clear terminal history",
  handler: () => {
    return { output: "", action: { type: "clear" } };
  },
};

const managerCommand: CommandDefinition = {
  name: "/manager",
  description: "Navigate to admin panel",
  hidden: true,
  handler: () => {
    return { output: "Navigating to manager...", action: { type: "navigate", path: "/manager" } };
  },
};

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

export const commands: CommandDefinition[] = [
  helpCommand,
  cdCommand,
  lsCommand,
  playCommand,
  gameShortcut,
  clearCommand,
  managerCommand,
];

export function findCommand(input: string): { command: CommandDefinition; args: string } | null {
  const trimmed = input.trim();

  // Match longest command name first (e.g. "play game" before "play")
  const sorted = [...commands].sort((a, b) => b.name.length - a.name.length);
  for (const cmd of sorted) {
    if (trimmed === cmd.name || trimmed.startsWith(cmd.name + " ")) {
      const args = trimmed.slice(cmd.name.length).trim();
      return { command: cmd, args };
    }
  }
  return null;
}
