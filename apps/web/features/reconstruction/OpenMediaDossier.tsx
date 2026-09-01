"use client";

import { ArrowUpRight, CirclePause, CirclePlay, Film, ImageIcon } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useLanguage } from "@/components/Providers";

type Localized = { en: string; zh: string };

const motionRecords = [
  {
    id: "djlo-long",
    image: "/research/media/opening-closing-djlo.gif",
    width: 174,
    height: 115,
    title: { en: "Opening / closing motion record", zh: "开合运动记录" },
    creator: "DJLO · 2011",
    license: "CC BY-SA 3.0",
    href: "https://commons.wikimedia.org/wiki/File:Opening_and_closing_a_Balisong_aka_Butterfly_Knife.gif",
    note: {
      en: "Used only to compare broad body order and whole-object orientation. Modern self-published media—not evidence of historical performance.",
      zh: "只用于比较宽泛部件先后关系与整体朝向。这是当代自发布媒体，不构成历史表演证据。",
    },
    family: { en: "Source family A · primary sequence", zh: "来源家族 A · 主要序列" },
  },
  {
    id: "djlo-short",
    image: "/research/media/opening-closing-simple-djlo.gif",
    width: 191,
    height: 116,
    title: { en: "Short motion variant", zh: "短版运动变体" },
    creator: "DJLO · 2011",
    license: "CC BY-SA 3.0",
    href: "https://commons.wikimedia.org/wiki/File:Opening_and_closing_a_balisong_simple.gif",
    note: {
      en: "A second pose-order check from the same creator. It is grouped with, not counted independently from, the first record.",
      zh: "来自同一创作者的第二条姿态顺序核对记录。它与第一条归入同一来源家族，不作为独立印证。",
    },
    family: { en: "Source family A · dependent variant", zh: "来源家族 A · 相关变体" },
  },
  {
    id: "gumballwolf",
    image: "/research/media/performance-loop-gumballwolf.gif",
    width: 360,
    height: 640,
    title: { en: "Contemporary performance envelope", zh: "当代表演运动范围" },
    creator: "Gumballwolf · 2020",
    license: "CC BY-SA 4.0",
    href: "https://commons.wikimedia.org/wiki/File:A_little_bit_of_flipping.gif",
    note: {
      en: "An independent continuity check for whole-object motion only. No frame stepping, timing data, grip analysis, or instructions are extracted.",
      zh: "仅作为整体运动连续性的独立核对。不提取逐帧、计时、握持分析或动作说明。",
    },
    family: { en: "Source family B · independent modern media", zh: "来源家族 B · 独立当代媒体" },
  },
] as const;

const photographs: readonly {
  image: string;
  width: number;
  height: number;
  title: Localized;
  creator: string;
  license: string;
  href: string;
  state: "observed" | "context" | "unverified";
  note: Localized;
}[] = [
  {
    image: "/research/media/balisong-open-ringer.jpg", width: 500, height: 375,
    title: { en: "Matched open view", zh: "配对开放视图" }, creator: "Ringer · 2016", license: "CC BY-SA 4.0",
    href: "https://commons.wikimedia.org/wiki/File:Balisong_open.jpg", state: "observed",
    note: { en: "Visible contemporary open-state appearance only.", zh: "仅支持当代开放状态的可见外观。" },
  },
  {
    image: "/research/media/balisong-closed-ringer.jpg", width: 500, height: 375,
    title: { en: "Matched closed view", zh: "配对闭合视图" }, creator: "Ringer · 2016", license: "CC BY-SA 4.0",
    href: "https://commons.wikimedia.org/wiki/File:Balisong_closed.jpg", state: "observed",
    note: { en: "Same creator, date, and photographic location as the open view.", zh: "与开放视图具有相同创作者、日期和拍摄地点。" },
  },
  {
    image: "/research/media/baling-sungay-melchior22.jpg", width: 1280, height: 853,
    title: { en: "Surface and material appearance", zh: "表面与材料外观" }, creator: "Melchior22 · 2021", license: "CC BY-SA 4.0",
    href: "https://commons.wikimedia.org/wiki/File:BALING_SUNGAY.jpg", state: "observed",
    note: { en: "Color and surface appearance are observable; the uploader's heritage narrative is not accepted as historical evidence.", zh: "颜色与表面外观可直接观察；上传者的遗产叙述不被直接接受为历史证据。" },
  },
  {
    image: "/research/media/open-closed-comparison-iamthawalrus.jpg", width: 525, height: 394,
    title: { en: "Open / closed silhouette comparison", zh: "开合轮廓比较" }, creator: "Iamthawalrus · 2013", license: "CC BY-SA 3.0",
    href: "https://commons.wikimedia.org/wiki/File:ButterflyKnifeOpenandClosed.jpg", state: "observed",
    note: { en: "Broad silhouette comparison only; no real scale is inferred.", zh: "只用于宽泛轮廓比较，不推算真实尺度。" },
  },
  {
    image: "/research/media/police-museum-display-sasha-taylor.jpg", width: 853, height: 1280,
    title: { en: "Museum-display context", zh: "博物馆展示语境" }, creator: "Sasha Taylor · 2014", license: "CC BY-SA 2.0",
    href: "https://commons.wikimedia.org/wiki/File:West_Midlands_Police_Museum_(13176531015).jpg", state: "context",
    note: { en: "Photographic context only; no object-level catalogue metadata was found on the file page.", zh: "仅作为摄影语境；文件页未提供可审核的物件级目录元数据。" },
  },
  {
    image: "/research/media/before-1982-provenance-lead-szilas.jpg", width: 1280, height: 1280,
    title: { en: "Uploader-dated provenance lead", zh: "上传者标注年代的来源线索" }, creator: "Szilas · photographed 2025", license: "CC BY 4.0",
    href: "https://commons.wikimedia.org/wiki/File:Balisong,_made_before_1982.jpg", state: "unverified",
    note: { en: "The pre-1982 date appears only in the uploader title. It remains unverified and does not date the 3D preset.", zh: "“1982 年以前”只出现在上传者标题中，尚未核验，不能据此为三维预设定年。" },
  },
] as const;

const stateCopy = {
  observed: { en: "Visible observation", zh: "可见观察" },
  context: { en: "Context only", zh: "仅背景语境" },
  unverified: { en: "Dating unverified", zh: "年代未核验" },
} as const;

export function OpenMediaDossier() {
  const { locale } = useLanguage();
  const [activeMotion, setActiveMotion] = useState<string | null>("djlo-long");

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setActiveMotion(null);
  }, []);

  return <section className="border-y border-ink/25 py-8" data-testid="open-media-dossier" aria-labelledby="open-media-heading">
    <div className="grid gap-5 lg:grid-cols-[290px_1fr] lg:items-end">
      <div>
        <p className="font-mono text-[9px] font-bold uppercase tracking-[.12em] text-redline">{locale === "zh" ? "9 项开放许可媒体" : "9 open-licensed media records"}</p>
        <h2 id="open-media-heading" className="mt-2 font-display text-3xl">{locale === "zh" ? "影像证据阅览室" : "Visual media evidence room"}</h2>
      </div>
      <p className="max-w-3xl text-sm leading-6 text-quiet">{locale === "zh"
        ? "所有本地副本都记录创作者、来源页、许可、哈希与证据边界。开放许可只解决展示权利，不会自动证明上传者所写的年代、起源或历史叙述。"
        : "Every local copy records creator, source page, license, hash, and evidence limits. An open license permits display; it does not verify an uploader's date, origin, or historical narrative."}</p>
    </div>

    <div className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,.85fr)]">
      <div className="border border-ink/20 bg-night p-4 text-white">
        <div className="flex items-center justify-between gap-4 border-b border-white/15 pb-3">
          <div className="flex items-center gap-2"><Film size={16} aria-hidden="true" /><h3 className="font-display text-2xl">{locale === "zh" ? "连续运动记录" : "Continuous motion records"}</h3></div>
          <span className="font-mono text-[8px] uppercase tracking-[.1em] text-fog">{locale === "zh" ? "无逐帧／无速度／无教学" : "No stepping / speed / instruction"}</span>
        </div>

        <div className="mt-4 aspect-[16/10] overflow-hidden border border-white/15 bg-black/35">
          {activeMotion ? (() => {
            const selected = motionRecords.find((item) => item.id === activeMotion) ?? motionRecords[0];
            return <div className="relative h-full w-full">
              <Image src={selected.image} alt={selected.title[locale]} fill unoptimized sizes="(max-width: 1024px) 100vw, 55vw" className="object-contain" priority={selected.id === "djlo-long"} />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent px-4 pb-4 pt-12">
                <p className="font-display text-xl">{selected.title[locale]}</p>
                <p className="mt-1 font-mono text-[8px] uppercase tracking-[.1em] text-fog">{selected.creator} · {selected.license}</p>
              </div>
            </div>;
          })() : <div className="grid h-full place-items-center px-8 text-center">
            <div><CirclePause className="mx-auto text-fog" aria-hidden="true" /><p className="mt-3 text-sm text-fog">{locale === "zh" ? "运动媒体已暂停；选择下方记录重新载入。" : "Motion media is paused. Select a record below to load it."}</p></div>
          </div>}
        </div>

        <div className="mt-3 grid gap-2 md:grid-cols-3">
          {motionRecords.map((record) => {
            const active = activeMotion === record.id;
            return <button key={record.id} type="button" aria-pressed={active} onClick={() => setActiveMotion(active ? null : record.id)} className={`focus-ring min-h-[110px] border px-3 py-3 text-left ${active ? "border-amber-200 bg-white/10" : "border-white/15 hover:bg-white/5"}`}>
              <span className="flex items-center gap-2 font-mono text-[8px] font-bold uppercase tracking-[.09em] text-fog">{active ? <CirclePause size={13} aria-hidden="true" /> : <CirclePlay size={13} aria-hidden="true" />}{record.family[locale]}</span>
              <span className="mt-2 block font-display text-base leading-5">{record.title[locale]}</span>
            </button>;
          })}
        </div>

        {motionRecords.map((record) => activeMotion === record.id && <div key={record.id} className="mt-4 border-l-2 border-amber-200 pl-4 text-xs leading-5 text-fog">
          <p>{record.note[locale]}</p>
          <a href={record.href} target="_blank" rel="noreferrer" className="focus-ring mt-2 inline-flex items-center gap-1 font-mono text-[8px] font-bold uppercase tracking-[.09em] text-white underline underline-offset-4">{locale === "zh" ? "来源与许可" : "Source and license"}<ArrowUpRight size={11} aria-hidden="true" /></a>
        </div>)}
      </div>

      <aside className="border border-ink/20 bg-[#e6dece] p-5">
        <p className="font-mono text-[9px] font-bold uppercase tracking-[.11em] text-ochre">{locale === "zh" ? "如何进入三维运动" : "How media informs 3D motion"}</p>
        <h3 className="mt-2 font-display text-2xl">{locale === "zh" ? "只转译关系，不复制技巧" : "Translate relationships, not technique"}</h3>
        <ol className="mt-5 divide-y divide-ink/15 border-y border-ink/15 text-sm leading-6 text-quiet">
          <li className="py-4"><strong className="text-ink">01</strong><span className="ml-4">{locale === "zh" ? "比较外部三部分的宽泛先后关系。" : "Compare the broad order of three external bodies."}</span></li>
          <li className="py-4"><strong className="text-ink">02</strong><span className="ml-4">{locale === "zh" ? "核对整体朝向变化与连续过渡。" : "Check whole-object orientation changes and continuous transitions."}</span></li>
          <li className="py-4"><strong className="text-ink">03</strong><span className="ml-4">{locale === "zh" ? "去除手部、握持、速度、角度和动作步骤。" : "Remove hand, grip, speed, angle, and action-step information."}</span></li>
          <li className="py-4"><strong className="text-ink">04</strong><span className="ml-4">{locale === "zh" ? "将结果应用于无真实单位的中性视觉代理。" : "Apply the result to a neutral proxy with no real units."}</span></li>
        </ol>
        <p className="mt-5 text-xs leading-5 text-quiet">{locale === "zh" ? "三条运动记录来自两个来源家族；因此不是三份独立证据。生成节奏为展示设计，不复制原片速度。" : "The three motion records belong to two source families, so they are not three independent sources. Display cadence is synthetic and does not copy source timing."}</p>
      </aside>
    </div>

    <div className="mt-9 flex items-center gap-2"><ImageIcon size={17} aria-hidden="true" /><h3 className="font-display text-2xl">{locale === "zh" ? "图片观察与证据边界" : "Image observations and evidence limits"}</h3></div>
    <div className="mt-4 grid gap-0 border-l border-t border-ink/20 sm:grid-cols-2 xl:grid-cols-3">
      {photographs.map((photo) => <article key={photo.image} className="flex flex-col border-b border-r border-ink/20 bg-white/25 p-4">
        <div className="relative aspect-[4/3] overflow-hidden bg-[#cbc2b1]">
          <Image src={photo.image} alt={photo.title[locale]} fill sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw" className="object-cover" />
        </div>
        <div className="mt-4 flex items-start justify-between gap-3">
          <h4 className="font-display text-xl leading-6">{photo.title[locale]}</h4>
          <span className={`shrink-0 border-l-2 pl-2 font-mono text-[8px] font-bold uppercase tracking-[.07em] ${photo.state === "observed" ? "border-moss text-moss" : photo.state === "context" ? "border-ochre text-ochre" : "border-redline text-redline"}`}>{stateCopy[photo.state][locale]}</span>
        </div>
        <p className="mt-2 font-mono text-[8px] uppercase tracking-[.09em] text-quiet">{photo.creator} · {photo.license}</p>
        <p className="mt-3 text-xs leading-5 text-quiet">{photo.note[locale]}</p>
        <a href={photo.href} target="_blank" rel="noreferrer" className="focus-ring mt-auto inline-flex items-center gap-1 self-start pt-4 font-mono text-[8px] font-bold uppercase tracking-[.09em] underline underline-offset-4">{locale === "zh" ? "查看来源页" : "View source page"}<ArrowUpRight size={11} aria-hidden="true" /></a>
      </article>)}
    </div>
  </section>;
}
