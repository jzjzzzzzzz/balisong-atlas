import type { Metadata } from "next";
import { MuseumHeader } from "@/components/MuseumHeader";
import { ResearchPaperExperience } from "@/components/research/ResearchPaperExperience";
import { loadResearchPaper } from "@/lib/research-paper";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Between Two Handles | Balisong Atlas Research Paper",
  description: "A source-driven study of how the balisong became a form of Batangueño craft heritage, kinetic design, participatory performance, and contested legal classification.",
  alternates: { canonical: "/research/balisong-boundary-object" },
  authors: [{ name: "Balisong Atlas Research Team" }],
  keywords: ["balisong", "material culture", "craft heritage", "kinetic design", "participatory culture", "boundary object", "legal classification"],
  openGraph: {
    type: "article",
    title: "Between Two Handles | Balisong Atlas Research Paper",
    description: "A source-driven study of craft heritage, kinetic design, participatory performance, and contested legal classification.",
    url: "/research/balisong-boundary-object",
    modifiedTime: "2026-09-01T00:00:00.000Z",
    authors: ["Balisong Atlas Research Team"],
    images: [],
  },
  twitter: { card: "summary", title: "Between Two Handles | Balisong Atlas Research Paper", description: "An evidence-first interdisciplinary Research Draft." },
};

export default function ResearchPaperPage() {
  const data = loadResearchPaper();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ScholarlyArticle",
    headline: `${data.meta.title}: ${data.meta.subtitle}`,
    alternativeHeadline: `${data.meta.title_zh}：${data.meta.subtitle_zh}`,
    description: data.meta.abstract,
    author: [{ "@type": "Organization", name: "Balisong Atlas Research Team" }],
    dateModified: data.meta.last_verified,
    inLanguage: ["en", "zh-CN"],
    keywords: data.meta.keywords.join(", "),
    url: "/research/balisong-boundary-object",
    creativeWorkStatus: "Research Draft",
    isPartOf: { "@type": "WebSite", name: "Balisong Atlas", url: "/" },
  };
  return <>
    <MuseumHeader compact />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    <ResearchPaperExperience data={data} />
    <footer className="border-t border-ink/20 bg-night px-5 py-8 text-xs text-fog print:hidden md:px-10 lg:px-16"><div className="mx-auto flex max-w-[1200px] flex-wrap justify-between gap-4"><span>Balisong Atlas · Research Draft</span><span>Code: MIT · Research content and images retain their stated rights</span></div></footer>
  </>;
}
