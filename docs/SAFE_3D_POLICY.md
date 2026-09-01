# Safe 3D policy

Public reconstruction is a nonfunctional museum visualization, evidence-based visual hypothesis, visual proxy, or reconstruction hypothesis.

## Invariants

- no real dimensions, proportions, or units;
- one joined mesh; no separated component hierarchy;
- no internal or mechanical structure;
- no moving parts, armatures, constraints, joints, or operation animation;
- rounded abstract surfaces, neutral central insert, no sharp edge geometry;
- no manufacturing formats or engineering drawing/CAD conversion;
- only reviewed public-safe appearance features; unknown is never auto-completed;
- inferred fields remain prominent and human-reviewed.

`generation_report.json` records renderer version, brief hash, used/excluded feature IDs, normalization, safety transformations, joined/scale/motion/neutral-insert confirmations, edge check, and validation result.

The public viewer offers manual scene rotation, a slow whole-scene turntable,
limited zoom, background, evidence annotations, epistemic legend, version, and
brief summary. The turntable changes only the viewing camera around the joined
proxy; it is not object operation or part motion. The viewer omits download,
measurement, section, exploded view, per-part visibility, joint control,
part/operation animation, export, conversion, and real units.

## Browser kinetic exhibit

The performance/media page contains a separate, procedural React Three Fiber
scene. It animates two stylized handles around a rounded central display insert
and turns the complete assembly through a smooth loop. This runtime scene is not
a `ReconstructionVersion`, is not exported to GLB, and does not change the
single-mesh invariants above. Its five era palettes are appearance hypotheses
derived from broad source framing, not exact replicas. The interface provides
play, pause, restart, and palette selection only; it omits download,
measurement, frame stepping, export, and editable joint parameters.

The runtime hierarchy uses one anchored handle, a central body revolving from
that anchor, and a free handle revolving from the second pivot. The pose order
was visually checked against
[DJLO's CC BY-SA 3.0 Wikimedia Commons opening/closing reference](https://commons.wikimedia.org/wiki/File:Opening_and_closing_a_Balisong_aka_Butterfly_Knife.gif).
Only the attribution URL is stored; the GIF is not bundled or treated as
historical-form evidence.

The contemporary browser preset uses modern manufacturer anatomy imagery only
to calibrate broad visible design language: a slender silhouette, narrow paired
handles, restrained machined-metal shading, surface recesses, and visible pivot
caps. It does not reproduce a named commercial model or ingest published
measurements.

Release uses short-lived or controlled asset access. A browser-displayed asset cannot receive absolute DRM; no-download UI is an access/control limitation, not a claim that saving is impossible.
