#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (name) => fs.readFileSync(path.join(root, name), "utf8");
const articlePath = "content/research/balisong-boundary-object.en.md";
const chinesePath = "content/research/balisong-boundary-object.zh-summary.md";
const article = read(articlePath);
const chinese = read(chinesePath);
const bib = read("research/references.bib");
const figures = read("research/figure_manifest.csv");
const sources = read("research/source_matrix.csv");
const errors = [];
const pass = [];
const fail = (message) => errors.push(message);
const check = (condition, message) => condition ? pass.push(message) : fail(message);

function frontmatter(text, file) {
  const match = text.match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) { fail(`${file}: missing frontmatter`); return {}; }
  return Object.fromEntries(match[1].split("\n").map((line) => {
    const split = line.indexOf(":");
    return split < 0 ? [line, ""] : [line.slice(0, split).trim(), line.slice(split + 1).trim().replace(/^"|"$/g, "")];
  }));
}
function parseCsv(text) {
  const rows=[]; let row=[]; let field=""; let quoted=false;
  for (let i=0;i<text.length;i+=1) { const c=text[i]; if(c==='"'){ if(quoted&&text[i+1]==='"'){field+='"';i+=1;} else quoted=!quoted; } else if(c===','&&!quoted){row.push(field);field="";} else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i+=1;row.push(field);field="";if(row.some(Boolean))rows.push(row);row=[];} else field+=c; }
  if(field||row.length){row.push(field);rows.push(row);} const [headers,...data]=rows; return data.map((values)=>Object.fromEntries(headers.map((key,index)=>[key,values[index]??""])));
}
function bodyWords(text) {
  const body = text.split("---",3)[2].split("\n## Notes\n")[0];
  const main = body.split("## 1. Introduction",2)[1]?.split("## AI Use Disclosure",1)[0] ?? "";
  return main.match(/\b[A-Za-zÀ-ÖØ-öø-ÿ0-9]+(?:[’'-][A-Za-zÀ-ÖØ-öø-ÿ0-9]+)*\b/g)?.length ?? 0;
}

const meta = frontmatter(article, articlePath);
const zhMeta = frontmatter(chinese, chinesePath);
const required = ["title","subtitle","title_zh","subtitle_zh","slug","status","authors","abstract","keywords","keywords_zh","word_count","citation_style","last_verified","legal_sources_as_of","ai_disclosure"];
for (const key of required) check(Boolean(meta[key]), `${articlePath}: frontmatter ${key}`);
for (const key of ["title","subtitle","title_en","subtitle_en","slug","status","authors","abstract","keywords","word_count","citation_style","last_verified","legal_sources_as_of","ai_disclosure"]) check(Boolean(zhMeta[key]), `${chinesePath}: frontmatter ${key}`);
check(meta.status === "research-draft" && zhMeta.status === "research-draft", "Both content files declare research-draft");
check(article.includes("Research Draft") || meta.status === "research-draft", "Research Draft status is present");
check(meta.legal_sources_as_of === "2026-09-01", "Legal sources have an as-of date");

const notes = [...article.matchAll(/^\[\^(\d+)\]:\s+\{([^}]+)\}\s+(.+)$/gm)];
check(notes.length > 0, "Notes are present");
for (const note of notes) check(Boolean(note[3].trim()), `${articlePath}: note ${note[1]} is not empty`);
const markers = [...article.matchAll(/\[\^(\d+)\]/g)].map((m)=>m[1]);
const noteNumbers = new Set(notes.map((m)=>m[1]));
for (const marker of markers) check(noteNumbers.has(marker), `${articlePath}: note marker ${marker} resolves`);
const bibKeys = new Set([...bib.matchAll(/^@[A-Za-z]+\{([^,]+),/gm)].map((m)=>m[1].trim()));
const usedKeys = new Set(notes.flatMap((note)=>note[2].split(",").map((key)=>key.trim())));
for (const key of usedKeys) check(bibKeys.has(key), `Citation key exists: ${key}`);
for (const key of bibKeys) {
  const entryStart = bib.indexOf(`{${key},`);
  const nextEntry = bib.indexOf("\n@", entryStart);
  const entry = bib.slice(entryStart, nextEntry < 0 ? undefined : nextEntry);
  check(usedKeys.has(key) || /keywords\s*=\s*\{background_only\}/.test(entry), `Bibliography key is used or background_only: ${key}`);
}

const core = [...article.matchAll(/^## (\d+)\. .+$/gm)];
for (let i=0;i<core.length;i+=1) {
  const start=(core[i].index??0)+core[i][0].length; const end=core[i+1]?.index ?? article.indexOf("\n## AI Use Disclosure");
  const section=article.slice(start,end); const keys=new Set([...section.matchAll(/\[\^(\d+)\]/g)].flatMap((m)=>notes.find((n)=>n[1]===m[1])?.[2].split(",").map((k)=>k.trim())??[]));
  check(keys.size>=2, `${articlePath}: section ${core[i][1]} has at least two citation sources`);
}

const words=bodyWords(article);
check(words>=6000&&words<=7000, `English article body word count is 6,000–7,000 (actual ${words})`);
const abstract=article.split("## Abstract",2)[1]?.split("**Keywords:**",1)[0]??"";
const abstractWords=abstract.match(/\b[A-Za-z]+(?:[’'-][A-Za-z]+)*\b/g)?.length??0;
check(abstractWords>=150&&abstractWords<=200, `English abstract is 150–200 words (actual ${abstractWords})`);
const zhBody=chinese.split("## 中文扩展摘要",2)[1]?.split("**关键词：**",1)[0]??"";
const han=(zhBody.match(/[\u3400-\u9fff]/g)??[]).length;
check(han>=1200&&han<=1800, `Chinese extended abstract is 1,200–1,800 Han characters (actual ${han})`);
check(Number(meta.word_count)===words, `Frontmatter word_count matches canonical body (${words})`);

const figureRows=parseCsv(figures);
check(figureRows.length>=4&&figureRows.length<=8, `Figure manifest contains 4–8 records (actual ${figureRows.length})`);
for(const figure of figureRows){
 check(Boolean(figure.rights_status), `Figure ${figure.figure_id} has rights_status`);
 if(figure.public_display_allowed==='true') check(Boolean(figure.attribution), `Public figure ${figure.figure_id} has attribution`);
 check(Boolean(figure.alt_text), `Figure ${figure.figure_id} has alt text`);
 if(figure.synthetic==='true') check(/AI-assisted|AI 辅助/.test(figure.caption), `Synthetic figure ${figure.figure_id} has a synthetic label`);
 if(figure.rights_status==='unknown') check(figure.public_display_allowed!=='true', `Unknown-rights figure ${figure.figure_id} is not public`);
}

const combined=[article,chinese,figures,read("content/research/argument-map.json")].join("\n");
for(const [pattern,label] of [[/\bTODO\b/i,"TODO"],[/lorem ipsum/i,"lorem ipsum"],[/\b\d+(?:\.\d+)?\s*(?:mm|cm|inches?)\b/i,"exact physical dimensions"],[/\.(?:stl|step|dxf|gcode|obj)(?:\b|\?)/i,"manufacturing/model file link"]]) check(!pattern.test(combined), `Public research content contains no ${label}`);
const urls=[...combined.matchAll(/https?:\/\/[^\s,)\]"|]+/g)].map((m)=>m[0].toLowerCase());
for(const url of urls){
 check(!/(?:buy|shop|store|product|checkout)/.test(url), `No purchasing link: ${url}`);
 check(!/(?:tutorial|how-to|how_to|flipping|trick-guide)/.test(url), `No action-instruction link: ${url}`);
}
check(!/href=\{href\} target="_blank"(?! rel="noopener noreferrer")/.test(read("apps/web/components/research/Bibliography.tsx")), "External bibliography links use safe attributes");
check(/@media print/.test(read("apps/web/app/globals.css")) && /@page \{ margin: 1in/.test(read("apps/web/app/globals.css")), "Print CSS defines print rules and one-inch margins");
check(!/download model|exploded view|joint control/i.test(article), "Paper contains no model download or manipulation controls");
check(!/how to (?:flip|use|operate|make|assemble)/i.test(combined), "Paper contains no instructional phrasing");

const sourceRows=parseCsv(sources);
check(sourceRows.length>=40, `At least 40 candidates logged (actual ${sourceRows.length})`);
const statusByKey=new Map(sourceRows.map((source)=>[source.citation_key,source.verification_status]));
for(const key of usedKeys){
 if(statusByKey.get(key)==='abstract_only'){
   const noteText=notes.filter((note)=>note[2].split(",").map((item)=>item.trim()).includes(key)).map((note)=>note[3]).join(" ");
   check(/abstract/i.test(noteText), `Abstract-only source ${key} is labeled in its notes`);
 }
}
check(/AI is not a historical source|AI is not a historical source/i.test(article), "AI is explicitly not treated as a historical source");
check(chinese.includes("法律资料截至") || zhMeta.legal_sources_as_of, "Chinese content preserves the legal as-of field");

if(errors.length){
 console.error(`Research paper validation failed with ${errors.length} error(s):`);
 for(const error of errors) console.error(`  - ${error}`);
 process.exit(1);
}
console.log(`Research paper validation passed: ${pass.length} checks; ${words} body words; ${abstractWords} abstract words; ${han} Chinese characters; ${notes.length} notes; ${usedKeys.size} cited sources; ${sourceRows.length} candidates; ${figureRows.length} figures.`);
