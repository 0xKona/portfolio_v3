"use client";

import { useEffect } from "react";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error("Critical application error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-dvh font-mono bg-black text-neutral-300 antialiased">
        <main className="min-h-screen flex flex-col items-center justify-center px-4">
          <div className="text-red-400 text-sm mb-6 font-mono">
            <span className="text-neutral-500">$</span> CRITICAL ERROR
          </div>

          <div className="relative w-32 h-32 mb-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/initial_worried.gif"
              alt="Critical error"
              className="w-full h-full object-contain"
            />
          </div>

          <div className="border border-red-400 max-w-2xl w-full p-6 mb-6">
            <pre className="text-red-400 text-xs mb-2">FATAL: APPLICATION_CRASH</pre>
            <p className="text-neutral-400 font-mono text-sm mb-4">
              {error.message || "A critical error occurred. The application could not recover."}
            </p>
            {error.digest && (
              <div className="text-neutral-600 text-xs">Error ID: {error.digest}</div>
            )}
          </div>

          <div className="flex gap-4">
            <button
              onClick={reset}
              className="border border-green-400 text-green-400 px-6 py-2 font-mono text-sm hover:bg-green-400 hover:text-black transition-colors cursor-pointer"
            >
              retry
            </button>
            <button
              onClick={() => { window.location.href = "/"; }}
              className="border border-cyan-400 text-cyan-400 px-6 py-2 font-mono text-sm hover:bg-cyan-400 hover:text-black transition-colors cursor-pointer"
            >
              go home
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
