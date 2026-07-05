"use client";

import { useEffect, useState } from "react";
import { fetchGitHubActivity, type GitHubActivity } from "@/lib/github";
import { CONTENT } from "@/lib/constants/content";

function getTypeColor(type: GitHubActivity["type"]) {
  switch (type) {
    case "push":
      return "text-green-400";
    case "create":
      return "text-cyan-400";
    case "star":
      return "text-yellow-400";
    case "fork":
      return "text-purple-400";
    case "pr":
      return "text-blue-400";
    default:
      return "text-neutral-400";
  }
}

export function RecentActivity() {
  const [activities, setActivities] = useState<GitHubActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const data = await fetchGitHubActivity();
      setActivities(data);
      setIsLoading(false);
    }
    load();
  }, []);

  const { heading, command, emptyMessage, watchingText } =
    CONTENT.landing.recentActivity;

  return (
    <section id="activity-section" className="w-full max-w-4xl mx-auto px-4 py-12">
      <div className="font-mono text-neutral-500 text-sm mb-4">
        <span className="text-green-400">{command.charAt(0)}</span>
        {command.slice(1)}
      </div>

      <div className="border border-neutral-800 p-6">
        <h2 className="text-green-400 font-mono text-lg mb-4">{heading}</h2>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-3 bg-neutral-800 w-1/4 mb-1" />
                <div className="h-4 bg-neutral-800 w-3/4" />
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="text-neutral-600 text-sm font-mono">
            {emptyMessage}
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <a
                key={activity.id}
                href={activity.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-sm font-mono border-l-2 border-neutral-700 pl-3 py-2 hover:border-cyan-400 transition-colors group"
              >
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-1">
                  <span className="text-neutral-600 text-xs">
                    {activity.timestamp}
                  </span>
                  <span className={`${getTypeColor(activity.type)} text-xs`}>
                    [{activity.action}]
                  </span>
                </div>
                <div className="text-neutral-400 group-hover:text-cyan-400 transition-colors break-words">
                  {activity.description}
                </div>
              </a>
            ))}
          </div>
        )}

        <div className="mt-4 text-neutral-600 text-xs font-mono">
          <span className="animate-pulse">▊</span> {watchingText}
        </div>
      </div>
    </section>
  );
}
