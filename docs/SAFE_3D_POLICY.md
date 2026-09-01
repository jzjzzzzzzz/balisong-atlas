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
that anchor, and a free handle revolving from the second pivot. Its second motion
track uses continuous Hermite interpolation for the whole-object carrier and a
pose-to-pose joint sequence. This reduces visible stops while preserving short
rest poses. Translation, roll, yaw, and pitch are intentionally small and have
no public numeric readout.

Three open-licensed Wikimedia Commons motion records from two source families
are bundled in the media evidence room. The DJLO pair is one dependent source
family; the Gumballwolf record is a second independent modern family. Only broad
external-body order, orientation continuity, and transition character are
transferred. The UI exposes no frame stepping, source speed, angles, grip data,
or action breakdown. The generated cadence is synthetic, the hand is omitted,
and no record is treated as historical-form or historical-performance evidence.

The era selector changes geometry as well as color. It uses five distinct
external visual hypotheses: an 1880 patent-documented paired-handle comparison
with a curved neutral insert; a 1951–1953 Batangas industry frame with an interpreted
horn-appearance proxy; a 1969 national-cultural-display frame whose form remains
interpreted; all-metal skeletonized catalogue handles with an angular neutral
insert; and a narrow contemporary channel-style handle with a slender neutral
insert. The interface exposes the active handle and insert cue plus its evidence
state.

The 1880 comparative external relationship is directly observed in US Patent
229,706, but no internal or mechanically exact detail is copied. The 1951
report verifies an active Batangas industry but supplies no object image. Regional
cues are inferred from the 1953 transcription lead and the CCP's 1994
`Metalcraft` description of horn appearance, metal nail decoration, and
multiple external forms. The 1969 checkpoint is verified as a cultural-display
record while its object geometry remains unresolved. Industrial cues are
observed in 1979–1994 catalogue scans. Contemporary cues use modern manufacturer
anatomy imagery. None of these presets reproduces internal structure, a named
commercial model, a process sequence, or published measurements.

Release uses short-lived or controlled asset access. A browser-displayed asset cannot receive absolute DRM; no-download UI is an access/control limitation, not a claim that saving is impossible.
