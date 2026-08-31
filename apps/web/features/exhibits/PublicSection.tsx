import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { MuseumHeader } from "@/components/MuseumHeader";

export function PublicSection({ slug, eyebrow, title, intro, children }: { slug: string; eyebrow: string; title: string; intro: string; children: ReactNode }) {
  return <div className="min-h-screen"><MuseumHeader compact/><main className="mx-auto max-w-[1200px] px-5 py-16 lg:px-10"><Link href={`/exhibits/${slug}`} className="focus-ring inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.12em] text-quiet"><ArrowLeft size={14}/> Back to exhibit</Link><p className="eyebrow mt-14">{eyebrow}</p><h1 className="mt-5 max-w-4xl font-display text-6xl leading-[.95] tracking-tight sm:text-7xl">{title}</h1><p className="mt-7 max-w-3xl text-lg leading-8 text-quiet">{intro}</p><div className="museum-rule my-12"/>{children}</main></div>;
}
