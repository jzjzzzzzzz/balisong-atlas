"use client";

import { useLanguage } from "@/components/Providers";
import { labels } from "./research-labels";

const styles: Record<string, string> = {
  documented: "border-moss/50 bg-moss/10 text-moss",
  corroborated: "border-ink/40 bg-ink/5 text-ink",
  contested: "border-amber-700/40 bg-amber-700/10 text-amber-900",
  interpretive: "border-blue-900/30 bg-blue-900/5 text-blue-950",
  insufficient: "border-quiet/40 bg-quiet/5 text-quiet",
};
export function EvidenceBadge({ status }: { status: string }) {
  const { locale } = useLanguage();
  const t = labels[locale];
  const text = status === "documented" ? t.documented : status === "corroborated" ? t.corroborated : status === "contested" ? t.contested : status === "insufficient" ? t.insufficient : t.interpretive;
  return <span className={`inline-flex border px-2 py-1 font-mono text-[9px] uppercase tracking-[.12em] ${styles[status] ?? styles.interpretive}`}>{text}</span>;
}
