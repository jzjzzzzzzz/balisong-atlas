"use client";

import type { PaperNote } from "@/lib/research-paper";
import { useLanguage } from "@/components/Providers";
import { labels } from "./research-labels";

export function FootnotePopover({ note, close }: { note?: PaperNote; close: () => void }) {
  const { locale } = useLanguage();
  if (!note) return <div className="hidden lg:block"><p className="font-mono text-[9px] uppercase tracking-[.14em] text-quiet">{labels[locale].currentNote}</p><p className="mt-3 text-sm leading-6 text-quiet">{locale === "zh" ? "选择正文中的脚注编号查看来源。" : "Select a note number in the text to inspect its source."}</p></div>;
  return <aside className="footnote-popover" role="dialog" aria-label={`${labels[locale].notes} ${note.number}`} data-testid="footnote-popover">
    <div className="flex items-center justify-between border-b border-ink/20 pb-3">
      <span className="font-mono text-[10px] uppercase tracking-[.14em]">{labels[locale].notes} {note.number}</span>
      <button type="button" onClick={close} className="focus-ring font-mono text-[10px] uppercase">{labels[locale].close}</button>
    </div>
    <p className="mt-4 text-sm leading-6">{note.text}</p>
  </aside>;
}

export function FootnoteList({ notes }: { notes: PaperNote[] }) {
  const { locale } = useLanguage();
  return <section id="notes" className="paper-notes border-t border-ink/20 pt-12">
    <h2 className="font-serif text-4xl">{labels[locale].notes}</h2>
    <ol className="mt-8 space-y-5 text-sm leading-6">
      {notes.map((note) => <li key={note.number} id={`note-${note.number}`} className="scroll-mt-28 pl-2">
        <span className="mr-2 font-mono text-[10px]">{note.number}.</span>{note.text}{" "}
        <a href={`#ref-note-${note.number}`} className="focus-ring font-mono text-[10px] no-underline" aria-label={`${locale === "zh" ? "返回正文脚注" : "Return to note reference"} ${note.number}`}>↩</a>
      </li>)}
    </ol>
  </section>;
}
