"use client";

import { Canvas } from "@react-three/fiber";
import { Environment, Html, OrbitControls, useGLTF } from "@react-three/drei";
import { Box, Info, Palette } from "lucide-react";
import { Suspense, useState } from "react";

function Model() {
  const { scene } = useGLTF("/demo-abstract-proxy.glb");
  return <group rotation={[0.4, 0, -0.12]}><primitive object={scene.clone()} /><Html position={[0.18, .14, .08]} center distanceFactor={5}><span className="whitespace-nowrap rounded-full border border-white/30 bg-night/85 px-3 py-1 text-[10px] font-semibold text-white shadow-lg">Inferred · neutral central field</span></Html></group>;
}

export function SafeProxyViewer() {
  const [dark, setDark] = useState(true);
  const [annotations, setAnnotations] = useState(true);
  return <section className={`overflow-hidden rounded-[1.7rem] border border-ink/15 shadow-museum ${dark ? "bg-night" : "bg-parchment"}`} data-testid="safe-proxy-viewer">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4 text-white">
      <div><div className="eyebrow !text-fog/70">Nonfunctional museum visualization</div><h3 className="mt-1 font-display text-xl">A-01 visual proxy · version 1</h3></div>
      <div className="flex gap-2">
        <button className="focus-ring inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-2 text-xs hover:bg-white/10" onClick={() => setDark((value) => !value)}><Palette size={14}/> Background</button>
        <button className="focus-ring inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-2 text-xs hover:bg-white/10" onClick={() => setAnnotations((value) => !value)}><Info size={14}/> Evidence</button>
      </div>
    </div>
    <div className="relative h-[420px] sm:h-[540px]">
      <Canvas camera={{ position: [0, -1.7, .8], fov: 35 }} dpr={[1, 1.7]}>
        <color attach="background" args={[dark ? "#10191b" : "#e9e0cf"]}/>
        <ambientLight intensity={1.5}/><directionalLight position={[2, -2, 4]} intensity={3}/>
        <Suspense fallback={<Html center><span className="text-xs text-fog">Loading visual proxy…</span></Html>}><Model/><Environment preset="studio"/></Suspense>
        <OrbitControls enablePan={false} enableDamping minDistance={1.15} maxDistance={2.35} minPolarAngle={0.55} maxPolarAngle={2.45}/>
      </Canvas>
      <div className="pointer-events-none absolute bottom-4 left-4 flex items-center gap-2 rounded-full bg-paper/90 px-3 py-2 text-[10px] font-semibold uppercase tracking-[.1em] text-ink"><Box size={13}/> Unitless · one joined mesh · no moving parts</div>
    </div>
    {annotations && <div className="grid gap-px bg-white/10 text-white md:grid-cols-3">
      <div className="bg-night p-4"><span className="text-[10px] uppercase tracking-[.14em] text-fog">Observed</span><p className="mt-1 text-sm">Rounded continuous contour</p></div>
      <div className="bg-night p-4"><span className="text-[10px] uppercase tracking-[.14em] text-amber-300">Inferred</span><p className="mt-1 text-sm">Neutral central field</p></div>
      <div className="bg-night p-4"><span className="text-[10px] uppercase tracking-[.14em] text-fog">Version</span><p className="mt-1 text-sm">Fixture generator v1 · reviewed</p></div>
    </div>}
  </section>;
}
