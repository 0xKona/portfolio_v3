import { ReactNode } from "react";
import type { StatusVariant } from "@/types/ui";

// ---------------------------------------------------------------------------
// TerminalStatus — single-line feedback message with $ prefix
// ---------------------------------------------------------------------------

interface TerminalStatusProps {
  message: string;
  variant?: StatusVariant;
}

const statusColors: Record<StatusVariant, string> = {
  error: "text-red-400",
  success: "text-green-400",
  info: "text-cyan-400",
};

export function TerminalStatus({
  message,
  variant = "error",
}: TerminalStatusProps) {
  return (
    <div className={`${statusColors[variant]} text-sm mb-6 font-mono`}>
      <span className="text-neutral-500">$</span> {message}
    </div>
  );
}

// ---------------------------------------------------------------------------
// TerminalErrorBox — bordered error panel with title, message, and footer
// ---------------------------------------------------------------------------

interface TerminalErrorBoxProps {
  title: string;
  message: string;
  footer?: string | ReactNode;
}

export function TerminalErrorBox({
  title,
  message,
  footer,
}: TerminalErrorBoxProps) {
  return (
    <div className="border border-red-400 max-w-2xl w-full p-6 mb-6">
      <pre className="text-red-400 text-xs mb-2">{title}</pre>
      <p className="text-neutral-400 font-mono text-sm mb-4">{message}</p>
      {footer && <div className="text-neutral-600 text-xs">{footer}</div>}
    </div>
  );
}
