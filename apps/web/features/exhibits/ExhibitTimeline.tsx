const entries = [
  { label: "Source saved", detail: "Fictional research sheet · page 1", status: "Accepted evidence", tone: "bg-moss" },
  { label: "Visual observation", detail: "Muted two-tone field · image region", status: "Observed", tone: "bg-moss" },
  { label: "Interpretive review", detail: "Neutral central field · human rationale", status: "Inferred", tone: "bg-ochre" },
  { label: "Unresolved attribution", detail: "Conflicting fixture caption retained", status: "Disputed", tone: "bg-red-700" },
];
export function ExhibitTimeline() { return <ol className="relative border-l border-ink/20 pl-8">{entries.map((item,index)=><li key={item.label} className="relative pb-9 last:pb-0"><span className={`absolute -left-[2.55rem] top-1 h-4 w-4 rounded-full border-4 border-paper ${item.tone}`}/><span className="text-[10px] font-bold uppercase tracking-[.13em] text-quiet">0{index+1} · {item.status}</span><h3 className="mt-1 font-display text-2xl">{item.label}</h3><p className="mt-1 text-sm text-quiet">{item.detail}</p></li>)}</ol>; }
