"use client";

import Link from "next/link";
import { LanguageToggle } from "./LanguageToggle";
import { useLanguage } from "./Providers";

export function MuseumHeader({ compact = false }: { compact?: boolean }) {
  const { messages } = useLanguage();
  return <header className="sticky top-0 z-40 border-b border-white/25 bg-night text-white">
    <div className="grid min-h-16 grid-cols-[1fr_auto] md:grid-cols-[34%_1fr_auto]">
      <Link href="/" className="focus-ring flex items-center border-r border-white/25 px-5 font-semibold tracking-[-.02em] no-underline md:px-10">
        Balisong Atlas{!compact && <span className="ml-3 hidden font-mono text-[9px] font-normal uppercase tracking-[.12em] text-fog xl:inline">{messages.archiveSubtitle}</span>}
      </Link>
      <nav className="hidden items-stretch justify-center text-[13px] md:flex" aria-label={messages.navExhibition}>
        <Link href="/exhibits/between-two-handles" className="flex items-center px-5 no-underline hover:bg-white/10">{messages.navExhibition}</Link>
        <Link href="/exhibits/between-two-handles/sources" className="flex items-center px-5 no-underline hover:bg-white/10">{messages.navReadingRoom}</Link>
        <Link href="/exhibits/between-two-handles/methodology" className="flex items-center px-5 no-underline hover:bg-white/10">{messages.navMethod}</Link>
        <Link href="/admin" className="flex items-center px-5 no-underline hover:bg-white/10">{messages.navResearchDesk}</Link>
      </nav>
      <LanguageToggle />
    </div>
  </header>;
}
