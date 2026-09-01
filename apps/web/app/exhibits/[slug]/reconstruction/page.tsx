import { PublicSection } from "@/features/exhibits/PublicSection";
import { EvidenceLegend } from "@/components/EvidenceLegend";
import { SafeProxyViewer } from "@/features/reconstruction/SafeProxyViewer";
import { LocalizedText } from "@/components/LocalizedText";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <PublicSection
    slug={slug}
    eyebrow={{ en: "Visual hypothesis", zh: "视觉假设" }}
    title={{ en: "Nonfunctional museum visualization", zh: "非功能性博物馆视觉展示" }}
    intro={{ en: "This public proxy expresses reviewed, non-mechanical appearance only. It has no real unit or scale, no internal structure, and no movable components.", zh: "此公共视觉代理只表现经过审核的非机械性外观。它没有真实单位或比例、没有内部结构，也没有活动部件。" }}
  ><EvidenceLegend/><div className="mt-8"><SafeProxyViewer/></div><p className="mt-5 rounded-xl border border-ochre/20 bg-ochre/5 p-5 text-sm leading-6"><LocalizedText en="This reconstruction is a nonfunctional, evidence-based visual hypothesis. It is not a manufacturing model or an exact historical replica." zh="本重建是一个非功能性、以证据为基础的视觉假设，不是制造模型，也不是被宣称为完全准确的历史复制品。"/></p></PublicSection>;
}
