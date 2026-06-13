"use client";

import { AutomatePanel } from "@/components/automate/AutomatePanel";
import { AppTopNav } from "@/components/layout/AppTopNav";

export default function AutomatePage() {
  return (
    <div className="flex flex-col h-screen">
      <AppTopNav activeRoute="automate" />
      <AutomatePanel />
    </div>
  );
}
