// src/pages/Match.tsx
import { motion } from "framer-motion";
import { Loader2, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import StarField from "@/components/StarField";
import { useMatchFeed, MatchProfile } from "@/hooks/useMatchFeed";

const SIGN_SYMBOLS: Record<string, string> = {
  Aries: "♈", Taurus: "♉", Gemini: "♊", Cancer: "♋",
  Leo: "♌", Virgo: "♍", Libra: "♎", Scorpio: "♏",
  Sagittarius: "♐", Capricorn: "♑", Aquarius: "♒", Pisces: "♓",
};

function scoreColor(score: number) {
  if (score >= 70) return "from-emerald-500 to-teal-400";
  if (score >= 45) return "from-amber-500 to-yellow-400";
  return "from-rose-500 to-pink-400";
}

function MatchCard({ match, onClick }: { match: MatchProfile; onClick: () => void }) {
  const { profile, score } = match;
  const bigThree = [
    profile.sun_sign    ? `☀${SIGN_SYMBOLS[profile.sun_sign]    ?? ""}` : null,
    profile.moon_sign   ? `☽${SIGN_SYMBOLS[profile.moon_sign]   ?? ""}` : null,
    profile.rising_sign ? `↑${SIGN_SYMBOLS[profile.rising_sign] ?? ""}` : null,
  ].filter(Boolean).join("  ");

  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className="w-full text-left glass-panel rounded-xl p-4 hover:bg-white/5 transition-colors"
    >
      <div className="flex items-center gap-3">
        <Avatar className="h-12 w-12 border border-border/30 flex-shrink-0">
          <AvatarImage src={profile.avatar_url ?? undefined} />
          <AvatarFallback className="bg-primary/20 text-primary text-sm font-serif">
            {(profile.display_name ?? "?").charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{profile.display_name ?? "Cosmic Traveler"}</p>
          {bigThree && <p className="text-muted-foreground text-xs">{bigThree}</p>}
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full bg-border/30 overflow-hidden">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${scoreColor(score)}`}
                style={{ width: `${score}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground tabular-nums flex-shrink-0">
              {score}% synastry
            </span>
          </div>
        </div>
      </div>
    </motion.button>
  );
}

export default function Match() {
  const navigate = useNavigate();
  const { data: matches, isLoading, isError } = useMatchFeed();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <StarField />
      <main className="container mx-auto px-4 pt-6 pb-28 max-w-2xl relative z-10">
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-serif text-ethereal mb-6"
        >
          Cosmic Match
        </motion.h1>

        {isLoading && (
          <div className="flex justify-center py-12" role="status" aria-label="Loading matches">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden="true" />
          </div>
        )}

        {isError && (
          <p className="text-center text-destructive py-8 text-sm">
            Could not load matches. Try refreshing.
          </p>
        )}

        {!isLoading && !isError && (!matches || matches.length === 0) && (
          <div className="text-center py-12 text-muted-foreground">
            <Sparkles className="h-8 w-8 mx-auto mb-3 opacity-40" aria-hidden="true" />
            <p>No public profiles to match with yet.</p>
            <p className="text-xs mt-1">Be the first to make your profile public!</p>
          </div>
        )}

        <div className="space-y-3">
          {(matches ?? []).map((match) => (
            <MatchCard
              key={match.profile.user_id}
              match={match}
              onClick={() => navigate(`/profile/${match.profile.user_id}`)}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
