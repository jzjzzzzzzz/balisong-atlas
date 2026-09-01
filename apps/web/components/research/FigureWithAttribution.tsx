"use client";

/* eslint-disable @next/next/no-img-element */
import type { FigureRecord, ResearchStats } from "@/lib/research-paper";
import { useLanguage } from "@/components/Providers";
import { labels } from "./research-labels";

export function FigureWithAttribution({ figure, stats }: { figure: FigureRecord; stats: ResearchStats }) {
  const { locale } = useLanguage();
  const t = labels[locale];
  if (figure.public_display_allowed !== "true" || figure.rights_status === "unknown") return null;
  const paths = figure.filename.split("|");
  return <figure className="paper-figure my-12 border-y border-ink/25 py-6" data-testid={`figure-${figure.figure_id}`}>
    <div className="mb-4 flex items-center justify-between gap-3">
      <span className="font-mono text-[9px] uppercase tracking-[.15em]">{t.figure} {figure.figure_id.slice(1)}</span>
      <span className="font-mono text-[9px] uppercase tracking-[.12em] text-quiet">{figure.rights_status} · {figure.license}</span>
    </div>
    {figure.filename === "component:EvidenceTimeline" ? <EvidenceTimeline /> : figure.filename === "component:SourceDistribution" ? <SourceDistribution stats={stats} /> : paths.length > 1 ? <div className="grid gap-px overflow-hidden border border-ink/20 bg-ink/20 md:grid-cols-2">{paths.map((src) => <div key={src} className="min-h-72 bg-parchment"><img src={src} alt={figure.alt_text} className="h-full min-h-72 w-full object-contain" /></div>)}</div> : figure.filename.startsWith("/") ? <div className="min-h-72 bg-parchment"><img src={figure.filename} alt={figure.alt_text} className="mx-auto max-h-[620px] w-full object-contain" /></div> : null}
    <figcaption className="mt-5 grid gap-3 text-sm leading-6 md:grid-cols-[1fr_260px]">
      <p><strong>{figure.title}.</strong> {figure.caption}</p>
      <p className="text-xs text-quiet">{figure.attribution}{figure.synthetic === "true" && <><br /><span className="font-semibold text-ink">{t.synthetic}</span></>}</p>
    </figcaption>
  </figure>;
}

function EvidenceTimeline() {
  const { locale } = useLanguage();
  const points = locale === "zh" ? [
    ["1947", "菲律宾印刷语汇"], ["1951", "Batangas 产业记录"], ["1969", "国家展示引用链"], ["1971", "海关分类公告"], ["1994–2024", "机构遗产表述"],
  ] : [["1947", "Philippine print vocabulary"], ["1951", "Batangas industry report"], ["1969", "National-display citation chain"], ["1971", "Customs classification notice"], ["1994–2024", "Institutional heritage framing"]];
  return <div className="grid border border-ink/20 sm:grid-cols-5">{points.map(([year, text], index) => <div key={year} className="relative border-b border-ink/20 p-4 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
    <div className="mb-4 flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-moss" /><span className="font-mono text-xs">{year}</span></div>
    <p className="text-xs leading-5">{text}</p>{index < points.length - 1 && <span className="absolute right-[-5px] top-[22px] z-10 hidden h-px w-[9px] bg-ink sm:block" />}
  </div>)}</div>;
}

function SourceDistribution({ stats }: { stats: ResearchStats }) {
  const { locale } = useLanguage();
  const items = [
    [locale === "zh" ? "已核验全文" : "Verified full text", stats.sourceStatuses.verified_full_text],
    [locale === "zh" ? "已核验部分正文" : "Verified partial", stats.sourceStatuses.verified_partial],
    [locale === "zh" ? "仅摘要" : "Abstract only", stats.sourceStatuses.abstract_only],
    [locale === "zh" ? "仅目录信息" : "Metadata only", stats.sourceStatuses.metadata_only],
  ] as const;
  return <div className="space-y-4 border border-ink/20 p-5">{items.map(([label, value]) => <div key={label} className="grid grid-cols-[140px_1fr_32px] items-center gap-3 text-xs"><span>{label}</span><span className="h-2 bg-ink/10"><span className="block h-full bg-moss" style={{ width: `${(value / stats.candidateSourceCount) * 100}%` }} /></span><strong className="font-mono">{value}</strong></div>)}</div>;
}
