"use client";

import { useEffect } from "react";
import { SelfRating } from "@/lib/types";

/**
 * Wires 1/2/3 keys to the flashcard memory buttons
 * (1 = Bilmayman, 2 = Qisman esladim, 3 = Esladim).
 */
export function useMemoryShortcuts(onRate: (rating: SelfRating) => void, enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    const handler = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const target = e.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA"].includes(target.tagName)) return;
      if (e.key === "1") onRate("unknown");
      else if (e.key === "2") onRate("partial");
      else if (e.key === "3") onRate("known");
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onRate, enabled]);
}
