import { InputHTMLAttributes } from "react";

interface TerminalCheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
}

export function TerminalCheckbox({
  label,
  className = "",
  ...props
}: TerminalCheckboxProps) {
  return (
    <label className={`flex items-center gap-2 cursor-pointer group ${className}`}>
      <input
        type="checkbox"
        className="appearance-none w-4 h-4 border border-neutral-700 bg-black checked:bg-green-400 checked:border-green-400 focus:outline-none focus:border-cyan-400 cursor-pointer"
        {...props}
      />
      <span className="text-neutral-400 text-sm font-mono group-hover:text-neutral-300 transition-colors">
        {label}
      </span>
    </label>
  );
}
