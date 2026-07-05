const GITHUB_USERNAME = "0xKona";

interface GitHubEvent {
  id: string;
  type: string;
  created_at: string;
  repo: { name: string; url: string };
  payload: {
    ref?: string;
    ref_type?: string;
    commits?: Array<{ message: string }>;
    action?: string;
    pull_request?: { title: string; html_url: string };
  };
}

export interface GitHubActivity {
  id: string;
  timestamp: string;
  action: string;
  description: string;
  type: "push" | "create" | "star" | "fork" | "pr";
  url?: string;
}

function parseEvent(event: GitHubEvent): GitHubActivity | null {
  const timestamp = event.created_at.split("T")[0];

  switch (event.type) {
    case "PushEvent": {
      const msg = event.payload.commits?.[0]?.message || "code changes";
      return {
        id: event.id,
        timestamp,
        action: "PUSH",
        description: `${event.repo.name}: ${msg.slice(0, 60)}${msg.length > 60 ? "..." : ""}`,
        type: "push",
        url: `https://github.com/${event.repo.name}`,
      };
    }
    case "CreateEvent": {
      const refType = event.payload.ref_type || "repository";
      return {
        id: event.id,
        timestamp,
        action: "CREATE",
        description: `Created ${refType} ${event.payload.ref || event.repo.name}`,
        type: "create",
        url: `https://github.com/${event.repo.name}`,
      };
    }
    case "ForkEvent":
      return {
        id: event.id,
        timestamp,
        action: "FORK",
        description: `Forked ${event.repo.name}`,
        type: "fork",
        url: `https://github.com/${event.repo.name}`,
      };
    case "PullRequestEvent":
      return {
        id: event.id,
        timestamp,
        action: "PR",
        description: `${event.payload.action} PR: ${event.payload.pull_request?.title}`,
        type: "pr",
        url: event.payload.pull_request?.html_url,
      };
    default:
      return null;
  }
}

export async function fetchGitHubActivity(
  limit: number = 5,
): Promise<GitHubActivity[]> {
  try {
    const res = await fetch(
      `https://api.github.com/users/${GITHUB_USERNAME}/events/public?per_page=10`,
      { headers: { Accept: "application/vnd.github.v3+json" } },
    );

    if (!res.ok) return [];

    const events: GitHubEvent[] = await res.json();
    const activities: GitHubActivity[] = [];

    for (const event of events) {
      const activity = parseEvent(event);
      if (activity && !activity.description.includes("undefined")) {
        activities.push(activity);
      }
      if (activities.length >= limit) break;
    }

    return activities;
  } catch {
    return [];
  }
}
