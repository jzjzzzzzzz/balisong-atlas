"use client";
import { Languages } from "lucide-react";
import { useLanguage } from "./Providers";

export function LanguageToggle() {
  const { messages, toggle } = useLanguage();
  return <button type="button" onClick={toggle} className="focus-ring inline-flex items-center gap-2 rounded-full border border-ink/20 bg-paper/70 px-3 py-2 text-xs font-semibold hover:border-ochre" aria-label="Switch language"><Languages size={15} />{messages.language}</button>;
}
