"use client";

import { SvgLayerBreakdown } from "@/components/editor/SvgLayerBreakdown";
import { AppTopNav } from "@/components/layout/AppTopNav";
import { Toaster } from "@/components/ui/toaster";

export default function ManualPage() {
  return (
    <>
      <AppTopNav activeRoute="manual" />
      <SvgLayerBreakdown />
      <Toaster />
    </>
  );
}
