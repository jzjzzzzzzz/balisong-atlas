import { PublicSection } from "@/features/exhibits/PublicSection";
import { ExhibitTimeline } from "@/features/exhibits/ExhibitTimeline";
export default async function Page({params}:{params:Promise<{slug:string}>}) { const {slug}=await params; return <PublicSection slug={slug} eyebrow="Reviewed chronology" title="Evidence-bound timeline" intro="Public nodes require accepted claims, reviewer-verified evidence locations, confidence, and explicit uncertainty."><div className="max-w-3xl"><ExhibitTimeline/></div></PublicSection>; }
