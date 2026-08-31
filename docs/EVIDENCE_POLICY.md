# Evidence policy

Every accepted public claim binds to a saved source and at least one concrete location: chunk, page/section, image asset, normalized region/polygon, or reviewed image observation. Public excerpts remain short; pages show identity, location, evidence summary, original link, and rights.

## Advisory confidence

```text
confidence =
  0.30 * source_quality
+ 0.25 * evidence_directness
+ 0.20 * source_independence
+ 0.15 * cross_source_agreement
+ 0.10 * temporal_proximity
```

The UI exposes each factor. A Tier D source cannot receive `high`. Reposts from one origin share a source family and do not multiply independence. High-quality contradictory evidence enters a disputed queue. Temporal proximity is one factor; earlier does not automatically mean correct.

AI may propose support/conflict/context relations but cannot accept evidence or resolve disagreement. Generated prose, summaries, embeddings, renders, and synthetic images are never historical evidence.
