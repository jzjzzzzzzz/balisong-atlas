"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AdminSection } from "@/components/AdminSection";
import { apiFetch } from "@/lib/api";

const schema = z.object({
  title: z.string().min(3),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  subtitle: z.string(),
  description: z.string().min(1),
});
type Form = z.infer<typeof schema>;
type CreatedProject = { id: string };

export default function Page() {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { subtitle: "", description: "" },
  });
  const submit = handleSubmit(async (values) => {
    try {
      const project = await apiFetch<CreatedProject>("/projects", {
        method: "POST",
        body: JSON.stringify({ ...values, primary_language: "en", secondary_language: "zh" }),
      });
      router.push(`/admin/projects/${project.id}`);
    } catch (error) {
      setError("root", { message: error instanceof Error ? error.message : "Project creation failed" });
    }
  });
  return <AdminSection eyebrow="Project setup" title="New research project" description="New projects begin in draft and are never published automatically.">
    <form onSubmit={submit} className="max-w-3xl rounded-2xl border border-ink/10 bg-white/50 p-6">
      <label className="block text-xs font-bold uppercase tracking-[.1em]">Title<input {...register("title")} className="mt-2 w-full rounded-xl border border-ink/15 bg-paper px-4 py-3 text-base normal-case"/>{errors.title && <span className="text-xs text-red-700">{errors.title.message}</span>}</label>
      <label className="mt-5 block text-xs font-bold uppercase tracking-[.1em]">Subtitle<input {...register("subtitle")} className="mt-2 w-full rounded-xl border border-ink/15 bg-paper px-4 py-3 text-base normal-case"/></label>
      <label className="mt-5 block text-xs font-bold uppercase tracking-[.1em]">Slug<input {...register("slug")} className="mt-2 w-full rounded-xl border border-ink/15 bg-paper px-4 py-3 font-mono text-sm normal-case"/>{errors.slug && <span className="text-xs text-red-700">{errors.slug.message}</span>}</label>
      <label className="mt-5 block text-xs font-bold uppercase tracking-[.1em]">Description<textarea {...register("description")} rows={5} className="mt-2 w-full rounded-xl border border-ink/15 bg-paper px-4 py-3 text-base normal-case"/>{errors.description && <span className="text-xs text-red-700">{errors.description.message}</span>}</label>
      {errors.root && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{errors.root.message}</p>}
      <button disabled={isSubmitting} className="mt-6 rounded-full bg-ink px-5 py-3 text-sm font-bold text-paper disabled:opacity-60">{isSubmitting ? "Creating…" : "Create draft project"}</button>
    </form>
  </AdminSection>;
}
