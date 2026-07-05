import { ComponentType } from "react";

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

export interface PixelIconProps {
  size?: number;
  className?: string;
}

export type PixelIconComponent = ComponentType<PixelIconProps>;

// ---------------------------------------------------------------------------
// Buttons
// ---------------------------------------------------------------------------

export type ButtonVariant = "primary" | "secondary" | "ghost";

// ---------------------------------------------------------------------------
// Status / Feedback
// ---------------------------------------------------------------------------

export type StatusVariant = "error" | "success" | "info";

// ---------------------------------------------------------------------------
// Social links
// ---------------------------------------------------------------------------

export interface SocialLinkData {
  name: string;
  displayText: string;
  url: string;
  icon: PixelIconComponent;
}
