"use client";

import { useEffect, useRef } from "react";
import type { HistoryEntry } from "@/lib/terminal/types";

interface CommandHistoryProps {
  history: HistoryEntry[];
}

export function CommandHistory({ history }: CommandHistoryProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto px-4 py-2 font-mono text-sm"
    >
      {history.map((entry) => (
        <div key={entry.id} className="mb-2">
          <div className="text-green-400">
            <span className="select-none">&gt; </span>
            {entry.command}
          </div>
          {entry.output && (
            <pre
              className={`whitespace-pre-wrap mt-1 ${
                entry.isError ? "text-red-400" : "text-neutral-400"
              }`}
            >
              {entry.output}
            </pre>
          )}
        </div>
      ))}
    </div>
  );
}
