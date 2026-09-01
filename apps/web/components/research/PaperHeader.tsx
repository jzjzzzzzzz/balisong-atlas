"use client";

import type { PaperMeta, ResearchStats } from "@/lib/research-paper";
import { useLanguage } from "@/components/Providers";
import { labels } from "./research-labels";

export function PaperHeader({ meta, stats }: { meta: PaperMeta; stats: ResearchStats }) {
  const { locale } = useLanguage();
  const t = labels[locale];
  const readingMinutes = Math.ceil(stats.articleWordCount / 230);
  return <header className="paper-header border-b border-ink/20 px-5 pb-10 pt-12 md:px-10 lg:px-16">
    <div className="mx-auto max-w-[1200px]">
      <div className="mb-8 flex flex-wrap items-center gap-3 font-mono text-[10px] uppercase tracking-[.16em]">
        <span className="border border-ink bg-ink px-3 py-2 text-paper" data-testid="research-draft-status">{t.draft}</span>
        <span>{t.chicago}</span><span aria-hidden="true">·</span><span>{stats.articleWordCount.toLocaleString(locale === "zh" ? "zh-CN" : "en-US")} {t.words}</span>
        <span aria-hidden="true">·</span><span>{readingMinutes} {t.read}</span>
      </div>
      <h1 className="max-w-[980px] font-serif text-[clamp(3rem,7vw,6.3rem)] leading-[.9] tracking-[-.055em]">
        {locale === "zh" ? meta.title_zh : meta.title}
      </h1>
      <p className="mt-6 max-w-[970px] font-serif text-[clamp(1.4rem,2.8vw,2.65rem)] leading-[1.04] tracking-[-.035em] text-quiet">
        {locale === "zh" ? meta.subtitle_zh : meta.subtitle}
      </p>
      <dl className="mt-10 grid grid-cols-2 border-y border-ink/20 text-sm lg:grid-cols-4">
        <Meta label={t.author} value={locale === "zh" ? "Balisong Atlas 研究团队" : meta.authors.join(", ")} />
        <Meta label={t.verified} value={meta.last_verified} />
        <Meta label={t.legalAsOf} value={meta.legal_sources_as_of} />
        <Meta label={t.disclosure} value={locale === "zh" ? "已披露" : "Disclosed"} />
      </dl>
    </div>
  </header>;
}

function Meta({ label, value }: { label: string; value: string }) {
  return <div className="border-b border-ink/20 py-5 pr-5 last:border-b-0 odd:border-r lg:border-b-0 lg:border-r lg:last:border-r-0">
    <dt className="font-mono text-[9px] uppercase tracking-[.14em] text-quiet">{label}</dt>
    <dd className="mt-2">{value}</dd>
  </div>;
}
