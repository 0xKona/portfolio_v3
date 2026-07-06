import Link from "next/link";
import { TerminalStatus, TerminalErrorBox } from "@/components/ui/status";
import { WorriedCharacter } from "@/components/ui/characters";

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4">
      <TerminalStatus message="404 — page not found" variant="error" />

      <WorriedCharacter altText="Page not found" />

      <TerminalErrorBox
        title="ERROR: ENOENT"
        message="The page you're looking for doesn't exist or has been moved."
        footer="bash: cd: no such file or directory"
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
