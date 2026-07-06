"use client";

import { useCallback, useEffect, useRef } from "react";
import { useTerminal } from "./terminal-provider";
import { CommandHistory } from "./command-history";
import { CommandInput } from "./command-input";

export function TerminalPanel() {
  const { isOpen, history, executeCommand, close } = useTerminal();
  const panelRef = useRef<HTMLDivElement>(null);
  const inputContainerRef = useRef<HTMLDivElement>(null);

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen) {
      const timeout = setTimeout(() => {
        const input = panelRef.current?.querySelector("input");
        input?.focus();
      }, 50);
      return () => clearTimeout(timeout);
    }
  }, [isOpen]);

  // ESC closes
  useEffect(() => {
    if (!isOpen) return;
    const handle = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      }
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [isOpen, close]);

  // Focus trap
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Tab" && panelRef.current) {
        const focusable = panelRef.current.querySelectorAll<HTMLElement>(
          'input, button, [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    },
    [],
  );

  const handleSubmit = useCallback(
    (input: string) => {
      executeCommand(input);
    },
    [executeCommand],
  );

  return (
    <div
      ref={panelRef}
      role="region"
      aria-label="Terminal"
      className={`fixed inset-x-0 bottom-0 z-40 flex flex-col max-h-[40vh] border-t border-neutral-700 bg-black/95 backdrop-blur transition-transform duration-300 ${
        isOpen ? "translate-y-0" : "translate-y-full"
      }`}
      onKeyDown={handleKeyDown}
    >
      <CommandHistory history={history} />
      <div ref={inputContainerRef}>
        <CommandInput onSubmit={handleSubmit} />
      </div>
    </div>
  );
}
