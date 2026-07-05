import "@hackernoon/pixel-icon-library/fonts/iconfont.css";
import type { PixelIconProps } from "@/types/ui";

function PixelIcon({ name, size = 24, className = "" }: PixelIconProps & { name: string }) {
  return <i className={`hn hn-${name} ${className}`} style={{ fontSize: `${size}px` }} />;
}

export function PixelGitHub(props: PixelIconProps) {
  return <PixelIcon name="github" {...props} />;
}

export function PixelLinkedIn(props: PixelIconProps) {
  return <PixelIcon name="linkedin" {...props} />;
}

export function PixelEnvelope(props: PixelIconProps) {
  return <PixelIcon name="envelope" {...props} />;
}

export function PixelBurger(props: PixelIconProps) {
  return <PixelIcon name="bars-solid" {...props} />;
}

export function PixelClose(props: PixelIconProps) {
  return <PixelIcon name="window-close-solid" {...props} />;
}

export function PixelArrowLeft(props: PixelIconProps) {
  return <PixelIcon name="arrow-left-solid" {...props} />;
}

export function PixelArrowRight(props: PixelIconProps) {
  return <PixelIcon name="arrow-right-solid" {...props} />;
}
