import { motion } from "framer-motion";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Globe, Lock } from "lucide-react";

const SIGN_SYMBOLS: Record<string, string> = {
  Aries: "♈", Taurus: "♉", Gemini: "♊", Cancer: "♋",
  Leo: "♌", Virgo: "♍", Libra: "♎", Scorpio: "♏",
  Sagittarius: "♐", Capricorn: "♑", Aquarius: "♒", Pisces: "♓",
};

const ELEMENT_COLORS: Record<string, string> = {
  Aries: "text-red-400", Taurus: "text-emerald-400", Gemini: "text-yellow-300", Cancer: "text-blue-300",
  Leo: "text-orange-400", Virgo: "text-emerald-300", Libra: "text-pink-300", Scorpio: "text-red-500",
  Sagittarius: "text-orange-300", Capricorn: "text-stone-300", Aquarius: "text-cyan-400", Pisces: "text-indigo-300",
};

const ELEMENTS: Record<string, string> = {
  Aries: "Fire", Taurus: "Earth", Gemini: "Air", Cancer: "Water",
  Leo: "Fire", Virgo: "Earth", Libra: "Air", Scorpio: "Water",
  Sagittarius: "Fire", Capricorn: "Earth", Aquarius: "Air", Pisces: "Water",
};

const ELEMENT_BADGES: Record<string, string> = {
  Fire: "bg-red-500/20 text-red-300 border-red-500/30",
  Earth: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  Air: "bg-yellow-500/20 text-yellow-200 border-yellow-500/30",
  Water: "bg-blue-500/20 text-blue-300 border-blue-500/30",
};

export interface DiscoverProfile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  sun_sign: string | null;
  moon_sign: string | null;
  rising_sign: string | null;
  current_status: string | null;
  bio: string | null;
}

interface ProfileCardProps {
  profile: DiscoverProfile;
  index: number;
}

export default function ProfileCard({ profile, index }: ProfileCardProps) {
  const sunElement = profile.sun_sign ? ELEMENTS[profile.sun_sign] : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="glass-panel p-5 rounded-xl cosmic-border hover:nebula-glow transition-shadow duration-300 cursor-pointer group"
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <Avatar className="h-12 w-12 border border-border/50">
          <AvatarFallback className="bg-primary/20 text-primary text-lg font-serif">
            {(profile.display_name || "?").charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h3 className="font-serif text-foreground text-lg truncate">
            {profile.display_name || "Cosmic Traveler"}
          </h3>
          {sunElement && (
            <span className={`text-xs px-2 py-0.5 rounded-full border ${ELEMENT_BADGES[sunElement]}`}>
              {sunElement}
            </span>
          )}
        </div>
      </div>

      {/* Big Three */}
      <div className="flex justify-around mb-4">
        {[
          { label: "☉", sign: profile.sun_sign, title: "Sun" },
          { label: "☽", sign: profile.moon_sign, title: "Moon" },
          { label: "↑", sign: profile.rising_sign, title: "Rising" },
        ].map(({ label, sign, title }) => (
          <div key={title} className="text-center">
            <span className="text-xs text-muted-foreground block">{label}</span>
            <span className={`text-lg ${sign ? ELEMENT_COLORS[sign] || 'text-foreground' : 'text-muted-foreground/40'}`}>
              {sign ? SIGN_SYMBOLS[sign] || "?" : "—"}
            </span>
            <span className="text-[10px] text-muted-foreground block">{sign || "Unknown"}</span>
          </div>
        ))}
      </div>

      {/* Status */}
      {profile.current_status && (
        <p className="text-xs text-muted-foreground italic text-center truncate">
          "{profile.current_status}"
        </p>
      )}
    </motion.div>
  );
}
