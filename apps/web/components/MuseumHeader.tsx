import Link from "next/link";
import { Archive, ArrowUpRight } from "lucide-react";
import { LanguageToggle } from "./LanguageToggle";

export function MuseumHeader({ compact = false }: { compact?: boolean }) {
  return <header className="sticky top-0 z-40 border-b border-ink/10 bg-paper/90 backdrop-blur-xl">
    <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-5 px-5 py-3 lg:px-10">
      <Link href="/" className="focus-ring flex items-center gap-3 no-underline">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-ink text-paper"><Archive size={17} /></span>
        <span><strong className="block font-display text-lg leading-none tracking-tight">Balisong Atlas</strong>{!compact && <small className="mt-1 block text-[10px] uppercase tracking-[.15em] text-quiet">Visual history · Evidence archive</small>}</span>
      </Link>
      <nav className="hidden items-center gap-5 text-sm md:flex" aria-label="Primary navigation">
        <Link href="/exhibits/between-two-handles" className="hover:text-ochre">Exhibit</Link>
        <Link href="/exhibits/between-two-handles/methodology" className="hover:text-ochre">Methodology</Link>
        <Link href="/admin" className="inline-flex items-center gap-1 hover:text-ochre">Research workspace <ArrowUpRight size={14} /></Link>
      </nav>
      <LanguageToggle />
    </div>
  </header>;
}
