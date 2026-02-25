import { useRef, useCallback } from "react";
import { useMotionValue, useSpring } from "framer-motion";

const RADIUS_MULTIPLIER = 1.5; // how far outside the button the magnet activates

interface Rect { left: number; top: number; width: number; height: number }

/** Pure function exposed for testing */
export function computeMagneticOffset(
  mouseX: number,
  mouseY: number,
  rect: Rect,
  strength: number,
): { x: number; y: number } {
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const radius = Math.max(rect.width, rect.height) * RADIUS_MULTIPLIER;
  const dx = mouseX - cx;
  const dy = mouseY - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist > radius) return { x: 0, y: 0 };
  return { x: dx * strength, y: dy * strength };
}

export function useMagneticButton(strength = 0.4) {
  const ref = useRef<HTMLElement>(null);
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const x = useSpring(rawX, { stiffness: 200, damping: 20 });
  const y = useSpring(rawY, { stiffness: 200, damping: 20 });

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const offset = computeMagneticOffset(e.clientX, e.clientY, rect, strength);
    rawX.set(offset.x);
    rawY.set(offset.y);
  }, [rawX, rawY, strength]);

  const onMouseLeave = useCallback(() => {
    rawX.set(0);
    rawY.set(0);
  }, [rawX, rawY]);

  return { ref, x, y, onMouseMove, onMouseLeave };
}
