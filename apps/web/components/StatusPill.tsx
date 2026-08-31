const styles: Record<string, string> = {
  accepted: "bg-moss/10 text-moss border-moss/20", observed: "bg-moss/10 text-moss border-moss/20",
  proposed: "bg-ochre/10 text-ochre border-ochre/20", inferred: "bg-ochre/10 text-ochre border-ochre/20",
  disputed: "bg-red-50 text-red-800 border-red-200", unknown: "bg-ink/5 text-quiet border-ink/10",
  draft: "bg-ink/5 text-quiet border-ink/10", processed: "bg-moss/10 text-moss border-moss/20"
};
export function StatusPill({ children }: { children: string }) { const key = children.toLowerCase().replaceAll(" ", "_"); return <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.12em] ${styles[key] ?? styles.unknown}`}>{children}</span>; }
