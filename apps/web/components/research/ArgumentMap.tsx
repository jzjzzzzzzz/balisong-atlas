"use client";

import { useMemo, useState } from "react";
import type { ArgumentNode, ResearchPaperData } from "@/lib/research-paper";
import { useLanguage } from "@/components/Providers";
import { EvidenceBadge } from "./EvidenceBadge";
import { labels } from "./research-labels";

export function ArgumentMapView({ map, sources, claims }: { map: ResearchPaperData["argumentMap"]; sources: ResearchPaperData["sources"]; claims: ResearchPaperData["claims"] }) {
  const { locale } = useLanguage();
  const t = labels[locale];
  const [selectedId, setSelectedId] = useState(map.center.id);
  const nodes = useMemo(() => [map.center, ...map.branches, ...map.branches.flatMap((branch) => branch.children ?? [])], [map]);
  const selected = nodes.find((node) => node.id === selectedId) ?? map.center;
  const sourceIndex = useMemo(() => new Map(sources.map((source) => [source.citation_key, source])), [sources]);
  const relatedClaims = claims.filter((claim) => selected.claimIds.includes(claim.claim_id));
  return <div className="argument-layout grid gap-8 lg:grid-cols-[1fr_360px]" data-testid="argument-map">
    <div className="argument-map-canvas border border-ink/20 p-5 md:p-8">
      <NodeButton node={map.center} active={selectedId === map.center.id} onSelect={setSelectedId} locale={locale} center />
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {map.branches.map((branch) => <div key={branch.id} className="border border-ink/20 p-4">
          <NodeButton node={branch} active={selectedId === branch.id} onSelect={setSelectedId} locale={locale} />
          <div className="mt-3 flex flex-wrap gap-2">{branch.children?.map((child) => <NodeButton key={child.id} node={child} active={selectedId === child.id} onSelect={setSelectedId} locale={locale} small />)}</div>
        </div>)}
      </div>
      <p className="mt-6 border-t border-ink/20 pt-4 font-mono text-[9px] uppercase tracking-[.12em] text-quiet">{t.synthetic}</p>
    </div>
    <aside className="border-t-4 border-ink bg-parchment p-6" aria-live="polite">
      <EvidenceBadge status={selected.status} />
      <h2 className="mt-4 font-serif text-3xl leading-tight">{selected.label[locale]}</h2>
      {selected.summary && <p className="mt-4 text-sm leading-6">{selected.summary[locale]}</p>}
      <h3 className="mt-7 font-mono text-[9px] uppercase tracking-[.14em] text-quiet">{t.related}</h3>
      <ul className="mt-3 space-y-3 text-sm leading-5">{relatedClaims.map((claim) => <li key={claim.claim_id}><a href={`#${selected.sectionId ?? "section-7"}`} className="focus-ring underline decoration-ink/25 underline-offset-4">{claim.claim_id} · {locale === "zh" ? claim.final_wording : claim.proposed_claim}</a></li>)}</ul>
      <h3 className="mt-7 font-mono text-[9px] uppercase tracking-[.14em] text-quiet">{t.source}</h3>
      <ul className="mt-3 space-y-3 text-xs leading-5">{selected.sourceKeys?.map((key) => <li key={key}><SourceLink source={sourceIndex.get(key)} citationKey={key} /></li>)}</ul>
      {!!selected.contradictingSourceKeys?.length && <><h3 className="mt-7 font-mono text-[9px] uppercase tracking-[.14em] text-quiet">{t.counter}</h3><ul className="mt-3 space-y-3 text-xs">{selected.contradictingSourceKeys.map((key) => <li key={key}><SourceLink source={sourceIndex.get(key)} citationKey={key} /></li>)}</ul></>}
    </aside>
  </div>;
}

function NodeButton({ node, active, onSelect, locale, center = false, small = false }: { node: ArgumentNode; active: boolean; onSelect: (id: string) => void; locale: "en" | "zh"; center?: boolean; small?: boolean }) {
  return <button type="button" onClick={() => onSelect(node.id)} aria-pressed={active} className={`focus-ring text-left transition ${center ? "mx-auto block min-w-[240px] border-2 px-6 py-5 text-center font-serif text-2xl" : small ? "border px-2 py-2 text-[11px]" : "w-full border-b pb-3 font-serif text-xl"} ${active ? "border-ink bg-ink text-paper" : "border-ink/30 hover:border-ink"}`}>{node.label[locale]}</button>;
}

function SourceLink({ source, citationKey }: { source?: Record<string, string>; citationKey: string }) {
  if (!source) return <span>{citationKey}</span>;
  return <span><strong>{source.full_citation}</strong><br /><span className="text-quiet">{source.verification_status} · {source.source_tier}</span></span>;
}
