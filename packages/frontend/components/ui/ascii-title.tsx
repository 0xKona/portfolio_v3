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

async function renderFiglet(text: string): Promise<string[]> {
  try {
    const figlet = await import("figlet");
    const font = await import("figlet/importable-fonts/ANSI Shadow.js");
    figlet.default.parseFont("ANSI Shadow", font.default);
    const result = figlet.default.textSync(text, {
      font: "ANSI Shadow",
      horizontalLayout: "fitted",
      verticalLayout: "fitted",
    });
    return result.split("\n");
  } catch {
    return [text];
  }
}

export function AsciiTitle({ text, level = 1, className = "" }: AsciiTitleProps) {
  const [lines, setLines] = useState<string[] | null>(null);

  useEffect(() => {
    async function render() {
      // Split by newline to render each word/line separately (stacked)
      const parts = text.split("\n").filter(Boolean);
      const allLines: string[] = [];

      for (const part of parts) {
        const rendered = await renderFiglet(part);
        if (allLines.length > 0) allLines.push("");
        allLines.push(...rendered);
      }

      setLines(allLines);
    }
    render();
  }, [text]);

  return (
    <div className={`overflow-hidden w-full ${className}`}>
      <Heading level={level} text={text.replace("\n", " ")} />
      <pre
        className="text-neutral-300 text-[8px] leading-none select-none sm:text-sm md:text-lg lg:text-xl xl:text-2xl mx-auto w-fit text-center"
        aria-hidden="true"
      >
        {lines ? lines.join("\n") : text}
      </pre>
    </div>
  );
}
