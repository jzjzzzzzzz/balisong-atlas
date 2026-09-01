"use client";

import { ContactShadows, RoundedBox } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ArrowUpRight, CirclePause, CirclePlay, RotateCcw } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { PerspectiveCamera, Shape, type Group } from "three";
import { useLanguage } from "@/components/Providers";

type EraPresetId = "comparative" | "regional" | "museum" | "craft" | "contemporary";
type HandleStyle = "segmented-scale" | "horn-and-bolster" | "pinned-slab" | "skeletonized-metal" | "milled-channel";
type InsertStyle = "comparative-clasp" | "regional-spear" | "catalogue-straight" | "industrial-clip" | "contemporary-drop";
type EvidenceState = "observed" | "inferred" | "unknown";

type EraPreset = {
  id: EraPresetId;
  period: { en: string; zh: string };
  title: { en: string; zh: string };
  note: { en: string; zh: string };
  source: { en: string; zh: string };
  handle: string;
  inset: string;
  metal: string;
  accent: string;
  background: string;
  handleStyle: HandleStyle;
  insertStyle: InsertStyle;
  handleWidth: number;
  handleLength: number;
  pivotSpread: number;
  hasLatch: boolean;
  evidenceState: EvidenceState;
  structureCue: { en: string; zh: string };
  insertCue: { en: string; zh: string };
  evidenceCue: { en: string; zh: string };
};

const eraPresets: readonly EraPreset[] = [
  {
    id: "comparative",
    period: { en: "1880 documented comparison", zh: "1880 有图版记录的比较对象" },
    title: { en: "Documented two-section clasp form", zh: "有记录的双柄折叠形态" },
    note: { en: "US Patent 229,706 directly depicts two scale-clad handle sections rotating around a central implement. The proxy follows only that broad external reading and removes real scale and mechanical detail.", zh: "美国专利第 229,706 号直接描绘了两段带贴片的刀柄围绕中央部分转动。视觉代理只采用这一宽泛外观解读，并移除真实尺度与机械细节。" },
    source: { en: "US Patent 229,706 — drawing p. 1; specification pp. 2–3", zh: "美国专利第 229,706 号——图版第 1 页；说明第 2—3 页" },
    handle: "#4b4640", inset: "#17191a", metal: "#b9b8b2", accent: "#8e7654", background: "#0c1012",
    handleStyle: "segmented-scale", insertStyle: "comparative-clasp", handleWidth: 0.29, handleLength: 1.38, pivotSpread: 0.36, hasLatch: true, evidenceState: "observed",
    structureCue: { en: "Paired tapered handles with visible scales and an end latch", zh: "成对渐收式刀柄、可见贴片与末端闩扣" },
    insertCue: { en: "Curved neutral insert derived from the broad drawing silhouette", zh: "根据图版宽泛轮廓转译的弧形中性插片" },
    evidenceCue: { en: "Observed comparative form: verified in the 1880 patent drawing. Philippine origin and transmission remain unresolved.", zh: "比较形态可直接观察：已由 1880 年专利图版核验；菲律宾起源与传播路线仍未解决。" },
  },
  {
    id: "regional",
    period: { en: "1951–1953 industry records", zh: "1951—1953 产业记录" },
    title: { en: "Batangas industry record — appearance interpreted", zh: "八打雁产业记录——外观仍属解释" },
    note: { en: "A contemporaneous 1951 report verifies an active Batangas industry, and a paginated Taal transcription records an established local industry in 1953. The 1994 Metalcraft entry supplies later visible appearance vocabulary; no reviewed mid-century object image confirms this assembly.", zh: "一份 1951 年同期报告核验了八打雁已有活跃产业，带页码的塔阿尔转录稿则记录了 1953 年已经形成的当地产业。1994 年《金属工艺》条目提供较晚的可见外观术语；尚无经过审核的 20 世纪中期实物图像确认这一组合。" },
    source: { en: "Philippine Educator, printed p. 18 + Taal Historical Data, transcribed pp. 13–14 + Metalcraft, pp. 4–5", zh: "《菲律宾教育者》印刷页第 18 页＋《塔阿尔历史资料》转录第 13—14 页＋《金属工艺》第 4—5 页" },
    handle: "#59433a", inset: "#171718", metal: "#c2bbae", accent: "#9f7d4d", background: "#0c1112",
    handleStyle: "horn-and-bolster", insertStyle: "regional-spear", handleWidth: 0.3, handleLength: 1.46, pivotSpread: 0.38, hasLatch: true, evidenceState: "inferred",
    structureCue: { en: "Horn-appearance scales, brass-appearance bolsters, visible pins", zh: "角质外观贴片、黄铜外观箍件与可见铆钉" },
    insertCue: { en: "Spear/leaf-form regional hypothesis", zh: "矛叶形地区视觉假设" },
    evidenceCue: { en: "The 1951 industry record is verified and the 1953 local record is corroborated; this exact visual assembly remains inferred.", zh: "1951 年产业记录已核验，1953 年地方记录已印证；这一具体视觉组合仍属于推测。" },
  },
  {
    id: "museum",
    period: { en: "1969 cultural-display frame", zh: "1969 文化展示框架" },
    title: { en: "National display record — form unresolved", zh: "国家文化展示记录——形态未解决" },
    note: { en: "Institutional metadata confirms the 1969 Nayong Pilipino brochure, while later scholarship locates a Batangas-and-balisong section within it. The original brochure image has not been reviewed, so this restrained appearance remains interpretive.", zh: "机构目录确认了 1969 年菲律宾村手册，后期学术研究则定位到其中的“八打雁与 balisong”章节。项目尚未审核原始手册图像，因此这一克制外观仍属于解释。" },
    source: { en: "1969 brochure catalogue record + Yasa 2024, PDF pp. 90 and 112", zh: "1969 年手册目录记录＋Yasa 2024，第 90、112 页" },
    handle: "#353a3d", inset: "#121517", metal: "#c6c8c6", accent: "#858b8c", background: "#0a0f12",
    handleStyle: "pinned-slab", insertStyle: "catalogue-straight", handleWidth: 0.27, handleLength: 1.44, pivotSpread: 0.34, hasLatch: true, evidenceState: "inferred",
    structureCue: { en: "Plain slab scales with repeated visible pin pattern", zh: "平直贴片柄与重复可见铆钉纹样" },
    insertCue: { en: "Straight-back catalogue study silhouette", zh: "直背式博物馆目录研究轮廓" },
    evidenceCue: { en: "The 1969 cultural-display checkpoint is corroborated; its object form is still unknown.", zh: "1969 年文化展示节点已相互印证；其中的物件形态仍然未知。" },
  },
  {
    id: "craft",
    period: { en: "1979–1994 industrial frame", zh: "1979—1994 工业化框架" },
    title: { en: "Industrial catalogue geometry", zh: "工业目录几何形态" },
    note: { en: "Collector-hosted period scans visibly show scale-clad and exposed all-metal, skeletonized handle families. The proxy does not copy a named model.", zh: "收藏者托管的同期扫描中，可以直接看到贴片柄与外露全金属镂空柄两类外观；视觉代理不复制任何具体型号。" },
    source: { en: "Bali-Song / Pacific Cutlery / Benchmade catalogue scans", zh: "Bali-Song、Pacific Cutlery 与 Benchmade 目录扫描" },
    handle: "#9da3a4", inset: "#15191a", metal: "#c8ccca", accent: "#d7d9d7", background: "#0b0e10",
    handleStyle: "skeletonized-metal", insertStyle: "industrial-clip", handleWidth: 0.29, handleLength: 1.5, pivotSpread: 0.35, hasLatch: true, evidenceState: "observed",
    structureCue: { en: "All-metal skeletonized handle appearance", zh: "全金属镂空柄外观" },
    insertCue: { en: "Angular clip-form catalogue silhouette", zh: "折角削背式目录轮廓" },
    evidenceCue: { en: "Observed in period catalogue scans; model identity is not reproduced.", zh: "可见于同期目录扫描，但不复刻具体产品型号。" },
  },
  {
    id: "contemporary",
    period: { en: "1995–present media frame", zh: "1995—至今媒体框架" },
    title: { en: "Contemporary channel-form study", zh: "当代通道式形态研究" },
    note: { en: "Public anatomy imagery supports contemporary channel-style vocabulary and visible hardware placement. The display remains a generic, noncommercial visual proxy.", zh: "公开结构图像支持当代通道式刀柄术语与可见硬件位置；这里仍是通用、非商业的视觉代理。" },
    source: { en: "Public anatomy reference + UP media-research lead", zh: "公开结构参考＋菲律宾大学媒体研究线索" },
    handle: "#1b8fa8", inset: "#10191c", metal: "#c9cecf", accent: "#e0e5e5", background: "#071014",
    handleStyle: "milled-channel", insertStyle: "contemporary-drop", handleWidth: 0.225, handleLength: 1.5, pivotSpread: 0.28, hasLatch: false, evidenceState: "observed",
    structureCue: { en: "Narrow channel-style handle with milled recesses", zh: "带机加工凹槽的窄通道式柄" },
    insertCue: { en: "Slender drop-form neutral display insert", zh: "细长水滴形中性展示插片" },
    evidenceCue: { en: "Observed as broad contemporary design language; not a copied product.", zh: "作为当代通用设计语言直接观察，并非复制具体产品。" },
  },
] as const;

type Keyframe = readonly [time: number, value: number];

// Pose-to-pose study derived from the broad motion visible in public opening /
// closing references: one handle is the anchor, the blade-and-free-handle pair
// first revolves around it, then the free handle settles beside the anchor.
const bladeTrack: readonly Keyframe[] = [
  [0, Math.PI], [0.08, Math.PI], [0.31, -0.08], [0.37, 0],
  [0.58, 0], [0.82, Math.PI + 0.07], [0.9, Math.PI], [1, Math.PI],
];
const freeHandleTrack: readonly Keyframe[] = [
  [0, Math.PI], [0.3, Math.PI], [0.44, -0.08], [0.5, 0],
  [0.61, 0], [0.72, Math.PI + 0.08], [0.78, Math.PI], [1, Math.PI],
];
const carrierXTrack: readonly Keyframe[] = [[0, 0.04], [0.3, -0.12], [0.5, 0.08], [0.8, -0.1], [1, 0.04]];
const carrierYTrack: readonly Keyframe[] = [[0, -0.12], [0.32, 0.16], [0.52, -0.08], [0.8, 0.12], [1, -0.12]];
const carrierZTrack: readonly Keyframe[] = [[0, -0.08], [0.3, 0.22], [0.5, 0.04], [0.8, -0.2], [1, -0.08]];

function ease(value: number) {
  return value < 0.5 ? 4 * value * value * value : 1 - Math.pow(-2 * value + 2, 3) / 2;
}

function sample(track: readonly Keyframe[], time: number) {
  for (let index = 0; index < track.length - 1; index += 1) {
    const current = track[index];
    const next = track[index + 1];
    if (time >= current[0] && time <= next[0]) {
      const progress = ease((time - current[0]) / (next[0] - current[0]));
      return current[1] + (next[1] - current[1]) * progress;
    }
  }
  return track.at(-1)?.[1] ?? 0;
}

function DecorativeHandle({ preset, side, withLatch = false }: { preset: EraPreset; side: -1 | 1; withLatch?: boolean }) {
  const { handleLength: length, handleWidth: width, handleStyle: style } = preset;
  const half = length / 2;
  const pinPositions = [-length * 0.28, 0, length * 0.28] as const;
  const channelSlots = [-length * 0.29, -length * 0.02, length * 0.25] as const;
  const skeletonSlots = [-length * 0.31, -length * 0.1, length * 0.12, length * 0.33] as const;
  const baseColor = style === "horn-and-bolster" || style === "pinned-slab" ? preset.accent : preset.handle;

  return <group position={[0, -half, 0]}>
    <RoundedBox args={[width, length, 0.105]} radius={style === "segmented-scale" ? 0.055 : 0.036} smoothness={8} castShadow>
      <meshPhysicalMaterial color={baseColor} metalness={style === "horn-and-bolster" ? 0.68 : 0.76} roughness={0.26} clearcoat={0.3} clearcoatRoughness={0.24} />
    </RoundedBox>

    {style === "segmented-scale" && <>
      {[-length * 0.31, 0, length * 0.31].map((position) => <RoundedBox key={position} args={[width * 0.68, length * 0.23, 0.112]} radius={0.028} smoothness={6} position={[0, position, 0.006]}>
        <meshStandardMaterial color={preset.handle} metalness={0.22} roughness={0.46} />
      </RoundedBox>)}
      {[-half + 0.105, half - 0.105].map((position) => <RoundedBox key={position} args={[width + 0.008, 0.17, 0.114]} radius={0.03} smoothness={6} position={[0, position, 0.007]}>
        <meshStandardMaterial color={preset.accent} metalness={0.78} roughness={0.24} />
      </RoundedBox>)}
    </>}

    {style === "horn-and-bolster" && <>
      <RoundedBox args={[width * 0.68, length * 0.68, 0.113]} radius={0.045} smoothness={7} position={[0, 0, 0.006]}>
        <meshPhysicalMaterial color={preset.handle} metalness={0.1} roughness={0.38} clearcoat={0.52} clearcoatRoughness={0.18} />
      </RoundedBox>
      {[-half + 0.15, half - 0.15].map((position) => <RoundedBox key={position} args={[width * 0.86, 0.22, 0.114]} radius={0.025} smoothness={5} position={[0, position, 0.007]}>
        <meshStandardMaterial color={preset.metal} metalness={0.78} roughness={0.26} />
      </RoundedBox>)}
      {pinPositions.map((position) => <HandlePin key={position} position={position} preset={preset} />)}
    </>}

    {style === "pinned-slab" && <>
      <RoundedBox args={[width * 0.78, length * 0.82, 0.113]} radius={0.035} smoothness={7} position={[0, -0.01, 0.006]}>
        <meshPhysicalMaterial color={preset.handle} metalness={0.34} roughness={0.36} clearcoat={0.32} />
      </RoundedBox>
      {[-length * 0.31, -length * 0.1, length * 0.12, length * 0.33].map((position) => <HandlePin key={position} position={position} preset={preset} />)}
    </>}

    {style === "skeletonized-metal" && <>
      {skeletonSlots.map((position, index) => <RoundedBox key={position} args={[width * 0.5, index === 0 || index === 3 ? length * 0.15 : length * 0.13, 0.114]} radius={0.035} smoothness={7} position={[0, position, 0.007]}>
        <meshStandardMaterial color={preset.inset} metalness={0.5} roughness={0.42} />
      </RoundedBox>)}
      <HandlePin position={-length * 0.43} preset={preset} />
    </>}

    {style === "milled-channel" && <>
      <RoundedBox args={[width * 0.69, length * 0.9, 0.111]} radius={0.03} smoothness={7} position={[0, -0.015, 0.003]}>
        <meshPhysicalMaterial color={preset.inset} metalness={0.72} roughness={0.38} clearcoat={0.15} />
      </RoundedBox>
      {channelSlots.map((position, index) => <RoundedBox key={position} args={[width * 0.45, index === 1 ? length * 0.17 : length * 0.19, 0.116]} radius={0.026} smoothness={6} position={[side * 0.008, position, 0.007]}>
        <meshStandardMaterial color={preset.handle} metalness={0.74} roughness={0.27} />
      </RoundedBox>)}
      {[-half + 0.09, -half + 0.14, -half + 0.19].map((position) => <RoundedBox key={position} args={[width * 0.76, 0.012, 0.116]} radius={0.005} smoothness={4} position={[0, position, 0.008]}>
        <meshStandardMaterial color={preset.accent} metalness={0.82} roughness={0.2} />
      </RoundedBox>)}
    </>}

    <HandlePin position={-half + 0.08} preset={preset} />
    {withLatch && <group position={[0, -half - 0.015, 0]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.025, 0.025, 0.12, 24]} /><meshStandardMaterial color={preset.accent} metalness={0.95} roughness={0.2} /></mesh>
      <RoundedBox args={[0.055, 0.18, 0.045]} radius={0.02} position={[0, -0.085, 0]}>
        <meshStandardMaterial color={preset.accent} metalness={0.95} roughness={0.22} />
      </RoundedBox>
    </group>}
  </group>;
}

function HandlePin({ position, preset }: { position: number; preset: EraPreset }) {
  return <mesh position={[0, position, 0.062]} rotation={[Math.PI / 2, 0, 0]}>
    <cylinderGeometry args={[0.034, 0.034, 0.012, 28]} />
    <meshStandardMaterial color={preset.metal} metalness={0.78} roughness={0.22} />
  </mesh>;
}

function CentralDisplayInsert({ preset }: { preset: EraPreset }) {
  const silhouette = useMemo(() => {
    const shape = new Shape();
    if (preset.insertStyle === "comparative-clasp") {
      shape.moveTo(-0.115, -0.62);
      shape.lineTo(-0.105, 0.72);
      shape.bezierCurveTo(-0.09, 0.88, -0.035, 1, 0.035, 1.06);
      shape.bezierCurveTo(0.055, 0.93, 0.085, 0.79, 0.13, 0.66);
      shape.bezierCurveTo(0.145, 0.42, 0.138, 0.02, 0.12, -0.62);
    } else if (preset.insertStyle === "regional-spear") {
      shape.moveTo(-0.14, -0.62);
      shape.lineTo(-0.125, 0.52);
      shape.bezierCurveTo(-0.11, 0.72, -0.055, 0.91, 0, 1.04);
      shape.bezierCurveTo(0.055, 0.91, 0.11, 0.72, 0.125, 0.52);
      shape.lineTo(0.14, -0.62);
    } else if (preset.insertStyle === "catalogue-straight") {
      shape.moveTo(-0.12, -0.62);
      shape.lineTo(-0.115, 0.8);
      shape.bezierCurveTo(-0.1, 0.91, -0.055, 0.99, 0.005, 1.03);
      shape.bezierCurveTo(0.07, 0.94, 0.11, 0.72, 0.12, 0.43);
      shape.lineTo(0.125, -0.62);
    } else if (preset.insertStyle === "industrial-clip") {
      shape.moveTo(-0.12, -0.62);
      shape.lineTo(-0.115, 0.97);
      shape.lineTo(-0.015, 0.78);
      shape.bezierCurveTo(0.045, 0.82, 0.1, 0.68, 0.125, 0.43);
      shape.lineTo(0.13, -0.62);
    } else {
      shape.moveTo(-0.105, -0.62);
      shape.lineTo(-0.082, 0.68);
      shape.bezierCurveTo(-0.075, 0.82, -0.04, 0.96, 0.004, 1.02);
      shape.bezierCurveTo(0.05, 0.96, 0.082, 0.82, 0.088, 0.67);
      shape.lineTo(0.1, -0.62);
    }
    shape.closePath();
    return shape;
  }, [preset.insertStyle]);
  return <group>
    <mesh position={[0, 0, -0.036]} castShadow>
      <extrudeGeometry args={[silhouette, { depth: 0.072, bevelEnabled: true, bevelSegments: 5, bevelSize: 0.014, bevelThickness: 0.012, curveSegments: 32 }]} />
      <meshPhysicalMaterial color={preset.metal} metalness={0.84} roughness={0.31} clearcoat={0.14} clearcoatRoughness={0.28} />
    </mesh>
    {preset.insertStyle === "regional-spear" && <RoundedBox args={[0.025, 1.08, 0.078]} radius={0.01} smoothness={5} position={[0, 0.14, 0.003]}>
      <meshStandardMaterial color={preset.accent} metalness={0.76} roughness={0.26} />
    </RoundedBox>}
    {preset.insertStyle === "catalogue-straight" && <RoundedBox args={[0.042, 0.92, 0.078]} radius={0.017} smoothness={6} position={[-0.045, 0.15, 0.003]}>
      <meshStandardMaterial color={preset.inset} metalness={0.68} roughness={0.44} />
    </RoundedBox>}
    {preset.insertStyle === "industrial-clip" && <>
      <RoundedBox args={[0.055, 0.84, 0.078]} radius={0.022} smoothness={6} position={[-0.035, 0.12, 0.003]}>
        <meshStandardMaterial color={preset.inset} metalness={0.62} roughness={0.45} />
      </RoundedBox>
      <RoundedBox args={[0.052, 0.28, 0.079]} radius={0.022} smoothness={6} position={[0.052, 0.44, 0.004]}>
        <meshStandardMaterial color={preset.inset} metalness={0.62} roughness={0.45} />
      </RoundedBox>
    </>}
    {preset.insertStyle === "contemporary-drop" && <>
      <RoundedBox args={[0.043, 0.91, 0.078]} radius={0.018} smoothness={6} position={[-0.057, 0.16, 0.003]}>
        <meshStandardMaterial color={preset.inset} metalness={0.78} roughness={0.42} />
      </RoundedBox>
      {[-0.2, 0.2, 0.55].map((position, index) => <RoundedBox key={position} args={[0.065, index === 2 ? 0.2 : 0.26, 0.079]} radius={0.025} smoothness={6} position={[0.04, position, 0.004]}>
        <meshStandardMaterial color={preset.inset} metalness={0.72} roughness={0.44} />
      </RoundedBox>)}
    </>}
  </group>;
}

function PivotCap({ position, preset }: { position: [number, number, number]; preset: EraPreset }) {
  return <group position={position}>
    <mesh rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[0.078, 0.078, 0.13, 40]} />
      <meshPhysicalMaterial color={preset.accent} metalness={0.76} roughness={0.16} clearcoat={0.5} />
    </mesh>
    <mesh position={[0, 0, 0.068]} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[0.026, 0.026, 0.008, 6]} />
      <meshStandardMaterial color={preset.inset} metalness={0.65} roughness={0.36} />
    </mesh>
  </group>;
}

function KineticAssembly({ preset, playing, restartToken }: { preset: EraPreset; playing: boolean; restartToken: number }) {
  const carrier = useRef<Group>(null);
  const bladePivot = useRef<Group>(null);
  const freeHandle = useRef<Group>(null);
  const elapsed = useRef(0);
  const previousRestart = useRef(restartToken);
  const halfSpread = preset.pivotSpread / 2;

  useFrame((_, delta) => {
    if (!carrier.current || !bladePivot.current || !freeHandle.current) return;
    if (previousRestart.current !== restartToken) {
      elapsed.current = 0;
      previousRestart.current = restartToken;
    }
    if (playing) elapsed.current += Math.min(delta, 0.05);
    const time = (elapsed.current % 7.2) / 7.2;

    bladePivot.current.rotation.z = sample(bladeTrack, time);
    freeHandle.current.rotation.z = sample(freeHandleTrack, time);
    carrier.current.rotation.x = sample(carrierXTrack, time);
    carrier.current.rotation.y = sample(carrierYTrack, time);
    carrier.current.rotation.z = sample(carrierZTrack, time);
    carrier.current.position.x = Math.sin(time * Math.PI * 2) * 0.07;
    carrier.current.position.y = Math.sin(time * Math.PI * 2) * 0.04;
  });

  return <group scale={0.92}>
    <mesh position={[0, 0, -0.42]}>
      <circleGeometry args={[1.46, 96]} />
      <meshBasicMaterial color="#0b1113" transparent opacity={0.42} />
    </mesh>
    <group ref={carrier} position={[0, 0.04, 0]}>
      <group position={[-halfSpread, 0, 0.07]}>
        <DecorativeHandle preset={preset} side={-1} />
      </group>
      <group ref={bladePivot} position={[-halfSpread, 0, 0]}>
        <group position={[halfSpread, 0.62, 0]}><CentralDisplayInsert preset={preset} /></group>
        <group ref={freeHandle} position={[preset.pivotSpread, 0, -0.07]}>
          <DecorativeHandle preset={preset} side={1} withLatch={preset.hasLatch} />
        </group>
        <PivotCap position={[preset.pivotSpread, 0, -0.07]} preset={preset} />
      </group>
      <PivotCap position={[-halfSpread, 0, 0.07]} preset={preset} />
    </group>
  </group>;
}

function ResponsiveCamera() {
  const { camera, size } = useThree();

  useEffect(() => {
    if (!(camera instanceof PerspectiveCamera)) return;
    camera.position.set(0, 0.02, size.width < 640 ? 8.2 : 6.3);
    camera.fov = 31;
    camera.updateProjectionMatrix();
  }, [camera, size.width]);

  return null;
}

const evidenceStateCopy: Record<EvidenceState, { en: string; zh: string }> = {
  observed: { en: "Observed", zh: "直接观察" },
  inferred: { en: "Inferred", zh: "证据推测" },
  unknown: { en: "Unknown", zh: "当前未知" },
};

const evidenceStateStyles: Record<EvidenceState, string> = {
  observed: "border-[#79935f] text-[#b9d599]",
  inferred: "border-amber-300 text-amber-200",
  unknown: "border-white/35 text-fog",
};

const sourceFolios = [
  {
    image: "/research/sastron-batangas-1895.webp",
    year: "1895",
    title: { en: "Batangas and its province", zh: "《八打雁及其省份》" },
    creator: { en: "Manuel Sastrón", zh: "曼努埃尔·萨斯特龙" },
    note: { en: "Regional context; targeted Spanish-language review still required.", zh: "提供地区背景；仍需西班牙语定向审核。" },
    href: "https://archive.org/details/filipinaspequeo01sastgoog",
  },
  {
    image: "/research/philippine-exhibits-1904.webp",
    year: "1904",
    title: { en: "Official catalogue of Philippine exhibits", zh: "《菲律宾展品官方目录》" },
    creator: { en: "Louisiana Purchase Exposition", zh: "路易斯安那购地博览会" },
    note: { en: "Period exhibition frame; catalogue categories are not neutral descriptions.", zh: "提供同期博览会框架；目录分类并非中立描述。" },
    href: "https://archive.org/details/officialcatalogu00loui_2",
  },
  {
    image: "/research/usnm-bulletin-137-1926.webp",
    year: "1926",
    title: { en: "USNM Bulletin 137", zh: "美国国家博物馆第 137 号公报" },
    creator: { en: "Herbert W. Krieger", zh: "赫伯特·W·克里格" },
    note: { en: "Museum comparison context; not a documented balisong record.", zh: "博物馆比较背景；不是有记录的 balisong 实物。" },
    href: "https://doi.org/10.5479/si.03629236.137.1",
  },
] as const;

export function BalisongKineticShowcase() {
  const { locale } = useLanguage();
  const [presetId, setPresetId] = useState<EraPresetId>("contemporary");
  const [playing, setPlaying] = useState(true);
  const [restartToken, setRestartToken] = useState(0);
  const preset = eraPresets.find((item) => item.id === presetId) ?? eraPresets[4];

  return <div className="space-y-8" data-testid="balisong-kinetic-showcase">
    <section className="overflow-hidden border border-ink/25 bg-night text-white">
      <header className="grid gap-5 border-b border-white/15 px-5 py-6 lg:grid-cols-[1fr_auto] lg:items-end lg:px-7">
        <div>
          <h2 className="font-display text-3xl leading-tight lg:text-4xl">{locale === "zh" ? "时期形态与动态视觉研究" : "Period form and kinetic study"}</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-fog">{locale === "zh"
            ? "五个研究框架分别对应有图版记录的比较形态、菲律宾地方记录、国家文化展示、工业目录与当代结构术语。切换时期会改变中性插片与刀柄外部几何；记录已核验不代表具体外观或起源已经确定。"
            : "Five research frames separate a documented comparative form, a Philippine local record, national cultural display, industrial catalogues, and contemporary anatomy. Switching frames changes the neutral insert and visible handle geometry; a verified record does not make its exact appearance or origin certain."}</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setRestartToken((value) => value + 1)} className="focus-ring inline-flex items-center gap-2 border border-white/25 px-3 py-3 font-mono text-[9px] font-bold uppercase tracking-[.1em] hover:bg-white/10"><RotateCcw size={15} aria-hidden="true" />{locale === "zh" ? "重新播放" : "Restart"}</button>
          <button type="button" aria-pressed={playing} onClick={() => setPlaying((value) => !value)} className="focus-ring inline-flex items-center gap-2 border border-white/25 px-3 py-3 font-mono text-[9px] font-bold uppercase tracking-[.1em] hover:bg-white/10">
            {playing ? <CirclePause size={15} aria-hidden="true" /> : <CirclePlay size={15} aria-hidden="true" />}
            {playing ? (locale === "zh" ? "暂停" : "Pause") : (locale === "zh" ? "播放" : "Play")}
          </button>
        </div>
      </header>

      <div className="grid lg:grid-cols-[minmax(0,1.7fr)_minmax(320px,.62fr)]">
        <div
          className="relative h-[500px] border-b border-white/15 lg:h-[650px] lg:border-b-0 lg:border-r"
          data-testid="kinetic-geometry-stage"
          data-handle-style={preset.handleStyle}
          data-insert-style={preset.insertStyle}
          data-evidence-state={preset.evidenceState}
        >
          <Canvas camera={{ position: [0, 0.02, 6.3], fov: 31 }} dpr={[1, 1.8]} shadows>
            <ResponsiveCamera />
            <color attach="background" args={[preset.background]} />
            <ambientLight intensity={0.56} />
            <hemisphereLight args={["#e6f0ee", "#071014", 1.7]} />
            <directionalLight position={[-3.8, 4.2, 5.2]} intensity={4.8} castShadow />
            <spotLight position={[3.4, 1.5, 4.8]} intensity={3.4} angle={0.5} penumbra={0.86} color="#c9e9ed" />
            <pointLight position={[-2.7, -2, 2.8]} intensity={1.3} color={preset.accent} />
            <KineticAssembly preset={preset} playing={playing} restartToken={restartToken} />
            <ContactShadows position={[0, 0, -0.56]} rotation={[Math.PI / 2, 0, 0]} scale={5.4} opacity={0.38} blur={2.8} far={2.6} color="#000000" />
          </Canvas>
          <div className="pointer-events-none absolute left-4 top-4 max-w-[74%] border-l border-white/35 bg-night/70 px-3 py-2 backdrop-blur-sm">
            <p className="font-mono text-[8px] font-bold uppercase tracking-[.12em] text-fog">{preset.period[locale]}</p>
            <p className="mt-1 font-display text-lg leading-tight text-white">{preset.title[locale]}</p>
          </div>
          <div className="pointer-events-none absolute bottom-4 left-4 border border-white/25 bg-night/85 px-3 py-2 font-mono text-[8px] uppercase tracking-[.1em] text-fog">{locale === "zh" ? "实时 WebGL · 单一视觉代理 · 无下载" : "Real-time WebGL · single visual proxy · no download"}</div>
        </div>

        <aside className="flex flex-col p-5 lg:p-6">
          <div className="flex items-center justify-between gap-4 border-b border-white/15 pb-4">
            <p className="font-mono text-[9px] uppercase tracking-[.12em] text-fog">{locale === "zh" ? "当前证据档案" : "Current evidence dossier"}</p>
            <span className={`border-l-2 pl-2 font-mono text-[9px] font-bold uppercase tracking-[.09em] ${evidenceStateStyles[preset.evidenceState]}`}>{evidenceStateCopy[preset.evidenceState][locale]}</span>
          </div>

          <h3 className="mt-5 font-display text-2xl leading-tight">{preset.title[locale]}</h3>
          <p className="mt-3 text-sm leading-6 text-fog">{preset.note[locale]}</p>

          <dl className="mt-6 border-y border-white/15 text-xs">
            <div className="border-b border-white/10 py-4">
              <dt className="font-mono text-[8px] font-bold uppercase tracking-[.11em] text-fog">{locale === "zh" ? "刀柄外部结构" : "Visible handle structure"}</dt>
              <dd className="mt-2 leading-5 text-white">{preset.structureCue[locale]}</dd>
            </div>
            <div className="border-b border-white/10 py-4">
              <dt className="font-mono text-[8px] font-bold uppercase tracking-[.11em] text-fog">{locale === "zh" ? "刃形展示轮廓" : "Blade-form display silhouette"}</dt>
              <dd className="mt-2 leading-5 text-white">{preset.insertCue[locale]}</dd>
            </div>
            <div className="py-4">
              <dt className="font-mono text-[8px] font-bold uppercase tracking-[.11em] text-fog">{locale === "zh" ? "证据说明" : "Evidence note"}</dt>
              <dd className="mt-2 leading-5 text-fog">{preset.evidenceCue[locale]}</dd>
            </div>
          </dl>

          <div className="mt-5 border-l-2 border-amber-300 pl-4">
            <p className="font-mono text-[8px] font-bold uppercase leading-4 tracking-[.09em] text-amber-200">{locale === "zh" ? "主要来源路径" : "Primary source path"}</p>
            <p className="mt-2 text-xs leading-5 text-fog">{preset.source[locale]}</p>
          </div>

          <div className="mt-auto grid grid-cols-3 gap-3 border-t border-white/15 pt-6">
            {(["observed", "inferred", "unknown"] as const).map((state) => <div key={state} className="min-w-0">
              <span className={`block border-t-2 pt-2 font-mono text-[8px] font-bold uppercase tracking-[.06em] ${evidenceStateStyles[state]}`}>{evidenceStateCopy[state][locale]}</span>
            </div>)}
          </div>
        </aside>
      </div>

      <div className="border-t border-white/15" role="tablist" aria-label={locale === "zh" ? "时期结构预设" : "Period geometry presets"}>
        <div className="grid min-w-[860px] grid-cols-5 overflow-x-auto lg:min-w-0">
          {eraPresets.map((item, index) => <button key={item.id} type="button" role="tab" aria-selected={presetId === item.id} onClick={() => setPresetId(item.id)} className={`focus-ring relative min-h-[116px] border-r border-white/15 px-4 py-4 text-left last:border-r-0 ${presetId === item.id ? "bg-white/10" : "hover:bg-white/5"}`}>
            <span className={`absolute inset-x-0 top-0 h-0.5 ${presetId === item.id ? "bg-amber-200" : "bg-transparent"}`} />
            <span className="font-display text-xl text-white/45">0{index + 1}</span>
            <span className="ml-3 font-mono text-[8px] font-bold uppercase tracking-[.1em] text-fog">{item.period[locale]}</span>
            <span className="mt-2 block font-display text-base leading-5 text-white">{item.title[locale]}</span>
          </button>)}
        </div>
      </div>
    </section>

    <section aria-labelledby="source-folios-heading" className="border-y border-ink/25 py-7">
      <div className="grid gap-5 lg:grid-cols-[260px_1fr] lg:items-end">
        <div>
          <h2 id="source-folios-heading" className="font-display text-3xl">{locale === "zh" ? "档案书目图像" : "Archival source folios"}</h2>
          <p className="mt-2 text-xs leading-5 text-quiet">{locale === "zh" ? "以下均为公版来源的封面或题名页，仅用于书目导航，不是物件形态证据。" : "Public-domain covers and title pages for bibliographic navigation only; they are not object-form evidence."}</p>
        </div>
        <p className="max-w-2xl text-sm leading-6 text-quiet">{locale === "zh" ? "新增的文献筛选把地区史、博览会目录与博物馆目录分开处理。年代早不等于结论更可靠；每一条形态主张仍需绑定具体页面或图像区域。" : "The expanded literature pass separates regional history, exposition catalogues, and museum catalogues. Earlier publication does not mean greater certainty; every form claim still needs a page or image-region citation."}</p>
      </div>
      <div className="mt-7 grid gap-0 border-t border-ink/20 md:grid-cols-3">
        {sourceFolios.map((folio) => <article key={folio.year} className="grid grid-cols-[96px_1fr] gap-4 border-b border-ink/20 py-5 md:grid-cols-1 md:border-r md:px-5 md:first:pl-0 md:last:border-r-0 md:last:pr-0 xl:grid-cols-[112px_1fr]">
          <div className="relative aspect-[3/4] overflow-hidden border border-ink/20 bg-[#e7decc]">
            <Image src={folio.image} alt={locale === "zh" ? `${folio.title.zh}题名页` : `${folio.title.en} title page`} fill sizes="(max-width: 768px) 96px, 180px" className="object-cover grayscale-[18%]" />
          </div>
          <div className="flex min-w-0 flex-col">
            <p className="font-mono text-[9px] font-bold uppercase tracking-[.11em] text-redline">{folio.year}</p>
            <h3 className="mt-2 font-display text-xl leading-6">{folio.title[locale]}</h3>
            <p className="mt-1 text-xs leading-5 text-quiet">{folio.creator[locale]}</p>
            <p className="mt-4 text-xs leading-5 text-quiet">{folio.note[locale]}</p>
            <a href={folio.href} target="_blank" rel="noreferrer" className="focus-ring mt-auto inline-flex items-center gap-1 self-start pt-4 font-mono text-[9px] font-bold uppercase tracking-[.09em] underline underline-offset-4">{locale === "zh" ? "来源记录" : "Source record"}<ArrowUpRight size={12} aria-hidden="true" /></a>
          </div>
        </article>)}
      </div>
    </section>

    <section className="divide-y divide-ink/15 border-b border-ink/20 text-sm leading-6">
      <div className="grid gap-4 py-5 md:grid-cols-[180px_1fr_auto] md:items-center">
        <p className="font-mono text-[9px] font-bold uppercase tracking-[.11em] text-ochre">{locale === "zh" ? "最早可核验比较形态" : "Earliest verified comparison"}</p>
        <p className="text-quiet">{locale === "zh" ? "美国专利第 229,706 号的 1880 年图版直接展示成对转动刀柄与合拢外观，因此可用于宽泛外部形态比较。它不证明菲律宾工艺的起源，也不证明任何传播路线；机械细节不进入公共代理。" : "The 1880 drawing in US Patent 229,706 directly shows paired rotating handles and their closed appearance, so it can support a broad external comparison. It proves neither the origin of the Philippine craft nor a transmission route; mechanical detail is excluded from the public proxy."}</p>
        <a href="https://patents.google.com/patent/US229706A/en" target="_blank" rel="noreferrer" className="focus-ring font-mono text-[9px] font-bold uppercase tracking-[.1em] underline underline-offset-4">{locale === "zh" ? "查看 1880 专利记录" : "View 1880 patent record"}</a>
      </div>
      <div className="grid gap-4 py-5 md:grid-cols-[180px_1fr_auto] md:items-center">
        <p className="font-mono text-[9px] font-bold uppercase tracking-[.11em] text-ochre">{locale === "zh" ? "运动关系参考" : "Motion relationship"}</p>
        <p className="text-quiet">{locale === "zh" ? "Wikimedia Commons 的 123 帧开放／闭合记录只用于校正三个外部部分的先后关系；不逐帧展示，也不转化为动作教学。" : "A 123-frame Wikimedia Commons opening/closing record is used only to check the sequence of three external bodies; it is neither shown frame-by-frame nor converted into instruction."}</p>
        <a href="https://commons.wikimedia.org/wiki/File:Opening_and_closing_a_Balisong_aka_Butterfly_Knife.gif" target="_blank" rel="noreferrer" className="focus-ring font-mono text-[9px] font-bold uppercase tracking-[.1em] underline underline-offset-4">{locale === "zh" ? "CC BY-SA 3.0 来源" : "CC BY-SA 3.0 source"}</a>
      </div>
      <div className="grid gap-4 py-5 md:grid-cols-[180px_1fr_auto] md:items-center">
        <p className="font-mono text-[9px] font-bold uppercase tracking-[.11em] text-ochre">{locale === "zh" ? "结构与外观参考" : "Structure and appearance"}</p>
        <p className="text-quiet">{locale === "zh" ? "1994 年《金属工艺》条目支持角质外观、金属钉饰与多种外部轮廓；1979—1994 目录扫描支持贴片柄与全金属镂空柄两类可见形态。更早的组合继续标为推测或未知。" : "The 1994 Metalcraft entry supports horn appearance, metal nail decoration, and multiple external silhouettes; 1979–1994 scans support visible scale-clad and all-metal skeletonized handle families. Earlier assemblies remain inferred or unknown."}</p>
        <div className="flex flex-col items-start gap-2 font-mono text-[9px] font-bold uppercase tracking-[.1em]">
          <a href="https://nlpdl.nlp.gov.ph/CC01/monographs/1994/NLP00VM052mcd/v3/v17.pdf" target="_blank" rel="noreferrer" className="focus-ring underline underline-offset-4">{locale === "zh" ? "查看 1994 工艺条目" : "View 1994 craft entry"}</a>
          <a href="https://www.pbase.com/balisong/balisong_catalogs" target="_blank" rel="noreferrer" className="focus-ring underline underline-offset-4">{locale === "zh" ? "查看历史目录扫描" : "View period catalogue scans"}</a>
        </div>
      </div>
      <div className="grid gap-4 py-5 md:grid-cols-[180px_1fr_auto] md:items-center">
        <p className="font-mono text-[9px] font-bold uppercase tracking-[.11em] text-ochre">{locale === "zh" ? "当代术语参考" : "Contemporary terminology"}</p>
        <p className="text-quiet">{locale === "zh" ? "公开结构页面仅用于核对当代通道式／夹层式刀柄、可见枢轴与闩锁等外部术语。没有复制商业型号，也没有读取尺寸。" : "A public anatomy page is used only to check contemporary channel/sandwich handle, visible pivot, and latch terminology. No commercial model or dimension is copied."}</p>
        <a href="https://www.squidindustries.co/blogs/education-squid-industries/balisong-anatomy" target="_blank" rel="noreferrer" className="focus-ring font-mono text-[9px] font-bold uppercase tracking-[.1em] underline underline-offset-4">{locale === "zh" ? "查看公开结构参考" : "View public anatomy reference"}</a>
      </div>
    </section>
  </div>;
}
