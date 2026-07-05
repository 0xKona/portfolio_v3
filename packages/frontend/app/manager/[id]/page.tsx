import { ProjectEditorPage } from "@/components/manager/project-editor-page";

// ---------------------------------------------------------------------------
// Static params — "new" generates the HTML shell. The CloudFront Function
// rewrites any /manager/<id> to this shell, and the client component reads
// the real ID from the URL via useParams().
// ---------------------------------------------------------------------------

export async function generateStaticParams() {
  return [{ id: "new" }];
}

// ---------------------------------------------------------------------------
// Page — trivial wrapper; ProjectEditorPage reads the ID from the URL itself.
// ---------------------------------------------------------------------------

export default function Page() {
  return <ProjectEditorPage />;
}
