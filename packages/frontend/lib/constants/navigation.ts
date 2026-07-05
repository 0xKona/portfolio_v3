export interface NavigationLink {
  name: string;
  displayText: string;
  route: string;
}

export const NAV_LINKS: NavigationLink[] = [
  { name: "home", displayText: "HOME", route: "/" },
  { name: "projects", displayText: "PROJECTS", route: "/projects" },
  { name: "about", displayText: "ABOUT", route: "/about" },
];
