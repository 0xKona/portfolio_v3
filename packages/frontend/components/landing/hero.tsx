"use client";

import { AsciiTitle } from "@/components/ui";
import { CONTENT } from "@/lib/constants/content";

export function Hero() {
  const { firstName, lastName, tagline, commandPrefix, divider, technologies } =
    CONTENT.landing.hero;

  return (
    <section id="hero-section" className="w-full px-4 py-4">
      <AsciiTitle text={`${firstName}\n${lastName}`} level={1} />

      {/* Terminal-style divider */}
      <div className="text-neutral-600 text-sm text-center mt-4">{divider}</div>

      {/* Tagline */}
      <h2 className="text-center max-w-2xl mx-auto mt-2">
        <span className="text-neutral-500">{commandPrefix}</span>
        <span className="text-neutral-300 ml-2">{tagline}</span>
        <div className="mt-2 text-sm text-neutral-400">{technologies}</div>
      </h2>
    </section>
  );
}
