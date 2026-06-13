"use client";

import { SvgLayerBreakdown } from "@/components/editor/SvgLayerBreakdown";
import { Toaster } from "@/components/ui/toaster";

export default function Home() {
  return (
    <>
      <SvgLayerBreakdown />
      <Toaster />
    </>
  );
}
