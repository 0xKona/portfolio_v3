export const CONTENT = {
  landing: {
    hero: {
      firstName: "CONNOR",
      lastName: "ROBINSON",
      tagline: "Full-stack developer building scalable web applications",
      commandPrefix: "$",
      divider: "--- • ---",
      technologies: "TypeScript • Next.js • AWS",
    },
    skills: {
      heading: "CORE TECHNOLOGIES",
      command: "$ cat core-tech.json",
    },
    featuredProjects: {
      heading: "FEATURED PROJECTS",
      subtitle: "Showcasing my best work",
      command: "$ ls ~/projects --featured",
      viewAllText: "view all projects →",
    },
    recentActivity: {
      heading: "RECENT ACTIVITY",
      command: "$ tail -f github-activity.log",
      emptyMessage: "no recent activity found",
      watchingText: "watching for changes...",
    },
    gameTrigger: {
      label: "bored already?",
      prefix: ">",
    },
  },
  navigation: {
    links: {
      home: "HOME",
      projects: "PROJECTS",
      about: "ABOUT",
    },
    mobile: {
      header: "--- NAVIGATION ---",
      closeInstruction: "Press ESC to close",
    },
  },
  footer: {
    headings: {
      navigation: "NAVIGATION",
      connect: "CONNECT",
    },
    copyright: "Connor Robinson",
    builtWith: "Built with Next.js + AWS",
  },
  projects: {
    title: "MY PROJECTS",
    command: "$ ls ~/projects --all",
  },
} as const;
