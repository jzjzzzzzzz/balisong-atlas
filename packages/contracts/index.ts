export type EpistemicState = "observed" | "inferred" | "unknown";
export type ReviewStatus = "proposed" | "accepted" | "rejected" | "needs_revision";
export type Citation = { sourceId: string; pageNumber?: number; section?: string; excerpt: string; rights: string };
