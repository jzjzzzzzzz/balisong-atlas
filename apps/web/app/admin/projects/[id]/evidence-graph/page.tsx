import { SlidersHorizontal } from "lucide-react";
import { AdminSection } from "@/components/AdminSection";
import { EvidenceGraph } from "@/features/evidence/EvidenceGraph";
export default function Page(){return <AdminSection eyebrow="Relationship view" title="Evidence graph" description="Explore reviewed links among artifacts, sources, claims, images, entities, visual features, and reconstruction hypotheses." action={<button className="inline-flex items-center gap-2 rounded-full border border-ink/20 px-4 py-2 text-xs font-bold"><SlidersHorizontal size={14}/> Filter nodes</button>}><EvidenceGraph/></AdminSection>}
