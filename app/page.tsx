"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import Toolbar from "@/components/Toolbar";

// Load Konva canvas only on the client (no SSR)
const CanvasStage = dynamic(() => import("@/components/CanvasStage"), { ssr: false });

const BG_KEY = "stickyDigitizer_bg";

export default function Page() {
  const [bgSrc, setBgSrc] = useState<string | null>(null);
  const [resetCounter, setResetCounter] = useState(0);

  // Load background from localStorage on first mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(BG_KEY);
      if (saved) setBgSrc(saved);
    } catch {
      // ignore
    }
  }, []);

  // Save background when it changes
  useEffect(() => {
    try {
      if (bgSrc) localStorage.setItem(BG_KEY, bgSrc);
      else localStorage.removeItem(BG_KEY);
    } catch {
      // ignore
    }
  }, [bgSrc]);

  return (
    <main className="h-screen w-screen flex flex-col">
      <Toolbar
        onBackgroundChosen={(src) => setBgSrc(src)}
        onReset={() => {
          setBgSrc(null);
          setResetCounter((n) => n + 1);
        }}
      />
      <div className="flex-1 min-h-0">
        <CanvasStage backgroundSrc={bgSrc} resetCounter={resetCounter} />
      </div>
    </main>
  );
}
