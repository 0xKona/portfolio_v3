"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import type { HistoryEntry } from "@/lib/terminal/types";
import { findCommand } from "@/lib/terminal/commands";

// ---------------------------------------------------------------------------
// Context type
// ---------------------------------------------------------------------------

interface TerminalContextValue {
  isOpen: boolean;
  history: HistoryEntry[];
  toggle: () => void;
  open: () => void;
  close: () => void;
  executeCommand: (input: string) => Promise<void>;
  clearHistory: () => void;
  isGameOpen: boolean;
  openGame: () => void;
  closeGame: () => void;
}

const TerminalContext = createContext<TerminalContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function TerminalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [hasOpenedBefore, setHasOpenedBefore] = useState(false);
  const [isGameOpen, setIsGameOpen] = useState(false);
  const router = useRouter();

  const toggle = useCallback(() => {
    setIsOpen((v) => {
      const next = !v;
      if (next && !hasOpenedBefore) {
        setHasOpenedBefore(true);
        setHistory([{
          id: "motd",
          command: "",
          output: `Welcome to the portfolio terminal.
Type /help to see available commands.
Use Tab for autocomplete. Ctrl+K or \` to toggle, ESC to exit.

Try: ls projects, cd about, cd projects/<project-name> play game`,
        }]);
      }
      return next;
    });
  }, [hasOpenedBefore]);

  const open = useCallback(() => {
    if (!hasOpenedBefore) {
      setHasOpenedBefore(true);
      setHistory([{
        id: "motd",
        command: "",
        output: `Welcome to the portfolio terminal.
Type /help to see available commands.
Use Tab for autocomplete. Ctrl+K or \` to toggle, ESC to exit.

Try: ls projects, cd about, cd projects/<project-name> play game`,
      }]);
    }
    setIsOpen(true);
  }, [hasOpenedBefore]);
  const close = useCallback(() => setIsOpen(false), []);
  const clearHistory = useCallback(() => setHistory([]), []);
  const openGame = useCallback(() => setIsGameOpen(true), []);
  const closeGame = useCallback(() => setIsGameOpen(false), []);

  const executeCommand = useCallback(
    async (input: string) => {
      const trimmed = input.trim();
      if (!trimmed) return;

      const found = findCommand(trimmed);

      if (!found) {
        setHistory((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            command: trimmed,
            output: `Command not found: ${trimmed}\nType /help to see available commands.`,
            isError: true,
          },
        ]);
        return;
      }

      const result = await found.command.handler(found.args);

      // Append to history (unless clear)
      if (result.action?.type !== "clear") {
        setHistory((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            command: trimmed,
            output: result.output,
            isError: result.isError,
          },
        ]);
      }

      // Dispatch action
      if (result.action) {
        switch (result.action.type) {
          case "navigate":
            router.push(result.action.path);
            break;
          case "scroll": {
            const el = document.getElementById(result.action.sectionId);
            if (el) el.scrollIntoView({ behavior: "smooth" });
            break;
          }
          case "clear":
            clearHistory();
            break;
          case "openGame":
            setIsGameOpen(true);
            setIsOpen(false);
            break;
        }
      }
    },
    [router, clearHistory],
  );

  const value = useMemo<TerminalContextValue>(
    () => ({
      isOpen,
      history,
      toggle,
      open,
      close,
      executeCommand,
      clearHistory,
      isGameOpen,
      openGame,
      closeGame,
    }),
    [isOpen, history, toggle, open, close, executeCommand, clearHistory, isGameOpen, openGame, closeGame],
  );

  return (
    <TerminalContext.Provider value={value}>
      {children}
    </TerminalContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useTerminal(): TerminalContextValue {
  const ctx = useContext(TerminalContext);
  if (!ctx) throw new Error("useTerminal must be used within a TerminalProvider");
  return ctx;
}
