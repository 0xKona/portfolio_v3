import { CONTENT } from "@/lib/constants/content";

// Pre-computed figlet output (ANSI Shadow font, fitted layout)
// Avoids dynamic import and eliminates any loading flash.
const ASCII_CONNOR = ` ██████╗ ██████╗ ███╗   ██╗███╗   ██╗ ██████╗ ██████╗ 
██╔════╝██╔═══██╗████╗  ██║████╗  ██║██╔═══██╗██╔══██╗
██║     ██║   ██║██╔██╗ ██║██╔██╗ ██║██║   ██║██████╔╝
██║     ██║   ██║██║╚██╗██║██║╚██╗██║██║   ██║██╔══██╗
╚██████╗╚██████╔╝██║ ╚████║██║ ╚████║╚██████╔╝██║  ██║
 ╚═════╝ ╚═════╝ ╚═╝  ╚═══╝╚═╝  ╚═══╝ ╚═════╝ ╚═╝  ╚═╝`;

const ASCII_ROBINSON = `██████╗  ██████╗ ██████╗ ██╗███╗   ██╗███████╗ ██████╗ ███╗   ██╗
██╔══██╗██╔═══██╗██╔══██╗██║████╗  ██║██╔════╝██╔═══██╗████╗  ██║
██████╔╝██║   ██║██████╔╝██║██╔██╗ ██║███████╗██║   ██║██╔██╗ ██║
██╔══██╗██║   ██║██╔══██╗██║██║╚██╗██║╚════██║██║   ██║██║╚██╗██║
██║  ██║╚██████╔╝██████╔╝██║██║ ╚████║███████║╚██████╔╝██║ ╚████║
╚═╝  ╚═╝ ╚═════╝ ╚═════╝ ╚═╝╚═╝  ╚═══╝╚══════╝ ╚═════╝ ╚═╝  ╚═══╝`;

export function Hero() {
  const { tagline, commandPrefix, divider, technologies } = CONTENT.landing.hero;

  return (
    <section id="hero-section" className="w-full px-4 py-4">
      <div className="overflow-hidden w-full">
        <h1 className="sr-only">Connor Robinson</h1>
        <pre
          className="text-neutral-300 text-[8px] leading-none select-none sm:text-sm md:text-lg lg:text-xl xl:text-2xl mx-auto w-fit text-center"
          aria-hidden="true"
        >
          {ASCII_CONNOR}
          {"\n\n"}
          {ASCII_ROBINSON}
        </pre>
      </div>

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
