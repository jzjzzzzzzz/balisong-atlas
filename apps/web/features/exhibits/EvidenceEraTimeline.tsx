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
import Image from "next/image";
import { useLanguage } from "@/components/Providers";
import { BalisongKineticShowcase } from "@/features/reconstruction/BalisongKineticShowcase";
import { SafeProxyViewer } from "@/features/reconstruction/SafeProxyViewer";
import { CertaintyAuditPanel } from "@/features/exhibits/CertaintyAuditPanel";
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
    id: "comparative-1880",
    date: "1880",
    title: { en: "Documented comparative form", zh: "有图版记录的比较形态" },
    scope: {
      en: "US Patent 229,706 directly documents a Solingen clasp-knife with two rotating handle sections. Perret's 1771 book remains only an unresolved earlier comparison.",
      zh: "美国专利第 229,706 号直接记录了索林根一件具有两段转动刀柄的折叠刀。佩雷 1771 年著作仍只是一条尚未解决的更早比较线索。",
    },
    status: { en: "Record and broad form verified", zh: "记录与宽泛形态已核验" },
    gap: {
      en: "The patent proves a comparable form existed by 1880; it does not establish origin, a Philippine connection, or a transmission route.",
      zh: "专利只能证明可比较形态到 1880 年已经存在；它不能确立起源、菲律宾联系或传播路线。",
    },
    state: "direct-lead",
    sourceRanks: [26, 17, 16],
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
    id: "philippine-1947-1953",
    date: "1947–1953",
    title: { en: "Philippine vocabulary and industry records", zh: "菲律宾术语与产业记录" },
    scope: {
      en: "A 1947 Philippine periodical verifies popular-media vocabulary; a contemporaneous 1951 report records active Batangas production; a Taal transcription records an established local industry in 1953.",
      zh: "一份 1947 年菲律宾期刊核验了通俗媒体术语；1951 年同期报告记录八打雁已有活跃生产；塔阿尔转录稿则记录了 1953 年已经形成的当地产业。",
    },
    status: { en: "Vocabulary and industry verified; form unresolved", zh: "术语与产业已核验；形态仍未解决" },
    gap: {
      en: "The 1947 fiction and 1951 report provide no reliable object image. The 1953 National Library page images still need comparison, so no exact period proxy is supported.",
      zh: "1947 年文学作品与 1951 年报告都不提供可靠实物图像；1953 年国家图书馆原始页图仍须比对，因此不能支持精确时期代理。",
    },
    state: "direct-lead",
    sourceRanks: [29, 30, 25, 3, 13],
  },
  {
    id: "craft-1969-1994",
    date: "1969–1994",
    title: { en: "Cultural display, regulation, and catalogue visibility", zh: "文化展示、监管与目录可见性" },
    scope: {
      en: "A 1969 brochure citation chain, a 1971 Customs notice, a Philippine legal record, a 1994 metalcraft reference, and 1979–1994 catalogue scans create independently dated checkpoints.",
      zh: "1969 年手册引用链、1971 年海关通知、菲律宾法律记录、1994 年金属工艺参考与 1979—1994 年目录扫描，形成了彼此独立定年的检查点。",
    },
    status: { en: "Four dated records; catalogue form observed", zh: "四条定年记录；目录形态可直接观察" },
    gap: {
      en: "The original 1969 brochure is not locally available. Catalogue scans support broad external form, but their host, source family, and image rights still need review.",
      zh: "项目尚未在本地获得 1969 年原始手册。目录扫描可支持宽泛外部形态，但托管方、来源家族与图像权利仍需审核。",
    },
    state: "direct-lead",
    sourceRanks: [27, 18, 28, 22, 1],
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

const periodImages: Record<string, Array<{ image: string; title: { en: string; zh: string }; note: { en: string; zh: string } }>> = {
  "comparative-1880": [{ image: "/research/sastron-batangas-1895.webp", title: { en: "1895 Batangas book title page", zh: "1895 年《八打雁》题名页" }, note: { en: "Regional context only; not an 1880 object image.", zh: "仅作地区背景；不是 1880 年物件图像。" } }],
  "regional-1895-1919": [{ image: "/research/sastron-batangas-1895.webp", title: { en: "Regional publication record", zh: "地区出版物记录" }, note: { en: "Bibliographic context; no balisong form is identified on this cover.", zh: "书目背景；封面未识别出 balisong 形态。" } }, { image: "/research/media/baling-sungay-melchior22.jpg", title: { en: "Contemporary Batangas appearance", zh: "当代八打雁外观" }, note: { en: "Visible appearance only; photographed in 2021, not period evidence.", zh: "仅作可见外观；拍摄于 2021 年，不是同期证据。" } }],
  "philippine-1947-1953": [{ image: "/research/media/balisong-open-ringer.jpg", title: { en: "Open-state photograph", zh: "开放状态照片" }, note: { en: "Modern visual comparison; it does not illustrate the 1947–1953 records.", zh: "现代视觉比较；不直接说明 1947—1953 年记录。" } }, { image: "/research/media/balisong-closed-ringer.jpg", title: { en: "Closed-state photograph", zh: "闭合状态照片" }, note: { en: "Matched contemporary view; no date or origin is inferred.", zh: "配对当代视图；不推断年代或起源。" } }],
  "craft-1969-1994": [{ image: "/research/media/police-museum-display-sasha-taylor.jpg", title: { en: "Museum-display photograph", zh: "博物馆展示照片" }, note: { en: "Display context only; object-level catalogue metadata is absent.", zh: "仅作展示语境；缺少物件级目录元数据。" } }, { image: "/research/media/open-closed-comparison-iamthawalrus.jpg", title: { en: "Open / closed comparison", zh: "开合状态比较" }, note: { en: "Contemporary silhouette reference, not a 1969–1994 catalogue plate.", zh: "当代轮廓参考，不是 1969—1994 年目录图版。" } }],
  "contemporary-1995-present": [{ image: "/research/media/balisong-open-ringer.jpg", title: { en: "Open-state appearance", zh: "开放状态外观" }, note: { en: "CC-licensed contemporary photograph used for visible appearance.", zh: "用于可见外观研究的 CC 许可当代照片。" } }, { image: "/research/media/balisong-closed-ringer.jpg", title: { en: "Closed-state appearance", zh: "闭合状态外观" }, note: { en: "Matched view; no measurement or mechanism is inferred.", zh: "配对视图；不推断尺寸或机械结构。" } }, { image: "/research/media/before-1982-provenance-lead-szilas.jpg", title: { en: "Provenance lead", zh: "来源线索" }, note: { en: "Uploader dating remains unverified.", zh: "上传者标注年代仍未核验。" } }],
};

function LockedProxy({ onOpenDemo }: { onOpenDemo: () => void }) {
  const { locale } = useLanguage();
  return <section className="flex min-h-[520px] flex-col border border-ink/20 bg-[#e5ddce]">
    <div className="flex items-start justify-between gap-4 border-b border-ink/15 px-6 py-5">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[.12em] text-quiet">{locale === "zh" ? "重建门禁" : "Reconstruction gate"}</p>
        <h3 className="mt-1 font-display text-2xl">{locale === "zh" ? "历史视觉代理受门禁，证据边界研究已提供" : "Historical proxy gated; evidence-bounded study available"}</h3>
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
    <CertaintyAuditPanel />
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
          </div> : <div>
            <LockedProxy onOpenDemo={() => setShowDemo(true)} />
            <div className="mt-4">
              <div className="mb-3 border border-ochre/40 bg-amber-50 px-4 py-3 text-xs leading-5 text-ochre">
                {locale === "zh" ? "历史时期视觉代理仍被证据门禁阻止；下方仅展示不带时期断言的证据边界视觉研究。" : "The historical-period proxy remains gated; the study below is a method-only visual without a period claim."}
              </div>
              <BalisongKineticShowcase />
            </div>
          </div>}
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

      <section className="border-t border-ink/20 pt-7" data-testid="object-design-images">
        <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="font-mono text-[9px] font-bold uppercase tracking-[.12em] text-redline">{locale === "zh" ? "实物与档案图像" : "Object and archival images"}</p><h2 className="mt-2 font-display text-3xl">{locale === "zh" ? "不是虚拟图：当前时期的图像证据" : "Not virtual: image evidence for this frame"}</h2></div><p className="max-w-xl text-xs leading-5 text-quiet">{locale === "zh" ? "图片按来源页和证据边界展示；现代照片不会被倒推成历史物件图像。" : "Images are shown with source limits; modern photographs are not projected backward as historical object images."}</p></div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{(periodImages[selected.id] ?? []).map((item) => <article key={item.image} className="border border-ink/20 bg-white/30 p-3"><div className="relative aspect-[4/3] overflow-hidden bg-[#d2c8b7]"><Image src={item.image} alt={item.title[locale]} fill sizes="(max-width: 640px) 100vw, 33vw" className="object-cover" /></div><h3 className="mt-3 font-display text-xl leading-5">{item.title[locale]}</h3><p className="mt-2 text-xs leading-5 text-quiet">{item.note[locale]}</p></article>)}</div>
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
