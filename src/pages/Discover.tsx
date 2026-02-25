/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Search, Users, Flame, Droplets, Wind, Mountain } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import StarField from "@/components/StarField";
import ProfileCard, { DiscoverProfile } from "@/components/discover/ProfileCard";
import { supabase } from "@/integrations/supabase/client";

const ZODIAC_SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

const SIGN_SYMBOLS: Record<string, string> = {
  Aries: "♈", Taurus: "♉", Gemini: "♊", Cancer: "♋",
  Leo: "♌", Virgo: "♍", Libra: "♎", Scorpio: "♏",
  Sagittarius: "♐", Capricorn: "♑", Aquarius: "♒", Pisces: "♓",
};

const ELEMENTS: Record<string, string[]> = {
  Fire: ["Aries", "Leo", "Sagittarius"],
  Earth: ["Taurus", "Virgo", "Capricorn"],
  Air: ["Gemini", "Libra", "Aquarius"],
  Water: ["Cancer", "Scorpio", "Pisces"],
};

const ELEMENT_ICONS: Record<string, React.ReactNode> = {
  Fire: <Flame className="h-3.5 w-3.5" />,
  Earth: <Mountain className="h-3.5 w-3.5" />,
  Air: <Wind className="h-3.5 w-3.5" />,
  Water: <Droplets className="h-3.5 w-3.5" />,
};

type FilterType = "all" | "Fire" | "Earth" | "Air" | "Water" | string;

const DiscoverPage = () => {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<DiscoverProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchProfiles = async () => {
      setIsLoading(true);
      const { data, error } = await (supabase as any)
        .from("profiles")
        .select("id, display_name, avatar_url, sun_sign, moon_sign, rising_sign, current_status, bio")
        .eq("is_public", true)
        .not("sun_sign", "is", null)
        .order("updated_at", { ascending: false })
        .limit(100);

      if (error) {
        console.error("Error fetching profiles:", error);
      } else {
        setProfiles(data || []);
      }
      setIsLoading(false);
    };

    fetchProfiles();
  }, []);

  const filtered = useMemo(() => {
    let result = profiles;

    // Element filter
    if (filter !== "all" && ELEMENTS[filter]) {
      result = result.filter(p => p.sun_sign && ELEMENTS[filter].includes(p.sun_sign));
    } else if (filter !== "all" && ZODIAC_SIGNS.includes(filter)) {
      result = result.filter(p => p.sun_sign === filter || p.moon_sign === filter || p.rising_sign === filter);
    }

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(p =>
        (p.display_name?.toLowerCase().includes(q)) ||
        (p.sun_sign?.toLowerCase().includes(q)) ||
        (p.moon_sign?.toLowerCase().includes(q)) ||
        (p.current_status?.toLowerCase().includes(q))
      );
    }

    return result;
  }, [profiles, filter, search]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <StarField />

      <main className="container mx-auto px-4 pt-6 pb-24 max-w-4xl relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span className="text-sm">{profiles.length} souls</span>
          </div>
        </div>

        {/* Title */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <h1 className="text-4xl font-serif text-ethereal mb-2">Discover</h1>
          <p className="text-sm text-muted-foreground">Find your cosmic tribe by sign, element, or vibe</p>
        </motion.div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, sign, or vibe..."
            className="pl-10 bg-input/50 border-border/50"
          />
        </div>

        {/* Element Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
            className="text-xs"
          >
            All
          </Button>
          {Object.entries(ELEMENT_ICONS).map(([element, icon]) => (
            <Button
              key={element}
              variant={filter === element ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f => f === element ? "all" : element)}
              className="text-xs gap-1.5"
            >
              {icon}
              {element}
            </Button>
          ))}
        </div>

        {/* Sign Quick-Filters */}
        <div className="flex flex-wrap gap-1.5 mb-8">
          {ZODIAC_SIGNS.map(sign => (
            <button
              key={sign}
              onClick={() => setFilter(f => f === sign ? "all" : sign)}
              className={`text-lg px-2 py-1 rounded-lg transition-all ${
                filter === sign
                  ? "glass-panel nebula-glow scale-110"
                  : "opacity-50 hover:opacity-80"
              }`}
              title={sign}
            >
              {SIGN_SYMBOLS[sign]}
            </button>
          ))}
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
            <p className="text-muted-foreground text-lg font-serif mb-2">No souls found</p>
            <p className="text-sm text-muted-foreground">
              {profiles.length === 0
                ? "Be the first to set up your astro-profile!"
                : "Try a different filter or search term."}
            </p>
            {profiles.length === 0 && (
              <Button variant="outline" size="sm" className="mt-4" onClick={() => navigate("/profile")}>
                Set Up My Profile
              </Button>
            )}
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((profile, i) => (
              <ProfileCard key={profile.id} profile={profile} index={i} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default DiscoverPage;
