interface RevealOptions {
  delay?: number;
  y?: number;
  duration?: number;
}

/** Pure function: returns Framer Motion props for scroll-reveal. Exported for testing. */
export function getRevealProps(opts: RevealOptions = {}) {
  const { delay = 0, y = 20, duration = 0.5 } = opts;
  return {
    initial: { opacity: 0, y },
    whileInView: { opacity: 1, y: 0 },
    transition: { duration, delay, ease: [0.25, 0.1, 0.25, 1] as const },
    viewport: { once: true, margin: "-60px" },
  } as const;
}

/** Hook alias for components that want to destructure directly */
export function useScrollReveal(opts?: RevealOptions) {
  return getRevealProps(opts);
}
