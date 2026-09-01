import { PublicSection } from "@/features/exhibits/PublicSection";
import { ExhibitTimeline } from "@/features/exhibits/ExhibitTimeline";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <PublicSection
    slug={slug}
    eyebrow={{ en: "Reviewed chronology", zh: "已审核的时间序列" }}
    title={{ en: "Evidence-bound timeline", zh: "证据绑定时间线" }}
    intro={{ en: "Public nodes require accepted claims, reviewer-verified evidence locations, confidence, and explicit uncertainty.", zh: "公开时间线节点必须绑定已接受主张、经审核的证据位置、置信度和明确的不确定性说明。" }}
  ><div className="max-w-3xl"><ExhibitTimeline/></div></PublicSection>;
}
