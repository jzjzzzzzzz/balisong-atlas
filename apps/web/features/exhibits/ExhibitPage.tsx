"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowRight, CircleAlert } from "lucide-react";
import { EvidenceLegend } from "@/components/EvidenceLegend";
import { MuseumHeader } from "@/components/MuseumHeader";
import { useLanguage, type Locale } from "@/components/Providers";
import { SafeProxyViewer } from "@/features/reconstruction/SafeProxyViewer";
import { LiteratureRegister } from "./LiteratureRegister";

const methodSteps = [
  { number: "01", enTitle: "Saved source", zhTitle: "保存来源", enText: "A source is located, captured, hashed, and preserved with provenance intact.", zhText: "定位并保存来源，计算文件哈希，同时保留完整来源链。", enState: "Observed", zhState: "直接观察" },
  { number: "02", enTitle: "Safe text", zhTitle: "安全文本", enText: "Controlled passages are detected and excluded before AI, embeddings, or public search.", zhText: "在进入 AI、向量嵌入或公共搜索前，检测并排除受控段落。", enState: "Observed", zhState: "直接观察" },
  { number: "03", enTitle: "Proposed claim", zhTitle: "待审核主张", enText: "A claim or observation is proposed only with a location in the saved corpus.", zhText: "只有绑定到已保存语料中的具体位置，才能提出待审核主张或观察。", enState: "Inferred", zhState: "推断" },
  { number: "04", enTitle: "Human review", zhTitle: "人工审核", enText: "A reviewer examines evidence, wording, rights, and alternative readings.", zhText: "审核人员检查证据、措辞、权利信息和其他可能解释。", enState: "Observed", zhState: "直接观察" },
  { number: "05", enTitle: "Contradiction retained", zhTitle: "保留矛盾", enText: "Conflicting accounts and shared source families remain visible.", zhText: "相互冲突的叙述和共享来源家族会被保留并展示。", enState: "Observed", zhState: "直接观察" },
  { number: "06", enTitle: "Public interpretation", zhTitle: "公共解释", enText: "Only reviewed material can appear with citations and uncertainty attached.", zhText: "只有经过审核的材料才能附带引用和不确定性说明公开展示。", enState: "Inferred", zhState: "推断" },
] as const;

function t(locale: Locale, en: string, zh: string) { return locale === "zh" ? zh : en; }

function FolioRail({ number, en, zh, locale }: { number: string; en: string; zh: string; locale: Locale }) {
  return <aside className="folio-rail" aria-hidden="true"><span className="block font-display text-lg text-redline">{number}</span><span className="folio-rail-label mt-7 block text-quiet">{t(locale, en, zh)}</span></aside>;
}

export function ExhibitPage({ demo = false }: { demo?: boolean }) {
  const { locale, messages } = useLanguage();
  const fullTitle = demo ? t(locale, "Balisong Atlas Demo Collection", "Balisong Atlas 证据流程演示集") : t(locale, "Between Two Handles: A Visual History of the Balisong", "双柄之间：蝴蝶刀的视觉设计史");
  const exhibitPath = demo ? "/exhibits/balisong-atlas-demo" : "/exhibits/between-two-handles";

  return <div className="min-h-screen paper-grain">
    <MuseumHeader/>
    <main>
      <section className="folio-section min-h-[calc(100vh-64px)]">
        <FolioRail number="01" en={demo ? "Demo collection" : "Exhibition"} zh={demo ? "演示资料集" : "数字展览"} locale={locale}/>
        <div className="grid min-w-0 lg:grid-cols-[minmax(0,1.75fr)_minmax(320px,.75fr)]">
          <div className="flex min-h-[680px] flex-col justify-between border-b border-ink p-6 md:p-10 lg:border-b-0 lg:border-r xl:p-12">
            <h1 aria-label={fullTitle} className="reveal-up max-w-[980px] font-display tracking-[-.055em]">
              <span className="block text-[clamp(4.4rem,10.2vw,10rem)] leading-[.76]">Balisong Atlas</span>
              <span className="mt-8 block text-[clamp(3.5rem,7vw,7.5rem)] leading-[.82] tracking-[-.035em]">{demo ? t(locale, "Demo Collection", "证据流程演示集") : t(locale, "Between Two Handles", "双柄之间")}</span>
              <span className="mt-5 block max-w-5xl text-[clamp(2.1rem,4.5vw,5rem)] font-normal leading-[.92] tracking-[-.035em] text-redline">{demo ? t(locale, "Evidence Workflow Fixture", "证据工作流测试集") : t(locale, "A Visual History of the Balisong", "蝴蝶刀的视觉设计史")}</span>
            </h1>
            <div className="mt-16 max-w-3xl">
              <div className="reveal-line h-px bg-ink"/>
              <p className="mt-6 font-display text-2xl leading-snug sm:text-3xl">{messages.tagline}</p>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-quiet">{demo ? t(locale, "A wholly fictional collection for validating sources, citations, human review, contradiction handling, and a nonfunctional visual proxy.", "完全虚构的测试资料集，用于验证来源、引文、人工审核、争议处理和非功能性视觉代理。") : t(locale, "The first exhibition remains in evidence collection. Historical conclusions are not published without evidence binding and human review.", "第一期展览仍处于证据收集阶段。没有完成证据绑定和人工审核的历史结论不会发布。")}</p>
              <div className="mt-7 flex flex-wrap gap-x-8 gap-y-4"><a href="#reading-room" className="focus-ring inline-flex items-center gap-3 border-b-2 border-redline pb-2 text-sm font-semibold text-redline no-underline">{demo ? messages.viewEvidence : t(locale, "Explore the evidence", "浏览证据")}<ArrowDown size={16}/></a><Link href={`${exhibitPath}/methodology`} className="focus-ring inline-flex items-center gap-3 border-b border-ink pb-2 text-sm font-semibold no-underline">{messages.method}<ArrowRight size={15}/></Link></div>
            </div>
          </div>

          <aside className="flex min-h-[520px] flex-col justify-between p-6 md:p-10 xl:p-12">
            <dl className="border-t border-ink font-mono text-[10px] uppercase tracking-[.06em]">{[
              [t(locale,"Edition status","版本状态"), demo ? t(locale,"Published fixture","已发布测试资料") : t(locale,"Draft / research stage","草稿／研究阶段")],
              [t(locale,"Language","语言"), t(locale,"English","中文")],
              [t(locale,"Curatorial approach","策展方法"), t(locale,"Evidence-first","证据优先")],
              [t(locale,"Source priority","来源优先级"), t(locale,"Archive · books · papers · web","档案 · 书籍 · 论文 · 网络")],
              [t(locale,"Rights posture","权利策略"), t(locale,"Closed until reviewed","审核前不公开")],
              [t(locale,"Historical claims","历史主张"), demo ? t(locale,"Fictional only","仅虚构内容") : t(locale,"None published","尚未发布")],
            ].map(([term,value]) => <div key={term} className="grid grid-cols-[1fr_1.05fr] gap-4 border-b border-ink/35 py-5"><dt className="text-quiet">{term}</dt><dd className="normal-case tracking-normal">{value}</dd></div>)}</dl>
            <div className="mt-12 border-l-2 border-redline pl-5"><p className="font-display text-2xl leading-snug">{t(locale,"Every public interpretation should show where it came from.","每一项公开解释，都应展示其证据来源。")}</p><p className="mt-3 font-mono text-[9px] uppercase tracking-[.1em] text-quiet">{t(locale,"Provenance · rights · uncertainty · review","来源链 · 权利 · 不确定性 · 审核")}</p></div>
          </aside>
        </div>
      </section>

      {!demo && <section className="folio-section bg-redline text-white"><FolioRail number="—" en="Editorial status" zh="编辑状态" locale={locale}/><div className="grid gap-8 px-6 py-9 md:px-10 lg:grid-cols-[1fr_2fr] lg:px-12"><div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[.1em]"><CircleAlert size={16}/>{t(locale,"Draft","草稿")}</div><div><h2 className="font-display text-3xl sm:text-4xl">{t(locale,"Evidence collection is in progress.","证据收集正在进行。")}</h2><p className="mt-3 max-w-3xl text-sm leading-6 text-white/75">{t(locale,"No unreviewed historical conclusions have been published. The register below is a research inventory, not an endorsement of every statement contained in each source.","目前没有发布未经审核的历史结论。下方登记册是研究资料清单，并不表示项目认可每个来源中的所有陈述。")}</p></div></div></section>}

      <section id="reading-room" className="folio-section scroll-mt-16">
        <FolioRail number="02" en={demo ? "Evidence register" : "Reading room"} zh={demo ? "证据登记册" : "研究阅览室"} locale={locale}/>
        <div className="min-w-0 px-6 py-16 md:px-10 lg:px-12 lg:py-20">{demo ? <DemoEvidence locale={locale}/> : <><div className="grid gap-8 border-t border-ink pt-6 lg:grid-cols-[1fr_.48fr_.75fr]"><div><h2 className="font-display text-5xl tracking-[-.04em] sm:text-6xl">{t(locale,"Reading Room","研究阅览室")}</h2></div><p className="font-display text-3xl leading-tight text-redline">{t(locale,"Books before posts.","书籍优先于网络帖子。")}</p><div><p className="text-sm leading-6">{t(locale,"A ranked register of archive records, books, period publications, papers, and institutional leads.","按优先级排列的档案记录、书籍、期刊、论文和机构线索登记册。")}</p><p className="mt-3 text-xs leading-5 text-quiet">{t(locale,"Priority controls discovery order only. It never substitutes for source criticism or determines whether a claim is true.","优先级只控制资料发现顺序，不能代替来源批判，也不能决定历史主张是否真实。")}</p></div></div><div className="mt-12"><LiteratureRegister compact/></div><div className="mt-7 flex flex-wrap items-center justify-between gap-4 border-b border-ink pb-7"><p className="max-w-2xl font-mono text-[10px] leading-5 uppercase tracking-[.08em] text-quiet">{t(locale,"Downloaded research copies remain private, content-addressed, and excluded from AI, embeddings, and public search pending rights and sensitive-content review.","下载的研究副本保持私有，并采用内容寻址存储；在完成权利与敏感内容审核前，不进入 AI、向量嵌入或公共搜索。")}</p><Link href={`${exhibitPath}/sources`} className="focus-ring inline-flex items-center gap-2 border-b border-redline pb-1 text-sm font-semibold text-redline no-underline">{t(locale,"Open full public register","打开完整公共登记册")}<ArrowRight size={14}/></Link></div></>}</div>
      </section>

      <section className="folio-section"><FolioRail number="03" en="Evidence method" zh="证据方法" locale={locale}/><div className="min-w-0 px-6 py-16 md:px-10 lg:px-12 lg:py-20"><div className="grid gap-8 border-t border-ink pt-6 lg:grid-cols-[1.3fr_.7fr]"><h2 className="font-display text-5xl tracking-[-.04em] sm:text-6xl">{t(locale,"Evidence Method","证据方法")}</h2><p className="max-w-lg text-sm leading-6 text-quiet">{t(locale,"A transparent editorial sequence applied to every claim, visual observation, and reconstruction hypothesis.","对每条历史主张、视觉观察和重建假设采用透明一致的编辑审核流程。")}</p></div><div className="mt-12 grid border-y border-ink sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">{methodSteps.map((step,index) => <article key={step.number} className="relative border-b border-ink/30 p-5 sm:border-r lg:min-h-[270px] lg:border-b-0 last:border-r-0"><span className="font-display text-2xl">{step.number}</span><h3 className="mt-7 font-display text-2xl leading-none">{t(locale,step.enTitle,step.zhTitle)}</h3><p className="mt-5 text-xs leading-5 text-quiet">{t(locale,step.enText,step.zhText)}</p><span className="absolute bottom-5 left-5 font-mono text-[8px] uppercase tracking-[.12em] text-quiet">{t(locale,step.enState,step.zhState)}</span>{index < methodSteps.length - 1 && <ArrowRight className="absolute -right-3 top-1/2 z-10 hidden bg-paper p-1 text-redline xl:block" size={22}/>}</article>)}</div></div></section>

      <section className="folio-section bg-night text-paper"><FolioRail number="04" en="Interpretive reconstruction" zh="解释性重建" locale={locale}/><div className="min-w-0 px-6 py-16 md:px-10 lg:px-12 lg:py-20"><div className="grid gap-8 border-t border-paper/70 pt-6 lg:grid-cols-[1.3fr_.7fr]"><h2 className="font-display text-5xl tracking-[-.04em] sm:text-6xl">{t(locale,"Interpretive Reconstruction","解释性重建")}</h2><p className="max-w-lg text-sm leading-6 text-fog">{t(locale,"A reconstruction is an evidence-based visual hypothesis, never a claim of exact form or manufacturing accuracy.","重建是以证据为基础的视觉假设，绝不宣称具有精确外形或制造级准确性。")}</p></div>{demo ? <div className="mt-12"><div className="mb-7 [&_p]:!text-fog [&>div]:!border-paper/40"><EvidenceLegend/></div><SafeProxyViewer/></div> : <div className="mt-12 grid min-h-[360px] place-items-center border border-paper/25 p-8 text-center"><div className="max-w-xl"><span className="font-mono text-[10px] uppercase tracking-[.12em] text-redline">{t(locale,"Capability held closed","功能暂未开放")}</span><h3 className="mt-5 font-display text-4xl">{t(locale,"No approved visual proxy exists for this draft exhibition.","当前草稿展览尚无已批准的视觉代理。")}</h3><p className="mt-4 text-sm leading-6 text-fog">{t(locale,"A proxy can appear only after accepted evidence, reviewed visual features, an approved Reconstruction Brief, and safety validation.","只有在获得已接受证据、经过审核的视觉特征、已批准的重建简报和安全验证后，才能展示视觉代理。")}</p></div></div>}<div className="mt-8 border border-redline"><p className="p-5 text-sm leading-6">{t(locale,"This reconstruction is a nonfunctional, evidence-based visual hypothesis. It is not a manufacturing model or an exact historical replica.","本重建是一个非功能性、以证据为基础的视觉假设，不是制造模型，也不是被宣称为完全准确的历史复制品。")}</p></div></div></section>
    </main>

    <footer className="grid bg-night text-paper md:grid-cols-[72px_1fr]"><div className="hidden border-r border-white/20 md:block"/><div className="grid gap-10 border-t border-white/25 px-6 py-12 md:px-10 lg:grid-cols-[1fr_1fr_1fr] lg:px-12"><div><strong className="font-display text-3xl font-normal">Balisong Atlas</strong><p className="mt-4 font-mono text-[9px] uppercase leading-5 tracking-[.12em] text-fog">{t(locale,"Coordinated evidence archive · Bilingual digital exhibition","协同证据档案 · 双语数字展览")}</p></div><div><p className="font-mono text-[9px] uppercase tracking-[.12em] text-redline">{t(locale,"Rights & attribution","权利与署名")}</p><p className="mt-4 text-xs leading-5 text-fog">{t(locale,"Code is MIT. Data, scans, imagery, and exhibition content retain the rights of their institutions and creators.","代码采用 MIT 许可证。数据、扫描件、图片和展览内容的权利仍归相关机构与创作者所有。")}</p></div><div><p className="font-mono text-[9px] uppercase tracking-[.12em] text-redline">{t(locale,"AI-use statement","AI 使用说明")}</p><p className="mt-4 text-xs leading-5 text-fog">{t(locale,"AI may assist extraction and comparison. It is not a source, cannot accept its own claims, and cannot resolve disputes.","AI 可以辅助提取和比较，但它不是来源，不能接受自己提出的主张，也不能自行解决历史争议。")}</p></div></div></footer>
  </div>;
}

function DemoEvidence({ locale }: { locale: Locale }) {
  return <><div className="grid gap-8 border-t border-ink pt-6 lg:grid-cols-[.75fr_1.25fr]"><div><h2 className="font-display text-5xl tracking-[-.04em] sm:text-6xl">{t(locale,"Evidence Register","证据登记册")}</h2></div><div><p className="font-display text-3xl leading-tight text-redline">{t(locale,"A visual hypothesis should expose the trail that produced it.","视觉假设应当展示形成它的完整证据路径。")}</p><p className="mt-5 max-w-2xl text-sm leading-6 text-quiet">{t(locale,"This fixture moves from saved source to reviewed claims, observations, explicit uncertainty, and a constrained browser visualization.","此测试资料展示从保存来源，到审核主张与观察、标注不确定性，再到受约束浏览器视觉展示的完整流程。")}</p></div></div><div className="mt-12 grid border-y border-ink md:grid-cols-3">{[["03","Reviewed claims","已审核主张"],["03","Visual observations","视觉观察"],["01","Open contradiction","待解决矛盾"]].map(([number,en,zh]) => <div key={en} className="border-b border-ink/30 p-6 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0"><strong className="font-display text-5xl font-normal text-redline">{number}</strong><span className="mt-3 block font-mono text-[9px] uppercase tracking-[.12em] text-quiet">{t(locale,en,zh)}</span></div>)}</div><div className="mt-12 grid gap-0 border border-ink md:grid-cols-2">{[["/abstract-study-a.png","Abstract fixture with a muted ochre band on a dark field","深色底面上带有低饱和赭色带的抽象测试图","Fictional source fixture A · public domain · complete attribution","虚构来源测试图 A · 公有领域 · 署名完整"],["/abstract-study-b.png","Abstract fixture with alternating circular color fields","具有交替圆形色块的抽象测试图","Fictional source fixture B · public domain · complete attribution","虚构来源测试图 B · 公有领域 · 署名完整"]].map(([src,enAlt,zhAlt,enCaption,zhCaption],index) => <figure key={src} className={index === 0 ? "border-b border-ink p-4 md:border-b-0 md:border-r" : "p-4"}><div className="relative aspect-[3/2]"><Image src={src} alt={t(locale,enAlt,zhAlt)} fill className="object-cover" sizes="(max-width:768px) 100vw, 50vw"/></div><figcaption className="mt-4 font-mono text-[9px] uppercase tracking-[.08em] text-quiet">{t(locale,enCaption,zhCaption)}</figcaption></figure>)}</div></>;
}
