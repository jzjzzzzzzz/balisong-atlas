"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FilePlus2, Link2, Plus, Upload, X } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { apiFetch, apiFetchForm } from "@/lib/api";
import { SourceTable, type SourceRow } from "./SourceTable";

type Mode = "upload" | "url" | "iiif" | "manual";
type EntryForm = { title: string; url: string; rights_status: string; source_tier: string; creator: string; institution: string };
const isUuid = (value: string) => /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(value);

export function SourceWorkspace({ projectId }: { projectId: string }) {
  const [mode, setMode] = useState<Mode | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const client = useQueryClient();
  const query = useQuery({ queryKey: ["sources", projectId], queryFn: () => apiFetch<SourceRow[]>(`/projects/${projectId}/sources`), enabled: isUuid(projectId) });
  const { register, handleSubmit, reset, formState: { errors } } = useForm<EntryForm>({ defaultValues: { title: "", url: "", rights_status: "unknown", source_tier: "D", creator: "", institution: "" } });
  const mutation = useMutation({
    mutationFn: async (values: EntryForm) => {
      if (!mode) throw new Error("Choose a source entry method");
      if (mode === "upload") {
        if (!file) throw new Error("Choose a PDF, image, text, Markdown, or HTML file");
        const form = new FormData();
        form.set("file", file); form.set("title", values.title); form.set("rights_status", values.rights_status); form.set("source_tier", values.source_tier); form.set("attribution_text", values.creator);
        return apiFetchForm(`/projects/${projectId}/sources/upload`, form);
      }
      if (mode === "url") return apiFetch(`/projects/${projectId}/sources/url`, { method: "POST", body: JSON.stringify({ url: values.url, title: values.title || "Pending URL metadata", administrator_approved: false, rights_status: values.rights_status, source_tier: values.source_tier }) });
      if (mode === "iiif") return apiFetch(`/projects/${projectId}/sources/iiif`, { method: "POST", body: JSON.stringify({ manifest_url: values.url, administrator_approved: false }) });
      return apiFetch(`/projects/${projectId}/sources/manual`, { method: "POST", body: JSON.stringify({ source_type: "manual_note", title: values.title, creator: values.creator, institution: values.institution, publisher: "", publication_date_text: "", original_language: "", rights_status: values.rights_status, rights_uri: "", license_label: "", attribution_text: values.creator, source_tier: values.source_tier, notes: "" }) });
    },
    onSuccess: async () => { await client.invalidateQueries({ queryKey: ["sources", projectId] }); setMode(null); setFile(null); reset(); },
  });
  const sources = query.data ?? undefined;
  return <>
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div className="grid flex-1 gap-3 sm:grid-cols-3">{[["Trusted domains", "2"], ["Immutable sources", String(sources?.length ?? 3)], ["External search", "disabled"]].map(([label, value]) => <div key={label} className="rounded-xl border border-ink/10 bg-white/40 p-4"><span className="text-xs text-quiet">{label}</span><strong className="float-right font-display text-2xl">{value}</strong></div>)}</div>
      <div className="flex flex-wrap gap-2"><button onClick={() => setMode("url")} className="inline-flex items-center gap-2 rounded-full border border-ink/20 px-4 py-2.5 text-xs font-bold"><Link2 size={14}/> URL / IIIF</button><button onClick={() => setMode("manual")} className="inline-flex items-center gap-2 rounded-full border border-ink/20 px-4 py-2.5 text-xs font-bold"><FilePlus2 size={14}/> Manual</button><button onClick={() => setMode("upload")} className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-xs font-bold text-paper"><Upload size={14}/> Upload source</button></div>
    </div>
    {query.isError && isUuid(projectId) && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-4 text-sm text-red-800">Could not load sources. Sign in again or check the API connection.</p>}
    <SourceTable sources={sources} projectId={projectId}/>
    {mode && <div className="fixed inset-0 z-50 grid place-items-center bg-night/65 p-4"><form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-paper p-6 shadow-2xl"><div className="flex items-center justify-between"><div><p className="eyebrow">Immutable source intake</p><h2 className="mt-2 font-display text-3xl">{mode === "upload" ? "Upload a saved file" : mode === "manual" ? "Manual source record" : "Record an approved URL"}</h2></div><button type="button" aria-label="Close source form" onClick={() => setMode(null)}><X/></button></div>
      {(mode === "url" || mode === "iiif") && <div className="mt-5 flex gap-2"><button type="button" onClick={() => setMode("url")} className={`rounded-full px-3 py-2 text-xs ${mode === "url" ? "bg-ink text-paper" : "border border-ink/20"}`}>Web page</button><button type="button" onClick={() => setMode("iiif")} className={`rounded-full px-3 py-2 text-xs ${mode === "iiif" ? "bg-ink text-paper" : "border border-ink/20"}`}>IIIF Manifest</button></div>}
      {(mode === "url" || mode === "iiif") && <label className="mt-5 block text-xs font-bold uppercase tracking-[.1em]">{mode === "iiif" ? "Manifest URL" : "Source URL"}<input {...register("url", { required: true })} type="url" className="mt-2 w-full rounded-xl border border-ink/15 bg-white px-4 py-3 text-base normal-case"/>{errors.url && <span className="text-red-700">A URL is required.</span>}</label>}
      {mode !== "iiif" && <label className="mt-5 block text-xs font-bold uppercase tracking-[.1em]">Title<input {...register("title", { required: mode !== "url" })} className="mt-2 w-full rounded-xl border border-ink/15 bg-white px-4 py-3 text-base normal-case"/></label>}
      {mode === "upload" && <label className="mt-5 block rounded-xl border border-dashed border-ink/25 p-5 text-sm"><input type="file" accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.md,.html" onChange={(event) => setFile(event.target.files?.[0] ?? null)} className="block w-full"/><span className="mt-2 block text-xs text-quiet">SVG and unsupported MIME types are rejected. Files remain private until rights allow display.</span></label>}
      {mode === "upload" && <label className="mt-5 block text-xs font-bold uppercase tracking-[.1em]">Attribution<input {...register("creator")} className="mt-2 w-full rounded-xl border border-ink/15 bg-white px-4 py-3 text-base normal-case" placeholder="Creator / institution / required credit"/></label>}
      {mode === "manual" && <><label className="mt-5 block text-xs font-bold uppercase tracking-[.1em]">Creator<input {...register("creator")} className="mt-2 w-full rounded-xl border border-ink/15 bg-white px-4 py-3 text-base normal-case"/></label><label className="mt-5 block text-xs font-bold uppercase tracking-[.1em]">Institution<input {...register("institution")} className="mt-2 w-full rounded-xl border border-ink/15 bg-white px-4 py-3 text-base normal-case"/></label></>}
      {mode !== "iiif" && <div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-xs font-bold uppercase tracking-[.1em]">Rights<select {...register("rights_status")} className="mt-2 w-full rounded-xl border border-ink/15 bg-white px-4 py-3 normal-case"><option value="unknown">Unknown — private</option><option value="metadata_only">Metadata only</option><option value="public_domain">Public domain</option><option value="licensed">Licensed</option><option value="permission_granted">Permission granted</option><option value="restricted">Restricted</option></select></label><label className="text-xs font-bold uppercase tracking-[.1em]">Source tier<select {...register("source_tier")} className="mt-2 w-full rounded-xl border border-ink/15 bg-white px-4 py-3 normal-case">{["A", "B", "C", "D"].map((tier) => <option key={tier}>{tier}</option>)}</select></label></div>}
      {mutation.error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{mutation.error.message}</p>}
      <button disabled={mutation.isPending} className="mt-6 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-bold text-paper disabled:opacity-60"><Plus size={15}/>{mutation.isPending ? "Saving…" : "Save source"}</button>
    </form></div>}
  </>;
}
