"use client";

import Link from "next/link";
import { useEffect } from "react";
import { TerminalStatus, TerminalErrorBox } from "@/components/ui/status";
import { WorriedCharacter } from "@/components/ui/characters";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4">
      <TerminalStatus message="500 — something went wrong" variant="error" />

      <WorriedCharacter altText="An error occurred" />

      <TerminalErrorBox
        title="ERROR: UNHANDLED_EXCEPTION"
        message={error.message || "An unexpected error occurred."}
        footer={error.digest ? `Error ID: ${error.digest}` : undefined}
      />

      <div className="flex gap-4">
        <button
          onClick={reset}
          className="border border-green-400 text-green-400 px-6 py-2 font-mono text-sm hover:bg-green-400 hover:text-black transition-colors cursor-pointer"
        >
          retry
        </button>
        <Link
          href="/"
          className="border border-cyan-400 text-cyan-400 px-6 py-2 font-mono text-sm hover:bg-cyan-400 hover:text-black transition-colors"
        >
          go home
        </Link>
      </div>
    </main>
  );
}
