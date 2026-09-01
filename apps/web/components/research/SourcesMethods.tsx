"use client";

import { useMemo, useState } from "react";
import type { ResearchPaperData } from "@/lib/research-paper";
import { useLanguage } from "@/components/Providers";
import { labels } from "./research-labels";
import { FigureWithAttribution } from "./FigureWithAttribution";

export function SourcesMethods({ data }: { data: ResearchPaperData }) {
  const { locale } = useLanguage();
  const t = labels[locale];
  const [filter, setFilter] = useState("all");
  const filtered = filter === "all" ? data.sources : data.sources.filter((source) => source.verification_status === filter);
  const distributions = useMemo(() => {
    const count = (field: string) => data.sources.reduce<Record<string, number>>((acc, source) => { const key = source[field] || "unspecified"; acc[key] = (acc[key] ?? 0) + 1; return acc; }, {});
    return { type: count("source_category"), geography: count("geographic_perspective"), primary: count("primary_or_secondary") };
  }, [data.sources]);
  const sourceFigure = data.figures.find((figure) => figure.figure_id === "F05");
  return <div className="mx-auto max-w-[1240px] px-5 py-12 md:px-10 lg:px-16" data-testid="sources-methods">
    <section className="grid gap-8 border-b border-ink/20 pb-12 lg:grid-cols-[1fr_1fr]">
      <div><p className="font-mono text-[10px] uppercase tracking-[.14em] text-quiet">{t.methodology}</p><h2 className="mt-4 font-serif text-5xl leading-none">{locale === "zh" ? "来源不是数量游戏" : "Source count is not evidentiary weight"}</h2></div>
      <p className="text-base leading-8 text-quiet">{locale === "zh" ? "候选来源必须分别记录全文状态、来源层级、地理视角、权利、依赖关系和实际阅读范围。检索结果和摘要可以帮助发现资料，却不能代替正式原文。" : "Every candidate is recorded with its access status, tier, geographic perspective, rights, dependencies, and actual reading scope. Search results and abstracts can support discovery; they cannot stand in for a source text."}</p>
    </section>
    <div className="mt-10 grid gap-px border border-ink/20 bg-ink/20 sm:grid-cols-2 lg:grid-cols-4">
      <Stat value={data.stats.candidateSourceCount} label={t.sourcesChecked} />
      <Stat value={data.stats.citedSourceCount} label={t.citedSources} />
      <Stat value={data.stats.lawfulLocalResearchCopies} label={t.localCopies} />
      <Stat value={data.stats.figureCount} label={t.figures} />
    </div>
    {sourceFigure && <FigureWithAttribution figure={sourceFigure} stats={data.stats} />}
    <section className="mt-12 grid gap-6 md:grid-cols-3">
      <MethodCard title={t.inclusion} items={locale === "zh" ? ["正式法条、判决与政府文件", "取得全文的同行评审研究", "菲律宾高校与文化机构资料", "有 provenance 与明确权利的图像", "摘要资料仅用于其明确陈述"] : ["Official statutes, judgments, and government records", "Peer-reviewed scholarship with accessible text", "Philippine university and cultural-institution sources", "Images with provenance and explicit rights", "Abstract records used only for their stated abstracts"]} />
      <MethodCard title={t.exclusion} items={locale === "zh" ? ["商品、交易与品牌营销页面", "论坛、社交媒体与匿名起源文章", "动作教学或操作视频", "盗版与绕过付费墙取得的资料", "专利技术图和制造文件"] : ["Product, marketplace, and brand-marketing pages", "Forums, social posts, and anonymous origin pages", "Instructional or operational videos", "Pirated or paywall-bypassed texts", "Patent drawings and technical production records"]} />
      <MethodCard title={t.limitations} items={locale === "zh" ? ["地方工匠口述史不足", "Filipino 语和市政档案不完整", "1969 年原始宣传册未取得", "缺少当代表演社群专题民族志", "法律研究不是全面辖区调查"] : ["Insufficient maker-centered oral histories", "Incomplete Filipino-language and municipal archives", "Original 1969 brochure not acquired", "No dedicated ethnography of performance communities", "Legal research is not an exhaustive jurisdiction survey"]} />
    </section>
    <section className="mt-12 grid gap-6 lg:grid-cols-3">
      <Distribution title={locale === "zh" ? "一手 / 二手" : "Primary / secondary"} values={distributions.primary} />
      <Distribution title={locale === "zh" ? "主要地理视角" : "Geographic perspectives"} values={distributions.geography} limit={6} />
      <Distribution title={locale === "zh" ? "来源类型" : "Source types"} values={distributions.type} limit={6} />
    </section>
    <section className="mt-12 border-y border-ink/20 py-8" data-testid="legal-disclaimer">
      <p className="font-mono text-[10px] uppercase tracking-[.14em] text-quiet">{t.legalNotice} · {data.stats.legalSourcesAsOf}</p>
      <p className="mt-4 max-w-4xl font-serif text-2xl leading-snug">{t.legalText}</p>
    </section>
    <section className="mt-12 border border-ink/20 p-6" data-testid="ai-disclosure"><p className="font-mono text-[10px] uppercase tracking-[.14em] text-quiet">{t.aiTitle}</p><p className="mt-4 max-w-4xl text-sm leading-7">{data.stats.aiDisclosure[locale]} {locale === "zh" ? "所有正式引用均回到已识别的原文、机构记录或官方法律文本；作者对最终论证负责。" : "Every formal citation returns to an identified source text, institutional record, or official legal document; the authors remain responsible for the argument."}</p></section>
    <section className="mt-14">
      <div className="flex flex-wrap items-end justify-between gap-5 border-b border-ink/20 pb-5">
        <div><p className="font-mono text-[10px] uppercase tracking-[.14em] text-quiet">{data.sources.length} records</p><h2 className="mt-2 font-serif text-4xl">{t.sourceRegister}</h2></div>
        <select value={filter} onChange={(event) => setFilter(event.target.value)} className="focus-ring border border-ink bg-paper px-3 py-2 text-sm" aria-label={t.status}>
          <option value="all">{locale === "zh" ? "全部状态" : "All statuses"}</option>
          <option value="verified_full_text">verified_full_text</option><option value="verified_partial">verified_partial</option><option value="abstract_only">abstract_only</option><option value="metadata_only">metadata_only</option>
        </select>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">{filtered.map((source) => <article key={source.source_id} className="border border-ink/20 p-5">
        <div className="flex flex-wrap gap-2 font-mono text-[9px] uppercase tracking-[.1em] text-quiet"><span>{source.source_tier}</span><span>·</span><span>{source.verification_status}</span><span>·</span><span>{source.primary_or_secondary}</span></div>
        <h3 className="mt-3 font-serif text-xl leading-snug">{source.full_citation}</h3>
        <p className="mt-3 text-xs leading-5 text-quiet">{source.evidence_contributed}</p>
        <p className="mt-3 border-t border-ink/15 pt-3 text-[11px] leading-5"><strong>{locale === "zh" ? "限制：" : "Limit: "}</strong>{source.limitations}</p>
      </article>)}</div>
    </section>
  </div>;
}

function Stat({ value, label }: { value: number; label: string }) { return <div className="bg-paper p-5"><strong className="font-serif text-4xl">{value}</strong><p className="mt-2 text-xs text-quiet">{label}</p></div>; }
function MethodCard({ title, items }: { title: string; items: string[] }) { return <article className="border-t-4 border-ink bg-parchment p-5"><h3 className="font-serif text-2xl">{title}</h3><ul className="mt-5 space-y-3 text-sm leading-6">{items.map((item) => <li key={item} className="flex gap-3"><span aria-hidden="true">—</span><span>{item}</span></li>)}</ul></article>; }
function Distribution({ title, values, limit = 8 }: { title: string; values: Record<string, number>; limit?: number }) { const items = Object.entries(values).sort((a,b) => b[1]-a[1]).slice(0,limit); return <article className="border border-ink/20 p-5"><h3 className="font-mono text-[10px] uppercase tracking-[.14em]">{title}</h3><ul className="mt-5 space-y-3">{items.map(([key,value]) => <li key={key} className="flex items-center justify-between gap-4 text-xs"><span>{key}</span><strong className="font-mono">{value}</strong></li>)}</ul></article>; }
