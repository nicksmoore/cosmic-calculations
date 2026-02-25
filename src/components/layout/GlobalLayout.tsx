import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import ReactLenis from "lenis/react";
import PageTransition from "./PageTransition";
import CosmicBackground from "@/components/canvas/CosmicBackground";

interface GlobalLayoutProps {
  children: ReactNode;
}

export default function GlobalLayout({ children }: GlobalLayoutProps) {
  const location = useLocation();

  return (
    <ReactLenis root options={{ lerp: 0.1, duration: 1.2, smoothWheel: true }}>
      {/* z-0: persistent R3F canvas */}
      <CosmicBackground />

      {/* z-20: motion layer + content (higher than any modals/overlays) */}
      <div className="relative z-20 w-full">
        <AnimatePresence mode="wait">
          <PageTransition key={location.pathname}>
            {children}
          </PageTransition>
        </AnimatePresence>
      </div>
    </ReactLenis>
  );
}
