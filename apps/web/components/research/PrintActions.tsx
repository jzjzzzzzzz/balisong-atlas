"use client";

import { useLanguage } from "@/components/Providers";
import { labels } from "./research-labels";

export function PrintActions() {
  const { locale } = useLanguage();
  return <button type="button" onClick={() => window.print()} className="focus-ring border border-ink px-4 py-3 font-mono text-[10px] uppercase tracking-[.12em] hover:bg-ink hover:text-paper print:hidden" data-testid="print-paper">
    {labels[locale].print}
  </button>;
}
