import { InputHTMLAttributes } from "react";

interface TerminalInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export function TerminalInput({
  label,
  className = "",
  ...props
}: TerminalInputProps) {
  return (
    <div>
      <label className="block text-neutral-500 text-xs font-mono mb-1">
        {label}
      </label>
      <input
        className={`w-full bg-black border border-neutral-700 text-neutral-300 font-mono text-sm px-3 py-2 focus:border-cyan-400 focus:outline-none placeholder:text-neutral-600 disabled:opacity-50 ${className}`}
        {...props}
      />
    </div>
  );
}
