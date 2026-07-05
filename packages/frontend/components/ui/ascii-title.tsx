"use client";

import { useEffect, useState } from "react";

interface AsciiTitleProps {
  text: string;
  level?: 1 | 2 | 3;
  className?: string;
}

function Heading({ level, text }: { level: 1 | 2 | 3; text: string }) {
  const headingClass = "sr-only";
  switch (level) {
    case 1:
      return <h1 className={headingClass}>{text}</h1>;
    case 2:
      return <h2 className={headingClass}>{text}</h2>;
    case 3:
      return <h3 className={headingClass}>{text}</h3>;
  }
}

export function AsciiTitle({ text, level = 1, className = "" }: AsciiTitleProps) {
  const [lines, setLines] = useState<string[] | null>(null);

  useEffect(() => {
    async function render() {
      try {
        const figlet = await import("figlet");
        const font = await import("figlet/importable-fonts/ANSI Shadow.js");
        figlet.default.parseFont("ANSI Shadow", font.default);
        const result = figlet.default.textSync(text, {
          font: "ANSI Shadow",
          horizontalLayout: "fitted",
          verticalLayout: "fitted",
        });
        setLines(result.split("\n"));
      } catch {
        setLines([text]);
      }
    }
    render();
  }, [text]);

  return (
    <div className={className}>
      <Heading level={level} text={text} />
      <pre
        className="text-neutral-300 text-[6px] leading-none select-none sm:text-xs md:text-sm lg:text-base mx-auto w-fit"
        aria-hidden="true"
      >
        {lines ? lines.join("\n") : text}
      </pre>
    </div>
  );
}
