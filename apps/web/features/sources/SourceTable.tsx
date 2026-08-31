import Link from "next/link";
import { FileImage, FileText, MoreHorizontal } from "lucide-react";
import { StatusPill } from "@/components/StatusPill";

export type SourceRow = {
  id: string;
  title: string;
  source_type: string;
  source_tier: string;
  rights_status: string;
  processing_status: string;
  content_sha256?: string;
};

const fixtures: SourceRow[] = [
  { id: "1", title: "Fictional A-01 research sheet", source_type: "pdf", source_tier: "A", rights_status: "public_domain", processing_status: "processed" },
  { id: "2", title: "Abstract fixture study 1", source_type: "image", source_tier: "A", rights_status: "public_domain", processing_status: "processed" },
  { id: "3", title: "Abstract fixture study 2", source_type: "image", source_tier: "A", rights_status: "public_domain", processing_status: "processed" },
];

export function SourceTable({ sources = fixtures, projectId = "demo" }: { sources?: SourceRow[]; projectId?: string }) {
  return <div className="overflow-x-auto rounded-2xl border border-ink/10"><table className="w-full min-w-[900px] text-left text-sm"><thead className="bg-ink text-paper"><tr>{["Source", "Type", "Tier", "Rights", "Processing", "Content address", ""].map((label) => <th key={label} className="p-4 text-[10px] uppercase tracking-[.12em]">{label}</th>)}</tr></thead><tbody>{sources.map((source) => <tr key={source.id} className="border-t border-ink/10 bg-white/35"><td className="p-4"><Link href={`/admin/projects/${projectId}/sources/${source.id}`} className="flex items-center gap-3 font-semibold"><span className="grid h-8 w-8 place-items-center rounded-full bg-ink/5">{source.source_type === "pdf" ? <FileText size={14}/> : <FileImage size={14}/>}</span>{source.title}</Link></td><td className="p-4 uppercase">{source.source_type}</td><td className="p-4"><span className="grid h-7 w-7 place-items-center rounded-full bg-moss text-xs font-bold text-white">{source.source_tier}</span></td><td className="p-4">{source.rights_status.replaceAll("_", " ")}</td><td className="p-4"><StatusPill>{source.processing_status}</StatusPill></td><td className="p-4 font-mono text-[11px] text-quiet">{source.content_sha256 ? `${source.content_sha256.slice(0, 14)}…` : "pending"}</td><td className="p-4"><button aria-label={`Actions for ${source.title}`}><MoreHorizontal size={16}/></button></td></tr>)}</tbody></table></div>;
}
