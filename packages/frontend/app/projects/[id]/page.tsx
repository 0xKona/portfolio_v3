import { ProjectDetail } from "@/components/projects/project-detail";

// ---------------------------------------------------------------------------
// Static params — at build time, fetch known project IDs from the API.
// Falls back to a placeholder so the build always succeeds even when the
// API is unreachable during deployment.
// ---------------------------------------------------------------------------

export async function generateStaticParams() {
  try {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE ?? "";
    const res = await fetch(`${apiBase}/api/projects`);
    if (res.ok) {
      const projects: { id: string }[] = await res.json();
      if (projects.length > 0) {
        return projects.map((p) => ({ id: p.id }));
      }
    }
  } catch {
    // API unavailable at build time — use placeholder
  }
  return [{ id: "__placeholder__" }];
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <ProjectDetail id={id} />;
}
