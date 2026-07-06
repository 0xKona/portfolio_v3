import { AboutMe } from "@/components/landing/about-me";
import { AboutContact } from "@/components/landing/about-contact";

export default function AboutPage() {
  return (
    <main className="min-h-screen">
      <AboutMe />
      <AboutContact />
    </main>
  );
}
