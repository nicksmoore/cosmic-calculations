import { useEffect, useRef } from "react";

const StarField = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    interface Star {
      x: number;
      y: number;
      size: number;
      opacity: number;
      speed: number;
      color: string;
    }

    const stars: Star[] = [];
    const starCount = 250;

    // Color palette for stars
    const starColors = [
      "255, 255, 255",      // White
      "255, 240, 220",      // Warm white
      "220, 230, 255",      // Cool white
      "255, 215, 0",        // Gold (accent)
      "180, 140, 255",      // Purple (nebula)
    ];

    for (let i = 0; i < starCount; i++) {
      const colorIndex = Math.random() < 0.1 
        ? Math.floor(Math.random() * 2) + 3 // 10% chance of colored star
        : Math.floor(Math.random() * 3);      // 90% white variants

      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 0.3,
        opacity: Math.random() * 0.7 + 0.3,
        speed: Math.random() * 0.0008 + 0.0002,
        color: starColors[colorIndex],
      });
    }

    // Nebula clouds
    const nebulae = [
      { x: 0.2, y: 0.3, radius: 0.3, color: "128, 0, 128" },  // Purple
      { x: 0.8, y: 0.7, radius: 0.25, color: "75, 0, 130" },  // Indigo
      { x: 0.5, y: 0.5, radius: 0.4, color: "100, 50, 150" }, // Violet
    ];

    let animationId: number;
    const animate = () => {
      // Deep obsidian background
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, "hsl(235, 25%, 7%)");
      gradient.addColorStop(0.5, "hsl(240, 20%, 10%)");
      gradient.addColorStop(1, "hsl(235, 25%, 7%)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw nebula clouds
      nebulae.forEach((nebula) => {
        const x = nebula.x * canvas.width;
        const y = nebula.y * canvas.height;
        const radius = nebula.radius * Math.min(canvas.width, canvas.height);

        const nebulaGradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        nebulaGradient.addColorStop(0, `rgba(${nebula.color}, 0.08)`);
        nebulaGradient.addColorStop(0.5, `rgba(${nebula.color}, 0.03)`);
        nebulaGradient.addColorStop(1, `rgba(${nebula.color}, 0)`);

        ctx.fillStyle = nebulaGradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      });

      // Draw and animate stars
      stars.forEach((star) => {
        star.opacity += Math.sin(Date.now() * star.speed) * 0.015;
        star.opacity = Math.max(0.1, Math.min(1, star.opacity));

        // Draw star with glow
        const glow = ctx.createRadialGradient(
          star.x, star.y, 0,
          star.x, star.y, star.size * 3
        );
        glow.addColorStop(0, `rgba(${star.color}, ${star.opacity})`);
        glow.addColorStop(0.5, `rgba(${star.color}, ${star.opacity * 0.3})`);
        glow.addColorStop(1, `rgba(${star.color}, 0)`);

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size * 3, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();

        // Core of the star
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${star.color}, ${star.opacity})`;
        ctx.fill();
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10"
    />
  );
};

export default StarField;
