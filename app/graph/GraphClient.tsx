"use client";

import dynamic from "next/dynamic";

// The force graph touches `window`, so it only renders in the browser.
export const GraphClient = dynamic(() => import("./GraphView").then((m) => m.GraphView), {
  ssr: false,
  loading: () => <div className="flex h-full items-center justify-center text-sm text-muted">Loading graph…</div>,
});
