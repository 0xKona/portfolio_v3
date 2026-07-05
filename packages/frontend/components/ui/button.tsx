import { ButtonHTMLAttributes } from "react";
import type { ButtonVariant } from "@/types/ui";

interface TerminalButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  prefix?: string;
  suffix?: string;
  children: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "border border-green-400 text-green-400 hover:bg-green-400 hover:text-black",
  secondary:
    "border border-neutral-500 text-neutral-300 hover:border-cyan-400 hover:text-cyan-400",
  ghost: "border-none text-neutral-300 hover:text-cyan-400",
};

export function TerminalButton({
  variant = "secondary",
  prefix,
  suffix,
  children,
  className = "",
  ...props
}: TerminalButtonProps) {
  return (
    <button
      className={`px-3 py-1.5 font-mono text-sm transition-colors duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {prefix && <span className="mr-1">{prefix}</span>}
      {children}
      {suffix && <span className="ml-1">{suffix}</span>}
    </button>
  );
}
