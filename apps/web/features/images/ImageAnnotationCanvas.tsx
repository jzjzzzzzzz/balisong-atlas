"use client";
import { Layer, Rect, Stage, Text } from "react-konva";

export default function ImageAnnotationCanvas() {
  return <div className="overflow-auto rounded-2xl border border-ink/10 bg-night p-4"><Stage width={720} height={420}><Layer><Rect x={0} y={0} width={720} height={420} fill="#1f3033"/><Rect x={70} y={145} width={580} height={130} fill="#a96532" opacity={0.75}/><Rect x={58} y={126} width={604} height={168} stroke="#f4f0e7" strokeWidth={2} dash={[8,5]}/><Text x={65} y={95} text="Observed · muted surface band" fill="#f4f0e7" fontSize={15}/></Layer></Stage></div>;
}
