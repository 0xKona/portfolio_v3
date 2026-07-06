"use client";

import { useEffect } from "react";
import { useTerminal } from "./terminal-provider";

export function TerminalTrigger() {
  const { isOpen, toggle } = useTerminal();

  // Global keyboard shortcuts
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      // Ctrl+K / Cmd+K
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        toggle();
        return;
      }

      // Backtick — only when no input/textarea is focused
      if (e.key === "`") {
        const active = document.activeElement;
        const isInput =
          active instanceof HTMLInputElement ||
          active instanceof HTMLTextAreaElement ||
          (active instanceof HTMLElement && active.isContentEditable);
        if (!isInput) {
          e.preventDefault();
          toggle();
        }
      }
    };

    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [toggle]);

  return (
    <button
      type="button"
      onClick={toggle}
      className="fixed bottom-4 right-4 z-50 flex h-11 w-11 items-center justify-center border border-neutral-700 bg-black text-green-400 font-mono text-sm hover:border-green-400 transition-colors"
      aria-label={isOpen ? "Close terminal" : "Open terminal"}
    >
      {isOpen ? "×" : ">_"}
    </button>
  );
}
