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

export function PublicSection({ slug, eyebrow, title, intro, children, workspace = false }: { slug: string; eyebrow: string | LocalizedCopy; title: string | LocalizedCopy; intro: string | LocalizedCopy; children: ReactNode; workspace?: boolean }) {
  const { locale, messages } = useLanguage();
  return <div className="min-h-screen paper-grain"><MuseumHeader compact/><main className="grid md:grid-cols-[72px_1fr]"><aside className="folio-rail hidden min-h-[calc(100vh-64px)] md:block" aria-hidden="true"><span className="font-display text-lg text-redline">{locale === "zh" ? "引" : "REF"}</span><span className="folio-rail-label mt-7 block text-quiet">{messages.publicResearchPage}</span></aside><div className={`min-w-0 px-5 lg:px-12 ${workspace ? "py-8 lg:py-10" : "py-12 lg:py-16"}`}><Link href={`/exhibits/${slug}`} className="focus-ring inline-flex items-center gap-2 border-b border-ink pb-1 font-mono text-[9px] uppercase tracking-[.1em] text-quiet no-underline"><ArrowLeft size={13}/> {messages.backToExhibit}</Link><div className={`${workspace ? "mt-8" : "mt-14"} grid gap-8 border-t border-ink pt-6 lg:grid-cols-[1.2fr_.8fr]`}><div><p className="eyebrow">{value(eyebrow, locale)}</p><h1 className={`${workspace ? "text-5xl sm:text-6xl" : "text-6xl sm:text-7xl"} mt-5 max-w-5xl font-display leading-[.9] tracking-[-.045em]`}>{value(title, locale)}</h1></div><p className="max-w-xl self-end text-base leading-7 text-quiet">{value(intro, locale)}</p></div><div className={`${workspace ? "my-8" : "my-12"} h-px bg-ink`}/>{children}</div></main></div>;
}
