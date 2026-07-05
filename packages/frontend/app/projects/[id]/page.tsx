import { ProjectDetail } from "@/components/projects/project-detail";

// ---------------------------------------------------------------------------
// Static params — generates at least one HTML shell so the static export
// succeeds. The CloudFront Function rewrites any /projects/<id> to this shell,
// and the client component reads the real ID from the URL via useParams().
// ---------------------------------------------------------------------------

export async function generateStaticParams() {
  return [{ id: "__placeholder__" }];
}

// ---------------------------------------------------------------------------
// Page — trivial wrapper; ProjectDetail reads the ID from the URL itself.
// ---------------------------------------------------------------------------

export default function ProjectDetailPage() {
  return <ProjectDetail />;
}
