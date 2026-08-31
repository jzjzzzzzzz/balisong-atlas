import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { AdminSection } from "@/components/AdminSection";
import { ProjectDashboard } from "@/features/projects/ProjectDashboard";
export default function Page(){return <AdminSection eyebrow="Project dashboard" title="Balisong Atlas Demo Collection" description="A wholly fictional collection for validating the evidence-first workflow. No real object history or technical data is included." action={<Link href="/exhibits/balisong-atlas-demo" className="inline-flex items-center gap-2 rounded-full border border-ink/20 px-4 py-2 text-xs font-bold">View public demo <ExternalLink size={14}/></Link>}><ProjectDashboard/></AdminSection>}
