import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { MuseumHeader } from "@/components/MuseumHeader";

export function PublicSection({ slug, eyebrow, title, intro, children }: { slug: string; eyebrow: string; title: string; intro: string; children: ReactNode }) {
  return <div className="min-h-screen paper-grain"><MuseumHeader compact/><main className="grid md:grid-cols-[72px_1fr]"><aside className="folio-rail hidden min-h-[calc(100vh-64px)] md:block" aria-hidden="true"><span className="font-display text-lg text-redline">REF</span><span className="folio-rail-label mt-7 block text-quiet">Public research page</span></aside><div className="min-w-0 px-5 py-12 lg:px-12 lg:py-16"><Link href={`/exhibits/${slug}`} className="focus-ring inline-flex items-center gap-2 border-b border-ink pb-1 font-mono text-[9px] uppercase tracking-[.1em] text-quiet no-underline"><ArrowLeft size={13}/> Back to exhibit</Link><div className="mt-14 grid gap-8 border-t border-ink pt-6 lg:grid-cols-[1.2fr_.8fr]"><div><p className="eyebrow">{eyebrow}</p><h1 className="mt-5 max-w-5xl font-display text-6xl leading-[.9] tracking-[-.045em] sm:text-7xl">{title}</h1></div><p className="max-w-xl self-end text-base leading-7 text-quiet">{intro}</p></div><div className="my-12 h-px bg-ink"/>{children}</div></main></div>;
}
