import { Filter, Sparkles } from "lucide-react";
import { AdminSection } from "@/components/AdminSection";
import { ClaimReviewPanel } from "@/features/claims/ClaimReviewPanel";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AdminSection eyebrow="Human review queue" title="Claims" description="AI and human proposals remain proposed until a reviewer verifies their evidence and records a decision." action={<div className="flex gap-2"><button className="inline-flex items-center gap-2 rounded-full border border-ink/20 px-4 py-2 text-xs font-bold"><Filter size={14}/> Filters</button><button className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-xs font-bold text-paper"><Sparkles size={14}/> Propose from source</button></div>}><ClaimReviewPanel projectId={id}/></AdminSection>;
}
