import { AdminSection } from "@/components/AdminSection";
import { ArtifactWorkspace } from "@/features/artifacts/ArtifactWorkspace";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AdminSection eyebrow="Artifact records" title="Artifacts" description="Museum objects, documented objects, design types, and reconstruction subjects. Technical measurement and mechanism fields do not exist in this workspace."><ArtifactWorkspace projectId={id}/></AdminSection>;
}
