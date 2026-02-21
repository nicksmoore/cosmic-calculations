// src/components/BottomNav.tsx
import { NavLink, useLocation } from "react-router-dom";

const tabs = [
  { label: "Sky",   icon: "✦", to: "/feed" },
  { label: "Match", icon: "⚝", to: "/match" },
] as const;

interface BottomNavProps {
  onOpenPost: () => void;
  onSignOut: () => void;
}

export default function BottomNav({ onOpenPost, onSignOut }: BottomNavProps) {
  const location = useLocation();

  return (
    <nav
      aria-label="Main navigation"
      className="fixed bottom-0 inset-x-0 z-40 pb-safe md:hidden"
    >
      <div className="mx-auto max-w-2xl px-4 pb-4">
        <div className="glass-panel border border-border/30 rounded-2xl flex items-center justify-around px-2 py-3 backdrop-blur-xl shadow-2xl">
          {tabs.map((tab) => {
            const isActive = location.pathname === tab.to;
            return (
              <NavLink
                key={tab.to}
                to={tab.to}
                aria-label={tab.label}
                className={`flex flex-col items-center gap-0.5 min-w-[44px] min-h-[44px] justify-center rounded-xl transition-all ${
                  isActive
                    ? "text-accent [text-shadow:0_0_12px_hsl(var(--accent)/0.8)]"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className="text-xl leading-none">{tab.icon}</span>
                <span className="text-[10px] hidden sm:block">{tab.label}</span>
              </NavLink>
            );
          })}

          {/* Post button — center */}
          <button
            onClick={onOpenPost}
            aria-label="Create post"
            className="flex flex-col items-center justify-center min-w-[44px] min-h-[44px] rounded-xl bg-accent text-accent-foreground hover:bg-accent/90 transition-colors px-3 py-2 shadow-lg"
          >
            <span className="text-xl leading-none">⊕</span>
            <span className="text-[10px] hidden sm:block">Post</span>
          </button>

          <button
            onClick={onSignOut}
            aria-label="Sign out"
            className="flex flex-col items-center justify-center min-w-[44px] min-h-[44px] rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors px-3 py-2"
          >
            <span className="text-lg leading-none">↩</span>
            <span className="text-[10px] hidden sm:block">Out</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
