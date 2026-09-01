import { PublicSection } from "@/features/exhibits/PublicSection";
import { EvidenceEraTimeline } from "@/features/exhibits/EvidenceEraTimeline";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <PublicSection
    slug={slug}
    eyebrow={{ en: "Evidence-gated chronology", zh: "证据门禁时间序列" }}
    title={{ en: "Design evolution timeline", zh: "设计演变时间轴" }}
    intro={{ en: "Select a research period to inspect its sources, review status, uncertainty, and readiness for a nonfunctional visual proxy. Period frames are not historical conclusions.", zh: "选择一个研究时期，查看其来源、审核状态、不确定性以及生成非功能性视觉代理的准备程度。时期框架不等于历史结论。" }}
    workspace
  ><EvidenceEraTimeline /></PublicSection>;
}
