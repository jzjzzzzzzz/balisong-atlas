import type { Metadata } from "next";
import { ExhibitPage } from "@/features/exhibits/ExhibitPage";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const demo = slug === "balisong-atlas-demo";
  return { title: demo ? "Balisong Atlas Demo Collection" : "Between Two Handles", description: demo ? "A fictional evidence workflow demonstration." : "The research-stage exhibition structure for the visual history of the balisong.", openGraph: { images: [] }, twitter: { images: [] } };
}
export default async function ExhibitRoute({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; return <ExhibitPage demo={slug === "balisong-atlas-demo"}/>; }
