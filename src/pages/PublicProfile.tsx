import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, Lock, UserPlus, UserCheck } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import StarField from "@/components/StarField";
import { supabase } from "@/integrations/supabase/client";
import { Profile, useProfile } from "@/hooks/useProfile";
import { useEphemeris } from "@/hooks/useEphemeris";
import { calculateCompatibility } from "@/lib/synastry/compatibility";
import { BirthData } from "@/components/intake/BirthDataForm";
import NatalChartWheel from "@/components/NatalChartWheel";
import PlanetDetails from "@/components/PlanetDetails";
import HouseDetails from "@/components/HouseDetails";
import { Planet, House } from "@/data/natalChartData";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { useFollowStatus, useFollowCounts, useToggleFollow } from "@/hooks/useFollow";
import { useAuth } from "@/hooks/useAuth";

const SIGN_SYMBOLS: Record<string, string> = {
  Aries: "♈", Taurus: "♉", Gemini: "♊", Cancer: "♋",
  Leo: "♌", Virgo: "♍", Libra: "♎", Scorpio: "♏",
  Sagittarius: "♐", Capricorn: "♑", Aquarius: "♒", Pisces: "♓",
};

function scoreRing(score: number) {
  if (score >= 70) return "border-emerald-400 shadow-[0_0_16px_rgba(52,211,153,0.5)]";
  if (score >= 45) return "border-amber-400 shadow-[0_0_16px_rgba(251,191,36,0.5)]";
  return "border-rose-400 shadow-[0_0_16px_rgba(251,113,133,0.4)]";
}

function profileToBirthData(p: Profile): BirthData | null {
  if (!p.birth_date || p.birth_lat == null || p.birth_lng == null) return null;
  return {
    name: p.display_name ?? "Unknown",
    birthDate: p.birth_date,
    birthTime: p.birth_time ?? "12:00",
    timeUnknown: p.time_unknown ?? false,
    location: p.birth_location ?? "",
    latitude: p.birth_lat,
    longitude: p.birth_lng,
    timezone: "UTC+0",
  };
}

export default function PublicProfile() {
  const params = useParams<{ userId?: string; id?: string }>();
  const userId = params.userId ?? params.id;
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { profile: myProfile } = useProfile();
  const { data: isFollowing } = useFollowStatus(userId);
  const { data: followCounts } = useFollowCounts(userId);
  const toggleFollow = useToggleFollow(userId);

  const [theirProfile, setTheirProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlanet, setSelectedPlanet] = useState<Planet | null>(null);
  const [selectedHouse, setSelectedHouse] = useState<House | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (!userId) return;
    (supabase as any)
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single()
      .then(({ data }: { data: Profile | null }) => {
        setTheirProfile(data);
        setLoading(false);
      });
  }, [userId]);

  const myBirthData = myProfile ? profileToBirthData(myProfile) : null;
  const theirBirthData = theirProfile ? profileToBirthData(theirProfile) : null;
  const { chartData: myChartData } = useEphemeris(myBirthData);
  const { chartData: theirChartData } = useEphemeris(theirBirthData);

  const compatScore = myChartData && theirChartData
    ? calculateCompatibility(myChartData.planets, theirChartData.planets).overall
    : null;

  const handleSelectPlanet = (planet: Planet | null) => {
    setSelectedPlanet(planet);
    setSelectedHouse(null);
    if (planet) setDrawerOpen(true);
  };

  const handleSelectHouse = (house: House | null) => {
    setSelectedHouse(house);
    setSelectedPlanet(null);
    if (house) setDrawerOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" role="status" aria-label="Loading">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-hidden="true" />
      </div>
    );
  }

  if (!theirProfile || !theirProfile.is_public) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center p-8">
        <Lock className="h-10 w-10 text-muted-foreground opacity-50" />
        <p className="text-muted-foreground">This profile is private.</p>
        <Button variant="ghost" onClick={() => navigate("/match")}>← Back to Match</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <StarField />
      <main className="container mx-auto px-4 pt-6 pb-28 max-w-2xl relative z-10">
        <Button variant="ghost" size="sm" onClick={() => navigate("/match")} className="gap-2 mb-6">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <div className="relative inline-block mb-4">
            <Avatar className={`h-24 w-24 border-4 ${compatScore !== null ? scoreRing(compatScore) : "border-primary/30"}`}>
              <AvatarImage src={theirProfile.avatar_url ?? undefined} />
              <AvatarFallback className="bg-primary/20 text-primary text-2xl font-serif">
                {(theirProfile.display_name ?? "?").charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {compatScore !== null && (
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-background border border-border/50 rounded-full px-2 py-0.5 text-[10px] font-medium whitespace-nowrap">
                {compatScore}% match
              </div>
            )}
          </div>

          <h1 className="text-2xl font-serif text-ethereal mb-2">
            {theirProfile.display_name ?? "Cosmic Traveler"}
          </h1>

          {currentUser && currentUser.id !== userId && (
            <div className="flex items-center justify-center gap-4 mb-4">
              <Button
                variant={isFollowing ? "outline" : "default"}
                size="sm"
                className="gap-2"
                onClick={() => toggleFollow.mutate(!!isFollowing)}
                disabled={toggleFollow.isPending}
              >
                {isFollowing
                  ? <><UserCheck className="h-4 w-4" /> Following</>
                  : <><UserPlus className="h-4 w-4" /> Follow</>
                }
              </Button>
              {followCounts && (
                <span className="text-xs text-muted-foreground">
                  {followCounts.followers} followers
                </span>
              )}
            </div>
          )}

          <div className="flex justify-center gap-6 mb-4">
            {[
              { label: "Sun", sign: theirProfile.sun_sign },
              { label: "Moon", sign: theirProfile.moon_sign },
              { label: "Rising", sign: theirProfile.rising_sign },
            ].map(({ label, sign }) => (
              <div key={label} className="text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
                <p className="text-sm font-serif">{sign ? `${SIGN_SYMBOLS[sign] ?? ""} ${sign}` : "—"}</p>
              </div>
            ))}
          </div>

          {theirProfile.current_status && (
            <p className="text-sm font-serif italic text-muted-foreground">
              "{theirProfile.current_status}"
            </p>
          )}
        </motion.div>

        {theirBirthData && theirChartData && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8">
            <NatalChartWheel
              onSelectPlanet={handleSelectPlanet}
              onSelectHouse={handleSelectHouse}
              selectedPlanet={selectedPlanet}
              selectedHouse={selectedHouse}
              houseSystem="placidus"
              chartData={theirChartData}
              partnerChartData={null}
              partnerName={undefined}
            />
          </motion.div>
        )}

        {theirProfile.bio && (
          <div className="glass-panel p-4 rounded-xl mb-4">
            <h3 className="font-serif text-lg text-foreground mb-2">About</h3>
            <p className="text-sm text-muted-foreground">{theirProfile.bio}</p>
          </div>
        )}
        {theirProfile.mercury_bio && (
          <div className="glass-panel p-4 rounded-xl mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span>☿</span>
              <h3 className="font-serif text-foreground">Mercury</h3>
            </div>
            <p className="text-sm text-muted-foreground italic">{theirProfile.mercury_bio}</p>
          </div>
        )}
        {theirProfile.venus_bio && (
          <div className="glass-panel p-4 rounded-xl mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span>♀</span>
              <h3 className="font-serif text-foreground">Venus</h3>
            </div>
            <p className="text-sm text-muted-foreground italic">{theirProfile.venus_bio}</p>
          </div>
        )}
        {theirProfile.mars_bio && (
          <div className="glass-panel p-4 rounded-xl mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span>♂</span>
              <h3 className="font-serif text-foreground">Mars</h3>
            </div>
            <p className="text-sm text-muted-foreground italic">{theirProfile.mars_bio}</p>
          </div>
        )}
      </main>

      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent className="glass-panel border-border/30 max-h-[60vh]">
          <DrawerHeader>
            <DrawerTitle className="font-serif text-ethereal">
              {selectedPlanet
                ? `${selectedPlanet.symbol} ${selectedPlanet.name} in ${selectedPlanet.sign}`
                : selectedHouse
                ? `${selectedHouse.number}th House`
                : "Details"}
            </DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6 overflow-y-auto">
            {selectedPlanet && theirChartData && <PlanetDetails planet={selectedPlanet} />}
            {selectedHouse && theirChartData && <HouseDetails house={selectedHouse} planets={theirChartData.planets} />}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
