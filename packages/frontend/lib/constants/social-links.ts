import { PixelGitHub, PixelLinkedIn } from "@/components/ui/icons";
import type { SocialLinkData } from "@/types/ui";

export const SOCIAL_LINKS: SocialLinkData[] = [
  {
    name: "github",
    displayText: "GitHub",
    url: "https://github.com/0xKona",
    icon: PixelGitHub,
  },
  {
    name: "linkedin",
    displayText: "LinkedIn",
    url: "https://www.linkedin.com/in/konarobinson/",
    icon: PixelLinkedIn,
  },
];
