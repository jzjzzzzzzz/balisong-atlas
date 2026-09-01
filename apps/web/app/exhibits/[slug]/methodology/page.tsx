import { PublicSection } from "@/features/exhibits/PublicSection";
import { EvidenceLegend } from "@/components/EvidenceLegend";
import { LocalizedText } from "@/components/LocalizedText";

const steps = [
  ["01", "Preserve", "保存", "Save immutable source snapshots, hashes, rights, access time, and attribution.", "保存不可变来源快照、文件哈希、权利信息、访问时间和署名信息。"],
  ["02", "Parse safely", "安全解析", "Extract page-aware text and images; redact controlled content before AI or public search.", "提取带页码定位的文本和图片；在进入 AI 或公共搜索前遮蔽受控内容。"],
  ["03", "Propose", "提出建议", "AI may suggest claims and visual observations only from saved corpus context.", "AI 只能依据已保存语料提出待审核主张和视觉观察。"],
  ["04", "Review", "人工审核", "A person accepts, revises, rejects, or preserves a disagreement.", "审核人员负责接受、修改、拒绝主张，或保留争议。"],
  ["05", "Relate", "建立关联", "Bind claims to evidence and expose source families, support, context, and contradiction.", "将主张绑定到证据，并展示来源家族、支持证据、背景证据和冲突证据。"],
  ["06", "Interpret", "解释重建", "Create an approved brief and a nonfunctional visual proxy with uncertainty attached.", "根据已批准的重建简报创建非功能性视觉代理，并附带不确定性说明。"],
] as const;

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <PublicSection
    slug={slug}
    eyebrow={{ en: "Research method", zh: "研究方法" }}
    title={{ en: "Evidence before appearance", zh: "证据先于外观" }}
    intro={{ en: "AI is an extraction and comparison aid, never a historical source. Reconstruction remains an interpretive hypothesis.", zh: "AI 只是提取和比较工具，不是历史来源。重建始终是一种解释性假设。" }}
  ><EvidenceLegend/><div className="mt-10 grid gap-4 md:grid-cols-2">{steps.map(([n,enTitle,zhTitle,enText,zhText]) => <article key={n} className="rounded-2xl border border-ink/10 p-6"><span className="font-mono text-xs text-ochre">{n}</span><h2 className="mt-5 font-display text-3xl"><LocalizedText en={enTitle} zh={zhTitle}/></h2><p className="mt-3 text-sm leading-6 text-quiet"><LocalizedText en={enText} zh={zhText}/></p></article>)}</div></PublicSection>;
}
