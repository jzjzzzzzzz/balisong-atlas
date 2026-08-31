"use client";
import { ArrowRight, FileImage, FileText, Shapes, Sparkles } from "lucide-react";

const nodes = [
  { id: "s1", type: "Source", title: "Fictional research sheet", icon: FileText, x: "6%", y: "16%", color: "bg-moss" },
  { id: "i1", type: "Image", title: "Abstract study A", icon: FileImage, x: "6%", y: "66%", color: "bg-moss" },
  { id: "c1", type: "Claim", title: "Two muted surface bands", icon: Sparkles, x: "39%", y: "16%", color: "bg-ochre" },
  { id: "c2", type: "Disputed claim", title: "Separate study attribution", icon: Sparkles, x: "39%", y: "66%", color: "bg-red-700" },
  { id: "f1", type: "Visual feature", title: "Two-tone surface", icon: Shapes, x: "72%", y: "38%", color: "bg-ink" },
];
export function EvidenceGraph() {
  return <div className="relative min-h-[520px] overflow-hidden rounded-3xl border border-ink/10 bg-white/45 p-4 paper-grid" aria-label="Evidence relationship graph">
    <svg className="absolute inset-0 h-full w-full" aria-hidden="true"><defs><marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10z" fill="#687574"/></marker></defs><path d="M190 105 C300 100 390 105 470 105" stroke="#405a55" strokeWidth="2" fill="none" markerEnd="url(#arrow)"/><path d="M190 365 C305 365 350 365 470 365" stroke="#9f3a38" strokeDasharray="5 5" strokeWidth="2" fill="none" markerEnd="url(#arrow)"/><path d="M600 120 C700 160 730 220 830 245" stroke="#687574" strokeWidth="2" fill="none" markerEnd="url(#arrow)"/><path d="M600 365 C700 330 730 280 830 255" stroke="#9f3a38" strokeDasharray="5 5" strokeWidth="2" fill="none" markerEnd="url(#arrow)"/></svg>
    {nodes.map(({id,type,title,icon:Icon,x,y,color}) => <button key={id} className="focus-ring absolute w-[27%] min-w-36 max-w-60 rounded-2xl border border-ink/10 bg-paper p-4 text-left shadow-lg transition hover:-translate-y-1" style={{left:x,top:y}}><span className={`mb-3 grid h-8 w-8 place-items-center rounded-full text-white ${color}`}><Icon size={15}/></span><span className="block text-[10px] font-bold uppercase tracking-[.13em] text-quiet">{type}</span><strong className="mt-1 block text-sm leading-5">{title}</strong></button>)}
    <div className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-4 rounded-xl bg-paper/90 p-3 text-[10px] uppercase tracking-[.12em] text-quiet"><span className="flex items-center gap-1"><ArrowRight size={13} className="text-moss"/> supports</span><span className="flex items-center gap-1"><ArrowRight size={13} className="text-red-700"/> contradicts</span><span>Filter: all reviewed records</span></div>
  </div>;
}
