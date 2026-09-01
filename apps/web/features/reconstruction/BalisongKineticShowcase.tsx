"use client";

import { RoundedBox } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { CirclePause, CirclePlay, RotateCcw, Sparkles } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { Shape, type Group, type Mesh } from "three";
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
    handle: "#5c4634", inset: "#241d18", metal: "#b8b2a6", accent: "#c49b54", background: "#111718",
  },
  {
    id: "regional",
    period: { en: "1895–1919 regional frame", zh: "1895—1919 地区框架" },
    title: { en: "Batangas craft palette", zh: "八打雁工艺色调" },
    note: { en: "Wood, dark metal, and warm brass are interpretive appearance cues only.", zh: "木色、深色金属与暖黄铜仅作为解释性外观提示。" },
    source: { en: "Regional books and exposition catalogues", zh: "地区书籍与博览会目录" },
    handle: "#75462e", inset: "#2b1c17", metal: "#c1b7a3", accent: "#d0a04d", background: "#121a18",
  },
  {
    id: "museum",
    period: { en: "1926–1951 museum frame", zh: "1926—1951 博物馆框架" },
    title: { en: "Museum-catalogue study", zh: "博物馆目录研究色调" },
    note: { en: "A restrained archival finish; no catalogue dimension or mechanism is reproduced.", zh: "采用克制的档案外观，不复现目录中的尺寸或机械结构。" },
    source: { en: "USNM Bulletin 137 and Batangas archive leads", zh: "美国国家博物馆第 137 号公报与八打雁档案线索" },
    handle: "#313b3b", inset: "#151b1b", metal: "#c4c7c2", accent: "#8c7757", background: "#101619",
  },
  {
    id: "craft",
    period: { en: "1952–1994 craft-display frame", zh: "1952—1994 工艺展示框架" },
    title: { en: "Craft-display interpretation", zh: "工艺展示解释色调" },
    note: { en: "Warm display materials are suggested by later craft publications awaiting review.", zh: "暖色展示材料来自仍待审核的后期工艺出版物线索。" },
    source: { en: "CCP Metalcraft and Nayong Pilipino research leads", zh: "菲律宾文化中心《金属工艺》与 Nayong Pilipino 研究线索" },
    handle: "#8a5532", inset: "#39251b", metal: "#d0c5aa", accent: "#d5a33e", background: "#171714",
  },
  {
    id: "contemporary",
    period: { en: "1995–present media frame", zh: "1995—至今媒体框架" },
    title: { en: "Contemporary media silhouette", zh: "当代媒体轮廓" },
    note: { en: "A cleaner graphic finish for media-history display, not a commercial product model.", zh: "采用适合媒体史展示的简洁图形外观，不是商业产品模型。" },
    source: { en: "UP short-film thesis catalogue lead", zh: "菲律宾大学短片论文目录线索" },
    handle: "#28383d", inset: "#0f171a", metal: "#d6d8d2", accent: "#b45d45", background: "#0d1518",
  },
] as const;

type Keyframe = readonly [time: number, value: number];

const leftHandleTrack: readonly Keyframe[] = [
  [0, Math.PI], [0.09, Math.PI], [0.24, 0], [0.38, 0], [0.5, -Math.PI],
  [0.63, 0], [0.78, 0], [0.92, Math.PI], [1, Math.PI],
];
const rightHandleTrack: readonly Keyframe[] = [
  [0, -Math.PI], [0.16, -Math.PI], [0.33, 0], [0.5, 0], [0.62, Math.PI],
  [0.75, 0], [0.84, 0], [0.96, -Math.PI], [1, -Math.PI],
];
const carrierXTrack: readonly Keyframe[] = [[0, 0.16], [0.24, -0.22], [0.5, 0.25], [0.76, -0.16], [1, 0.16]];
const carrierYTrack: readonly Keyframe[] = [[0, -0.14], [0.22, 0.24], [0.48, -0.12], [0.72, 0.2], [1, -0.14]];
const carrierZTrack: readonly Keyframe[] = [[0, -0.16], [0.25, 0.42], [0.5, -0.4], [0.75, 0.34], [1, -0.16]];

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

function DecorativeHandle({ preset, side }: { preset: EraPreset; side: -1 | 1 }) {
  const markers = [-0.84, -0.58, -0.32] as const;
  return <group position={[0, -0.58, 0]}>
    <RoundedBox args={[0.36, 1.18, 0.16]} radius={0.075} smoothness={6} castShadow>
      <meshStandardMaterial color={preset.handle} metalness={0.5} roughness={0.32} />
    </RoundedBox>
    <RoundedBox args={[0.17, 0.82, 0.174]} radius={0.052} smoothness={5} position={[0, -0.02, 0.006]}>
      <meshStandardMaterial color={preset.inset} metalness={0.2} roughness={0.5} />
    </RoundedBox>
    {markers.map((position) => <mesh key={position} position={[0, position + 0.58, 0.094]} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[0.038, 0.038, 0.015, 28]} />
      <meshStandardMaterial color={preset.accent} metalness={0.82} roughness={0.22} />
    </mesh>)}
    <RoundedBox args={[0.055, 0.95, 0.18]} radius={0.02} position={[side * 0.128, 0, 0.002]}>
      <meshStandardMaterial color={preset.accent} metalness={0.75} roughness={0.26} />
    </RoundedBox>
  </group>;
}

function CentralDisplayInsert({ preset }: { preset: EraPreset }) {
  const silhouette = useMemo(() => {
    const shape = new Shape();
    shape.moveTo(-0.15, -0.47);
    shape.lineTo(-0.145, 0.43);
    shape.bezierCurveTo(-0.14, 0.64, -0.075, 0.76, 0.005, 0.79);
    shape.bezierCurveTo(0.09, 0.7, 0.145, 0.52, 0.16, 0.34);
    shape.lineTo(0.135, -0.47);
    shape.closePath();
    return shape;
  }, []);
  return <group>
    <mesh position={[0, 0, -0.05]} castShadow>
      <extrudeGeometry args={[silhouette, { depth: 0.1, bevelEnabled: true, bevelSegments: 5, bevelSize: 0.022, bevelThickness: 0.018, curveSegments: 28 }]} />
      <meshStandardMaterial color={preset.metal} metalness={0.8} roughness={0.24} />
    </mesh>
    <RoundedBox args={[0.06, 0.87, 0.112]} radius={0.028} position={[-0.085, 0.17, 0.006]}>
      <meshStandardMaterial color={preset.accent} metalness={0.72} roughness={0.28} />
    </RoundedBox>
    <mesh position={[0, -0.48, 0]} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[0.2, 0.2, 0.11, 48]} />
      <meshStandardMaterial color={preset.metal} metalness={0.82} roughness={0.22} />
    </mesh>
  </group>;
}

function PivotCap({ position, preset }: { position: [number, number, number]; preset: EraPreset }) {
  return <mesh position={position} rotation={[Math.PI / 2, 0, 0]}>
    <cylinderGeometry args={[0.092, 0.092, 0.2, 36]} />
    <meshStandardMaterial color={preset.accent} metalness={0.86} roughness={0.2} />
  </mesh>;
}

function KineticAssembly({ preset, playing, restartToken }: { preset: EraPreset; playing: boolean; restartToken: number }) {
  const carrier = useRef<Group>(null);
  const leftHandle = useRef<Group>(null);
  const rightHandle = useRef<Group>(null);
  const glow = useRef<Mesh>(null);
  const elapsed = useRef(0);
  const previousRestart = useRef(restartToken);

  useFrame((_, delta) => {
    if (!carrier.current || !leftHandle.current || !rightHandle.current) return;
    if (previousRestart.current !== restartToken) {
      elapsed.current = 0;
      previousRestart.current = restartToken;
    }
    if (playing) elapsed.current += Math.min(delta, 0.05);
    const time = (elapsed.current % 7.2) / 7.2;

    leftHandle.current.rotation.z = sample(leftHandleTrack, time);
    rightHandle.current.rotation.z = sample(rightHandleTrack, time);
    carrier.current.rotation.x = sample(carrierXTrack, time);
    carrier.current.rotation.y = sample(carrierYTrack, time);
    carrier.current.rotation.z = sample(carrierZTrack, time);
    carrier.current.position.x = Math.sin(time * Math.PI * 4) * 0.13;
    carrier.current.position.y = Math.sin(time * Math.PI * 2) * 0.08;
    if (glow.current) glow.current.rotation.z = time * Math.PI * 2;
  });

  return <group>
    <mesh ref={glow} position={[0, 0, -0.42]}>
      <ringGeometry args={[1.3, 1.34, 96]} />
      <meshBasicMaterial color={preset.accent} transparent opacity={0.16} />
    </mesh>
    <group ref={carrier} position={[0, 0.04, 0]}>
      <CentralDisplayInsert preset={preset} />
      <group ref={leftHandle} position={[-0.24, -0.47, 0.105]}>
        <DecorativeHandle preset={preset} side={-1} />
      </group>
      <group ref={rightHandle} position={[0.24, -0.47, -0.105]}>
        <DecorativeHandle preset={preset} side={1} />
      </group>
      <PivotCap position={[-0.24, -0.47, 0.105]} preset={preset} />
      <PivotCap position={[0.24, -0.47, -0.105]} preset={preset} />
    </group>
  </group>;
}

export function BalisongKineticShowcase() {
  const { locale } = useLanguage();
  const [presetId, setPresetId] = useState<EraPresetId>("craft");
  const [playing, setPlaying] = useState(true);
  const [restartToken, setRestartToken] = useState(0);
  const preset = eraPresets.find((item) => item.id === presetId) ?? eraPresets[3];

  return <div className="space-y-6" data-testid="balisong-kinetic-showcase">
    <section className="overflow-hidden border border-ink/25 bg-night text-white">
      <header className="grid gap-4 border-b border-white/15 px-5 py-5 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <div className="flex items-center gap-2 font-mono text-[9px] font-bold uppercase tracking-[.11em] text-amber-200"><Sparkles size={14} aria-hidden="true" />{locale === "zh" ? "3D 连续动态展览" : "Continuous 3D kinetic exhibit"}</div>
          <h2 className="mt-3 font-display text-3xl">{locale === "zh" ? "蝴蝶刀动态视觉研究" : "Balisong kinetic visual study"}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-fog">{locale === "zh"
            ? "双柄围绕中央展示插片进行连续展开、回转与收束，场景整体同步翻转，形成流畅循环的浏览器 3D 动画。"
            : "Two handles continuously unfold, revolve, and return around a central display insert while the full assembly turns through a smooth browser-rendered loop."}</p>
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
          <Canvas camera={{ position: [0, 0.05, 4.8], fov: 36 }} dpr={[1, 1.7]} shadows>
            <color attach="background" args={[preset.background]} />
            <ambientLight intensity={1.15} />
            <directionalLight position={[-2.8, 2.5, 4]} intensity={3.2} castShadow />
            <pointLight position={[2.5, -1.5, 2.5]} intensity={1.7} color={preset.accent} />
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
        { en: "Procedural handle movement", zh: "程序化双柄运动" },
        { en: "Five research-era palettes", zh: "五种研究时期外观" },
        { en: "Real-time browser rendering", zh: "浏览器实时渲染" },
      ].map((item) => <div key={item.en} className="bg-paper px-4 py-4 font-mono text-[9px] font-bold uppercase tracking-[.09em] text-quiet">{item[locale]}</div>)}
    </section>
  </div>;
}
