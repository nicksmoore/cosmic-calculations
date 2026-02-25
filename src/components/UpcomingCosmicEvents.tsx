import { useMemo } from "react";
import { motion } from "framer-motion";
import { CalendarDays, MoonStar, Sun, RotateCcw } from "lucide-react";

type CosmicEventType = "lunar-eclipse" | "solar-eclipse" | "mercury-retrograde";

interface CosmicEvent {
  type: CosmicEventType;
  title: string;
  dateLabel: string;
  startsAtIso: string;
  endsAtIso?: string;
}

const UPCOMING_EVENTS: CosmicEvent[] = [
  {
    type: "lunar-eclipse",
    title: "Total Lunar Eclipse",
    dateLabel: "March 3, 2026",
    startsAtIso: "2026-03-03T00:00:00Z",
  },
  {
    type: "solar-eclipse",
    title: "Total Solar Eclipse",
    dateLabel: "August 12, 2026",
    startsAtIso: "2026-08-12T00:00:00Z",
  },
  {
    type: "mercury-retrograde",
    title: "Mercury Retrograde",
    dateLabel: "Feb 26 - Mar 20, 2026",
    startsAtIso: "2026-02-26T00:00:00Z",
    endsAtIso: "2026-03-20T00:00:00Z",
  },
];

const ICON_BY_TYPE: Record<CosmicEventType, typeof Sun> = {
  "lunar-eclipse": MoonStar,
  "solar-eclipse": Sun,
  "mercury-retrograde": RotateCcw,
};

function formatRelative(startIso: string) {
  const now = new Date();
  const start = new Date(startIso);
  const ms = start.getTime() - now.getTime();
  const days = Math.ceil(ms / 86_400_000);
  if (days <= 0) return "Now";
  if (days === 1) return "Tomorrow";
  return `In ${days} days`;
}

export default function UpcomingCosmicEvents() {
  const nextEvents = useMemo(() => {
    const now = Date.now();
    return [...UPCOMING_EVENTS]
      .filter((event) => {
        const endTs = event.endsAtIso ? new Date(event.endsAtIso).getTime() : Number.NEGATIVE_INFINITY;
        return endTs >= now || new Date(event.startsAtIso).getTime() >= now;
      })
      .sort((a, b) => new Date(a.startsAtIso).getTime() - new Date(b.startsAtIso).getTime())
      .slice(0, 3);
  }, []);

  if (nextEvents.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel rounded-xl p-4 sm:p-5 mb-6"
      aria-label="Next major cosmic events"
    >
      <div className="flex items-center gap-2 mb-3">
        <CalendarDays className="h-4 w-4 text-primary" />
        <h2 className="font-serif text-base text-foreground">Next Cosmic Events</h2>
      </div>

      <div className="space-y-2">
        {nextEvents.map((event) => {
          const Icon = ICON_BY_TYPE[event.type];
          return (
            <div
              key={event.type}
              className="flex items-center justify-between rounded-lg border border-border/40 bg-card/40 px-3 py-2.5"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon className="h-4 w-4 text-primary shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{event.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{event.dateLabel}</p>
                </div>
              </div>
              <span className="text-[11px] rounded-full px-2 py-1 border border-primary/30 text-primary bg-primary/10">
                {formatRelative(event.startsAtIso)}
              </span>
            </div>
          );
        })}
      </div>
    </motion.section>
  );
}
