"use client";
import dynamic from "next/dynamic";
const ImageAnnotationCanvas = dynamic(() => import("./ImageAnnotationCanvas"), { ssr: false });
export function ImageCanvasClient() { return <ImageAnnotationCanvas/>; }
