"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowRight, CircleAlert } from "lucide-react";
import { EvidenceLegend } from "@/components/EvidenceLegend";
import { MuseumHeader } from "@/components/MuseumHeader";
import { useLanguage } from "@/components/Providers";
import { SafeProxyViewer } from "@/features/reconstruction/SafeProxyViewer";
import { LiteratureRegister } from "./LiteratureRegister";

const methodSteps = [
  ["01", "Saved source", "A source is located, captured, hashed, and preserved with provenance intact.", "Observed"],
  ["02", "Safe text", "Controlled passages are detected and excluded before AI, embeddings, or public search.", "Observed"],
  ["03", "Proposed claim", "A claim or observation is proposed only with a location in the saved corpus.", "Inferred"],
  ["04", "Human review", "A reviewer examines evidence, wording, rights, and alternative readings.", "Observed"],
  ["05", "Contradiction retained", "Conflicting accounts and shared source families remain visible.", "Observed"],
  ["06", "Public interpretation", "Only reviewed material can appear with citations and uncertainty attached.", "Inferred"],
] as const;

function FolioRail({ number, label }: { number: string; label: string }) {
  return <aside className="folio-rail" aria-hidden="true"><span className="block font-display text-lg text-redline">{number}</span><span className="folio-rail-label mt-7 block text-quiet">{label}</span></aside>;
}

export function ExhibitPage({ demo = false }: { demo?: boolean }) {
  const { locale, messages } = useLanguage();
  const fullTitle = demo ? "Balisong Atlas Demo Collection" : "Between Two Handles: A Visual History of the Balisong";
  const titleZh = demo ? "Balisong Atlas 证据流程演示集" : "双柄之间";
  const exhibitPath = demo ? "/exhibits/balisong-atlas-demo" : "/exhibits/between-two-handles";

  return <div className="min-h-screen paper-grain">
    <MuseumHeader />
    <main>
      <section className="folio-section min-h-[calc(100vh-64px)]">
        <FolioRail number="01" label={demo ? "Demo collection" : "Exhibition"} />
        <div className="grid min-w-0 lg:grid-cols-[minmax(0,1.75fr)_minmax(320px,.75fr)]">
          <div className="flex min-h-[680px] flex-col justify-between border-b border-ink p-6 md:p-10 lg:border-b-0 lg:border-r xl:p-12">
            <h1 aria-label={fullTitle} className="reveal-up max-w-[980px] font-display tracking-[-.055em]">
              <span className="block text-[clamp(4.4rem,10.2vw,10rem)] leading-[.76]">Balisong Atlas</span>
              <span className="mt-8 block text-[clamp(3.5rem,7vw,7.5rem)] leading-[.82] tracking-[-.035em]">{titleZh}</span>
              <span className="mt-5 block max-w-5xl text-[clamp(2.8rem,5.6vw,6rem)] font-normal leading-[.9] tracking-[-.04em] text-redline">
                {demo ? (locale === "zh" ? "证据流程演示集" : "Demo Collection") : "Between Two Handles"}
              </span>
              {!demo && <span className="mt-4 block text-[clamp(1.5rem,2.3vw,2.75rem)] font-normal leading-tight tracking-[-.025em]">A Visual History of the Balisong</span>}
            </h1>
            <div className="mt-16 max-w-3xl">
              <div className="reveal-line h-px bg-ink" />
              <p className="mt-6 font-display text-2xl leading-snug sm:text-3xl">{messages.tagline}</p>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-quiet">
                {demo
                  ? (locale === "zh" ? "完全虚构的测试藏品，用于验证来源、引文、人工审核、争议处理和非功能性视觉代理。" : "A wholly fictional collection for validating sources, citations, human review, contradiction handling, and a nonfunctional visual proxy.")
                  : (locale === "zh" ? "第一期展览仍处于文献收集阶段。未经证据绑定和人工审核的历史结论不会发布。" : "The first exhibition remains in evidence collection. Historical conclusions are not published without evidence binding and human review.")}
              </p>
              <div className="mt-7 flex flex-wrap gap-x-8 gap-y-4">
                <a href="#reading-room" className="focus-ring inline-flex items-center gap-3 border-b-2 border-redline pb-2 text-sm font-semibold text-redline no-underline">{demo ? messages.viewEvidence : "Explore the evidence"}<ArrowDown size={16} /></a>
                <Link href={`${exhibitPath}/methodology`} className="focus-ring inline-flex items-center gap-3 border-b border-ink pb-2 text-sm font-semibold no-underline">{messages.method}<ArrowRight size={15} /></Link>
              </div>
            </div>
          </div>

          <aside className="flex min-h-[520px] flex-col justify-between p-6 md:p-10 xl:p-12">
            <dl className="border-t border-ink font-mono text-[10px] uppercase tracking-[.06em]">
              {[
                ["Edition status", demo ? "Published fixture" : "Draft / research stage"],
                ["Language", "EN / 中文"],
                ["Curatorial approach", "Evidence-first"],
                ["Source priority", "Archive · books · papers · web"],
                ["Rights posture", "Closed until reviewed"],
                ["Historical claims", demo ? "Fictional only" : "None published"],
              ].map(([term, value]) => <div key={term} className="grid grid-cols-[1fr_1.05fr] gap-4 border-b border-ink/35 py-5"><dt className="text-quiet">{term}</dt><dd className="normal-case tracking-normal">{value}</dd></div>)}
            </dl>
            <div className="mt-12 border-l-2 border-redline pl-5">
              <p className="font-display text-2xl leading-snug">Every public interpretation should show where it came from.</p>
              <p className="mt-3 font-mono text-[9px] uppercase tracking-[.1em] text-quiet">Provenance · rights · uncertainty · review</p>
            </div>
          </aside>
        </div>
      </section>

      {!demo && <section className="folio-section bg-redline text-white">
        <FolioRail number="—" label="Editorial status" />
        <div className="grid gap-8 px-6 py-9 md:px-10 lg:grid-cols-[1fr_2fr] lg:px-12">
          <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[.1em]"><CircleAlert size={16} /> Draft / 草稿</div>
          <div><h2 className="font-display text-3xl sm:text-4xl">Evidence collection is in progress.</h2><p className="mt-3 max-w-3xl text-sm leading-6 text-white/75">No unreviewed historical conclusions have been published. The register below is a research inventory, not an endorsement of every statement contained in each source.</p></div>
        </div>
      </section>}

      <section id="reading-room" className="folio-section scroll-mt-16">
        <FolioRail number="02" label={demo ? "Evidence register" : "Reading room"} />
        <div className="min-w-0 px-6 py-16 md:px-10 lg:px-12 lg:py-20">
          {demo ? <DemoEvidence /> : <>
            <div className="grid gap-8 border-t border-ink pt-6 lg:grid-cols-[1fr_.48fr_.75fr]">
              <div><h2 className="font-display text-5xl tracking-[-.04em] sm:text-6xl">Reading Room<span className="mt-1 block text-4xl">研究阅览室</span></h2></div>
              <p className="font-display text-3xl leading-tight text-redline">Books before posts.</p>
              <div><p className="text-sm leading-6">A ranked register of archive records, books, period publications, papers, and institutional leads.</p><p className="mt-3 text-xs leading-5 text-quiet">Priority controls discovery order only. It never substitutes for source criticism or determines whether a claim is true.</p></div>
            </div>
            <div className="mt-12"><LiteratureRegister compact /></div>
            <div className="mt-7 flex flex-wrap items-center justify-between gap-4 border-b border-ink pb-7">
              <p className="max-w-2xl font-mono text-[10px] leading-5 uppercase tracking-[.08em] text-quiet">Downloaded research copies remain private, content-addressed, and excluded from AI, embeddings, and public search pending rights and sensitive-content review.</p>
              <Link href={`${exhibitPath}/sources`} className="focus-ring inline-flex items-center gap-2 border-b border-redline pb-1 text-sm font-semibold text-redline no-underline">Open full public register <ArrowRight size={14} /></Link>
            </div>
          </>}
        </div>
      </section>

      <section className="folio-section">
        <FolioRail number="03" label="Evidence method" />
        <div className="min-w-0 px-6 py-16 md:px-10 lg:px-12 lg:py-20">
          <div className="grid gap-8 border-t border-ink pt-6 lg:grid-cols-[1.3fr_.7fr]">
            <h2 className="font-display text-5xl tracking-[-.04em] sm:text-6xl">Evidence Method<span className="mt-1 block text-4xl">证据方法</span></h2>
            <p className="max-w-lg text-sm leading-6 text-quiet">A transparent editorial sequence applied to every claim, visual observation, and reconstruction hypothesis.</p>
          </div>
          <div className="mt-12 grid border-y border-ink sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {methodSteps.map(([number, title, text, state], index) => <article key={number} className="relative border-b border-ink/30 p-5 sm:border-r lg:min-h-[270px] lg:border-b-0 last:border-r-0">
              <span className="font-display text-2xl">{number}</span>
              <h3 className="mt-7 font-display text-2xl leading-none">{title}</h3>
              <p className="mt-5 text-xs leading-5 text-quiet">{text}</p>
              <span className="absolute bottom-5 left-5 font-mono text-[8px] uppercase tracking-[.12em] text-quiet">{state}</span>
              {index < methodSteps.length - 1 && <ArrowRight className="absolute -right-3 top-1/2 z-10 hidden bg-paper p-1 text-redline xl:block" size={22} />}
            </article>)}
          </div>
        </div>
      </section>

      <section className="folio-section bg-night text-paper">
        <FolioRail number="04" label="Interpretive reconstruction" />
        <div className="min-w-0 px-6 py-16 md:px-10 lg:px-12 lg:py-20">
          <div className="grid gap-8 border-t border-paper/70 pt-6 lg:grid-cols-[1.3fr_.7fr]">
            <h2 className="font-display text-5xl tracking-[-.04em] sm:text-6xl">Interpretive Reconstruction<span className="mt-1 block text-4xl text-fog">解释性重建</span></h2>
            <p className="max-w-lg text-sm leading-6 text-fog">A reconstruction is an evidence-based visual hypothesis, never a claim of exact form or manufacturing accuracy.</p>
          </div>
          {demo ? <div className="mt-12"><div className="mb-7 [&_p]:!text-fog [&>div]:!border-paper/40"><EvidenceLegend /></div><SafeProxyViewer /></div> : <div className="mt-12 grid min-h-[360px] place-items-center border border-paper/25 p-8 text-center">
            <div className="max-w-xl"><span className="font-mono text-[10px] uppercase tracking-[.12em] text-redline">Capability held closed</span><h3 className="mt-5 font-display text-4xl">No approved visual proxy exists for this draft exhibition.</h3><p className="mt-4 text-sm leading-6 text-fog">A proxy can appear only after accepted evidence, reviewed visual features, an approved Reconstruction Brief, and safety validation.</p></div>
          </div>}
          <div className="mt-8 grid border border-redline md:grid-cols-2">
            <p className="p-5 text-sm leading-6 md:border-r md:border-redline">This reconstruction is a nonfunctional, evidence-based visual hypothesis. It is not a manufacturing model or an exact historical replica.</p>
            <p className="border-t border-redline p-5 text-sm leading-6 md:border-t-0">本重建是一个非功能性、以证据为基础的视觉假设，不是制造模型，也不是被宣称为完全准确的历史复制品。</p>
          </div>
        </div>
      </section>
    </main>

    <footer className="grid bg-night text-paper md:grid-cols-[72px_1fr]">
      <div className="hidden border-r border-white/20 md:block" />
      <div className="grid gap-10 border-t border-white/25 px-6 py-12 md:px-10 lg:grid-cols-[1fr_1fr_1fr] lg:px-12">
        <div><strong className="font-display text-3xl font-normal">Balisong Atlas</strong><p className="mt-4 font-mono text-[9px] uppercase leading-5 tracking-[.12em] text-fog">Coordinated evidence archive<br />Bilingual digital exhibition</p></div>
        <div><p className="font-mono text-[9px] uppercase tracking-[.12em] text-redline">Rights & attribution</p><p className="mt-4 text-xs leading-5 text-fog">Code is MIT. Data, scans, imagery, and exhibition content retain the rights of their institutions and creators.</p></div>
        <div><p className="font-mono text-[9px] uppercase tracking-[.12em] text-redline">AI-use statement</p><p className="mt-4 text-xs leading-5 text-fog">AI may assist extraction and comparison. It is not a source, cannot accept its own claims, and cannot resolve disputes.</p></div>
      </div>
    </footer>
  </div>;
}

function DemoEvidence() {
  return <>
    <div className="grid gap-8 border-t border-ink pt-6 lg:grid-cols-[.75fr_1.25fr]">
      <div><h2 className="font-display text-5xl tracking-[-.04em] sm:text-6xl">Evidence Register<span className="mt-1 block text-4xl">证据登记册</span></h2></div>
      <div><p className="font-display text-3xl leading-tight text-redline">A visual hypothesis should expose the trail that produced it.</p><p className="mt-5 max-w-2xl text-sm leading-6 text-quiet">This fixture moves from saved source to reviewed claims, observations, explicit uncertainty, and a constrained browser visualization.</p></div>
    </div>
    <div className="mt-12 grid border-y border-ink md:grid-cols-3">
      {[["03", "Reviewed claims"], ["03", "Visual observations"], ["01", "Open contradiction"]].map(([number, label]) => <div key={label} className="border-b border-ink/30 p-6 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0"><strong className="font-display text-5xl font-normal text-redline">{number}</strong><span className="mt-3 block font-mono text-[9px] uppercase tracking-[.12em] text-quiet">{label}</span></div>)}
    </div>
    <div className="mt-12 grid gap-0 border border-ink md:grid-cols-2">
      {[["/abstract-study-a.png", "Abstract fixture with a muted ochre band on a dark field", "Fictional source fixture A · public domain · complete attribution"], ["/abstract-study-b.png", "Abstract fixture with alternating circular color fields", "Fictional source fixture B · public domain · complete attribution"]].map(([src, alt, caption], index) => <figure key={src} className={index === 0 ? "border-b border-ink p-4 md:border-b-0 md:border-r" : "p-4"}><div className="relative aspect-[3/2]"><Image src={src} alt={alt} fill className="object-cover" sizes="(max-width:768px) 100vw, 50vw" /></div><figcaption className="mt-4 font-mono text-[9px] uppercase tracking-[.08em] text-quiet">{caption}</figcaption></figure>)}
    </div>
  </>;
}
