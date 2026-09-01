"use client";

import Link from "next/link";
import { LanguageToggle } from "./LanguageToggle";
import { useLanguage } from "./Providers";

export function MuseumHeader({ compact = false }: { compact?: boolean }) {
  const { messages, locale } = useLanguage();
  const links = [
    ["/exhibits/between-two-handles", messages.navExhibition],
    ["/exhibits/between-two-handles/timeline", messages.navTimeline],
    ["/research/balisong-boundary-object", messages.navResearchPaper],
    ["/exhibits/between-two-handles/sources", messages.navReadingRoom],
    ["/exhibits/between-two-handles/methodology", messages.navMethod],
    ["/admin", messages.navResearchDesk],
  ] as const;
  return <header className="sticky top-0 z-40 border-b border-white/25 bg-night text-white print:hidden">
    <div className="grid min-h-16 grid-cols-[1fr_auto_auto] md:grid-cols-[30%_1fr_auto] xl:grid-cols-[34%_1fr_auto]">
      <Link href="/" className="focus-ring flex items-center border-r border-white/25 px-5 font-semibold tracking-[-.02em] no-underline md:px-8 xl:px-10">
        Balisong Atlas{!compact && <span className="ml-3 hidden font-mono text-[9px] font-normal uppercase tracking-[.12em] text-fog xl:inline">{messages.archiveSubtitle}</span>}
      </Link>
      <nav className="hidden items-stretch justify-center text-[12px] md:flex" aria-label={messages.navExhibition}>
        {links.map(([href,label]) => <Link key={href} href={href} className="flex items-center px-3 no-underline hover:bg-white/10 xl:px-4">{label}</Link>)}
      </nav>
      <details className="group relative md:hidden">
        <summary className="focus-ring flex h-16 cursor-pointer list-none items-center border-r border-white/25 px-4 font-mono text-[10px] uppercase tracking-[.12em] [&::-webkit-details-marker]:hidden">{locale === "zh" ? "导航" : "Menu"}</summary>
        <nav className="absolute right-0 top-16 z-50 w-64 border border-white/25 bg-night shadow-2xl" aria-label={locale === "zh" ? "移动导航" : "Mobile navigation"} data-testid="mobile-navigation">
          {links.map(([href,label]) => <Link key={href} href={href} className="focus-ring block border-b border-white/15 px-5 py-4 text-sm no-underline last:border-b-0 hover:bg-white/10">{label}</Link>)}
        </nav>
      </details>
      <LanguageToggle />
    </div>
  </header>;
}
