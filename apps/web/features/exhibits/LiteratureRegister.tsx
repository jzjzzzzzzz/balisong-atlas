import { ArrowUpRight } from "lucide-react";
import { researchLibrary } from "@/lib/research-library";

export function LiteratureRegister({ compact = false }: { compact?: boolean }) {
  const rows = compact ? researchLibrary.slice(0, 6) : researchLibrary;
  return (
    <div className="library-register border-t border-ink">
      <div className="md:hidden">
        {rows.map((item) => <article key={item.rank} className="border-b border-ink/30 py-5">
          <div className="flex items-start justify-between gap-5 font-mono text-[9px] uppercase tracking-[.08em]"><span className="font-display text-xl text-redline">{String(item.rank).padStart(2, "0")}</span><span className="text-right">{item.type} · Tier {item.tier}<span className="mt-1 block text-quiet">{item.year}</span></span></div>
          <h3 className="mt-5 font-display text-2xl font-normal leading-tight">{item.title}</h3>
          <p className="mt-2 text-xs leading-5 text-quiet">{item.creator}</p>
          <p className="mt-4 text-xs leading-5">{item.institution}<span className="mt-1 block text-quiet">{item.rights} · {item.access}</span></p>
          {!compact && <p className="mt-3 text-xs leading-5 text-quiet">{item.note}</p>}
          <a className="focus-ring mt-5 inline-flex items-center gap-1 border-b border-redline pb-1 font-mono text-[9px] uppercase tracking-[.08em] text-redline no-underline" href={item.url} target="_blank" rel="noreferrer">Cite <ArrowUpRight size={11} /></a>
        </article>)}
      </div>
      <div className="hidden overflow-x-auto md:block">
      <table className="w-full min-w-[1040px] border-collapse text-left">
        <thead>
          <tr>
            {["Rank", "Type / tier", "Year", "Title / creator", "Institution", "Rights / access", "Reference"].map((heading) => (
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
              <td className="w-32 border-b border-ink/20 px-3 py-4 font-mono text-[10px] uppercase tracking-[.08em]">
                {item.type}<span className="mt-1 block text-quiet">Tier {item.tier}</span>
              </td>
              <td className="w-24 border-b border-ink/20 px-3 py-4 font-mono text-[10px]">{item.year}</td>
              <td className="max-w-[320px] border-b border-ink/20 px-3 py-4">
                <strong className="block font-display text-lg font-normal leading-snug">{item.title}</strong>
                <span className="mt-2 block text-xs leading-5 text-quiet">{item.creator}</span>
                {!compact && <span className="mt-2 block text-[11px] leading-5 text-quiet">{item.note}</span>}
              </td>
              <td className="border-b border-ink/20 px-3 py-4 text-xs leading-5">{item.institution}</td>
              <td className="border-b border-ink/20 px-3 py-4 text-xs leading-5">{item.rights}<span className="mt-1 block text-quiet">{item.access}</span></td>
              <td className="w-24 border-b border-ink/20 py-4 pl-3 text-right">
                <a className="focus-ring inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[.08em] text-redline no-underline hover:underline" href={item.url} target="_blank" rel="noreferrer">
                  Cite <ArrowUpRight size={12} />
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}
