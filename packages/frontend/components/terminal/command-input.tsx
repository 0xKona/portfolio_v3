"use client";

import { useCallback, useRef, useState } from "react";
import {
  getAutocompleteSuggestion,
  getProjectSlugs,
  filterProjectSlugs,
} from "@/lib/terminal/autocomplete";

interface CommandInputProps {
  onSubmit: (input: string) => void;
}

export function CommandInput({ onSubmit }: CommandInputProps) {
  const [value, setValue] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestion = getAutocompleteSuggestion(value);

  // Project slug dropdown
  const showProjectDropdown = value.toLowerCase().startsWith("cd projects/");
  const partial = showProjectDropdown
    ? value.slice("cd projects/".length).toLowerCase()
    : "";
  const projectMatches = showProjectDropdown
    ? filterProjectSlugs(getProjectSlugs(), partial).slice(0, 8)
    : [];

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        // If project dropdown is showing and an item is selected
        if (showProjectDropdown && projectMatches.length > 0) {
          const selected = projectMatches[selectedIndex];
          if (selected) {
            const full = `cd projects/${selected}`;
            onSubmit(full);
            setValue("");
            setSelectedIndex(0);
            return;
          }
        }
        if (value.trim()) {
          onSubmit(value.trim());
          setValue("");
          setSelectedIndex(0);
        }
      } else if (e.key === "Tab") {
        e.preventDefault();
        if (showProjectDropdown && projectMatches.length > 0) {
          const selected = projectMatches[selectedIndex];
          if (selected) {
            setValue(`cd projects/${selected}`);
            setSelectedIndex(0);
          }
        } else if (suggestion) {
          setValue(suggestion.suggestion);
        }
      } else if (e.key === "ArrowDown" && showProjectDropdown) {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, projectMatches.length - 1));
      } else if (e.key === "ArrowUp" && showProjectDropdown) {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      }
    },
    [value, suggestion, onSubmit, showProjectDropdown, projectMatches, selectedIndex],
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value.slice(0, 200);
    setValue(newVal);
    setSelectedIndex(0);
  };

  return (
    <div className="relative border-t border-neutral-800 px-4 py-2">
      {/* Project slug dropdown */}
      {showProjectDropdown && projectMatches.length > 0 && (
        <div className="absolute bottom-full left-4 right-4 mb-1 bg-neutral-900 border border-neutral-700 rounded max-h-40 overflow-y-auto font-mono text-sm">
          {projectMatches.map((slug, i) => (
            <button
              key={slug}
              type="button"
              className={`block w-full text-left px-3 py-1 ${
                i === selectedIndex
                  ? "bg-neutral-800 text-green-400"
                  : "text-neutral-400 hover:bg-neutral-800"
              }`}
              onMouseDown={(e) => {
                e.preventDefault();
                const full = `cd projects/${slug}`;
                onSubmit(full);
                setValue("");
                setSelectedIndex(0);
              }}
              onMouseEnter={() => setSelectedIndex(i)}
            >
              {slug}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center font-mono text-sm">
        <span className="text-green-400 select-none mr-2">&gt;</span>
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent text-neutral-300 caret-green-400 outline-none"
            spellCheck={false}
            autoComplete="off"
            autoCapitalize="off"
            aria-label="Terminal input"
          />
          {/* Ghost text overlay */}
          {suggestion && !showProjectDropdown && (
            <div
              className="absolute inset-0 pointer-events-none text-neutral-600 whitespace-nowrap overflow-hidden"
              aria-hidden="true"
            >
              <span className="invisible">{value}</span>
              <span>{suggestion.ghostText}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
