import { UnderConstruction } from "@/components/ui";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center">
      <UnderConstruction message="Portfolio v3 — coming soon" progress={10} />
    </main>
  );
}
