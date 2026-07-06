import { commands, getCachedProjectSlugs } from "./commands";

const NAV_TARGETS = ["home", "projects", "about", "signin"];
const PAGE_NAMES = ["home", "projects", "about"];

// Visible commands for autocomplete (excludes hidden)
const VISIBLE_COMMANDS = commands
  .filter((c) => !c.hidden)
  .map((c) => c.name);

export function getProjectSlugs(): string[] {
  return getCachedProjectSlugs();
}

export function filterProjectSlugs(slugs: string[], partial: string): string[] {
  if (!partial) return slugs;
  return slugs.filter((s) => s.startsWith(partial));
}

export function getAutocompleteSuggestion(
  input: string,
): { suggestion: string; ghostText: string } | null {
  if (!input) return null;

  const lower = input.toLowerCase();

  // 1. cd projects/<partial> → match against cached project slugs
  const cdProjectPrefix = "cd projects/";
  if (lower.startsWith(cdProjectPrefix)) {
    const partial = lower.slice(cdProjectPrefix.length);
    const slugs = getProjectSlugs();
    const match = slugs.find((s) => s.startsWith(partial) && s !== partial);
    if (match) {
      const suggestion = `cd projects/${match}`;
      const ghostText = suggestion.slice(input.length);
      return { suggestion, ghostText };
    }
    return null;
  }

  // 2. cd <partial> → match against nav targets
  const cdPrefix = "cd ";
  if (lower.startsWith(cdPrefix) && !lower.startsWith(cdProjectPrefix)) {
    const partial = lower.slice(cdPrefix.length);
    if (partial) {
      const match = NAV_TARGETS.find((t) => t.startsWith(partial) && t !== partial);
      if (match) {
        const suggestion = `cd ${match}`;
        const ghostText = suggestion.slice(input.length);
        return { suggestion, ghostText };
      }
    }
    return null;
  }

  // 3. ls <partial> → match against page names
  const lsPrefix = "ls ";
  if (lower.startsWith(lsPrefix)) {
    const partial = lower.slice(lsPrefix.length);
    if (partial) {
      const match = PAGE_NAMES.find((p) => p.startsWith(partial) && p !== partial);
      if (match) {
        const suggestion = `ls ${match}`;
        const ghostText = suggestion.slice(input.length);
        return { suggestion, ghostText };
      }
    }
    return null;
  }

  // 4. play <partial> → match 'game'
  const playPrefix = "play ";
  if (lower.startsWith(playPrefix)) {
    const partial = lower.slice(playPrefix.length);
    if (partial && "game".startsWith(partial) && "game" !== partial) {
      const suggestion = "play game";
      const ghostText = suggestion.slice(input.length);
      return { suggestion, ghostText };
    }
    return null;
  }

  // 5. Top-level command prefix match
  const match = VISIBLE_COMMANDS.find((c) => c.startsWith(lower) && c !== lower);
  if (match) {
    const ghostText = match.slice(input.length);
    return { suggestion: match, ghostText };
  }

  return null;
}
