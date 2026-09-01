"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { MuseumHeader } from "@/components/MuseumHeader";
import { useLanguage } from "@/components/Providers";
import type { LocalizedCopy } from "@/components/LocalizedText";

function value(copy: string | LocalizedCopy, locale: "en" | "zh") {
  return typeof copy === "string" ? copy : copy[locale];
}

export function PublicSection({ slug, eyebrow, title, intro, children }: { slug: string; eyebrow: string | LocalizedCopy; title: string | LocalizedCopy; intro: string | LocalizedCopy; children: ReactNode }) {
  const { locale, messages } = useLanguage();
  return <div className="min-h-screen paper-grain"><MuseumHeader compact/><main className="grid md:grid-cols-[72px_1fr]"><aside className="folio-rail hidden min-h-[calc(100vh-64px)] md:block" aria-hidden="true"><span className="font-display text-lg text-redline">{locale === "zh" ? "引" : "REF"}</span><span className="folio-rail-label mt-7 block text-quiet">{messages.publicResearchPage}</span></aside><div className="min-w-0 px-5 py-12 lg:px-12 lg:py-16"><Link href={`/exhibits/${slug}`} className="focus-ring inline-flex items-center gap-2 border-b border-ink pb-1 font-mono text-[9px] uppercase tracking-[.1em] text-quiet no-underline"><ArrowLeft size={13}/> {messages.backToExhibit}</Link><div className="mt-14 grid gap-8 border-t border-ink pt-6 lg:grid-cols-[1.2fr_.8fr]"><div><p className="eyebrow">{value(eyebrow, locale)}</p><h1 className="mt-5 max-w-5xl font-display text-6xl leading-[.9] tracking-[-.045em] sm:text-7xl">{value(title, locale)}</h1></div><p className="max-w-xl self-end text-base leading-7 text-quiet">{value(intro, locale)}</p></div><div className="my-12 h-px bg-ink"/>{children}</div></main></div>;
}
