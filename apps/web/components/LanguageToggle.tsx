"use client";
import { useLanguage } from "./Providers";

export function LanguageToggle() {
  const { messages, toggle } = useLanguage();
  return <button type="button" onClick={toggle} className="focus-ring border-l border-white/25 px-5 py-5 font-mono text-[11px] uppercase tracking-[.08em] text-white hover:bg-white/10" aria-label="Switch language">{messages.language === "中文" ? "EN / 中文" : "中文 / EN"}</button>;
}
