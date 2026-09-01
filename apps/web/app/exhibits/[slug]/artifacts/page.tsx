import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PublicSection } from "@/features/exhibits/PublicSection";
import { StatusPill } from "@/components/StatusPill";
import { LocalizedText } from "@/components/LocalizedText";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <PublicSection
    slug={slug}
    eyebrow={{ en: "Collection records", zh: "藏品记录" }}
    title={{ en: "Artifacts & design hypotheses", zh: "历史物件与设计假设" }}
    intro={{ en: "A record may represent a documented object, a design type, or a bounded reconstruction subject. Exact technical fields are intentionally absent.", zh: "记录可以表示有文献依据的物件、设计类型或有明确边界的重建对象。系统有意不设置精确技术参数字段。" }}
  >{slug === "balisong-atlas-demo" ? <Link href={`/exhibits/${slug}/artifacts/fictional-kinetic-folding-artifact-a-01`} className="group block rounded-3xl border border-ink/10 bg-white/50 p-7 no-underline"><StatusPill>verified</StatusPill><h2 className="mt-8 font-display text-4xl"><LocalizedText en="Fictional Kinetic Folding Artifact A-01" zh="虚构动态折叠物件 A-01"/></h2><p className="mt-3 max-w-2xl text-quiet"><LocalizedText en="A unitless abstract fixture used solely to validate evidence review and the safe museum visualization workflow." zh="一个没有真实单位的抽象测试物件，仅用于验证证据审核和安全博物馆视觉展示流程。"/></p><span className="mt-7 inline-flex items-center gap-2 text-sm font-bold"><LocalizedText en="Open record" zh="打开记录"/> <ArrowRight size={15} className="transition group-hover:translate-x-1"/></span></Link> : <div className="rounded-3xl border border-dashed border-ink/20 p-12 text-center text-quiet"><LocalizedText en="No reviewed artifact records have been published." zh="目前尚未发布经过审核的历史物件记录。"/></div>}</PublicSection>;
}
