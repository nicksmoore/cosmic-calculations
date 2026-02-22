interface CosmicLoaderProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function CosmicLoader({ size = "md", className = "" }: CosmicLoaderProps) {
  const sizeClass = { sm: "text-xl", md: "text-3xl", lg: "text-5xl" }[size];
  const duration = { sm: "2.5s", md: "3s", lg: "3.5s" }[size];

  return (
    <span
      className={`inline-block text-nebula-glow ${sizeClass} ${className}`}
      style={{
        animation: `spin ${duration} linear infinite`,
        display: "inline-block",
        filter: "drop-shadow(0 0 6px hsl(275 70% 75% / 0.6))",
      }}
      aria-hidden="true"
    >
      ✦
    </span>
  );
}

export function CosmicLoaderPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center bg-background"
      role="status"
      aria-label="Loading"
    >
      <CosmicLoader size="lg" />
    </div>
  );
}
