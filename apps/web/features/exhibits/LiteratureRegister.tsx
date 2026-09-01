"use client";

import { useMemo, useState } from "react";
import { ArrowUpRight, Search, X } from "lucide-react";
import { useLanguage, type Locale } from "@/components/Providers";
import {
  literatureScreeningSummary,
  researchLibrary,
  type ResearchLane,
} from "@/lib/research-library";

const laneOptions: Array<"All" | ResearchLane> = ["All", "Direct lead", "Regional & craft", "Historical context", "Comparative context"];
const laneZh: Record<(typeof laneOptions)[number], string> = { All: "全部", "Direct lead": "直接线索", "Regional & craft": "地区与工艺", "Historical context": "历史背景", "Comparative context": "比较背景" };
const typeZh = { Book: "书籍", Periodical: "期刊", Paper: "论文", Archive: "档案", "Institutional record": "机构记录" } as const;
const screeningZh = { "Page leads found": "已发现页面线索", "Metadata priority": "元数据优先", "Targeted OCR needed": "需要定向 OCR", "Context only": "仅背景资料" } as const;

function laneLabel(lane: (typeof laneOptions)[number], locale: Locale) { return locale === "zh" ? laneZh[lane] : lane; }

function ScreeningOverview() {
  const { locale } = useLanguage();
  const metrics = locale === "zh" ? [
    [literatureScreeningSummary.catalogued, "已编目记录"],
    [literatureScreeningSummary.privatePdfs, "已筛选私有 PDF"],
    [literatureScreeningSummary.textBearingPdfs, "包含可搜索文本"],
    [literatureScreeningSummary.curatedForReview, "优先人工审核"],
  ] as const : [
    [literatureScreeningSummary.catalogued, "catalogued records"],
    [literatureScreeningSummary.privatePdfs, "private PDFs screened"],
    [literatureScreeningSummary.textBearingPdfs, "with searchable text"],
    [literatureScreeningSummary.curatedForReview, "prioritized for review"],
  ] as const;

  return <section aria-label={locale === "zh" ? "文献筛选概览" : "Screening overview"} className="mb-10 border-y border-ink">
    <div className="grid grid-cols-2 lg:grid-cols-4">{metrics.map(([value, label], index) => <div key={label} className={`py-5 pr-4 ${index % 2 ? "border-l border-ink/30 pl-5" : ""} ${index > 1 ? "border-t border-ink/30 lg:border-t-0" : ""} ${index === 2 ? "lg:border-l lg:pl-5" : ""}`}><strong className="block font-display text-4xl font-normal tracking-[-.04em] text-redline">{value}</strong><span className="mt-2 block font-mono text-[9px] uppercase tracking-[.1em] text-quiet">{label}</span></div>)}</div>
    <div className="grid gap-4 border-t border-ink px-0 py-5 lg:grid-cols-[220px_1fr]">
      <h2 className="font-display text-2xl font-normal">{locale === "zh" ? "已筛选，不等于已接受。" : "Screened, not accepted."}</h2>
      <p className="max-w-3xl text-xs leading-5 text-quiet">{locale === "zh" ? "本地确定性筛选只记录术语组计数和页码，不保存摘录、测量值或来源全文。排序只用于指出下一步人工查看位置，不会创建证据，也不会解决历史争议。" : "A deterministic local pass recorded term-group counts and page numbers only—no excerpts, measurements, or source text. Ranking identifies where a researcher should look next; it does not create evidence or resolve a historical claim."}<span className="mt-2 block font-mono text-[9px] uppercase tracking-[.08em] text-ink">{locale === "zh" ? `${literatureScreeningSummary.directTermLeads} 项直接术语线索 · ${literatureScreeningSummary.regionalMaterialLeads} 项地区／物质文化线索` : `${literatureScreeningSummary.directTermLeads} direct-term lead · ${literatureScreeningSummary.regionalMaterialLeads} regional/material leads`}</span></p>
    </div>
  </section>;
}

export function LiteratureRegister({ compact = false }: { compact?: boolean }) {
  const { locale } = useLanguage();
  const [activeLane, setActiveLane] = useState<(typeof laneOptions)[number]>("All");
  const [query, setQuery] = useState("");
  const rows = useMemo(() => {
    if (compact) return researchLibrary.slice(0, 6);
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return researchLibrary.filter((item) => {
      const laneMatches = activeLane === "All" || item.lane === activeLane;
      const queryMatches = !normalizedQuery || [item.title, item.titleZh, item.creator, item.creatorZh, item.institution, item.institutionZh, item.year, item.yearZh].some((value) => value.toLocaleLowerCase().includes(normalizedQuery));
      return laneMatches && queryMatches;
    });
  }, [activeLane, compact, query]);

  const copy = locale === "zh" ? {
    reviewLane: "审核分类", search: "搜索优先来源", placeholder: "搜索标题、作者或机构…", clear: "清除搜索", showing: `显示 ${rows.length}／${researchLibrary.length} 条优先记录`, rank: "排序", year: "年份", title: "标题／作者", screening: "筛选状态", rights: "权利／访问", reference: "引用", cite: "引用", tier: "等级", pages: "页线索", noResults: "没有符合当前筛选条件的优先来源。", researchCopy: "研究副本", metadataOnly: "仅元数据",
  } : {
    reviewLane: "Review lane", search: "Search prioritized sources", placeholder: "Search title, creator, institution…", clear: "Clear search", showing: `Showing ${rows.length} of ${researchLibrary.length} prioritized records`, rank: "Rank", year: "Year", title: "Title / creator", screening: "Screening", rights: "Rights / access", reference: "Reference", cite: "Cite", tier: "Tier", pages: "pages surfaced", noResults: "No prioritized sources match this filter.", researchCopy: "Research copy", metadataOnly: "Metadata only",
  };

  return <>
    {!compact && <><ScreeningOverview/><div className="mb-8 grid gap-6 border-b border-ink pb-6 xl:grid-cols-[1fr_320px] xl:items-end"><div><p className="font-mono text-[9px] uppercase tracking-[.12em] text-quiet">{copy.reviewLane}</p><div className="mt-4 flex flex-wrap gap-x-5 gap-y-3" aria-label={copy.reviewLane}>{laneOptions.map((lane) => <button key={lane} type="button" aria-pressed={activeLane === lane} onClick={() => setActiveLane(lane)} className={`focus-ring border-b pb-1 font-mono text-[10px] uppercase tracking-[.07em] transition-colors ${activeLane === lane ? "border-redline text-redline" : "border-transparent text-quiet hover:border-ink hover:text-ink"}`}>{laneLabel(lane, locale)}</button>)}</div></div><label className="relative block"><span className="sr-only">{copy.search}</span><Search className="absolute left-0 top-1/2 -translate-y-1/2 text-quiet" size={15} aria-hidden="true"/><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={copy.placeholder} className="focus-ring w-full border-0 border-b border-ink bg-transparent py-3 pl-7 pr-8 font-mono text-[11px] outline-none placeholder:text-quiet/70"/>{query && <button type="button" onClick={() => setQuery("")} className="focus-ring absolute right-0 top-1/2 -translate-y-1/2 text-quiet hover:text-ink" aria-label={copy.clear}><X size={14}/></button>}</label></div><p className="mb-4 font-mono text-[9px] uppercase tracking-[.1em] text-quiet" aria-live="polite">{copy.showing}</p></>}

    <div className="library-register border-t border-ink">
      <div className="md:hidden">{rows.map((item) => {
        const title = locale === "zh" ? item.titleZh : item.title;
        return <article key={item.rank} className="border-b border-ink/30 py-5"><div className="flex items-start justify-between gap-5 font-mono text-[9px] uppercase tracking-[.08em]"><span className="font-display text-xl text-redline">{String(item.rank).padStart(2, "0")}</span><span className="text-right">{locale === "zh" ? typeZh[item.type] : item.type} · {copy.tier} {item.tier}<span className="mt-1 block text-quiet">{locale === "zh" ? item.yearZh : item.year}</span></span></div><h3 className="mt-5 font-display text-2xl font-normal leading-tight">{title}</h3><p className="mt-2 text-xs leading-5 text-quiet">{locale === "zh" ? item.creatorZh : item.creator}</p>{!compact && <div className="mt-5 grid grid-cols-2 gap-4 border-y border-ink/20 py-3 font-mono text-[9px] uppercase leading-4 tracking-[.06em]"><span>{laneLabel(item.lane, locale)}</span><span className="text-right text-quiet">{locale === "zh" ? screeningZh[item.screening] : item.screening}{item.locatedPages ? ` · ${item.locatedPages} ${copy.pages}` : ""}</span></div>}<p className="mt-4 text-xs leading-5">{locale === "zh" ? item.institutionZh : item.institution}<span className="mt-1 block text-quiet">{locale === "zh" ? item.rightsZh : item.rights} · {item.access === "Research copy" ? copy.researchCopy : copy.metadataOnly}</span></p>{!compact && <p className="mt-3 text-xs leading-5 text-quiet">{locale === "zh" ? item.noteZh : item.note}</p>}<a className="focus-ring mt-5 inline-flex items-center gap-1 border-b border-redline pb-1 font-mono text-[9px] uppercase tracking-[.08em] text-redline no-underline" href={item.url} target="_blank" rel="noreferrer">{copy.cite} <ArrowUpRight size={11}/></a></article>;
      })}</div>
      <div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[1180px] border-collapse text-left"><thead><tr>{[copy.rank, copy.reviewLane, copy.year, copy.title, copy.screening, copy.rights, copy.reference].map((heading) => <th key={heading} className="border-b border-ink px-3 py-3 font-mono text-[9px] font-medium uppercase tracking-[.13em] text-quiet first:pl-0 last:pr-0">{heading}</th>)}</tr></thead><tbody>{rows.map((item) => <tr key={item.rank} className="group align-top"><td className="w-14 border-b border-ink/20 py-4 pr-3 font-display text-xl tabular-nums text-redline">{String(item.rank).padStart(2, "0")}</td><td className="w-40 border-b border-ink/20 px-3 py-4 font-mono text-[10px] uppercase leading-4 tracking-[.06em]">{laneLabel(item.lane, locale)}<span className="mt-1 block text-quiet">{locale === "zh" ? typeZh[item.type] : item.type} · {copy.tier} {item.tier}</span></td><td className="w-24 border-b border-ink/20 px-3 py-4 font-mono text-[10px]">{locale === "zh" ? item.yearZh : item.year}</td><td className="max-w-[360px] border-b border-ink/20 px-3 py-4"><strong className="block font-display text-lg font-normal leading-snug">{locale === "zh" ? item.titleZh : item.title}</strong><span className="mt-2 block text-xs leading-5 text-quiet">{locale === "zh" ? item.creatorZh : item.creator}</span>{!compact && <span className="mt-2 block text-[11px] leading-5 text-quiet">{locale === "zh" ? item.noteZh : item.note}</span>}</td><td className="w-40 border-b border-ink/20 px-3 py-4 font-mono text-[10px] uppercase leading-4 tracking-[.06em]">{locale === "zh" ? screeningZh[item.screening] : item.screening}{item.locatedPages && <span className="mt-1 block text-redline">{item.locatedPages} {copy.pages}</span>}</td><td className="border-b border-ink/20 px-3 py-4 text-xs leading-5">{locale === "zh" ? item.rightsZh : item.rights}<span className="mt-1 block text-quiet">{item.access === "Research copy" ? copy.researchCopy : copy.metadataOnly}</span><span className="mt-2 block text-quiet">{locale === "zh" ? item.institutionZh : item.institution}</span></td><td className="w-24 border-b border-ink/20 py-4 pl-3 text-right"><a className="focus-ring inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[.08em] text-redline no-underline hover:underline" href={item.url} target="_blank" rel="noreferrer">{copy.cite} <ArrowUpRight size={12}/></a></td></tr>)}</tbody></table>{rows.length === 0 && <p className="border-b border-ink/20 py-12 text-center font-display text-2xl text-quiet">{copy.noResults}</p>}</div>
    </div>
  </>;
}
