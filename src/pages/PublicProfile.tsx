import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Globe, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import StarField from "@/components/StarField";
import { supabase } from "@/integrations/supabase/client";

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

interface PublicProfile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  sun_sign: string | null;
  moon_sign: string | null;
  rising_sign: string | null;
  mercury_bio: string | null;
  venus_bio: string | null;
  mars_bio: string | null;
  current_status: string | null;
  is_public: boolean;
}

const PublicProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetch = async () => {
      setIsLoading(true);
      const { data, error } = await (supabase as any)
        .from("profiles")
        .select("id, display_name, avatar_url, bio, sun_sign, moon_sign, rising_sign, mercury_bio, venus_bio, mars_bio, current_status, is_public")
        .eq("id", id)
        .eq("is_public", true)
        .single();

      if (error || !data) {
        setNotFound(true);
      } else {
        setProfile(data);
      }
      setIsLoading(false);
    };
    fetch();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <StarField />
        <main className="container mx-auto px-4 pt-20 max-w-2xl relative z-10 text-center">
          <h1 className="text-3xl font-serif text-foreground mb-4">Profile Not Found</h1>
          <p className="text-muted-foreground mb-6">This profile is private or doesn't exist.</p>
          <Button variant="outline" onClick={() => navigate("/discover")}>Back to Discover</Button>
        </main>
      </div>
    );
  }

  const signs = [
    { label: "Sun", sign: profile.sun_sign, desc: "Core identity" },
    { label: "Moon", sign: profile.moon_sign, desc: "Emotional self" },
    { label: "Rising", sign: profile.rising_sign, desc: "First impression" },
  ];

  const planetarySections = [
    { icon: "☿", label: "Mercury", subtitle: "How they communicate", value: profile.mercury_bio },
    { icon: "♀", label: "Venus", subtitle: "How they love", value: profile.venus_bio },
    { icon: "♂", label: "Mars", subtitle: "How they work & fight", value: profile.mars_bio },
  ].filter(s => s.value);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <StarField />
      <main className="container mx-auto px-4 pt-6 pb-24 max-w-2xl relative z-10">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2 mb-8">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        {/* Avatar & Name */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6">
          <Avatar className="h-24 w-24 mx-auto mb-4 border-2 border-primary/30 nebula-glow">
            <AvatarFallback className="bg-primary/20 text-primary text-2xl font-serif">
              {(profile.display_name || "?").charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <h1 className="text-3xl font-serif text-ethereal">{profile.display_name || "Cosmic Traveler"}</h1>
          <span className="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-2">
            <Globe className="h-3 w-3" /> Public Profile
          </span>
        </motion.div>

        {/* Big Three */}
        <div className="flex justify-center gap-4 sm:gap-8 mb-8">
          {signs.map(({ label, sign, desc }) => (
            <motion.div key={label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
              <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full glass-panel flex items-center justify-center mx-auto mb-2 ${sign ? 'nebula-glow' : 'opacity-50'}`}>
                <span className={`text-2xl sm:text-3xl ${sign ? ELEMENT_COLORS[sign] || 'text-foreground' : 'text-muted-foreground'}`}>
                  {sign ? SIGN_SYMBOLS[sign] || "?" : "?"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
              <p className="text-sm font-serif text-foreground">{sign || "Unknown"}</p>
              <p className="text-xs text-muted-foreground hidden sm:block">{desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Status */}
        {profile.current_status && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-panel p-4 rounded-xl mb-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-accent" />
              <span className="text-xs uppercase tracking-wider text-muted-foreground">Current Vibe</span>
            </div>
            <p className="text-sm font-serif text-foreground italic">"{profile.current_status}"</p>
          </motion.div>
        )}

        {/* Bio */}
        {profile.bio && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-panel p-4 sm:p-6 rounded-xl mb-6">
            <h3 className="font-serif text-lg text-foreground mb-3">About</h3>
            <p className="text-sm text-muted-foreground">{profile.bio}</p>
          </motion.div>
        )}

        {/* Planetary Bios */}
        {planetarySections.length > 0 && (
          <div className="space-y-4">
            {planetarySections.map(({ icon, label, subtitle, value }) => (
              <motion.div key={label} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="glass-panel p-4 sm:p-6 rounded-xl">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{icon}</span>
                  <div>
                    <h3 className="font-serif text-foreground text-lg">{label}</h3>
                    <p className="text-xs text-muted-foreground">{subtitle}</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground italic">{value}</p>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default PublicProfilePage;
