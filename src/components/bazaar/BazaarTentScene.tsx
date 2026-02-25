import { useEffect, useMemo, useRef, useState } from "react";
import * as pc from "playcanvas";

interface BazaarTentSceneProps {
  categories: readonly { name: string; desc: string }[];
  activeCategory: string | null;
  onSelectCategory: (category: string) => void;
}

const TENT_LAYOUT = [
  { x: -6.4, z: 2.4 },
  { x: -3.7, z: -0.5 },
  { x: -1.0, z: 2.2 },
  { x: 1.8, z: -0.2 },
  { x: 4.8, z: 2.2 },
  { x: -0.1, z: -3.0 },
  { x: 3.8, z: -3.3 },
] as const;

type TentEntry = {
  category: string;
  root: pc.Entity;
  roofMat: pc.StandardMaterial;
  auraMat: pc.StandardMaterial;
};

export default function BazaarTentScene({
  categories,
  activeCategory,
  onSelectCategory,
}: BazaarTentSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tentsRef = useRef<TentEntry[]>([]);
  const cameraRef = useRef<pc.Entity | null>(null);
  const [engineLabel, setEngineLabel] = useState("PlayCanvas (WASM-ready)");
  const [signPositions, setSignPositions] = useState<Record<string, { left: number; top: number }>>({});

  const categoriesToRender = useMemo(
    () => categories.slice(0, Math.min(categories.length, TENT_LAYOUT.length)),
    [categories]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const app = new pc.Application(canvas, {
      mouse: new pc.Mouse(canvas),
      graphicsDeviceOptions: {
        antialias: true,
        alpha: false,
        preferWebGl2: true,
      },
    });
    app.start();
    app.setCanvasFillMode(pc.FILLMODE_NONE);
    app.setCanvasResolution(pc.RESOLUTION_AUTO);
    app.scene.ambientLight = new pc.Color(0.08, 0.08, 0.16);
    setEngineLabel("PlayCanvas WebGL (WASM-ready)");

    const camera = new pc.Entity("camera");
    camera.addComponent("camera", {
      clearColor: new pc.Color(0.02, 0.03, 0.08),
      farClip: 120,
    });
    camera.setLocalPosition(0, 9.3, 14.5);
    camera.lookAt(0, 0.8, 0);
    app.root.addChild(camera);
    cameraRef.current = camera;

    const dirLight = new pc.Entity("dir-light");
    dirLight.addComponent("light", {
      type: "directional",
      color: new pc.Color(1.0, 0.84, 0.62),
      intensity: 1.35,
      castShadows: false,
    });
    dirLight.setEulerAngles(52, 24, 0);
    app.root.addChild(dirLight);

    const fillLight = new pc.Entity("fill-light");
    fillLight.addComponent("light", {
      type: "omni",
      color: new pc.Color(0.5, 0.58, 1),
      range: 30,
      intensity: 1.7,
    });
    fillLight.setLocalPosition(-7, 4, -5);
    app.root.addChild(fillLight);

    const ground = new pc.Entity("ground");
    ground.addComponent("render", { type: "cylinder" });
    ground.setLocalScale(24, 0.2, 24);
    ground.setLocalPosition(0, -0.25, 0);
    const groundMat = new pc.StandardMaterial();
    groundMat.diffuse = new pc.Color(0.13, 0.1, 0.18);
    groundMat.emissive = new pc.Color(0.04, 0.03, 0.07);
    groundMat.update();
    ground.render?.meshInstances.forEach((mi) => {
      mi.material = groundMat;
    });
    app.root.addChild(ground);

    const rug = new pc.Entity("rug");
    rug.addComponent("render", { type: "box" });
    rug.setLocalScale(15, 0.05, 7.4);
    rug.setLocalPosition(0, -0.08, -0.2);
    const rugMat = new pc.StandardMaterial();
    rugMat.diffuse = new pc.Color(0.2, 0.12, 0.15);
    rugMat.emissive = new pc.Color(0.04, 0.01, 0.02);
    rugMat.update();
    rug.render?.meshInstances.forEach((mi) => {
      mi.material = rugMat;
    });
    app.root.addChild(rug);

    const sky = new pc.Entity("sky");
    sky.addComponent("render", { type: "sphere" });
    sky.setLocalScale(85, 85, 85);
    const skyMat = new pc.StandardMaterial();
    skyMat.cull = pc.CULLFACE_FRONT;
    skyMat.useLighting = false;
    skyMat.emissive = new pc.Color(0.05, 0.07, 0.16);
    skyMat.update();
    sky.render?.meshInstances.forEach((mi) => {
      mi.material = skyMat;
    });
    app.root.addChild(sky);

    for (let i = 0; i < 260; i += 1) {
      const star = new pc.Entity(`star-${i}`);
      star.addComponent("render", { type: "sphere" });
      const r = 22 + Math.random() * 18;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI * 0.5;
      const x = Math.cos(theta) * Math.cos(phi) * r;
      const y = Math.sin(phi) * r + 5;
      const z = Math.sin(theta) * Math.cos(phi) * r;
      star.setLocalPosition(x, y, z);
      star.setLocalScale(0.07, 0.07, 0.07);
      const starMat = new pc.StandardMaterial();
      starMat.useLighting = false;
      starMat.emissive = new pc.Color(0.95, 0.92, 1);
      starMat.update();
      star.render?.meshInstances.forEach((mi) => {
        mi.material = starMat;
      });
      app.root.addChild(star);
    }

    const lanternMat = new pc.StandardMaterial();
    lanternMat.useLighting = false;
    lanternMat.emissive = new pc.Color(1, 0.78, 0.3);
    lanternMat.update();
    for (let i = 0; i < 12; i += 1) {
      const angle = (Math.PI * 2 * i) / 12;
      const radius = 8.7;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius * 0.72;

      const post = new pc.Entity(`post-${i}`);
      post.addComponent("render", { type: "box" });
      post.setLocalScale(0.08, 1.8, 0.08);
      post.setLocalPosition(x, 0.78, z);
      const postMat = new pc.StandardMaterial();
      postMat.diffuse = new pc.Color(0.28, 0.2, 0.18);
      postMat.update();
      post.render?.meshInstances.forEach((mi) => {
        mi.material = postMat;
      });
      app.root.addChild(post);

      const lantern = new pc.Entity(`lantern-${i}`);
      lantern.addComponent("render", { type: "sphere" });
      lantern.setLocalScale(0.2, 0.2, 0.2);
      lantern.setLocalPosition(x, 1.8, z);
      lantern.render?.meshInstances.forEach((mi) => {
        mi.material = lanternMat;
      });
      app.root.addChild(lantern);
    }

    const tents: TentEntry[] = [];
    categoriesToRender.forEach((cat, idx) => {
      const spot = TENT_LAYOUT[idx];
      const root = new pc.Entity(`tent-${idx}`);
      root.setLocalPosition(spot.x, 0, spot.z);
      app.root.addChild(root);

      const body = new pc.Entity(`tent-body-${idx}`);
      body.addComponent("render", { type: "cylinder" });
      body.setLocalScale(2.2, 1.1, 2.2);
      body.setLocalPosition(0, 0.6, 0);
      root.addChild(body);

      const roof = new pc.Entity(`tent-roof-${idx}`);
      roof.addComponent("render", { type: "cone" });
      roof.setLocalScale(2.6, 1.4, 2.6);
      roof.setLocalPosition(0, 1.74, 0);
      roof.setLocalEulerAngles(0, idx * 28, 0);
      root.addChild(roof);

      const door = new pc.Entity(`tent-door-${idx}`);
      door.addComponent("render", { type: "box" });
      door.setLocalScale(0.46, 0.72, 0.12);
      door.setLocalPosition(0, 0.44, 1.04);
      root.addChild(door);

      const aura = new pc.Entity(`tent-aura-${idx}`);
      aura.addComponent("render", { type: "cylinder" });
      aura.setLocalScale(3.1, 0.02, 3.1);
      aura.setLocalPosition(0, 0.02, 0);
      root.addChild(aura);

      const bodyMat = new pc.StandardMaterial();
      bodyMat.diffuse = idx % 2 === 0 ? new pc.Color(0.3, 0.56, 0.36) : new pc.Color(0.41, 0.2, 0.42);
      bodyMat.emissive = new pc.Color(0.06, 0.04, 0.12);
      bodyMat.shininess = 20;
      bodyMat.update();
      body.render?.meshInstances.forEach((mi) => {
        mi.material = bodyMat;
      });

      const roofMat = new pc.StandardMaterial();
      roofMat.diffuse = idx % 2 === 0 ? new pc.Color(0.94, 0.6, 0.26) : new pc.Color(0.92, 0.56, 0.46);
      roofMat.emissive = new pc.Color(0.27, 0.16, 0.1);
      roofMat.shininess = 42;
      roofMat.update();
      roof.render?.meshInstances.forEach((mi) => {
        mi.material = roofMat;
      });

      const doorMat = new pc.StandardMaterial();
      doorMat.diffuse = new pc.Color(0.09, 0.07, 0.13);
      doorMat.update();
      door.render?.meshInstances.forEach((mi) => {
        mi.material = doorMat;
      });

      const auraMat = new pc.StandardMaterial();
      auraMat.blendType = pc.BLEND_ADDITIVEALPHA;
      auraMat.opacity = 0.28;
      auraMat.diffuse = new pc.Color(0.97, 0.86, 0.56);
      auraMat.emissive = new pc.Color(0.51, 0.35, 0.08);
      auraMat.update();
      aura.render?.meshInstances.forEach((mi) => {
        mi.material = auraMat;
      });

      tents.push({ category: cat.name, root, roofMat, auraMat });
    });
    tentsRef.current = tents;

    const updateSignPositions = () => {
      if (!canvas || !cameraRef.current?.camera) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / Math.max(rect.width, 1);
      const scaleY = canvas.height / Math.max(rect.height, 1);
      const next: Record<string, { left: number; top: number }> = {};
      tents.forEach((tent) => {
        const world = tent.root.getPosition().clone().add(new pc.Vec3(0, 2.5, 0));
        const sp = cameraRef.current!.camera.worldToScreen(world);
        next[tent.category] = {
          left: sp.x / scaleX,
          top: rect.height - sp.y / scaleY,
        };
      });
      setSignPositions(next);
    };

    const onResize = () => {
      app.resizeCanvas(canvas.clientWidth, canvas.clientHeight);
      updateSignPositions();
    };
    window.addEventListener("resize", onResize);
    onResize();
    updateSignPositions();

    const onCanvasClick = (ev: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = (ev.clientX - rect.left) * (canvas.width / rect.width);
      const y = (ev.clientY - rect.top) * (canvas.height / rect.height);
      const targetY = canvas.height - y;

      let best: string | null = null;
      let minDist = 60;
      tents.forEach((tent) => {
        const sp = camera.camera.worldToScreen(tent.root.getPosition());
        const dx = sp.x - x;
        const dy = sp.y - targetY;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < minDist) {
          minDist = d;
          best = tent.category;
        }
      });
      if (best) onSelectCategory(best);
    };
    canvas.addEventListener("click", onCanvasClick);

    return () => {
      window.removeEventListener("resize", onResize);
      canvas.removeEventListener("click", onCanvasClick);
      tentsRef.current = [];
      cameraRef.current = null;
      app.destroy();
    };
  }, [categoriesToRender, onSelectCategory]);

  useEffect(() => {
    tentsRef.current.forEach((tent) => {
      const active = tent.category === activeCategory;
      const s = active ? 1.08 : 1;
      tent.root.setLocalScale(s, s, s);
      tent.roofMat.emissive = active ? new pc.Color(0.5, 0.29, 0.16) : new pc.Color(0.27, 0.16, 0.1);
      tent.roofMat.update();
      tent.auraMat.opacity = active ? 0.55 : 0.28;
      tent.auraMat.update();
    });
  }, [activeCategory]);

  return (
    <div className="space-y-3">
      <div className="relative rounded-xl overflow-hidden border border-amber-400/35 bg-black/35 h-[370px]">
        <canvas ref={canvasRef} className="h-full w-full block" />
        <div className="absolute inset-0 pointer-events-none">
          {categoriesToRender.map((cat) => {
            const pos = signPositions[cat.name];
            if (!pos) return null;
            const active = activeCategory === cat.name;
            return (
              <div
                key={`sign-${cat.name}`}
                className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-md border px-2 py-1 text-[10px] md:text-[11px] shadow-md ${
                  active
                    ? "border-amber-300/90 bg-amber-200/90 text-black"
                    : "border-white/40 bg-black/70 text-white"
                }`}
                style={{ left: `${pos.left}px`, top: `${pos.top}px` }}
              >
                {cat.name}
              </div>
            );
          })}
        </div>
        <div className="absolute left-3 top-3 rounded-full border border-white/25 bg-black/45 px-3 py-1 text-[11px] text-amber-200/90 backdrop-blur-sm">
          {engineLabel}
        </div>
        <div className="absolute right-3 bottom-3 rounded-md border border-white/20 bg-black/45 px-3 py-1 text-[11px] text-white/80 backdrop-blur-sm">
          Click a tent to enter
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {categoriesToRender.map((cat) => {
          const active = activeCategory === cat.name;
          return (
            <button
              key={cat.name}
              type="button"
              onClick={() => onSelectCategory(cat.name)}
              className={`rounded-lg border p-3 text-left transition ${
                active
                  ? "border-amber-300/80 bg-amber-300/15"
                  : "border-border/40 bg-card/40 hover:border-amber-400/50 hover:bg-card/70"
              }`}
            >
              <p className="text-sm font-medium">{cat.name}</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{cat.desc}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
