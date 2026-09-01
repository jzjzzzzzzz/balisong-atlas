import type { Metadata } from "next";
import Image from "next/image";
import { PublicSection } from "@/features/exhibits/PublicSection";
import { StatusPill } from "@/components/StatusPill";
import { EvidenceLegend } from "@/components/EvidenceLegend";
import { LocalizedText } from "@/components/LocalizedText";

export async function generateMetadata(): Promise<Metadata> { return { title: "Fictional Kinetic Folding Artifact A-01", description: "A fictional, unitless evidence-workflow fixture.", openGraph: { images: [] }, twitter: { images: [] } }; }

export default async function Page({ params }: { params: Promise<{ slug: string; artifactSlug: string }> }) {
  const { slug } = await params;
  const fields = [
    ["Institution", "机构", "Fictional Fixture Lab", "虚构测试实验室"],
    ["Date", "时间", "Fictional study; no historical date", "虚构研究；没有历史日期"],
    ["Geography", "地理信息", "Unknown / not assigned", "未知／未指定"],
    ["Sources", "来源", "Three reviewed fixtures", "三份已审核测试资料"],
    ["Disputes", "争议", "One unresolved attribution", "一项尚未解决的归属问题"],
  ] as const;
  return <PublicSection
    slug={slug}
    eyebrow={{ en: "Reconstruction subject · DEMO-A-01", zh: "重建对象 · DEMO-A-01" }}
    title={{ en: "Fictional Kinetic Folding Artifact A-01", zh: "虚构动态折叠物件 A-01" }}
    intro={{ en: "A wholly fictional record created solely to demonstrate source processing, review, contradiction, rights, and safe visualization.", zh: "一条完全虚构的记录，仅用于演示来源处理、人工审核、矛盾记录、权利管理和安全视觉展示。" }}
  ><div className="mb-8"><StatusPill>verified</StatusPill></div><div className="grid gap-8 lg:grid-cols-2"><div className="relative aspect-[3/2] overflow-hidden rounded-2xl"><Image src="/abstract-study-a.png" alt="Fictional abstract study" fill className="object-cover"/></div><dl className="grid content-start grid-cols-[auto_1fr] gap-x-5 gap-y-4 text-sm">{fields.map(([enTerm,zhTerm,enValue,zhValue]) => <div className="contents" key={enTerm}><dt className="text-quiet"><LocalizedText en={enTerm} zh={zhTerm}/></dt><dd><LocalizedText en={enValue} zh={zhValue}/></dd></div>)}</dl></div><div className="mt-10"><EvidenceLegend/></div></PublicSection>;
}
