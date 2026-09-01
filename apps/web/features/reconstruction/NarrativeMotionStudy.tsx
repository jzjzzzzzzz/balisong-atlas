"use client";

import { Html, Line, useGLTF } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { BookOpenText, CirclePause, CirclePlay, Film, ShieldCheck } from "lucide-react";
import { Suspense, useMemo, useRef, useState } from "react";
import { CatmullRomCurve3, type Mesh, Vector3 } from "three";
import { useLanguage, type Locale } from "@/components/Providers";

type CueMode = "circulation" | "attention" | "uncertainty";

type CueDefinition = {
  id: CueMode;
  label: { en: string; zh: string };
  description: { en: string; zh: string };
  color: string;
  dashed: boolean;
  points: readonly [number, number, number][];
};

// Arbitrary, unitless scene-composition cues. They are deliberately detached
// from the proxy and never encode an object, hand, joint, or operation.
const cueDefinitions: readonly CueDefinition[] = [
  {
    id: "circulation",
    label: { en: "Narrative circulation", zh: "叙事传播" },
    description: {
      en: "An abstract loop for following how an image or term circulates between media records.",
      zh: "以抽象回路表示图像或术语如何在媒体记录之间传播。",
    },
    color: "#d7a84b",
    dashed: false,
    points: [[-0.88, -0.18, 0.14], [-0.42, 0.48, 0.32], [0.28, 0.54, -0.12], [0.86, 0.08, 0.16], [0.34, -0.52, 0.3], [-0.5, -0.5, -0.08], [-0.88, -0.18, 0.14]],
  },
  {
    id: "attention",
    label: { en: "Viewer attention", zh: "观看注意" },
    description: {
      en: "A curatorial attention path that points to changing emphasis without describing manipulation.",
      zh: "以策展观看路径表示关注重点的变化，不描述物件操作。",
    },
    color: "#b9d4c5",
    dashed: false,
    points: [[-0.92, 0.28, 0.2], [-0.46, -0.4, 0.38], [0.08, -0.2, -0.18], [0.52, 0.42, 0.26], [0.94, 0.08, 0.08]],
  },
  {
    id: "uncertainty",
    label: { en: "Uncertainty field", zh: "不确定性场" },
    description: {
      en: "A broken trace marks missing views, ambiguous prose, and unreviewed interpretation.",
      zh: "以断续轨迹标记缺失视角、含混叙述和未经审核的解释。",
    },
    color: "#d5ccc0",
    dashed: true,
    points: [[-0.9, -0.38, -0.12], [-0.6, 0.14, 0.3], [-0.16, 0.42, -0.2], [0.28, 0.18, 0.38], [0.66, -0.36, -0.08], [0.94, 0.18, 0.22]],
  },
] as const;

const periodGates = [
  { en: "1771 comparative record", zh: "1771 对照记录" },
  { en: "1895–1919 regional context", zh: "1895—1919 地区背景" },
  { en: "1926–1951 museum records", zh: "1926—1951 博物馆记录" },
  { en: "1952–1994 cultural display", zh: "1952—1994 文化展示" },
  { en: "1995–present media study", zh: "1995—至今媒体研究" },
] as const;

function StaticMethodProxy() {
  const { scene } = useGLTF("/demo-abstract-proxy.glb");
  return <group rotation={[0.22, 0, -0.08]}><primitive object={scene.clone()} /></group>;
}

function CameraStudyRig({ playing }: { playing: boolean }) {
  const phase = useRef(0);
  useFrame(({ camera }, delta) => {
    if (playing) phase.current = (phase.current + delta * 0.075) % 1;
    const theta = phase.current * Math.PI * 2;
    const target = new Vector3(
      Math.sin(theta) * 1.42,
      -1.7 + Math.cos(theta) * 0.16,
      0.72 + Math.sin(theta * 0.5) * 0.13,
    );
    camera.position.lerp(target, 0.035);
    camera.lookAt(0, 0, 0);
  });
  return null;
}

function AbstractCue({ cue, playing }: { cue: CueDefinition; playing: boolean }) {
  const marker = useRef<Mesh>(null);
  const phase = useRef(0.08);
  const vectors = useMemo(() => cue.points.map((point) => new Vector3(...point)), [cue]);
  const curve = useMemo(
    () => new CatmullRomCurve3(vectors, cue.id === "circulation", "centripetal"),
    [cue.id, vectors],
  );

  useFrame((_, delta) => {
    if (!marker.current) return;
    if (playing) phase.current = (phase.current + delta * 0.055) % 1;
    marker.current.position.copy(curve.getPointAt(phase.current));
  });

  return <group>
    <Line
      points={curve.getPoints(96)}
      color={cue.color}
      lineWidth={1.5}
      transparent
      opacity={0.72}
      dashed={cue.dashed}
      dashSize={0.035}
      gapSize={0.026}
    />
    <mesh ref={marker}>
      <sphereGeometry args={[0.025, 18, 18]} />
      <meshStandardMaterial color={cue.color} emissive={cue.color} emissiveIntensity={0.75} />
    </mesh>
  </group>;
}

function StudyScene({ cue, locale, playing }: { cue: CueDefinition; locale: Locale; playing: boolean }) {
  return <>
    <CameraStudyRig playing={playing} />
    <ambientLight intensity={1.2} />
    <directionalLight position={[2, -2, 3]} intensity={2.8} />
    <Suspense fallback={<Html center><span className="text-xs text-fog">{locale === "zh" ? "正在加载场景研究…" : "Loading scene study…"}</span></Html>}>
      <StaticMethodProxy />
      <AbstractCue cue={cue} playing={playing} />
    </Suspense>
  </>;
}

export function NarrativeMotionStudy() {
  const { locale } = useLanguage();
  const [mode, setMode] = useState<CueMode>("circulation");
  const [playing, setPlaying] = useState(true);
  const cue = cueDefinitions.find((item) => item.id === mode) ?? cueDefinitions[0];

  return <div className="space-y-7" data-testid="narrative-motion-study">
    <section className="overflow-hidden border border-ink/25 bg-night text-white">
      <header className="grid gap-4 border-b border-white/15 px-5 py-5 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <div className="flex flex-wrap items-center gap-2 font-mono text-[9px] font-bold uppercase tracking-[.11em]">
            <span className="border border-amber-300/50 px-2 py-1 text-amber-200">{locale === "zh" ? "提议状态" : "Proposed"}</span>
            <span className="border border-fog/30 px-2 py-1 text-fog">{locale === "zh" ? "媒体呈现研究" : "Media representation study"}</span>
          </div>
          <h2 className="mt-3 font-display text-3xl">{locale === "zh" ? "叙事运动场景研究" : "Narrative motion scene study"}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-fog">{locale === "zh"
            ? "把文献、小说或影像中的叙事线索转译为策展层面的观看路径。轨迹属于镜头与叙事标记，不是物件操作轨迹。"
            : "Translates narrative cues from documents, fiction, or moving-image records into a curatorial viewing path. The trace belongs to the camera and narrative marker—not to object operation."}</p>
        </div>
        <button
          type="button"
          aria-pressed={playing}
          onClick={() => setPlaying((value) => !value)}
          className="focus-ring inline-flex items-center justify-center gap-2 border border-white/25 px-4 py-3 font-mono text-[9px] font-bold uppercase tracking-[.1em] hover:bg-white/10"
        >
          {playing ? <CirclePause size={16} aria-hidden="true" /> : <CirclePlay size={16} aria-hidden="true" />}
          {playing ? (locale === "zh" ? "暂停场景漫游" : "Pause scene study") : (locale === "zh" ? "播放场景漫游" : "Play scene study")}
        </button>
      </header>

      <div className="grid lg:grid-cols-[minmax(0,1.45fr)_minmax(300px,.55fr)]">
        <div className="relative min-h-[470px] border-b border-white/15 lg:border-b-0 lg:border-r">
          <Canvas camera={{ position: [0, -1.7, 0.72], fov: 35 }} dpr={[1, 1.65]}>
            <color attach="background" args={["#10191b"]} />
            <StudyScene cue={cue} locale={locale} playing={playing} />
          </Canvas>
          <div className="pointer-events-none absolute left-4 top-4 border border-white/25 bg-night/90 px-3 py-2 font-mono text-[8px] uppercase tracking-[.1em] text-fog">
            {locale === "zh" ? "静止的虚构单一网格" : "Static fictional joined mesh"}
          </div>
          <div className="pointer-events-none absolute bottom-4 left-4 border border-white/25 bg-night/90 px-3 py-2 font-mono text-[8px] uppercase tracking-[.1em] text-fog">
            {locale === "zh" ? "抽象叙事标记 · 不是物件运动路径" : "Abstract narrative cue · not an object-motion path"}
          </div>
        </div>

        <aside className="p-5">
          <p className="font-mono text-[9px] uppercase tracking-[.12em] text-fog">{locale === "zh" ? "选择解释层" : "Select interpretive layer"}</p>
          <div className="mt-3 grid gap-2" role="tablist" aria-label={locale === "zh" ? "叙事运动解释层" : "Narrative motion interpretive layer"}>
            {cueDefinitions.map((item) => <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={mode === item.id}
              onClick={() => setMode(item.id)}
              className={`focus-ring border px-4 py-3 text-left transition-colors ${mode === item.id ? "border-amber-200 bg-white/10" : "border-white/15 text-fog hover:bg-white/5"}`}
            >
              <span className="block font-display text-lg text-white">{item.label[locale]}</span>
              <span className="mt-1 block text-xs leading-5">{item.description[locale]}</span>
            </button>)}
          </div>

          <div className="mt-6 border-l-2 border-amber-300 pl-4 text-xs leading-5 text-fog">
            <p className="font-mono text-[9px] font-bold uppercase tracking-[.1em] text-amber-200">{locale === "zh" ? "演示边界" : "Demonstration boundary"}</p>
            <p className="mt-2">{locale === "zh"
              ? "A-01 为虚构、静止、单一合并网格。场景没有物件零件运动，不提供逐帧、握持、角度或速度信息。"
              : "A-01 is a fictional, static, joined mesh. The scene has no object-part motion and exposes no frame sequence, grip, angle, or speed information."}</p>
          </div>
        </aside>
      </div>
    </section>

    <section className="grid gap-px border border-ink/20 bg-ink/20 sm:grid-cols-2 xl:grid-cols-5">
      {periodGates.map((period) => <div key={period.en} className="bg-paper p-4">
        <p className="font-mono text-[9px] font-bold uppercase tracking-[.09em] text-quiet">{period[locale]}</p>
        <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-red-700"><ShieldCheck size={13} aria-hidden="true" />{locale === "zh" ? "时期运动代理已锁定" : "Period motion proxy locked"}</p>
        <p className="mt-2 text-xs leading-5 text-quiet">{locale === "zh" ? "缺少已接受、可定位的媒体观察。" : "No accepted, locatable media observation."}</p>
      </div>)}
    </section>

    <section className="grid gap-6 border-y border-ink/20 py-6 lg:grid-cols-2">
      <div className="flex gap-3">
        <Film className="mt-1 shrink-0 text-ochre" size={20} aria-hidden="true" />
        <div>
          <h3 className="font-display text-xl">{locale === "zh" ? "机构媒体线索" : "Institutional media lead"}</h3>
          <p className="mt-2 text-sm leading-6 text-quiet">{locale === "zh"
            ? "菲律宾大学图书馆的《Balisong》短片论文记录被加入待审核媒体来源。它目前只有目录信息，没有被用来生成时期动作。"
            : "The University of the Philippines Library record for the short-film thesis Balisong is queued as a media source. It is catalogue metadata only and has not generated period movement."}</p>
          <a className="focus-ring mt-3 inline-flex font-mono text-[9px] font-bold uppercase tracking-[.1em] underline underline-offset-4" href="https://tuklas.up.edu.ph/Record/UP-99796217613424750" target="_blank" rel="noreferrer">{locale === "zh" ? "查看机构目录" : "View institutional catalogue"}</a>
        </div>
      </div>
      <div className="flex gap-3">
        <BookOpenText className="mt-1 shrink-0 text-ochre" size={20} aria-hidden="true" />
        <div>
          <h3 className="font-display text-xl">{locale === "zh" ? "小说如何进入研究" : "How fiction enters the study"}</h3>
          <p className="mt-2 text-sm leading-6 text-quiet">{locale === "zh"
            ? "小说可以支持“媒体呈现”或“文化想象”主张。叙述中的动作只形成待审核的解释提示，不证明历史形态，也不转换为可复现的物件运动。"
            : "Fiction may support claims about media representation or cultural imagination. Described action becomes a proposed interpretive cue only; it proves neither historical form nor reproducible object motion."}</p>
        </div>
      </div>
    </section>
  </div>;
}
