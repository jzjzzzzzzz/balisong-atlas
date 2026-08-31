"use client";
import { Circle, CircleDashed, HelpCircle } from "lucide-react";
import { useLanguage } from "./Providers";

export function EvidenceLegend() {
  const { messages } = useLanguage();
  return <div className="grid overflow-hidden rounded-2xl border border-ink/10 bg-white/50 md:grid-cols-3">
    {[{name:"Observed", text:messages.observed, icon:<Circle size={17} className="fill-moss text-moss"/>},{name:"Inferred", text:messages.inferred, icon:<CircleDashed size={17} className="text-ochre"/>},{name:"Unknown", text:messages.unknown, icon:<HelpCircle size={17} className="text-quiet"/>}].map((item) => <div key={item.name} className="border-b border-ink/10 p-5 last:border-0 md:border-b-0 md:border-r md:last:border-r-0"><div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[.14em]">{item.icon}{item.name}</div><p className="text-sm leading-6 text-quiet">{item.text}</p></div>)}
  </div>;
}
