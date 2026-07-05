import { TextareaHTMLAttributes } from "react";

interface TerminalTextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
}

export function TerminalTextarea({
  label,
  className = "",
  ...props
}: TerminalTextareaProps) {
  return (
    <div>
      <label className="block text-neutral-500 text-xs font-mono mb-1">
        {label}
      </label>
      <textarea
        className={`w-full bg-black border border-neutral-700 text-neutral-300 font-mono text-sm px-3 py-2 resize-y min-h-[80px] focus:border-cyan-400 focus:outline-none placeholder:text-neutral-600 disabled:opacity-50 ${className}`}
        {...props}
      />
    </div>
  );
}
