import { PublicSection } from "@/features/exhibits/PublicSection";
import { LiteratureRegister } from "@/features/exhibits/LiteratureRegister";
import { LocalizedText } from "@/components/LocalizedText";

const rows = [
  ["Fictional A-01 research sheet", "虚构 A-01 研究资料", "PDF · Tier A", "PDF · A 级", "Public domain", "公有领域", "Page-level text and block locations", "页级文本与区块定位"],
  ["Abstract fixture study 1", "抽象测试图 1", "Image · Tier A", "图片 · A 级", "Public domain", "公有领域", "Observed color and contour", "直接观察的色彩与轮廓"],
  ["Abstract fixture study 2", "抽象测试图 2", "Image · Tier A", "图片 · A 级", "Public domain", "公有领域", "Observed surface motif", "直接观察的表面纹样"],
] as const;

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const demo = slug === "balisong-atlas-demo";
  return <PublicSection
    slug={slug}
    eyebrow={demo ? { en: "Source register", zh: "来源登记册" } : { en: "Reading Room", zh: "研究阅览室" }}
    title={demo ? { en: "Sources, rights & attribution", zh: "来源、权利与署名" } : { en: "Books before posts.", zh: "书籍优先于网络帖子。" }}
    intro={demo ? { en: "The public register prioritizes source identity, location, rights, and contribution over long copied excerpts.", zh: "公共登记册优先展示来源身份、位置、权利和研究贡献，而不是大段复制原文。" } : { en: "A screened, public-safe research queue. Filter the sixteen highest-priority leads while keeping discovery rank separate from historical truth.", zh: "经过筛选、适合公开展示的研究队列。可以筛选十六条最高优先级线索，同时明确区分发现排序与历史真实性。" }}
  >{demo ? <div className="overflow-x-auto border-y border-ink"><table className="w-full min-w-[720px] text-left text-sm"><thead><tr>{[["Source","来源"],["Type & tier","类型与等级"],["Rights","权利"],["Research contribution","研究贡献"]].map(([en,zh]) => <th key={en} className="border-b border-ink p-4 font-mono text-[9px] uppercase tracking-[.13em]"><LocalizedText en={en} zh={zh}/></th>)}</tr></thead><tbody>{rows.map((row) => <tr key={row[0]}>{[[row[0],row[1]],[row[2],row[3]],[row[4],row[5]],[row[6],row[7]]].map(([en,zh]) => <td key={en} className="border-b border-ink/20 p-4"><LocalizedText en={en} zh={zh}/></td>)}</tr>)}</tbody></table></div> : <><LiteratureRegister/><div className="mt-10 grid gap-8 border-y border-ink py-7 lg:grid-cols-2"><div><h2 className="font-display text-3xl"><LocalizedText en="Access is not publication." zh="获得资料不等于允许发布。"/></h2><p className="mt-3 text-sm leading-6 text-quiet"><LocalizedText en="Research copies are stored privately by SHA-256 and excluded from AI, embeddings, public search, and exhibit display until rights and sensitive-content review is complete." zh="研究副本按 SHA-256 私有保存；在权利与敏感内容审核完成前，不进入 AI、向量嵌入、公共搜索或展览展示。"/></p></div><div><h2 className="font-display text-3xl"><LocalizedText en="A page lead is not evidence." zh="页面线索不等于证据。"/></h2><p className="mt-3 text-sm leading-6 text-quiet"><LocalizedText en="A term match only identifies a page for inspection. A claim still needs a reviewer-verified passage, location, rights decision, and audit record." zh="术语命中只用于定位待检查页面。历史主张仍须绑定经审核的段落、位置、权利决定和审计记录。"/></p></div></div></>}</PublicSection>;
}
