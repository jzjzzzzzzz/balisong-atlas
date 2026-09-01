"use client";

import type { ResearchPaperData } from "@/lib/research-paper";
import { useLanguage } from "@/components/Providers";
import { labels } from "./research-labels";

export function Bibliography({ entries }: { entries: ResearchPaperData["bibliography"] }) {
  const { locale } = useLanguage();
  const t = labels[locale];
  const groups = [
    ["primary", t.primary], ["scholarship", t.scholarship], ["institutional", t.institutional],
  ] as const;
  return <section id="bibliography" className="paper-bibliography border-t border-ink/20 pt-12" data-testid="bibliography">
    <h2 className="font-serif text-4xl">{t.bibliography}</h2>
    {groups.map(([category, title]) => <div key={category} className="mt-10">
      <h3 className="border-b border-ink/20 pb-3 font-mono text-[10px] uppercase tracking-[.15em]">{title}</h3>
      <ul className="mt-5 space-y-5 text-sm leading-6">
        {entries.filter((entry) => entry.category === category).map((entry) => {
          const href = entry.fields.doi ? `https://doi.org/${entry.fields.doi}` : entry.fields.url;
          return <li key={entry.key} className="pl-7 -indent-7" data-citation-key={entry.key}>
            {entry.formatted}{href && <> <a href={href} target="_blank" rel="noopener noreferrer" className="focus-ring break-all font-mono text-[10px] underline decoration-ink/30 underline-offset-4">[{locale === "zh" ? "来源" : "source"}]</a></>}
          </li>;
        })}
      </ul>
    </div>)}
  </section>;
}
