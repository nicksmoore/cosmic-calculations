import { useRef, useMemo, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Points, PointMaterial } from "@react-three/drei";
import * as THREE from "three";
import { usePerformanceTier } from "./AdaptivePerformance";

const STAR_COUNT_TIER1 = 800;
const STAR_COUNT_TIER2 = 300;

function StarField({ count }: { count: number }) {
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3]     = (Math.random() - 0.5) * 20;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 20;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    return arr;
  }, [count]);

  const ref = useRef<THREE.Points>(null);
  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.02;
      ref.current.rotation.x += delta * 0.005;
    }
  });

  return (
    <Points ref={ref} positions={positions} stride={3}>
      <PointMaterial
        transparent
        color="#a855f7"
        size={0.025}
        sizeAttenuation
        depthWrite={false}
        opacity={0.7}
      />
    </Points>
  );
}

function MouseGlow() {
  const lightRef = useRef<THREE.PointLight>(null);
  const { viewport } = useThree();

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (!lightRef.current) return;
    const x = (e.clientX / window.innerWidth)  * 2 - 1;
    const y = -(e.clientY / window.innerHeight) * 2 + 1;
    lightRef.current.position.set(
      x * viewport.width  / 2,
      y * viewport.height / 2,
      2
    );
  }, [viewport]);

  useMemo(() => {
    window.addEventListener("pointermove", handlePointerMove);
    return () => window.removeEventListener("pointermove", handlePointerMove);
  }, [handlePointerMove]);

  return (
    <pointLight
      ref={lightRef}
      color="#c084fc"
      intensity={2}
      distance={6}
      decay={2}
    />
  );
}

function Scene({ tier }: { tier: 1 | 2 }) {
  const count = tier === 1 ? STAR_COUNT_TIER1 : STAR_COUNT_TIER2;
  return (
    <>
      <ambientLight intensity={0.1} />
      <StarField count={count} />
      {tier === 1 && <MouseGlow />}
    </>
  );
}

export default function CosmicBackground() {
  const tier = usePerformanceTier();

  if (tier === 3) {
    return <div className="cosmic-bg-fallback" aria-hidden="true" />;
  }

  return (
    <div
      className="fixed inset-0 z-0"
      aria-hidden="true"
      style={{ pointerEvents: "none" }}
    >
      <Canvas
        camera={{ position: [0, 0, 5], fov: 60 }}
        gl={{ antialias: false, alpha: true }}
        dpr={[1, tier === 1 ? 2 : 1]}
        frameloop="always"
        style={{ background: "transparent" }}
      >
        <Scene tier={tier as 1 | 2} />
      </Canvas>
    </div>
  );
}
