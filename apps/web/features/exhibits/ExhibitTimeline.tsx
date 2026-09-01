"use client";

import { useLanguage } from "@/components/Providers";

const entries = [
  { enLabel: "Source saved", zhLabel: "来源已保存", enDetail: "Fictional research sheet · page 1", zhDetail: "虚构研究资料 · 第 1 页", enStatus: "Accepted evidence", zhStatus: "已接受证据", tone: "bg-moss" },
  { enLabel: "Visual observation", zhLabel: "视觉观察", enDetail: "Muted two-tone field · image region", zhDetail: "低饱和双色区域 · 图片标注范围", enStatus: "Observed", zhStatus: "直接观察", tone: "bg-moss" },
  { enLabel: "Interpretive review", zhLabel: "解释性审核", enDetail: "Neutral central field · human rationale", zhDetail: "中性中央区域 · 人工审核理由", enStatus: "Inferred", zhStatus: "推断", tone: "bg-ochre" },
  { enLabel: "Unresolved attribution", zhLabel: "未解决的归属问题", enDetail: "Conflicting fixture caption retained", zhDetail: "相互冲突的测试说明被保留", enStatus: "Disputed", zhStatus: "有争议", tone: "bg-red-700" },
];

export function ExhibitTimeline() {
  const { locale } = useLanguage();
  return <ol className="relative border-l border-ink/20 pl-8">{entries.map((item,index) => {
    const label = locale === "zh" ? item.zhLabel : item.enLabel;
    return <li key={item.enLabel} className="relative pb-9 last:pb-0"><span className={`absolute -left-[2.55rem] top-1 h-4 w-4 rounded-full border-4 border-paper ${item.tone}`}/><span className="text-[10px] font-bold uppercase tracking-[.13em] text-quiet">0{index+1} · {locale === "zh" ? item.zhStatus : item.enStatus}</span><h3 className="mt-1 font-display text-2xl">{label}</h3><p className="mt-1 text-sm text-quiet">{locale === "zh" ? item.zhDetail : item.enDetail}</p></li>;
  })}</ol>;
}
