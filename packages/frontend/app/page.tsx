import { Suspense } from "react";
import { Hero } from "@/components/landing/hero";
import { Skills } from "@/components/landing/skills";
import { FeaturedProjects } from "@/components/landing/featured-projects";
import { RecentActivity } from "@/components/landing/recent-activity";
import { GameTrigger } from "@/components/game/game-trigger";
import { TerminalLoading } from "@/components/ui";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center pt-20 pb-12">
      <Hero />

      <GameTrigger className="mt-10" />

      <Skills />

      <Suspense fallback={<TerminalLoading message="loading projects..." />}>
        <FeaturedProjects />
      </Suspense>

      <Suspense fallback={<TerminalLoading message="loading activity..." />}>
        <RecentActivity />
      </Suspense>
    </main>
  );
}
