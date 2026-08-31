"use client";
import { Check, ChevronRight, CircleDashed, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { EvidenceLegend } from "@/components/EvidenceLegend";
import { SafeProxyViewer } from "./SafeProxyViewer";
const steps=["Accepted Evidence","Visual Observation Matrix","Design Feature Review","Reconstruction Brief","Safety Validation","Safe Proxy Preview"];
export function ReconstructionWorkspace(){const [active,setActive]=useState(3);return <div className="grid gap-6 xl:grid-cols-[260px_1fr]"><nav className="space-y-2" aria-label="Reconstruction steps">{steps.map((step,index)=><button key={step} onClick={()=>setActive(index)} className={`focus-ring flex w-full items-center gap-3 rounded-xl border p-3 text-left text-sm ${index===active?"border-ochre bg-ochre/5":"border-ink/10 bg-white/35"}`}><span className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold ${index<active?"bg-moss text-white":index===active?"bg-ochre text-white":"bg-ink/5 text-quiet"}`}>{index<active?<Check size={13}/>:index+1}</span><span className="flex-1">{step}</span><ChevronRight size={13}/></button>)}</nav><section>{active===0&&<div className="space-y-5"><EvidenceLegend/><div className="rounded-2xl border border-ink/10 bg-white/50 p-6"><h2 className="font-display text-3xl">Accepted evidence only</h2><p className="mt-3 text-sm text-quiet">2 accepted claims · 3 accepted observations · 1 disputed claim excluded from generation</p></div></div>}{active===1&&<div className="rounded-2xl border border-ink/10 bg-white/50 p-6"><h2 className="font-display text-3xl">Visual observation matrix</h2><div className="mt-5 divide-y divide-ink/10">{["Muted two-tone surface · observed","Rounded outer contour · observed","Circular surface fields · observed"].map(x=><p key={x} className="py-3 text-sm">{x}</p>)}</div></div>}{active===2&&<div className="grid gap-4 sm:grid-cols-2">{["Rounded continuous contour","Muted two-tone surface","Circular field motif","Neutral central field"].map((x,index)=><div key={x} className="rounded-2xl border border-ink/10 bg-white/50 p-5"><span className="text-[10px] uppercase tracking-[.12em] text-quiet">{index===3?"Inferred":"Observed"}</span><h3 className="mt-3 font-display text-2xl">{x}</h3><span className="mt-5 inline-flex items-center gap-1 text-xs text-moss"><Check size={13}/> Human reviewed</span></div>)}</div>}{active===3&&<div className="rounded-2xl border border-ink/10 bg-white/50 p-6"><div className="flex items-center justify-between"><div><p className="eyebrow">ReconstructionBriefV1</p><h2 className="mt-2 font-display text-3xl">A-01 abstract visual hypothesis</h2></div><span className="rounded-full bg-moss/10 px-3 py-1 text-xs font-bold text-moss">Approved</span></div><pre className="scrollbar-thin mt-6 max-h-[480px] overflow-auto rounded-xl bg-night p-5 text-xs leading-6 text-fog">{`{
  "schema_version": "1.0",
  "visual_features": [
    { "category": "silhouette", "epistemic_state": "observed", "evidence_observation_ids": ["…"] },
    { "category": "external_form", "epistemic_state": "inferred", "evidence_claim_ids": ["…"] }
  ],
  "excluded_information": ["measurement", "mechanism", "manufacturing", "operation"],
  "safety_constraints": {
    "nonfunctional": true,
    "real_scale_removed": true,
    "joined_mesh_only": true,
    "neutral_central_insert": true,
    "no_moving_parts": true
  }
}`}</pre></div>}{active===4&&<div className="rounded-2xl border border-moss/20 bg-moss/5 p-6"><ShieldCheck size={32} className="text-moss"/><h2 className="mt-5 font-display text-3xl">Policy validation passed</h2><div className="mt-5 grid gap-3 sm:grid-cols-2">{["One joined mesh","Real scale removed","No moving parts","Neutral central insert","Rounded abstract surfaces","No manufacturing exports"].map(x=><p key={x} className="flex items-center gap-2 rounded-xl bg-paper p-3 text-sm"><Check size={14} className="text-moss"/>{x}</p>)}</div><div className="mt-5 flex items-center gap-2 text-sm text-ochre"><CircleDashed size={15}/> Blender capability unavailable locally; fixture viewer remains honest and available.</div></div>}{active===5&&<SafeProxyViewer/>}</section></div>}
