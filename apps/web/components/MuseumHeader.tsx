import Link from "next/link";
import { LanguageToggle } from "./LanguageToggle";

export function MuseumHeader({ compact = false }: { compact?: boolean }) {
  return <header className="sticky top-0 z-40 border-b border-white/25 bg-night text-white">
    <div className="grid min-h-16 grid-cols-[1fr_auto] md:grid-cols-[34%_1fr_auto]">
      <Link href="/" className="focus-ring flex items-center border-r border-white/25 px-5 font-semibold tracking-[-.02em] no-underline md:px-10">
        Balisong Atlas{!compact && <span className="ml-3 hidden font-mono text-[9px] font-normal uppercase tracking-[.12em] text-fog xl:inline">Coordinated research archive</span>}
      </Link>
      <nav className="hidden items-stretch justify-center text-[13px] md:flex" aria-label="Primary navigation">
        <Link href="/exhibits/between-two-handles" className="flex items-center px-5 no-underline hover:bg-white/10">Exhibition</Link>
        <Link href="/exhibits/between-two-handles/sources" className="flex items-center px-5 no-underline hover:bg-white/10">Reading Room</Link>
        <Link href="/exhibits/between-two-handles/methodology" className="flex items-center px-5 no-underline hover:bg-white/10">Method</Link>
        <Link href="/admin" className="flex items-center px-5 no-underline hover:bg-white/10">Research Desk</Link>
      </nav>
      <LanguageToggle />
    </div>
  </header>;
}
