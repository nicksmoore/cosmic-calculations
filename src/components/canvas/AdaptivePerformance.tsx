import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { detectPerformanceTier, PerformanceTier } from "@/lib/performance";

const Ctx = createContext<PerformanceTier>(1);

export function AdaptivePerformanceProvider({ children }: { children: ReactNode }) {
  const [tier, setTier] = useState<PerformanceTier>(1);

  useEffect(() => {
    detectPerformanceTier().then(setTier);
  }, []);

  return <Ctx.Provider value={tier}>{children}</Ctx.Provider>;
}

export function usePerformanceTier(): PerformanceTier {
  return useContext(Ctx);
}
