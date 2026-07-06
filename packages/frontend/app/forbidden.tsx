"use client";

import Link from "next/link";
import { TerminalStatus, TerminalErrorBox } from "@/components/ui/status";
import { WorriedCharacter } from "@/components/ui/characters";

export default function Forbidden() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4">
      <TerminalStatus message="403 — access denied" variant="error" />

      <WorriedCharacter altText="Access denied" />

      <TerminalErrorBox
        title="ERROR: EACCES"
        message="You don't have permission to access this resource."
        footer="permission denied"
      />

      <div className="flex gap-4">
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
