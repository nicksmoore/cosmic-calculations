import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy } from "lucide-react";
import { Planet } from "@/data/natalChartData";
import { detectBadges, ChartBadge } from "@/lib/chartPatterns";
import GlossaryTerm from "@/components/GlossaryPopover";

interface ChartBadgesProps {
  planets: Planet[];
}

const ChartBadges = ({ planets }: ChartBadgesProps) => {
  const badges = useMemo(() => detectBadges(planets), [planets]);
  const [expanded, setExpanded] = useState(false);

  const unlocked = badges.filter((b) => b.unlocked);
  const locked = badges.filter((b) => !b.unlocked);

  return (
    <div className="glass-panel rounded-xl p-4 sm:p-6">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between mb-4"
      >
        <div className="flex items-center gap-3">
          <Trophy className="h-5 w-5 text-accent" />
          <h2 className="text-xl sm:text-2xl font-serif text-ethereal">
            Chart Treasure Hunt
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-accent font-medium">
            {unlocked.length}/{badges.length}
          </span>
          <motion.span
            animate={{ rotate: expanded ? 180 : 0 }}
            className="text-muted-foreground"
          >
            ▾
          </motion.span>
        </div>
      </button>

      {/* Always show unlocked badges */}
      <div className="flex flex-wrap gap-2 mb-2">
        {unlocked.map((badge) => (
          <BadgeChip key={badge.id} badge={badge} />
        ))}
        {unlocked.length === 0 && (
          <p className="text-sm text-muted-foreground italic">
            Explore your chart to discover hidden patterns!
          </p>
        )}
      </div>

      {/* Expandable locked badges */}
      <AnimatePresence>
        {expanded && locked.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="border-t border-border/30 pt-3 mt-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                Locked — not found in your chart
              </p>
              <div className="flex flex-wrap gap-2">
                {locked.map((badge) => (
                  <BadgeChip key={badge.id} badge={badge} locked />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

function BadgeChip({ badge, locked }: { badge: ChartBadge; locked?: boolean }) {
  const [showDetail, setShowDetail] = useState(false);

  // Map badge ids to glossary terms
  const glossaryMap: Record<string, string> = {
    stellium: "stellium",
    "grand-trine": "grand trine",
    "t-square": "t-square",
    "grand-cross": "grand cross",
    yod: "yod",
  };

  const inner = (
    <motion.button
      onClick={() => !locked && setShowDetail(!showDetail)}
      whileHover={locked ? undefined : { scale: 1.05 }}
      whileTap={locked ? undefined : { scale: 0.97 }}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium border transition-colors ${
        locked
          ? "bg-secondary/40 border-border/30 text-muted-foreground opacity-50 cursor-default"
          : "bg-accent/15 border-accent/30 text-foreground cursor-pointer hover:bg-accent/25"
      }`}
    >
      <span className="text-lg">{badge.emoji}</span>
      <span>{badge.name}</span>
    </motion.button>
  );

  return (
    <div className="relative">
      {glossaryMap[badge.id] && !locked ? (
        <GlossaryTerm term={glossaryMap[badge.id]}>
          <span className="inline-flex items-center gap-1.5">
            <span className="text-lg">{badge.emoji}</span>
            <span>{badge.name}</span>
          </span>
        </GlossaryTerm>
      ) : (
        inner
      )}
      <AnimatePresence>
        {showDetail && badge.detail && !locked && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute z-10 top-full mt-1 left-0 glass-panel border-border/50 rounded-lg p-3 min-w-[200px] max-w-[280px]"
          >
            <p className="text-xs text-muted-foreground">{badge.description}</p>
            <p className="text-sm text-foreground mt-1 font-medium">{badge.detail}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ChartBadges;
