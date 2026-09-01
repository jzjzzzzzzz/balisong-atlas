"use client";

import { useLanguage } from "./Providers";

const styles: Record<string, string> = {
  accepted: "bg-moss/10 text-moss border-moss/20", observed: "bg-moss/10 text-moss border-moss/20",
  proposed: "bg-ochre/10 text-ochre border-ochre/20", inferred: "bg-ochre/10 text-ochre border-ochre/20",
  disputed: "bg-red-50 text-red-800 border-red-200", unknown: "bg-ink/5 text-quiet border-ink/10",
  verified: "bg-moss/10 text-moss border-moss/20", draft: "bg-ink/5 text-quiet border-ink/10", processed: "bg-moss/10 text-moss border-moss/20",
};
const zhLabels: Record<string, string> = { accepted: "已接受", observed: "直接观察", proposed: "待审核", inferred: "推断", disputed: "有争议", unknown: "未知", verified: "已核验", draft: "草稿", processed: "已处理" };

export function StatusPill({ children }: { children: string }) {
  const { locale } = useLanguage();
  const key = children.toLowerCase().replaceAll(" ", "_");
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.12em] ${styles[key] ?? styles.unknown}`}>{locale === "zh" ? zhLabels[key] ?? children : children}</span>;
}
