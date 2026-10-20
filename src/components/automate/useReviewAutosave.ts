"use client";

import { useEffect } from "react";
import { useBatchAutomationStore } from "@/store/batchAutomationStore";
import { saveAutosaveProject } from "@/lib/project/projectAutosave";
import type { ReviewProjectFile } from "@/lib/project/reviewProject";

const AUTOSAVE_DEBOUNCE_MS = 1000;

/**
 * Single client-side wiring for review-project autosave:
 * - checks for an existing draft once on mount (resume banner),
 * - subscribes to relevant store slices and writes a debounced draft,
 * - flushes the pending draft on page hide/beforeunload (best effort).
 */
export function useReviewAutosave() {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    let inFlight = false;
    let pendingAfterFlight = false;

    const doSave = async () => {
      const s = useBatchAutomationStore.getState();
      if (!s.isReviewMode || s.isRunning || s.isPreparingReview || s.isExportingReview || s.isRestoringProject) return;
      if (inFlight) {
        pendingAfterFlight = true;
        return;
      }
      inFlight = true;
      let saved: ReviewProjectFile | null = null;
      try {
        s.setAutosaveStatus("saving");
        const file = s.buildReviewProjectFile();
        if (!file) {
          s.setAutosaveStatus("idle");
          return;
        }
        await saveAutosaveProject(file);
        saved = file;
      } catch (err: unknown) {
        const current = useBatchAutomationStore.getState();
        if (current.isReviewMode) {
          const msg = err instanceof Error ? err.message : String(err);
          current.setAutosaveStatus("error", msg);
          current.addLog({ level: "warning", message: `Autosave failed: ${msg}. Use "Save project" as a manual backup.` });
        }
        return;
      } finally {
        inFlight = false;
      }
      const current = useBatchAutomationStore.getState();
      if (current.isReviewMode && saved) current.recordAutosaveSaved(saved);
      if (pendingAfterFlight) {
        pendingAfterFlight = false;
        schedule();
      }
    };

    const schedule = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        timer = null;
        void doSave();
      }, AUTOSAVE_DEBOUNCE_MS);
    };

    const isRelevantChange = (s: ReturnType<typeof useBatchAutomationStore.getState>, prev: ReturnType<typeof useBatchAutomationStore.getState>) =>
      s.reviewItems !== prev.reviewItems ||
      s.activeReviewId !== prev.activeReviewId ||
      s.reviewExportScope !== prev.reviewExportScope ||
      s.options !== prev.options ||
      s.reviewSelectedLayerId !== prev.reviewSelectedLayerId ||
      s.reviewSelectedLayerIds !== prev.reviewSelectedLayerIds ||
      s.reviewColorProperty !== prev.reviewColorProperty ||
      s.reviewEditColor !== prev.reviewEditColor ||
      s.reviewFilter !== prev.reviewFilter ||
      s.reviewSearchQuery !== prev.reviewSearchQuery;

    const unsubscribe = useBatchAutomationStore.subscribe((s, prev) => {
      if (!s.isReviewMode || !isRelevantChange(s, prev)) return;
      schedule();
    });

    const flush = () => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      const s = useBatchAutomationStore.getState();
      // Only flush when the review session has a draft-worthy change pending.
      if (s.isReviewMode && !s.isRunning) {
        void doSave();
      }
    };
    window.addEventListener("pagehide", flush);
    window.addEventListener("beforeunload", flush);

    // Show the resume banner if a draft survives from a previous session.
    void useBatchAutomationStore.getState().checkAutosaveDraft();

    return () => {
      unsubscribe();
      if (timer) clearTimeout(timer);
      window.removeEventListener("pagehide", flush);
      window.removeEventListener("beforeunload", flush);
    };
  }, []);
}
