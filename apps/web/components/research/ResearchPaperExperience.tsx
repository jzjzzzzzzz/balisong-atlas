"use client";

import { Fragment, useMemo, useState, type ReactNode } from "react";
import type { PaperBlock, PaperNote, PaperSection, ResearchPaperData } from "@/lib/research-paper";
import { useLanguage } from "@/components/Providers";
import { ArgumentMapView } from "./ArgumentMap";
import { Bibliography } from "./Bibliography";
import { FigureWithAttribution } from "./FigureWithAttribution";
import { FootnoteList, FootnotePopover } from "./Footnotes";
import { PaperHeader } from "./PaperHeader";
import { PrintActions } from "./PrintActions";
import { ReadingProgress } from "./ReadingProgress";
import { SourcesMethods } from "./SourcesMethods";
import { labels, sectionSummariesZh, sectionTitlesZh } from "./research-labels";

type View = "essay" | "evidence" | "methods";

export function ResearchPaperExperience({ data }: { data: ResearchPaperData }) {
  const { locale } = useLanguage();
  const t = labels[locale];
  const [view, setView] = useState<View>("essay");
  const [activeNote, setActiveNote] = useState<number>();
  const [showEnglish, setShowEnglish] = useState(false);
  const note = data.notes.find((item) => item.number === activeNote);
  const coreSections = data.sections.filter((section) => /^section-\d+$/.test(section.id));
  return <main className="research-paper-page bg-paper text-ink">
    <ReadingProgress />
    <PaperHeader meta={data.meta} stats={data.stats} />
    <nav className="paper-tabs sticky top-16 z-30 flex overflow-x-auto border-b border-ink/20 bg-paper/95 px-5 backdrop-blur md:px-10 lg:px-16" aria-label={locale === "zh" ? "论文子页面" : "Paper views"}>
      {(["essay", "evidence", "methods"] as const).map((item) => <button key={item} type="button" onClick={() => setView(item)} aria-current={view === item ? "page" : undefined} className={`focus-ring shrink-0 border-x border-transparent px-5 py-4 font-mono text-[10px] uppercase tracking-[.12em] ${view === item ? "border-ink/20 bg-parchment" : "hover:bg-parchment/60"}`} data-testid={`paper-tab-${item}`}>{t[item]}</button>)}
      <div className="ml-auto hidden items-center py-2 sm:flex"><PrintActions /></div>
    </nav>
    {view === "essay" && <>
      <section className="mx-auto max-w-[1200px] border-b border-ink/20 px-5 py-12 md:px-10 lg:px-16">
        <p className="font-mono text-[10px] uppercase tracking-[.14em] text-quiet">{locale === "zh" ? t.chineseSummary : "Abstract"}</p>
        {locale === "zh" ? <div className="mt-6 max-w-[840px] space-y-5 text-[17px] leading-8">{data.chineseSummary.map((paragraph) => <p key={paragraph.slice(0,30)}>{paragraph}</p>)}</div> : <EnglishAbstract section={data.sections.find((section) => section.id === "abstract")} onNote={setActiveNote} />}
      </section>
      {locale === "zh" && <section className="mx-auto max-w-[1200px] px-5 py-12 md:px-10 lg:px-16">
        <p className="font-mono text-[10px] uppercase tracking-[.14em] text-quiet">章节论点</p>
        <div className="mt-6 grid gap-px border border-ink/20 bg-ink/20 md:grid-cols-2">{coreSections.map((section) => <a key={section.id} href={`#${section.id}`} onClick={() => setShowEnglish(true)} className="focus-ring bg-paper p-5 no-underline hover:bg-parchment"><span className="font-mono text-[10px]">{section.number.padStart(2,"0")}</span><h2 className="mt-3 font-serif text-2xl">{sectionTitlesZh[section.id]}</h2><p className="mt-3 text-sm leading-6 text-quiet">{sectionSummariesZh[section.id]}</p></a>)}</div>
        <p className="mt-8 max-w-3xl text-sm leading-6 text-quiet">{t.allEnglish}</p>
        <button type="button" onClick={() => setShowEnglish((value) => !value)} className="focus-ring mt-5 border border-ink px-5 py-3 font-mono text-[10px] uppercase tracking-[.12em] hover:bg-ink hover:text-paper" aria-expanded={showEnglish}>{showEnglish ? "收起英文全文" : t.openEnglish}</button>
      </section>}
      <div className={`paper-english-details ${locale === "zh" && !showEnglish ? "hidden print:block" : "block"}`}>
        {locale === "zh" && <div className="mx-auto max-w-[1200px] border-y border-ink/20 px-5 py-5 font-mono text-[10px] uppercase tracking-[.12em] text-quiet md:px-10 lg:px-16">{t.englishText}</div>}
        <ArticleLayout data={data} activeNote={note} onNote={setActiveNote} closeNote={() => setActiveNote(undefined)} />
      </div>
    </>}
    {view === "evidence" && <section className="mx-auto max-w-[1240px] px-5 py-12 md:px-10 lg:px-16"><div className="mb-10 max-w-3xl"><p className="font-mono text-[10px] uppercase tracking-[.14em] text-quiet">{t.evidence}</p><h2 className="mt-4 font-serif text-5xl">{locale === "zh" ? "同一转化，四种制度性阅读" : "One transformation, four institutional readings"}</h2><p className="mt-5 leading-7 text-quiet">{locale === "zh" ? "点击节点查看相关论文段落、来源、争议与证据状态。图谱不包含动作步骤、技术尺寸或机械图。" : "Select a node to inspect its related paragraph, sources, contest, and evidence status. The map contains no action sequence, technical dimension, or mechanical diagram."}</p></div><ArgumentMapView map={data.argumentMap} sources={data.sources} claims={data.claims} /></section>}
    {view === "methods" && <SourcesMethods data={data} />}
  </main>;
}

function EnglishAbstract({ section, onNote }: { section?: PaperSection; onNote: (number: number) => void }) {
  if (!section) return null;
  return <div className="mt-6 max-w-[820px] space-y-6 text-[18px] leading-8">{section.blocks.map((block, index) => block.type === "callout" ? <blockquote key={index} className="border-l-2 border-moss bg-parchment px-5 py-4 font-serif text-2xl leading-snug"><InlineText text={block.text} onNote={onNote} /></blockquote> : block.type === "keywords" ? <p key={index} className="text-sm"><strong>Keywords:</strong> {block.text}</p> : block.type === "paragraph" ? <p key={index}><InlineText text={block.text} onNote={onNote} /></p> : null)}</div>;
}

function ArticleLayout({ data, activeNote, onNote, closeNote }: { data: ResearchPaperData; activeNote?: PaperNote; onNote: (number: number) => void; closeNote: () => void }) {
  const { locale } = useLanguage();
  const sections = data.sections.filter((section) => section.id !== "abstract");
  return <div className="paper-reading-grid mx-auto grid max-w-[1500px] grid-cols-1 px-5 py-12 md:px-10 lg:grid-cols-[220px_minmax(0,760px)_260px] lg:gap-10 lg:px-12 xl:gap-14">
    <aside className="hidden lg:block"><div className="sticky top-36"><p className="font-mono text-[9px] uppercase tracking-[.14em] text-quiet">{labels[locale].contents}</p><nav className="mt-5 space-y-3 text-xs leading-5" aria-label={labels[locale].contents}>{sections.map((section) => <a key={section.id} href={`#${section.id}`} className="focus-ring block no-underline hover:underline">{section.number === "AI" ? "" : `${section.number}. `}{locale === "zh" ? sectionTitlesZh[section.id] ?? section.title : section.title}</a>)}<a href="#notes" className="focus-ring block no-underline hover:underline">{labels[locale].notes}</a><a href="#bibliography" className="focus-ring block no-underline hover:underline">{labels[locale].bibliography}</a></nav><div className="mt-8"><PrintActions /></div></div></aside>
    <article className="paper-article min-w-0" data-testid="research-paper-article">{sections.map((section) => <Section key={section.id} section={section} data={data} onNote={onNote} />)}<FootnoteList notes={data.notes} /><Bibliography entries={data.bibliography} /></article>
    <aside className="paper-note-rail"><div className="sticky top-36"><FootnotePopover note={activeNote} close={closeNote} /></div></aside>
  </div>;
}

function Section({ section, data, onNote }: { section: PaperSection; data: ResearchPaperData; onNote: (number: number) => void }) {
  const { locale } = useLanguage();
  return <section id={section.id} className="paper-section scroll-mt-36 pb-16">
    <div className="mb-8 border-b border-ink/20 pb-5"><span className="font-mono text-[10px] uppercase tracking-[.14em] text-quiet">{section.number === "AI" ? "Disclosure" : `Section ${section.number}`}</span><h2 className="mt-3 font-serif text-[clamp(2.2rem,5vw,4.3rem)] leading-[.98] tracking-[-.035em]">{locale === "zh" ? sectionTitlesZh[section.id] ?? section.title : section.title}</h2></div>
    {section.blocks.map((block, index) => <Block key={`${section.id}-${index}`} block={block} data={data} onNote={onNote} />)}
  </section>;
}

function Block({ block, data, onNote }: { block: PaperBlock; data: ResearchPaperData; onNote: (number: number) => void }) {
  if (block.type === "figure") { const figure = data.figures.find((item) => item.figure_id === block.id); return figure ? <FigureWithAttribution figure={figure} stats={data.stats} /> : null; }
  if (block.type === "heading3") return <h3 className="mb-4 mt-10 font-serif text-3xl"><InlineText text={block.text} onNote={onNote} /></h3>;
  if (block.type === "callout") return <blockquote className="my-8 border-l-2 border-moss bg-parchment px-5 py-4 text-base leading-7"><InlineText text={block.text} onNote={onNote} /></blockquote>;
  if (block.type === "keywords") return null;
  return <p className="mb-6 text-[17px] leading-[1.82]"><InlineText text={block.text} onNote={onNote} /></p>;
}

function InlineText({ text, onNote }: { text: string; onNote: (number: number) => void }) {
  const parts = useMemo(() => text.split(/(\[\^\d+\]|\*\*[^*]+\*\*|\*[^*]+\*)/g).filter(Boolean), [text]);
  return <>{parts.map((part, index): ReactNode => {
    const note = part.match(/^\[\^(\d+)\]$/);
    if (note) { const number = Number(note[1]); return <button key={`${part}-${index}`} id={`ref-note-${number}`} type="button" onClick={() => onNote(number)} onFocus={() => onNote(number)} onMouseEnter={() => onNote(number)} aria-label={`Footnote ${number}`} className="citation-anchor focus-ring align-super font-mono text-[10px] leading-none text-moss" data-testid={`citation-${number}`}>{number}</button>; }
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={index}>{part.slice(2,-2)}</strong>;
    if (part.startsWith("*") && part.endsWith("*")) return <em key={index}>{part.slice(1,-1)}</em>;
    return <Fragment key={index}>{part}</Fragment>;
  })}</>;
}
