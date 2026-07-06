"use client";

import Link from "next/link";
import { TerminalStatus, TerminalErrorBox } from "@/components/ui/status";
import { WorriedCharacter } from "@/components/ui/characters";

export default function Unauthorized() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4">
      <TerminalStatus message="401 — authentication required" variant="error" />

      <WorriedCharacter altText="Authentication required" />

      <TerminalErrorBox
        title="ERROR: EAUTH"
        message="You need to sign in to access this page."
        footer="authentication required"
      />

      <div className="flex gap-4">
        <Link
          href="/signin"
          className="border border-cyan-400 text-cyan-400 px-6 py-2 font-mono text-sm hover:bg-cyan-400 hover:text-black transition-colors"
        >
          sign in
        </Link>
        <Link
          href="/"
          className="border border-neutral-600 text-neutral-400 px-6 py-2 font-mono text-sm hover:border-neutral-300 hover:text-neutral-300 transition-colors"
        >
          go home
        </Link>
      </div>
    </main>
  );
}
