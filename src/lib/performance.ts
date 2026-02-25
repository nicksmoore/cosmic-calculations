export type PerformanceTier = 1 | 2 | 3;

/** Synchronous tier check (no battery API). Used in tests and as fallback. */
export function detectPerformanceTierSync(): PerformanceTier {
  if (typeof window === "undefined") return 3;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return 3;

  const canvas = document.createElement("canvas");
  const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
  if (!gl) return 3;

  const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
  if (debugInfo) {
    const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) as string;
    if (/intel hd|intel uhd|mali|adreno [34]/i.test(renderer)) return 2;
  }

  return 1;
}

/** Full async check including Battery API. */
export async function detectPerformanceTier(): Promise<PerformanceTier> {
  const sync = detectPerformanceTierSync();
  if (sync === 3) return 3;

  if ("getBattery" in navigator) {
    try {
      const battery = await (navigator as any).getBattery();
      if (!battery.charging && battery.level < 0.2) return 3;
    } catch {
      // getBattery not supported or blocked — ignore
    }
  }

  return sync;
}
