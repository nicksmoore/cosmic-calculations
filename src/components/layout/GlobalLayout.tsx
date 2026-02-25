import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import ReactLenis from "lenis/react";
import PageTransition from "./PageTransition";

interface GlobalLayoutProps {
  children: ReactNode;
}

export default function GlobalLayout({ children }: GlobalLayoutProps) {
  const location = useLocation();

  return (
    <ReactLenis root options={{ lerp: 0.1, duration: 1.2, smoothWheel: true }}>
      {/* Canvas layer lives here in Phase 3 */}
      <div
        className="relative z-10"
        style={{ pointerEvents: "none" }}
      >
        <AnimatePresence mode="wait">
          <PageTransition key={location.pathname}>
            {children}
          </PageTransition>
        </AnimatePresence>
      </div>
    </ReactLenis>
  );
}
