import { AdminSection } from "@/components/AdminSection";
import { SourceWorkspace } from "@/features/sources/SourceWorkspace";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AdminSection eyebrow="Source workspace" title="Sources" description="Upload approved files, record one trusted URL, import IIIF metadata, set rights, and preserve immutable snapshots."><SourceWorkspace projectId={id}/></AdminSection>;
}
