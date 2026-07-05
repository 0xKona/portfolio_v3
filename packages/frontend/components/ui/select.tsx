import { SelectHTMLAttributes } from "react";

interface TerminalSelectOption {
  value: string;
  label: string;
}

interface TerminalSelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "children"> {
  label: string;
  options: TerminalSelectOption[];
}

export function TerminalSelect({
  label,
  options,
  className = "",
  ...props
}: TerminalSelectProps) {
  return (
    <div>
      <label className="block text-neutral-500 text-xs font-mono mb-1">
        {label}
      </label>
      <select
        className={`w-full bg-black border border-neutral-700 text-neutral-300 font-mono text-sm px-3 py-2 focus:border-cyan-400 focus:outline-none disabled:opacity-50 ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
