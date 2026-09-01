"use client";

import { useMemo, useState } from "react";
import { ArrowUpRight, Search, X } from "lucide-react";
import {
  literatureScreeningSummary,
  researchLibrary,
  type ResearchLane,
} from "@/lib/research-library";

const laneOptions: Array<"All" | ResearchLane> = [
  "All",
  "Direct lead",
  "Regional & craft",
  "Historical context",
  "Comparative context",
];

function ScreeningOverview() {
  const metrics = [
    [literatureScreeningSummary.catalogued, "catalogued records"],
    [literatureScreeningSummary.privatePdfs, "private PDFs screened"],
    [literatureScreeningSummary.textBearingPdfs, "with searchable text"],
    [literatureScreeningSummary.curatedForReview, "prioritized for review"],
  ] as const;

  return (
    <section aria-label="Screening overview" className="mb-10 border-y border-ink">
      <div className="grid grid-cols-2 lg:grid-cols-4">
        {metrics.map(([value, label], index) => (
          <div
            key={label}
            className={`py-5 pr-4 ${index % 2 ? "border-l border-ink/30 pl-5" : ""} ${index > 1 ? "border-t border-ink/30 lg:border-t-0" : ""} ${index === 2 ? "lg:border-l lg:pl-5" : ""}`}
          >
            <strong className="block font-display text-4xl font-normal tracking-[-.04em] text-redline">{value}</strong>
            <span className="mt-2 block font-mono text-[9px] uppercase tracking-[.1em] text-quiet">{label}</span>
          </div>
        ))}
      </div>
      <div className="grid gap-4 border-t border-ink px-0 py-5 lg:grid-cols-[220px_1fr]">
        <h2 className="font-display text-2xl font-normal">Screened, not accepted.</h2>
        <p className="max-w-3xl text-xs leading-5 text-quiet">
          A deterministic local pass recorded term-group counts and page numbers only—no excerpts, measurements, or source text. Ranking identifies where a researcher should look next; it does not create evidence or resolve a historical claim.
          <span className="mt-2 block font-mono text-[9px] uppercase tracking-[.08em] text-ink">{literatureScreeningSummary.directTermLeads} direct-term lead · {literatureScreeningSummary.regionalMaterialLeads} regional/material leads</span>
        </p>
      </div>
    </section>
  );
}

export function LiteratureRegister({ compact = false }: { compact?: boolean }) {
  const [activeLane, setActiveLane] = useState<(typeof laneOptions)[number]>("All");
  const [query, setQuery] = useState("");
  const rows = useMemo(() => {
    if (compact) return researchLibrary.slice(0, 6);
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return researchLibrary.filter((item) => {
      const laneMatches = activeLane === "All" || item.lane === activeLane;
      const queryMatches = !normalizedQuery || [item.title, item.creator, item.institution, item.year]
        .some((value) => value.toLocaleLowerCase().includes(normalizedQuery));
      return laneMatches && queryMatches;
    });
  }, [activeLane, compact, query]);

  return (
    <>
      {!compact && (
        <>
          <ScreeningOverview />
          <div className="mb-8 grid gap-6 border-b border-ink pb-6 xl:grid-cols-[1fr_320px] xl:items-end">
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[.12em] text-quiet">Review lane</p>
              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-3" aria-label="Filter by review lane">
                {laneOptions.map((lane) => (
                  <button
                    key={lane}
                    type="button"
                    aria-pressed={activeLane === lane}
                    onClick={() => setActiveLane(lane)}
                    className={`focus-ring border-b pb-1 font-mono text-[10px] uppercase tracking-[.07em] transition-colors ${activeLane === lane ? "border-redline text-redline" : "border-transparent text-quiet hover:border-ink hover:text-ink"}`}
                  >
                    {lane}
                  </button>
                ))}
              </div>
            </div>
            <label className="relative block">
              <span className="sr-only">Search prioritized sources</span>
              <Search className="absolute left-0 top-1/2 -translate-y-1/2 text-quiet" size={15} aria-hidden="true" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search title, creator, institution…"
                className="focus-ring w-full border-0 border-b border-ink bg-transparent py-3 pl-7 pr-8 font-mono text-[11px] outline-none placeholder:text-quiet/70"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="focus-ring absolute right-0 top-1/2 -translate-y-1/2 text-quiet hover:text-ink"
                  aria-label="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </label>
          </div>
          <p className="mb-4 font-mono text-[9px] uppercase tracking-[.1em] text-quiet" aria-live="polite">
            Showing {rows.length} of {researchLibrary.length} prioritized records
          </p>
        </>
      )}

      <div className="library-register border-t border-ink">
        <div className="md:hidden">
          {rows.map((item) => (
            <article key={item.rank} className="border-b border-ink/30 py-5">
              <div className="flex items-start justify-between gap-5 font-mono text-[9px] uppercase tracking-[.08em]">
                <span className="font-display text-xl text-redline">{String(item.rank).padStart(2, "0")}</span>
                <span className="text-right">{item.type} · Tier {item.tier}<span className="mt-1 block text-quiet">{item.year}</span></span>
              </div>
              <h3 className="mt-5 font-display text-2xl font-normal leading-tight">{item.title}</h3>
              <p className="mt-2 text-xs leading-5 text-quiet">{item.creator}</p>
              {!compact && (
                <div className="mt-5 grid grid-cols-2 gap-4 border-y border-ink/20 py-3 font-mono text-[9px] uppercase leading-4 tracking-[.06em]">
                  <span>{item.lane}</span>
                  <span className="text-right text-quiet">{item.screening}{item.locatedPages ? ` · ${item.locatedPages} page${item.locatedPages === 1 ? "" : "s"}` : ""}</span>
                </div>
              )}
              <p className="mt-4 text-xs leading-5">{item.institution}<span className="mt-1 block text-quiet">{item.rights} · {item.access}</span></p>
              {!compact && <p className="mt-3 text-xs leading-5 text-quiet">{item.note}</p>}
              <a className="focus-ring mt-5 inline-flex items-center gap-1 border-b border-redline pb-1 font-mono text-[9px] uppercase tracking-[.08em] text-redline no-underline" href={item.url} target="_blank" rel="noreferrer">Cite <ArrowUpRight size={11} /></a>
            </article>
          ))}
        </div>
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[1180px] border-collapse text-left">
            <thead>
              <tr>
                {["Rank", "Review lane", "Year", "Title / creator", "Screening", "Rights / access", "Reference"].map((heading) => (
                  <th key={heading} className="border-b border-ink px-3 py-3 font-mono text-[9px] font-medium uppercase tracking-[.13em] text-quiet first:pl-0 last:pr-0">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => (
                <tr key={item.rank} className="group align-top">
                  <td className="w-14 border-b border-ink/20 py-4 pr-3 font-display text-xl tabular-nums text-redline">{String(item.rank).padStart(2, "0")}</td>
                  <td className="w-40 border-b border-ink/20 px-3 py-4 font-mono text-[10px] uppercase leading-4 tracking-[.06em]">
                    {item.lane}<span className="mt-1 block text-quiet">{item.type} · Tier {item.tier}</span>
                  </td>
                  <td className="w-24 border-b border-ink/20 px-3 py-4 font-mono text-[10px]">{item.year}</td>
                  <td className="max-w-[360px] border-b border-ink/20 px-3 py-4">
                    <strong className="block font-display text-lg font-normal leading-snug">{item.title}</strong>
                    <span className="mt-2 block text-xs leading-5 text-quiet">{item.creator}</span>
                    {!compact && <span className="mt-2 block text-[11px] leading-5 text-quiet">{item.note}</span>}
                  </td>
                  <td className="w-40 border-b border-ink/20 px-3 py-4 font-mono text-[10px] uppercase leading-4 tracking-[.06em]">
                    {item.screening}
                    {item.locatedPages && <span className="mt-1 block text-redline">{item.locatedPages} page{item.locatedPages === 1 ? "" : "s"} surfaced</span>}
                  </td>
                  <td className="border-b border-ink/20 px-3 py-4 text-xs leading-5">{item.rights}<span className="mt-1 block text-quiet">{item.access}</span><span className="mt-2 block text-quiet">{item.institution}</span></td>
                  <td className="w-24 border-b border-ink/20 py-4 pl-3 text-right">
                    <a className="focus-ring inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[.08em] text-redline no-underline hover:underline" href={item.url} target="_blank" rel="noreferrer">
                      Cite <ArrowUpRight size={12} />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && (
            <p className="border-b border-ink/20 py-12 text-center font-display text-2xl text-quiet">No prioritized sources match this filter.</p>
          )}
        </div>
      </div>
    </>
  );
}
