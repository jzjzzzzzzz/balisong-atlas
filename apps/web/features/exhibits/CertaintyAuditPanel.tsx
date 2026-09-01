"use client";

import { ArrowUpRight, CircleHelp, FileCheck2, Link2 } from "lucide-react";
import { useMemo, useState } from "react";
import auditData from "../../../../data/research/certainty-audit.json";
import { useLanguage } from "@/components/Providers";
import { researchLibrary } from "@/lib/research-library";

type AuditStatus = "verified_record" | "corroborated_lead" | "unresolved";
type AuditRecord = (typeof auditData.records)[number];

const sourceRanks: Record<string, number> = {
  "jansen-clasp-knife-patent-1880": 26,
  "ilang-ilang-balisong-fiction-1947": 29,
  "lardizabal-community-schools-batangas-1951": 30,
  "batangas-history-taal-transcription-part-3": 25,
  "ang-nayong-pilipino-brochure-1969": 27,
  "yasa-nayong-pilipino-2024": 18,
  "us-customs-imported-balisong-knives-1971": 28,
  "people-v-lasanas-1987-lawphil": 22,
  "ccp-encyclopedia-metalcraft-1994": 1,
  "galvan-2016-dlsu-thesis": 2,
  "perret-art-du-coutelier-1771": 17,
  "ia-filipinaspequeo01sastgoog": 4,
  "ia-officialcatalogu00loui_2": 5,
  "krieger-1926-usnm-bulletin-137": 13,
};

const statusStyles: Record<AuditStatus, string> = {
  verified_record: "border-moss bg-moss text-white",
  corroborated_lead: "border-ochre bg-[#efe2c2] text-ochre",
  unresolved: "border-ink/35 bg-paper text-quiet",
};

export function CertaintyAuditPanel() {
  const { locale } = useLanguage();
  const [active, setActive] = useState<"all" | AuditStatus>("all");
  const records = useMemo(
    () => auditData.records.filter((record) => active === "all" || record.status === active),
    [active],
  );

  const labels = locale === "zh" ? {
    eyebrow: "确定性核查 · 2026-09-01",
    title: "把“记录确定”与“起源确定”分开",
    intro: "这轮核查完成了七条记录级验证、两条相互印证的线索，并保留三项尚未解决的问题。AI 只能提出 proposed 记录；accepted 仍须人工审核签署。",
    all: "全部",
    verified_record: "记录已核验",
    corroborated_lead: "已相互印证",
    unresolved: "尚未解决",
    supports: "现在可以确定",
    limit: "仍不能推出",
    locator: "定位",
    source: "来源记录",
    proposed: "主张状态：proposed",
  } : {
    eyebrow: "Certainty audit · 2026-09-01",
    title: "Separate a verified record from a certain origin",
    intro: "This pass completed seven record-level verifications, retained two corroborated leads, and kept three questions unresolved. AI can propose records only; accepted status still requires a signed human review.",
    all: "All",
    verified_record: "Record verified",
    corroborated_lead: "Corroborated lead",
    unresolved: "Unresolved",
    supports: "What is now certain",
    limit: "What it still cannot prove",
    locator: "Locator",
    source: "Source record",
    proposed: "Claim state: proposed",
  };

  const filters: Array<"all" | AuditStatus> = ["all", "verified_record", "corroborated_lead", "unresolved"];
  const counts: Record<"all" | AuditStatus, number> = {
    all: auditData.records.length,
    verified_record: auditData.summary.verified_records,
    corroborated_lead: auditData.summary.corroborated_leads,
    unresolved: auditData.summary.unresolved_questions,
  };

  return <section className="border-y border-ink bg-[#e8dfcf]" data-testid="certainty-audit">
    <div className="grid gap-6 border-b border-ink px-5 py-7 lg:grid-cols-[1fr_minmax(420px,.9fr)] lg:px-7">
      <div>
        <p className="font-mono text-[9px] font-bold uppercase tracking-[.13em] text-redline">{labels.eyebrow}</p>
        <h2 className="mt-2 max-w-2xl font-display text-3xl leading-tight lg:text-4xl">{labels.title}</h2>
      </div>
      <div className="lg:self-end">
        <p className="max-w-2xl text-sm leading-6 text-quiet">{labels.intro}</p>
        <p className="mt-3 font-mono text-[9px] font-bold uppercase tracking-[.09em] text-ink">{labels.proposed}</p>
      </div>
    </div>

    <div className="grid grid-cols-2 border-b border-ink lg:grid-cols-4" role="tablist" aria-label={labels.title}>
      {filters.map((status) => <button
        key={status}
        type="button"
        role="tab"
        aria-selected={active === status}
        onClick={() => setActive(status)}
        className={`focus-ring border-r border-ink px-4 py-4 text-left last:border-r-0 ${active === status ? "bg-ink text-white" : "hover:bg-white/40"}`}
      >
        <span className={`block font-display text-3xl ${active === status ? "text-white" : "text-redline"}`}>{String(counts[status]).padStart(2, "0")}</span>
        <span className="mt-1 block font-mono text-[9px] font-bold uppercase tracking-[.09em]">{labels[status]}</span>
      </button>)}
    </div>

    <div className="divide-y divide-ink/25">
      {records.map((record) => <AuditRow key={record.id} record={record} locale={locale} labels={labels} />)}
    </div>
  </section>;
}

function AuditRow({
  record,
  locale,
  labels,
}: {
  record: AuditRecord;
  locale: "en" | "zh";
  labels: Record<string, string>;
}) {
  const status = record.status as AuditStatus;
  const primaryEvidence = record.evidence[0];
  const rank = sourceRanks[primaryEvidence.source_id];
  const source = researchLibrary.find((item) => item.rank === rank);
  const Icon = status === "verified_record" ? FileCheck2 : status === "corroborated_lead" ? Link2 : CircleHelp;

  return <article className="grid gap-5 px-5 py-6 lg:grid-cols-[9rem_minmax(280px,.85fr)_minmax(360px,1.15fr)] lg:px-7">
    <div>
      <p className="font-display text-3xl text-redline">{record.date}</p>
      <span className={`mt-3 inline-flex items-center gap-1.5 border px-2 py-1 font-mono text-[8px] font-bold uppercase tracking-[.08em] ${statusStyles[status]}`}>
        <Icon size={12} aria-hidden="true" />{labels[status]}
      </span>
    </div>
    <div>
      <h3 className="font-display text-xl leading-6">{record.statement[locale]}</h3>
      <p className="mt-3 font-mono text-[9px] uppercase leading-4 tracking-[.08em] text-quiet">{labels.locator}: {primaryEvidence.locator}</p>
      {source && <a href={source.url} target="_blank" rel="noreferrer" className="focus-ring mt-4 inline-flex items-center gap-1 border-b border-redline pb-1 font-mono text-[9px] font-bold uppercase tracking-[.08em] text-redline no-underline">
        {labels.source}<ArrowUpRight size={11} aria-hidden="true" />
      </a>}
    </div>
    <dl className="grid gap-4 text-sm leading-6 sm:grid-cols-2">
      <div className="border-l-2 border-moss pl-4">
        <dt className="font-mono text-[8px] font-bold uppercase tracking-[.1em] text-moss">{labels.supports}</dt>
        <dd className="mt-2 text-quiet">{record.supports[locale]}</dd>
      </div>
      <div className="border-l-2 border-ochre pl-4">
        <dt className="font-mono text-[8px] font-bold uppercase tracking-[.1em] text-ochre">{labels.limit}</dt>
        <dd className="mt-2 text-quiet">{record.limit[locale]}</dd>
      </div>
    </dl>
  </article>;
}
