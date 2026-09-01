"use client";

import { RoundedBox } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { CirclePause, CirclePlay, RotateCcw, Sparkles } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { PerspectiveCamera, Shape, type Group } from "three";
import { useLanguage } from "@/components/Providers";

type EraPresetId = "comparative" | "regional" | "museum" | "craft" | "contemporary";

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
};

const eraPresets: readonly EraPreset[] = [
  {
    id: "comparative",
    period: { en: "1771 comparative frame", zh: "1771 比较框架" },
    title: { en: "European cutlery-book palette", zh: "欧洲刀具图录色调" },
    note: { en: "A comparative visual mood, not an origin claim or period replica.", zh: "仅采用比较研究的视觉气氛，不构成起源主张或时期复制品。" },
    source: { en: "Perret, L’art du coutelier — metadata review", zh: "佩雷《刀匠技艺》——元数据审核" },
    handle: "#4b4640", inset: "#17191a", metal: "#b9b8b2", accent: "#8e7654", background: "#0c1012",
  },
  {
    id: "regional",
    period: { en: "1895–1919 regional frame", zh: "1895—1919 地区框架" },
    title: { en: "Batangas craft palette", zh: "八打雁工艺色调" },
    note: { en: "Wood, dark metal, and warm brass are interpretive appearance cues only.", zh: "木色、深色金属与暖黄铜仅作为解释性外观提示。" },
    source: { en: "Regional books and exposition catalogues", zh: "地区书籍与博览会目录" },
    handle: "#59433a", inset: "#171718", metal: "#c2bbae", accent: "#9f7d4d", background: "#0c1112",
  },
  {
    id: "museum",
    period: { en: "1926–1951 museum frame", zh: "1926—1951 博物馆框架" },
    title: { en: "Museum-catalogue study", zh: "博物馆目录研究色调" },
    note: { en: "A restrained archival finish; no catalogue dimension or mechanism is reproduced.", zh: "采用克制的档案外观，不复现目录中的尺寸或机械结构。" },
    source: { en: "USNM Bulletin 137 and Batangas archive leads", zh: "美国国家博物馆第 137 号公报与八打雁档案线索" },
    handle: "#353a3d", inset: "#121517", metal: "#c6c8c6", accent: "#858b8c", background: "#0a0f12",
  },
  {
    id: "craft",
    period: { en: "1952–1994 craft-display frame", zh: "1952—1994 工艺展示框架" },
    title: { en: "Craft-display interpretation", zh: "工艺展示解释色调" },
    note: { en: "Warm display materials are suggested by later craft publications awaiting review.", zh: "暖色展示材料来自仍待审核的后期工艺出版物线索。" },
    source: { en: "CCP Metalcraft and Nayong Pilipino research leads", zh: "菲律宾文化中心《金属工艺》与 Nayong Pilipino 研究线索" },
    handle: "#6f4b3a", inset: "#1a1716", metal: "#c8c2b6", accent: "#aa8350", background: "#0e1010",
  },
  {
    id: "contemporary",
    period: { en: "1995–present media frame", zh: "1995—至今媒体框架" },
    title: { en: "Contemporary media silhouette", zh: "当代媒体轮廓" },
    note: { en: "A cleaner graphic finish for media-history display, not a commercial product model.", zh: "采用适合媒体史展示的简洁图形外观，不是商业产品模型。" },
    source: { en: "Public manufacturer anatomy imagery + UP media lead", zh: "制造商公开结构图像与菲律宾大学媒体研究线索" },
    handle: "#1b8fa8", inset: "#10191c", metal: "#c9cecf", accent: "#e0e5e5", background: "#071014",
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
  const slotPositions = [-0.43, -0.03, 0.37] as const;
  const tailGrooves = [-0.61, -0.56, -0.51] as const;
  return <group position={[0, -0.74, 0]}>
    <RoundedBox args={[0.225, 1.5, 0.105]} radius={0.038} smoothness={8} castShadow>
      <meshPhysicalMaterial color={preset.handle} metalness={0.72} roughness={0.25} clearcoat={0.38} clearcoatRoughness={0.22} />
    </RoundedBox>
    <RoundedBox args={[0.155, 1.35, 0.111]} radius={0.03} smoothness={7} position={[0, -0.015, 0.003]}>
      <meshPhysicalMaterial color={preset.inset} metalness={0.72} roughness={0.38} clearcoat={0.15} />
    </RoundedBox>
    {slotPositions.map((position, index) => <RoundedBox key={position} args={[0.102, index === 1 ? 0.25 : 0.29, 0.116]} radius={0.026} smoothness={6} position={[side * 0.008, position, 0.007]}>
      <meshStandardMaterial color={preset.handle} metalness={0.9} roughness={0.27} />
    </RoundedBox>)}
    {tailGrooves.map((position) => <RoundedBox key={position} args={[0.17, 0.012, 0.116]} radius={0.005} smoothness={4} position={[0, position, 0.008]}>
      <meshStandardMaterial color={preset.accent} metalness={0.95} roughness={0.2} />
    </RoundedBox>)}
    <mesh position={[0, -0.66, 0.062]} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[0.045, 0.045, 0.012, 32]} />
      <meshPhysicalMaterial color={preset.accent} metalness={0.78} roughness={0.2} clearcoat={0.35} />
    </mesh>
    {withLatch && <group position={[0, -0.76, 0]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.025, 0.025, 0.12, 24]} /><meshStandardMaterial color={preset.accent} metalness={0.95} roughness={0.2} /></mesh>
      <RoundedBox args={[0.055, 0.18, 0.045]} radius={0.02} position={[0, -0.085, 0]}>
        <meshStandardMaterial color={preset.accent} metalness={0.95} roughness={0.22} />
      </RoundedBox>
    </group>}
  </group>;
}

function CentralDisplayInsert({ preset }: { preset: EraPreset }) {
  const silhouette = useMemo(() => {
    const shape = new Shape();
    shape.moveTo(-0.105, -0.62);
    shape.lineTo(-0.082, 0.68);
    shape.bezierCurveTo(-0.075, 0.82, -0.04, 0.96, 0.004, 1.02);
    shape.bezierCurveTo(0.05, 0.96, 0.082, 0.82, 0.088, 0.67);
    shape.lineTo(0.1, -0.62);
    shape.closePath();
    return shape;
  }, []);
  return <group>
    <mesh position={[0, 0, -0.036]} castShadow>
      <extrudeGeometry args={[silhouette, { depth: 0.072, bevelEnabled: true, bevelSegments: 5, bevelSize: 0.014, bevelThickness: 0.012, curveSegments: 32 }]} />
      <meshPhysicalMaterial color={preset.metal} metalness={0.84} roughness={0.31} clearcoat={0.14} clearcoatRoughness={0.28} />
    </mesh>
    <RoundedBox args={[0.043, 0.91, 0.078]} radius={0.018} smoothness={6} position={[-0.057, 0.16, 0.003]}>
      <meshStandardMaterial color={preset.inset} metalness={0.78} roughness={0.42} />
    </RoundedBox>
    {[-0.2, 0.2, 0.55].map((position, index) => <RoundedBox key={position} args={[0.065, index === 2 ? 0.2 : 0.26, 0.079]} radius={0.025} smoothness={6} position={[0.04, position, 0.004]}>
      <meshStandardMaterial color={preset.inset} metalness={0.72} roughness={0.44} />
    </RoundedBox>)}
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

  return <group scale={0.86}>
    <mesh position={[0, 0, -0.42]}>
      <circleGeometry args={[1.46, 96]} />
      <meshBasicMaterial color="#0b1113" transparent opacity={0.42} />
    </mesh>
    <group ref={carrier} position={[0, 0.04, 0]}>
      <group position={[-0.14, 0, 0.07]}>
        <DecorativeHandle preset={preset} side={-1} />
      </group>
      <group ref={bladePivot} position={[-0.14, 0, 0]}>
        <group position={[0.14, 0.62, 0]}><CentralDisplayInsert preset={preset} /></group>
        <group ref={freeHandle} position={[0.28, 0, -0.07]}>
          <DecorativeHandle preset={preset} side={1} withLatch={preset.id === "comparative" || preset.id === "regional"} />
        </group>
        <PivotCap position={[0.28, 0, -0.07]} preset={preset} />
      </group>
      <PivotCap position={[-0.14, 0, 0.07]} preset={preset} />
    </group>
  </group>;
}

function ResponsiveCamera() {
  const { camera, size } = useThree();

  useEffect(() => {
    if (!(camera instanceof PerspectiveCamera)) return;
    camera.position.set(0, 0.04, size.width < 640 ? 8.2 : 5.2);
    camera.fov = 31;
    camera.updateProjectionMatrix();
  }, [camera, size.width]);

  return null;
}

export function BalisongKineticShowcase() {
  const { locale } = useLanguage();
  const [presetId, setPresetId] = useState<EraPresetId>("contemporary");
  const [playing, setPlaying] = useState(true);
  const [restartToken, setRestartToken] = useState(0);
  const preset = eraPresets.find((item) => item.id === presetId) ?? eraPresets[4];

  return <div className="space-y-6" data-testid="balisong-kinetic-showcase">
    <section className="overflow-hidden border border-ink/25 bg-night text-white">
      <header className="grid gap-4 border-b border-white/15 px-5 py-5 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <div className="flex items-center gap-2 font-mono text-[9px] font-bold uppercase tracking-[.11em] text-amber-200"><Sparkles size={14} aria-hidden="true" />{locale === "zh" ? "3D 连续动态展览" : "Continuous 3D kinetic exhibit"}</div>
          <h2 className="mt-3 font-display text-3xl">{locale === "zh" ? "蝴蝶刀动态视觉研究" : "Balisong kinetic visual study"}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-fog">{locale === "zh"
            ? "重新按照公开视频校正刚体层级：一个柄作为锚点，中央插片与另一柄依次回转、合拢，再反向闭合，形成连续的浏览器 3D 动画。"
            : "The rigid-body hierarchy is corrected from public motion footage: one handle acts as the anchor while the central insert and free handle revolve, settle, and close in a continuous browser-rendered loop."}</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setRestartToken((value) => value + 1)} className="focus-ring inline-flex items-center gap-2 border border-white/25 px-3 py-3 font-mono text-[9px] font-bold uppercase tracking-[.1em] hover:bg-white/10"><RotateCcw size={15} aria-hidden="true" />{locale === "zh" ? "重新播放" : "Restart"}</button>
          <button type="button" aria-pressed={playing} onClick={() => setPlaying((value) => !value)} className="focus-ring inline-flex items-center gap-2 border border-white/25 px-3 py-3 font-mono text-[9px] font-bold uppercase tracking-[.1em] hover:bg-white/10">
            {playing ? <CirclePause size={15} aria-hidden="true" /> : <CirclePlay size={15} aria-hidden="true" />}
            {playing ? (locale === "zh" ? "暂停" : "Pause") : (locale === "zh" ? "播放" : "Play")}
          </button>
        </div>
      </header>

      <div className="grid lg:grid-cols-[minmax(0,1.55fr)_minmax(310px,.45fr)]">
        <div className="relative h-[520px] border-b border-white/15 lg:h-[620px] lg:border-b-0 lg:border-r">
          <Canvas camera={{ position: [0, 0.04, 5.2], fov: 31 }} dpr={[1, 1.7]} shadows>
            <ResponsiveCamera />
            <color attach="background" args={[preset.background]} />
            <ambientLight intensity={0.62} />
            <hemisphereLight args={["#dce9ed", "#071014", 1.5]} />
            <directionalLight position={[-3.6, 3.8, 5]} intensity={4.4} castShadow />
            <spotLight position={[3.2, 1.2, 4.5]} intensity={3.1} angle={0.52} penumbra={0.82} color="#b8e4ef" />
            <pointLight position={[-2.5, -1.8, 2.6]} intensity={1.15} color={preset.accent} />
            <KineticAssembly preset={preset} playing={playing} restartToken={restartToken} />
          </Canvas>
          <div className="pointer-events-none absolute bottom-4 left-4 border border-white/25 bg-night/85 px-3 py-2 font-mono text-[8px] uppercase tracking-[.1em] text-fog">{locale === "zh" ? "实时 WebGL · 流畅循环 · 无下载" : "Real-time WebGL · smooth loop · no download"}</div>
        </div>

        <aside className="p-5">
          <p className="font-mono text-[9px] uppercase tracking-[.12em] text-fog">{locale === "zh" ? "时期外观预设" : "Period appearance preset"}</p>
          <div className="mt-3 grid gap-2" role="tablist" aria-label={locale === "zh" ? "时期外观预设" : "Period appearance preset"}>
            {eraPresets.map((item) => <button key={item.id} type="button" role="tab" aria-selected={presetId === item.id} onClick={() => setPresetId(item.id)} className={`focus-ring border px-3 py-3 text-left ${presetId === item.id ? "border-amber-200 bg-white/10" : "border-white/15 hover:bg-white/5"}`}>
              <span className="block font-mono text-[8px] font-bold uppercase tracking-[.1em] text-fog">{item.period[locale]}</span>
              <span className="mt-1 block font-display text-lg">{item.title[locale]}</span>
            </button>)}
          </div>
          <div className="mt-5 border-l-2 border-amber-300 pl-4">
            <p className="text-xs leading-5 text-fog">{preset.note[locale]}</p>
            <p className="mt-3 font-mono text-[8px] uppercase leading-4 tracking-[.08em] text-amber-200">{preset.source[locale]}</p>
          </div>
        </aside>
      </div>
    </section>

    <section className="grid gap-px border border-ink/20 bg-ink/20 sm:grid-cols-3">
      {[
        { en: "Slender paired-handle silhouette", zh: "细长双柄轮廓" },
        { en: "Machined-metal surface study", zh: "机加工金属表面研究" },
        { en: "Real-time browser rendering", zh: "浏览器实时渲染" },
      ].map((item) => <div key={item.en} className="bg-paper px-4 py-4 font-mono text-[9px] font-bold uppercase tracking-[.09em] text-quiet">{item[locale]}</div>)}
    </section>
    <section className="grid gap-5 border-y border-ink/20 py-5 text-sm leading-6 md:grid-cols-[180px_1fr_auto] md:items-center">
      <p className="font-mono text-[9px] font-bold uppercase tracking-[.11em] text-ochre">{locale === "zh" ? "运动视频参考" : "Motion video reference"}</p>
      <p className="text-quiet">{locale === "zh"
        ? "使用 Wikimedia Commons 的 123 帧开放／闭合视频校正锚定柄、中央部分与自由柄的先后关系；原视频没有打包进项目。"
        : "A 123-frame opening/closing video on Wikimedia Commons was used to correct the relationship between the anchor handle, central body, and free handle. The source video is not bundled."}</p>
      <a href="https://commons.wikimedia.org/wiki/File:Opening_and_closing_a_Balisong_aka_Butterfly_Knife.gif" target="_blank" rel="noreferrer" className="focus-ring font-mono text-[9px] font-bold uppercase tracking-[.1em] underline underline-offset-4">{locale === "zh" ? "查看 CC BY-SA 3.0 视频" : "View CC BY-SA 3.0 video"}</a>
    </section>
    <section className="grid gap-5 border-b border-ink/20 pb-5 text-sm leading-6 md:grid-cols-[180px_1fr_auto] md:items-center">
      <p className="font-mono text-[9px] font-bold uppercase tracking-[.11em] text-ochre">{locale === "zh" ? "当代外观参考" : "Contemporary form reference"}</p>
      <p className="text-quiet">{locale === "zh"
        ? "根据制造商公开结构图像提取细长轮廓、通道式双柄、表面开槽、可见枢轴硬件与克制的阳极氧化／石洗金属观感；没有复制具体商业型号。"
        : "Public manufacturer anatomy imagery informed the slender silhouette, channel-style handles, surface slots, visible pivot hardware, and restrained anodized/stonewashed metal appearance. No commercial model is copied."}</p>
      <a href="https://www.squidindustries.co/blogs/education-squid-industries/balisong-anatomy" target="_blank" rel="noreferrer" className="focus-ring font-mono text-[9px] font-bold uppercase tracking-[.1em] underline underline-offset-4">{locale === "zh" ? "查看公开结构图" : "View public anatomy reference"}</a>
    </section>
  </div>;
}
