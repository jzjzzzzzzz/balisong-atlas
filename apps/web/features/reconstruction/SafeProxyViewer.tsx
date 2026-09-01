"use client";

import { Canvas } from "@react-three/fiber";
import { Environment, Html, OrbitControls, useGLTF } from "@react-three/drei";
import { Box, Info, Palette } from "lucide-react";
import { Suspense, useState } from "react";
import { useLanguage, type Locale } from "@/components/Providers";

function Model({ locale }: { locale: Locale }) {
  const { scene } = useGLTF("/demo-abstract-proxy.glb");
  return <group rotation={[0.4, 0, -0.12]}><primitive object={scene.clone()} /><Html position={[0.18, .14, .08]} center distanceFactor={5}><span className="whitespace-nowrap border border-white/30 bg-night/90 px-3 py-1 font-mono text-[9px] uppercase tracking-[.08em] text-white">{locale === "zh" ? "推断 · 中性中央区域" : "Inferred · neutral central field"}</span></Html></group>;
}

export function SafeProxyViewer() {
  const { locale } = useLanguage();
  const [dark, setDark] = useState(true);
  const [annotations, setAnnotations] = useState(true);
  return <section className={`overflow-hidden border border-white/25 ${dark ? "bg-night" : "bg-parchment"}`} data-testid="safe-proxy-viewer">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4 text-white">
      <div><div className="eyebrow !text-fog/70">{locale === "zh" ? "非功能性博物馆视觉展示" : "Nonfunctional museum visualization"}</div><h3 className="mt-1 font-display text-xl">{locale === "zh" ? "A-01 视觉代理 · 版本 1" : "A-01 visual proxy · version 1"}</h3></div>
      <div className="flex gap-2">
        <button className="focus-ring inline-flex items-center gap-2 border border-white/20 px-3 py-2 font-mono text-[9px] uppercase tracking-[.08em] hover:bg-white/10" onClick={() => setDark((value) => !value)}><Palette size={14}/>{locale === "zh" ? "背景" : "Background"}</button>
        <button className="focus-ring inline-flex items-center gap-2 border border-white/20 px-3 py-2 font-mono text-[9px] uppercase tracking-[.08em] hover:bg-white/10" onClick={() => setAnnotations((value) => !value)}><Info size={14}/>{locale === "zh" ? "证据" : "Evidence"}</button>
      </div>
    </div>
    <div className="relative h-[420px] sm:h-[540px]">
      <Canvas camera={{ position: [0, -1.7, .8], fov: 35 }} dpr={[1, 1.7]}>
        <color attach="background" args={[dark ? "#10191b" : "#e9e0cf"]}/>
        <ambientLight intensity={1.5}/><directionalLight position={[2, -2, 4]} intensity={3}/>
        <Suspense fallback={<Html center><span className="text-xs text-fog">{locale === "zh" ? "正在加载视觉代理…" : "Loading visual proxy…"}</span></Html>}><Model locale={locale}/><Environment preset="studio"/></Suspense>
        <OrbitControls enablePan={false} enableDamping minDistance={1.15} maxDistance={2.35} minPolarAngle={0.55} maxPolarAngle={2.45}/>
      </Canvas>
      <div className="pointer-events-none absolute bottom-4 left-4 flex items-center gap-2 border border-ink bg-paper/95 px-3 py-2 font-mono text-[9px] uppercase tracking-[.1em] text-ink"><Box size={13}/>{locale === "zh" ? "无单位 · 单一合并网格 · 无活动部件" : "Unitless · one joined mesh · no moving parts"}</div>
    </div>
    {annotations && <div className="grid gap-px bg-white/10 text-white md:grid-cols-3">
      <div className="bg-night p-4"><span className="text-[10px] uppercase tracking-[.14em] text-fog">{locale === "zh" ? "直接观察" : "Observed"}</span><p className="mt-1 text-sm">{locale === "zh" ? "连续圆润轮廓" : "Rounded continuous contour"}</p></div>
      <div className="bg-night p-4"><span className="text-[10px] uppercase tracking-[.14em] text-amber-300">{locale === "zh" ? "推断" : "Inferred"}</span><p className="mt-1 text-sm">{locale === "zh" ? "中性中央区域" : "Neutral central field"}</p></div>
      <div className="bg-night p-4"><span className="text-[10px] uppercase tracking-[.14em] text-fog">{locale === "zh" ? "版本" : "Version"}</span><p className="mt-1 text-sm">{locale === "zh" ? "测试生成器 v1 · 已审核" : "Fixture generator v1 · reviewed"}</p></div>
    </div>}
  </section>;
}
