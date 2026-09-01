"use client";

import {
  AlertTriangle,
  BookOpenText,
  Box,
  ExternalLink,
  FlaskConical,
  LockKeyhole,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useLanguage } from "@/components/Providers";
import { BalisongKineticShowcase } from "@/features/reconstruction/BalisongKineticShowcase";
import { SafeProxyViewer } from "@/features/reconstruction/SafeProxyViewer";
import { researchLibrary } from "@/lib/research-library";

type PeriodState = "direct-lead" | "context" | "metadata";

type EvidencePeriod = {
  id: string;
  date: string;
  dateZh?: string;
  title: { en: string; zh: string };
  scope: { en: string; zh: string };
  status: { en: string; zh: string };
  gap: { en: string; zh: string };
  state: PeriodState;
  sourceRanks: number[];
};

const periods: EvidencePeriod[] = [
  {
    id: "comparative-1771",
    date: "1771",
    title: { en: "Comparative cutlery record", zh: "欧洲刀具对照记录" },
    scope: {
      en: "A dated French cutlery book and a museum contact lead are retained to audit—not confirm—recurring origin narratives.",
      zh: "保留一部有明确年代的法国刀具书籍和一条博物馆联系线索，用于核查而不是确认反复出现的起源叙述。",
    },
    status: { en: "Relevance under review", zh: "相关性审核中" },
    gap: {
      en: "A curator must identify the exact plate and determine whether the depicted object is genuinely comparable before any claim is proposed.",
      zh: "必须由馆员定位具体图版并判断所示物件是否真正具有可比性，之后才能提出任何主张。",
    },
    state: "metadata",
    sourceRanks: [17, 16],
  },
  {
    id: "regional-1895-1919",
    date: "1895–1919",
    title: { en: "Batangas regional context", zh: "八打雁地区背景" },
    scope: {
      en: "Regional books, official exposition catalogues, and period craft journals define a search window; they do not yet establish a design chronology.",
      zh: "地区书籍、官方博览会目录和同期工艺期刊共同形成检索范围，但尚不能建立设计年代序列。",
    },
    status: { en: "Targeted OCR and page review", zh: "定向 OCR 与逐页审核" },
    gap: {
      en: "The regional sources need image-level review for directly depicted external form, terminology, provenance, and source dependence.",
      zh: "需要在图片层面审核地区史料中的直接外部形态、术语、来源链和相互依赖关系。",
    },
    state: "context",
    sourceRanks: [4, 5, 8],
  },
  {
    id: "museum-1926-1951",
    date: "1926–1951",
    title: { en: "Museum and local-history records", zh: "博物馆与地方史记录" },
    scope: {
      en: "Museum material-culture catalogues and retrospective local-history holdings provide comparison and archival leads.",
      zh: "博物馆物质文化目录和回溯性地方史馆藏提供比较材料与档案线索。",
    },
    status: { en: "Context only", zh: "仅作背景材料" },
    gap: {
      en: "No reviewed passage or image in this lane currently supports a public balisong form for this period.",
      zh: "这一研究区间目前没有经过审核的段落或图片能够支持公开展示该时期的 balisong 形态。",
    },
    state: "context",
    sourceRanks: [13, 3],
  },
  {
    id: "craft-1955-1994",
    date: "1955–1994",
    title: { en: "Craft, cinema, and catalogue visibility", zh: "工艺、电影与目录可见性" },
    scope: {
      en: "A 1955 studio-inventory title, a Philippine metalcraft reference, and 1979–1994 catalogue scans create separate media, craft, and design-history checkpoints.",
      zh: "1955 年片厂目录标题、菲律宾金属工艺参考与 1979—1994 年目录扫描，分别建立媒体、工艺和设计史检查点。",
    },
    status: { en: "Direct page leads found", zh: "已发现直接页面线索" },
    gap: {
      en: "The film inventory proves only a dated title; a viewing copy is still required. Catalogue scans can support broad external form, but their host and image rights need review.",
      zh: "电影目录只能证明一个有明确年代的片名，仍需取得可观看副本。目录扫描可支持宽泛的外部形态，但托管方和图像权利需要审核。",
    },
    state: "direct-lead",
    sourceRanks: [20, 1, 18, 22],
  },
  {
    id: "contemporary-1995-present",
    date: "1995–present",
    dateZh: "1995—至今",
    title: { en: "Contemporary cultural research", zh: "当代文化研究" },
    scope: {
      en: "Regional books, institutional theses, and a municipal record frame cultural identity, terminology, media, livelihood, and living-craft questions.",
      zh: "地区书籍、机构论文与市政府记录，共同建立文化身份、术语、媒体、生计与活态工艺研究框架。",
    },
    status: { en: "Access and rights pending", zh: "等待获取与权利确认" },
    gap: {
      en: "The most directly relevant thesis is metadata-only. A lawful research copy and page-level review are still required.",
      zh: "最直接相关的论文目前只有元数据。仍需合法取得研究副本并完成逐页审核。",
    },
    state: "metadata",
    sourceRanks: [14, 2, 19, 21, 23],
  },
];

const stateStyles: Record<PeriodState, string> = {
  "direct-lead": "border-moss bg-moss text-white",
  context: "border-ochre bg-paper text-ochre",
  metadata: "border-ink/40 bg-paper text-quiet",
};

function LockedProxy({ onOpenDemo }: { onOpenDemo: () => void }) {
  const { locale } = useLanguage();
  return <section className="flex min-h-[520px] flex-col border border-ink/20 bg-[#e5ddce]">
    <div className="flex items-start justify-between gap-4 border-b border-ink/15 px-6 py-5">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[.12em] text-quiet">{locale === "zh" ? "重建门禁" : "Reconstruction gate"}</p>
        <h3 className="mt-1 font-display text-2xl">{locale === "zh" ? "证据不足，暂不生成视觉代理" : "Evidence insufficient; visual proxy withheld"}</h3>
      </div>
      <LockKeyhole className="mt-1 shrink-0 text-quiet" aria-hidden="true" />
    </div>
    <div className="grid flex-1 place-items-center px-6 py-14 text-center">
      <div className="max-w-md">
        <div className="mx-auto grid h-20 w-20 place-items-center border border-dashed border-ink/35 text-quiet"><Box size={30} aria-hidden="true" /></div>
        <p className="mt-7 text-base leading-7 text-quiet">{locale === "zh"
          ? "只有经过人工接受的主张、图片观察与公开安全设计特征才能进入重建简报。本时期目前没有满足条件的视觉特征。"
          : "Only human-accepted claims, image observations, and public-safe design features may enter a Reconstruction Brief. This period has no qualifying visual features yet."}</p>
        <button type="button" onClick={onOpenDemo} className="focus-ring mt-7 inline-flex items-center gap-2 border border-ink px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-[.1em] hover:bg-ink hover:text-white">
          <FlaskConical size={15} aria-hidden="true" />{locale === "zh" ? "查看虚构 A-01 方法演示" : "View fictional A-01 method demo"}
        </button>
      </div>
    </div>
    <div className="border-t border-ink/15 px-5 py-3 font-mono text-[9px] uppercase tracking-[.1em] text-quiet">{locale === "zh" ? "无模型 · 无尺寸 · 无活动结构" : "No model · no dimensions · no moving structure"}</div>
  </section>;
}

export function EvidenceEraTimeline() {
  const { locale } = useLanguage();
  const [selectedId, setSelectedId] = useState(periods[3].id);
  const [showDemo, setShowDemo] = useState(false);
  const [layer, setLayer] = useState<"design" | "performance">("design");
  const selected = periods.find((period) => period.id === selectedId) ?? periods[0];
  const sources = useMemo(
    () => selected.sourceRanks.map((rank) => researchLibrary.find((item) => item.rank === rank)).filter((item): item is NonNullable<typeof item> => Boolean(item)),
    [selected],
  );

  return <div className="space-y-8">
    <div className="flex flex-wrap items-center justify-between gap-4 border-y border-ink/20 py-3">
      <div className="flex gap-1" role="tablist" aria-label={locale === "zh" ? "时间线研究层" : "Timeline research layer"}>
        <button type="button" role="tab" aria-selected={layer === "design"} onClick={() => { setLayer("design"); setShowDemo(false); }} className={`focus-ring px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[.1em] ${layer === "design" ? "bg-ink text-white" : "text-quiet hover:bg-ink/5"}`}>{locale === "zh" ? "物件设计史" : "Object design history"}</button>
        <button type="button" role="tab" aria-selected={layer === "performance"} onClick={() => { setLayer("performance"); setShowDemo(false); }} className={`focus-ring px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[.1em] ${layer === "performance" ? "bg-ink text-white" : "text-quiet hover:bg-ink/5"}`}>{locale === "zh" ? "表演／媒体研究" : "Performance / media study"}</button>
      </div>
      <p className="max-w-xl text-right text-xs leading-5 text-quiet">{locale === "zh" ? "时间区间是研究框架，不是已经接受的历史结论。" : "Date ranges are research frames, not accepted historical conclusions."}</p>
    </div>

    {layer === "performance" ? <BalisongKineticShowcase /> : <>
      <div className="overflow-x-auto pb-3">
        <ol className="relative grid min-w-[980px] grid-cols-5 before:absolute before:left-[10%] before:right-[10%] before:top-5 before:h-px before:bg-ink/25">
          {periods.map((period, index) => {
            const active = period.id === selected.id;
            return <li key={period.id} className="relative px-3 text-center">
              <button type="button" onClick={() => { setSelectedId(period.id); setShowDemo(false); }} className="focus-ring group w-full" aria-current={active ? "step" : undefined}>
                <span className={`relative z-10 mx-auto grid h-10 w-10 place-items-center rounded-full border-2 font-mono text-xs font-bold transition-transform group-hover:scale-110 ${active ? "border-ink bg-ink text-white" : stateStyles[period.state]}`}>{index + 1}</span>
                <span className="mt-4 block font-mono text-[10px] font-bold uppercase tracking-[.12em] text-quiet">{locale === "zh" ? period.dateZh ?? period.date : period.date}</span>
                <span className={`mt-2 block font-display text-lg leading-5 ${active ? "text-ink" : "text-quiet"}`}>{period.title[locale]}</span>
                <span className="mt-2 block text-xs leading-5 text-quiet">{period.status[locale]}</span>
              </button>
            </li>;
          })}
        </ol>
      </div>

      <section className="grid border border-ink/20 xl:grid-cols-[minmax(0,1.45fr)_minmax(330px,.75fr)]">
        <div className="min-w-0 border-b border-ink/20 p-4 xl:border-b-0 xl:border-r">
          {showDemo ? <div>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3 border border-ochre/40 bg-amber-50 px-4 py-3 text-xs leading-5 text-ochre">
              <span>{locale === "zh" ? "虚构 A-01 仅演示审核和显示方法，不代表任何历史时期。" : "Fictional A-01 demonstrates review and display methods only; it represents no historical period."}</span>
              <button type="button" onClick={() => setShowDemo(false)} className="focus-ring font-mono text-[9px] font-bold uppercase tracking-[.1em] underline underline-offset-4">{locale === "zh" ? "返回时期门禁" : "Return to period gate"}</button>
            </div>
            <SafeProxyViewer />
          </div> : <LockedProxy onOpenDemo={() => setShowDemo(true)} />}
        </div>

        <aside className="bg-white/35 px-6 py-7">
          <p className="font-mono text-[10px] uppercase tracking-[.13em] text-quiet">{locale === "zh" ? selected.dateZh ?? selected.date : selected.date}</p>
          <h2 className="mt-2 font-display text-3xl leading-tight">{selected.title[locale]}</h2>
          <p className="mt-4 text-sm leading-6 text-quiet">{selected.scope[locale]}</p>

          <dl className="mt-7 border-y border-ink/20 text-sm">
            <div className="flex items-center justify-between gap-4 border-b border-ink/10 py-3"><dt className="text-quiet">{locale === "zh" ? "已筛选来源" : "Screened sources"}</dt><dd className="font-mono font-bold">{sources.length}</dd></div>
            <div className="flex items-center justify-between gap-4 border-b border-ink/10 py-3"><dt className="text-quiet">{locale === "zh" ? "已接受主张" : "Accepted claims"}</dt><dd className="font-mono font-bold">0</dd></div>
            <div className="flex items-center justify-between gap-4 border-b border-ink/10 py-3"><dt className="text-quiet">{locale === "zh" ? "已接受视觉观察" : "Accepted observations"}</dt><dd className="font-mono font-bold">0</dd></div>
            <div className="flex items-center justify-between gap-4 py-3"><dt className="text-quiet">{locale === "zh" ? "视觉代理" : "Visual proxy"}</dt><dd className="inline-flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[.08em] text-red-700"><LockKeyhole size={13} aria-hidden="true" />{locale === "zh" ? "已锁定" : "Locked"}</dd></div>
          </dl>

          <div className="mt-7 border-l-2 border-ochre pl-4">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[.12em] text-ochre">{locale === "zh" ? "研究缺口" : "Research gap"}</p>
            <p className="mt-2 text-sm leading-6 text-quiet">{selected.gap[locale]}</p>
          </div>
        </aside>
      </section>

      <section className="grid gap-8 border-t border-ink/20 pt-7 lg:grid-cols-[1.3fr_.7fr]">
        <div>
          <div className="flex items-center gap-2"><BookOpenText size={18} aria-hidden="true" /><h2 className="font-display text-2xl">{locale === "zh" ? "来源与审核记录" : "Sources and review record"}</h2></div>
          <div className="mt-4 divide-y divide-ink/15 border-y border-ink/15">
            {sources.map((source) => <article key={source.rank} className="grid gap-3 py-5 sm:grid-cols-[5.5rem_1fr_auto] sm:items-start">
              <span className="font-mono text-[10px] font-bold uppercase tracking-[.1em] text-quiet">{locale === "zh" ? `${source.tier} 级` : `Tier ${source.tier}`} · {locale === "zh" ? source.yearZh : source.year}</span>
              <div><h3 className="font-display text-lg leading-6">{locale === "zh" ? source.titleZh : source.title}</h3><p className="mt-1 text-xs leading-5 text-quiet">{locale === "zh" ? source.noteZh : source.note}</p></div>
              <a href={source.url} target="_blank" rel="noreferrer" className="focus-ring inline-flex items-center gap-1 font-mono text-[9px] font-bold uppercase tracking-[.1em] underline underline-offset-4">{locale === "zh" ? "来源记录" : "Source record"}<ExternalLink size={12} aria-hidden="true" /></a>
            </article>)}
          </div>
        </div>
        <aside className="border-l border-ink/20 pl-6">
          <div className="flex items-center gap-2 text-ochre"><AlertTriangle size={18} aria-hidden="true" /><h2 className="font-display text-2xl">{locale === "zh" ? "进入 3D 前" : "Before 3D"}</h2></div>
          <ol className="mt-4 space-y-4 text-sm leading-6 text-quiet">
            {[
              { en: "A reviewer accepts page-bound historical claims.", zh: "审核人员接受绑定到具体页面的历史主张。" },
              { en: "Visible external features receive accepted image observations.", zh: "可见外部特征获得已接受的图片观察。" },
              { en: "Unknown form remains unknown and is not completed.", zh: "未知形态保持未知，不进行补全。" },
              { en: "An approved brief produces one joined, unitless, nonfunctional proxy.", zh: "经批准的重建简报只能生成单一合并、无单位、非功能性视觉代理。" },
            ].map((item, index) => <li key={item.en} className="grid grid-cols-[1.5rem_1fr] gap-2"><span className="font-mono text-xs font-bold text-ink">0{index + 1}</span><span>{locale === "zh" ? item.zh : item.en}</span></li>)}
          </ol>
        </aside>
      </section>
    </>}
  </div>;
}
