"use client";

import { Languages } from "lucide-react";
import { useLanguage } from "./Providers";

export function LanguageToggle() {
  const { messages, toggle } = useLanguage();
  return <button type="button" onClick={toggle} className="focus-ring flex items-center gap-2 border-l border-white/25 px-5 py-5 font-mono text-[11px] uppercase tracking-[.08em] text-white hover:bg-white/10" aria-label={messages.switchLanguage} title={messages.switchLanguage}><Languages size={13} aria-hidden="true" />{messages.languageTarget}</button>;
}
