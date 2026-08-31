import { AdminSection } from "@/components/AdminSection";
import { ExhibitTimeline } from "@/features/exhibits/ExhibitTimeline";
export default function Page(){return <AdminSection eyebrow="Reviewed chronology" title="Timeline" description="Only accepted claims with reviewer-verified source locations can become timeline items."><div className="max-w-4xl rounded-2xl border border-ink/10 bg-white/45 p-8"><ExhibitTimeline/></div></AdminSection>}
