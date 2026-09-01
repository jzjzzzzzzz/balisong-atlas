import fs from "node:fs";
import path from "node:path";

export type PaperMeta = {
  title: string;
  subtitle: string;
  title_zh: string;
  subtitle_zh: string;
  slug: string;
  status: string;
  authors: string[];
  abstract: string;
  keywords: string[];
  keywords_zh: string[];
  word_count: number;
  citation_style: string;
  last_verified: string;
  legal_sources_as_of: string;
  ai_disclosure: string;
};

export type PaperBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading3"; text: string }
  | { type: "callout"; text: string }
  | { type: "figure"; id: string }
  | { type: "keywords"; text: string };

export type PaperSection = { id: string; number: string; title: string; blocks: PaperBlock[] };
export type PaperNote = { number: number; keys: string[]; text: string };
export type BibEntry = { key: string; type: string; fields: Record<string, string> };
export type FigureRecord = {
  figure_id: string;
  filename: string;
  title: string;
  source: string;
  creator: string;
  date: string;
  institution: string;
  stable_url: string;
  rights_status: string;
  license: string;
  attribution: string;
  public_display_allowed: string;
  synthetic: string;
  purpose: string;
  caption: string;
  alt_text: string;
  associated_claim_ids: string;
};
export type SourceRecord = Record<string, string>;
export type ClaimRecord = Record<string, string>;
export type ArgumentNode = {
  id: string;
  label: { en: string; zh: string };
  status: string;
  sectionId?: string;
  claimIds: string[];
  sourceKeys?: string[];
  contradictingSourceKeys?: string[];
  summary?: { en: string; zh: string };
  children?: ArgumentNode[];
};
export type ArgumentMap = { center: ArgumentNode; branches: ArgumentNode[] };
export type ResearchStats = {
  schemaVersion: string;
  slug: string;
  status: string;
  lastVerified: string;
  legalSourcesAsOf: string;
  canonicalPath: string;
  candidateSourceCount: number;
  citedSourceCount: number;
  lawfulLocalResearchCopies: number;
  sourceStatuses: Record<string, number>;
  excludedSourceCount: number;
  articleWordCount: number;
  abstractWordCount: number;
  chineseAbstractHanCharacters: number;
  footnoteCount: number;
  figureCount: number;
  citationStyle: string;
  aiDisclosure: { en: string; zh: string };
};

export type ResearchPaperData = {
  meta: PaperMeta;
  sections: PaperSection[];
  notes: PaperNote[];
  chineseSummary: string[];
  bibliography: Array<BibEntry & { formatted: string; category: "primary" | "scholarship" | "institutional" }>;
  figures: FigureRecord[];
  sources: SourceRecord[];
  claims: ClaimRecord[];
  argumentMap: ArgumentMap;
  stats: ResearchStats;
};

function repoRoot() {
  const cwd = process.cwd();
  if (fs.existsSync(path.join(cwd, "content", "research"))) return cwd;
  return path.resolve(cwd, "../..");
}

function read(name: string) {
  return fs.readFileSync(path.join(repoRoot(), name), "utf8");
}

function stripQuotes(value: string) {
  const trimmed = value.trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function parseFrontmatter(markdown: string): { meta: PaperMeta; body: string } {
  const match = markdown.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) throw new Error("Research paper frontmatter is missing");
  const values: Record<string, string | string[] | number> = {};
  for (const line of match[1].split("\n")) {
    const divider = line.indexOf(":");
    if (divider < 0) continue;
    const key = line.slice(0, divider).trim();
    const raw = line.slice(divider + 1).trim();
    if (raw.startsWith("[") && raw.endsWith("]")) {
      values[key] = raw.slice(1, -1).split(",").map((part) => stripQuotes(part));
    } else if (/^\d+$/.test(raw)) values[key] = Number(raw);
    else values[key] = stripQuotes(raw);
  }
  return { meta: values as unknown as PaperMeta, body: match[2] };
}

function slugSection(number: string) {
  return number === "Abstract" ? "abstract" : number === "AI" ? "ai-disclosure" : `section-${number}`;
}

function parseBlocks(raw: string): PaperBlock[] {
  const blocks: PaperBlock[] = [];
  for (const chunk of raw.trim().split(/\n\n+/)) {
    const value = chunk.trim();
    if (!value) continue;
    if (value.startsWith("### ")) blocks.push({ type: "heading3", text: value.slice(4) });
    else if (value.startsWith("> ")) blocks.push({ type: "callout", text: value.replace(/^> ?/gm, "") });
    else if (/^\[\[figure:[A-Z0-9]+\]\]$/.test(value)) blocks.push({ type: "figure", id: value.slice(9, -2) });
    else if (value.startsWith("**Keywords:**")) blocks.push({ type: "keywords", text: value.replace("**Keywords:**", "").trim() });
    else blocks.push({ type: "paragraph", text: value.replace(/\n/g, " ") });
  }
  return blocks;
}

function parsePaper(markdown: string) {
  const { meta, body } = parseFrontmatter(markdown);
  const [articleBody, notesBody = ""] = body.split("\n## Notes\n");
  const sections: PaperSection[] = [];
  const regex = /^## (.+)$/gm;
  const heads = [...articleBody.matchAll(regex)];
  heads.forEach((head, index) => {
    const label = head[1];
    const start = (head.index ?? 0) + head[0].length;
    const end = heads[index + 1]?.index ?? articleBody.length;
    const numbered = label.match(/^(\d+)\.\s+(.+)$/);
    const number = numbered?.[1] ?? (label === "Abstract" ? "Abstract" : "AI");
    const title = numbered?.[2] ?? label;
    sections.push({ id: slugSection(number), number, title, blocks: parseBlocks(articleBody.slice(start, end)) });
  });
  const notes: PaperNote[] = [];
  for (const match of notesBody.matchAll(/^\[\^(\d+)\]:\s+\{([^}]+)\}\s+(.+)$/gm)) {
    notes.push({ number: Number(match[1]), keys: match[2].split(",").map((item) => item.trim()), text: match[3].trim() });
  }
  return { meta, sections, notes };
}

function parseCsv(text: string): SourceRecord[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === '"') {
      if (quoted && text[index + 1] === '"') { field += '"'; index += 1; }
      else quoted = !quoted;
    } else if (char === "," && !quoted) { row.push(field); field = ""; }
    else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && text[index + 1] === "\n") index += 1;
      row.push(field); field = "";
      if (row.some(Boolean)) rows.push(row);
      row = [];
    } else field += char;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  const [header = [], ...data] = rows;
  return data.map((values) => Object.fromEntries(header.map((key, index) => [key, values[index] ?? ""])));
}

function parseBib(text: string): BibEntry[] {
  const entries: BibEntry[] = [];
  let cursor = 0;
  while (cursor < text.length) {
    const at = text.indexOf("@", cursor);
    if (at < 0) break;
    const open = text.indexOf("{", at);
    if (open < 0) break;
    const type = text.slice(at + 1, open).trim().toLowerCase();
    let depth = 1;
    let end = open + 1;
    for (; end < text.length && depth > 0; end += 1) {
      if (text[end] === "{") depth += 1;
      else if (text[end] === "}") depth -= 1;
    }
    const inner = text.slice(open + 1, end - 1);
    const comma = inner.indexOf(",");
    const key = inner.slice(0, comma).trim();
    const rest = inner.slice(comma + 1);
    const fields: Record<string, string> = {};
    const fieldRegex = /([A-Za-z_]+)\s*=\s*\{([\s\S]*?)\}\s*,?(?=\s*[A-Za-z_]+\s*=|\s*$)/g;
    for (const fieldMatch of rest.matchAll(fieldRegex)) fields[fieldMatch[1].toLowerCase()] = fieldMatch[2].replace(/\s+/g, " ").trim();
    entries.push({ key, type, fields });
    cursor = end;
  }
  return entries;
}

function cleanName(value = "") {
  return value.replace(/[{}]/g, "").replace(/ and /g, ", and ").replace(/`/g, "‘").replace(/'/g, "’");
}

function formatBib(entry: BibEntry) {
  const f = entry.fields;
  const author = cleanName(f.author || (f.editor ? `${f.editor}, ed.` : ""));
  const title = cleanName(f.title || "Untitled");
  const year = f.year || f.date?.slice(0, 4) || "n.d.";
  const container = cleanName(f.journal || f.booktitle || "");
  const institution = cleanName(f.publisher || f.school || f.institution || "");
  const volume = f.volume ? ` ${f.volume}${f.number ? `, no. ${f.number}` : ""}` : "";
  const pages = f.pages ? `: ${f.pages.replace(/--/g, "–")}` : "";
  const doiOrUrl = f.doi ? ` https://doi.org/${f.doi}.` : f.url ? ` ${f.url}.` : "";
  const accessed = f.urldate ? ` Accessed ${new Date(`${f.urldate}T00:00:00Z`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" })}.` : "";
  if (entry.type === "article") return `${author}. “${title}.” ${container}${volume} (${year})${pages}.${doiOrUrl}${accessed}`.replace(/\.\./g, ".");
  if (["legal", "legislation"].includes(entry.type)) return `${author}. *${title}*. ${f.volume ? `${f.volume} ${f.reporter ?? ""} ${f.pages ?? ""}. ` : ""}${year}.${doiOrUrl}${accessed}`.replace(/\.\./g, ".");
  if (["online", "museum"].includes(entry.type)) return `${author}. “${title}.” ${year}.${doiOrUrl}${accessed}`.replace(/\.\./g, ".");
  if (["thesis", "mastersthesis"].includes(entry.type)) return `${author}. “${title}.” ${f.type || "Thesis"}, ${f.school || f.institution || ""}, ${year}.${doiOrUrl}${accessed}`.replace(/\.\./g, ".");
  if (entry.type === "incollection") return `${author}. “${title}.” In *${cleanName(f.booktitle)}*, ${f.editor ? `edited by ${cleanName(f.editor)}, ` : ""}${pages ? `${f.pages.replace(/--/g, "–")}. ` : ""}${institution ? `${institution}, ` : ""}${year}.${doiOrUrl}${accessed}`.replace(/\.\./g, ".");
  return `${author}. *${title}*. ${institution ? `${institution}, ` : ""}${year}.${doiOrUrl}${accessed}`.replace(/\.\./g, ".");
}

const primaryKeys = new Set(["lardizabal1951", "ilangilang1947", "usc1241", "customs1971", "taylor1988", "riddall1991", "strange1990", "quattrone1989", "caag1986", "usdoj1988", "lasanas1987"]);
const institutionalKeys = new Set(["ccp1994", "universitybatangas2024", "municipalitytaal2013", "taalelpasubat2013", "ipophilgi2026", "unescoCraft", "unescoICH", "metluzonknife1999"]);

export function loadResearchPaper(): ResearchPaperData {
  const paper = parsePaper(read("content/research/balisong-boundary-object.en.md"));
  const chinese = parseFrontmatter(read("content/research/balisong-boundary-object.zh-summary.md")).body;
  const chineseSummary = chinese.split("## 中文扩展摘要")[1].split("**关键词：**")[0].trim().split(/\n\n+/).map((item) => item.replace(/\n/g, " "));
  const cited = new Set(paper.notes.flatMap((note) => note.keys));
  const bib = parseBib(read("research/references.bib"));
  const bibliography = bib.filter((entry) => cited.has(entry.key)).map((entry) => ({
    ...entry,
    formatted: formatBib(entry),
    category: primaryKeys.has(entry.key) ? "primary" as const : institutionalKeys.has(entry.key) ? "institutional" as const : "scholarship" as const,
  })).sort((a, b) => (a.fields.author || a.fields.editor || "").localeCompare(b.fields.author || b.fields.editor || ""));
  return {
    ...paper,
    chineseSummary,
    bibliography,
    figures: parseCsv(read("research/figure_manifest.csv")) as FigureRecord[],
    sources: parseCsv(read("research/source_matrix.csv")),
    claims: parseCsv(read("research/claim_evidence_matrix.csv")),
    argumentMap: JSON.parse(read("content/research/argument-map.json")) as ArgumentMap,
    stats: JSON.parse(read("content/research/paper-metadata.json")) as ResearchStats,
  };
}
