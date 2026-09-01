"use client";
import { Circle, CircleDashed, HelpCircle } from "lucide-react";
import { useLanguage } from "./Providers";

export function EvidenceLegend() {
  const { messages } = useLanguage();
  return <div className="grid border-y border-ink md:grid-cols-3">
    {[{name:"Observed", text:messages.observed, icon:<Circle size={14} className="fill-moss text-moss"/>},{name:"Inferred", text:messages.inferred, icon:<CircleDashed size={14} className="text-redline"/>},{name:"Unknown", text:messages.unknown, icon:<HelpCircle size={14} className="text-quiet"/>}].map((item) => <div key={item.name} className="border-b border-ink/30 p-5 last:border-0 md:border-b-0 md:border-r md:last:border-r-0"><div className="mb-2 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[.12em]">{item.icon}{item.name}</div><p className="text-sm leading-6 text-quiet">{item.text}</p></div>)}
  </div>;
}
