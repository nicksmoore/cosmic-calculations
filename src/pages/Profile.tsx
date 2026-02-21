// src/pages/Profile.tsx
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Edit2, Save, Globe, Lock, Sparkles, Loader2, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import StarField from "@/components/StarField";
import DailyHookCard from "@/components/feed/DailyHookCard";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { useEphemeris } from "@/hooks/useEphemeris";
import { useDailyTransits } from "@/hooks/useDailyTransits";
import { fetchCurrentVibeCopy, useHouseDescriptions } from "@/hooks/useAstroCopy";
import NatalChartWheel from "@/components/NatalChartWheel";
import PlanetDetails from "@/components/PlanetDetails";
import HouseDetails from "@/components/HouseDetails";
import AllHousesGuide from "@/components/AllHousesGuide";
import { Planet, House } from "@/data/natalChartData";
import { BirthData } from "@/components/intake/BirthDataForm";
import { timezoneFromLongitude } from "@/lib/timezone";
import ZodiacSystemSelector, { ZodiacSystem } from "@/components/ZodiacSystemSelector";
import { generateCurrentVibe } from "@/lib/currentVibe";

// --- Constants ---

const SIGN_SYMBOLS: Record<string, string> = {
  Aries: "♈", Taurus: "♉", Gemini: "♊", Cancer: "♋",
  Leo: "♌", Virgo: "♍", Libra: "♎", Scorpio: "♏",
  Sagittarius: "♐", Capricorn: "♑", Aquarius: "♒", Pisces: "♓",
};

const SIGN_COLORS: Record<string, string> = {
  Aries: "text-red-400", Taurus: "text-emerald-400", Gemini: "text-yellow-300",
  Cancer: "text-blue-300", Leo: "text-orange-400", Virgo: "text-emerald-300",
  Libra: "text-pink-300", Scorpio: "text-red-500", Sagittarius: "text-orange-300",
  Capricorn: "text-stone-300", Aquarius: "text-cyan-400", Pisces: "text-indigo-300",
};

const ASTEROID_POINTS = [
  "Ceres",
  "Pallas",
  "Juno",
  "Vesta",
  "Eris",
  "Lilith",
  "Chiron",
] as const;

// --- Trinity Widget ---

function TrinityCard({
  label, sign, description,
}: { label: string; sign: string | null; description: string }) {
  const symbol = sign ? SIGN_SYMBOLS[sign] ?? "?" : "?";
  const color  = sign ? SIGN_COLORS[sign] ?? "text-foreground" : "text-muted-foreground";

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className={`w-16 h-16 rounded-full glass-panel flex items-center justify-center ${
          sign ? "animate-[pulse-ring_3s_ease-in-out_infinite]" : "opacity-50"
        }`}
      >
        <span className={`text-2xl ${color}`}>{symbol}</span>
      </div>
      <div className="flex items-center gap-1">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
        <Popover>
          <PopoverTrigger asChild>
            <button aria-label={`About ${label}`}>
              <Info className="h-3 w-3 text-muted-foreground/70 hover:text-foreground" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-64 text-xs text-muted-foreground">
            {description}
          </PopoverContent>
        </Popover>
      </div>
      <p className="text-sm font-serif font-bold uppercase tracking-wide text-foreground">
        {sign ?? "—"}
      </p>
    </div>
  );
}

// --- Main ---

const ProfilePage = () => {
  type HouseSystem = "placidus" | "whole-sign" | "equal";
  const navigate   = useNavigate();
  const { user, signOut }   = useAuth();
  const { profile, isLoading, updateProfile } = useProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    display_name:   "",
    current_status: "",
    is_public:      true,
  });
  const [selectedPlanet, setSelectedPlanet] = useState<Planet | null>(null);
  const [selectedHouse,  setSelectedHouse]  = useState<House | null>(null);
  const [drawerOpen,     setDrawerOpen]     = useState(false);
  const [houseSystem, setHouseSystem] = useState<HouseSystem>("placidus");
  const [zodiacSystem, setZodiacSystem] = useState<ZodiacSystem>("tropical");
  const [autoVibeStamp, setAutoVibeStamp] = useState<string | null>(null);
  const lastAutoDateRef = useRef<string | null>(null);

  const birthData: BirthData | null =
    profile?.birth_date && profile?.birth_lat && profile?.birth_lng
      ? {
          name:        profile.display_name ?? "You",
          birthDate:   profile.birth_date,
          birthTime:   profile.birth_time ?? "12:00",
          timeUnknown: profile.time_unknown ?? false,
          location:    profile.birth_location ?? "",
          latitude:    profile.birth_lat,
          longitude:   profile.birth_lng,
          timezone:    timezoneFromLongitude(profile.birth_lng),
        }
      : null;

  const { chartData } = useEphemeris(birthData, houseSystem, zodiacSystem);
  const { data: dailyTransits } = useDailyTransits();
  const { data: houseDescriptions, isLoading: houseDescriptionsLoading } = useHouseDescriptions(chartData);

  const outerPlanets = chartData?.planets.filter((p) =>
    ["Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto"].includes(p.name)
  ) ?? [];
  const displayedSunSign = chartData?.planets.find((p) => p.name === "Sun")?.sign ?? profile?.sun_sign ?? null;
  const displayedMoonSign = chartData?.planets.find((p) => p.name === "Moon")?.sign ?? profile?.moon_sign ?? null;
  const displayedRisingSign = chartData?.angles.ascendant.sign ?? profile?.rising_sign ?? null;
  const asteroidPoints = ASTEROID_POINTS.map((name) => ({
    name,
    planet: chartData?.planets.find((p) => p.name === name),
  })).filter((item) => Boolean(item.planet));

  // Keep profile Big Three in sync with current chart computation.
  useEffect(() => {
    if (!chartData || !profile) return;
    if (zodiacSystem !== "tropical" || houseSystem !== "placidus") return;
    const sun    = chartData.planets.find(p => p.name === "Sun")?.sign ?? null;
    const moon   = chartData.planets.find(p => p.name === "Moon")?.sign ?? null;
    const rising = chartData.angles.ascendant.sign ?? null;
    const changed =
      sun !== profile.sun_sign ||
      moon !== profile.moon_sign ||
      rising !== profile.rising_sign;

    if (sun && moon && rising && changed) {
      updateProfile({ sun_sign: sun, moon_sign: moon, rising_sign: rising });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chartData, profile?.sun_sign, profile?.moon_sign, profile?.rising_sign, zodiacSystem, houseSystem]);

  useEffect(() => {
    if (!chartData || !dailyTransits || !profile || isEditing) return;

    const today = new Date().toISOString().slice(0, 10);
    if (lastAutoDateRef.current === today) return;

    const statusDate = profile.status_updated_at?.slice(0, 10) ?? null;
    const shouldGenerate = !profile.current_status || statusDate !== today;
    if (!shouldGenerate) return;

    let cancelled = false;
    (async () => {
      const generated = (await fetchCurrentVibeCopy(chartData, dailyTransits))
        || generateCurrentVibe(chartData, dailyTransits);
      if (cancelled) return;
      lastAutoDateRef.current = today;
      setAutoVibeStamp(today);
      await updateProfile({
        current_status: generated,
        status_updated_at: new Date().toISOString(),
      });
    })();
    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chartData, dailyTransits, profile?.current_status, profile?.status_updated_at, isEditing]);

  useEffect(() => {
    if (profile) {
      setForm({
        display_name:   profile.display_name   ?? "",
        current_status: profile.current_status  ?? "",
        is_public:      profile.is_public,
      });
    }
  }, [profile]);

  const handleSave = async () => {
    const success = await updateProfile({
      ...form,
      status_updated_at:
        form.current_status !== (profile?.current_status ?? "")
          ? new Date().toISOString()
          : profile?.status_updated_at ?? null,
    });
    if (success) setIsEditing(false);
  };

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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" role="status" aria-label="Loading">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <StarField />
      <main className="mx-auto w-full max-w-6xl px-4 pt-6 pb-28 md:px-8 md:pb-10 relative z-10">

        {/* ── Zone 1: Identity Header ── */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          {/* Avatar */}
          <Avatar className="h-24 w-24 mx-auto mb-4 border-2 border-primary/30 nebula-glow">
            <AvatarImage src={user?.user_metadata?.avatar_url || user?.user_metadata?.picture} />
            <AvatarFallback className="bg-primary/20 text-primary text-2xl font-serif">
              {(form.display_name || user?.email || "?").charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          {/* Display name */}
          {isEditing ? (
            <Input
              value={form.display_name}
              onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))}
              className="max-w-xs mx-auto text-center text-xl font-serif bg-input/50 border-border/50 mb-3"
              placeholder="Your display name"
            />
          ) : (
            <h1 className="text-3xl font-serif text-ethereal mb-3">
              {form.display_name || "Cosmic Traveler"}
            </h1>
          )}

          {/* Visibility */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {isEditing ? (
              <>
                <Switch
                  checked={form.is_public}
                  onCheckedChange={v => setForm(f => ({ ...f, is_public: v }))}
                  id="public-toggle"
                />
                <Label htmlFor="public-toggle" className="text-xs text-muted-foreground">
                  {form.is_public ? "Public profile" : "Private profile"}
                </Label>
              </>
            ) : (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                {form.is_public ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                {form.is_public ? "Public" : "Private"}
              </span>
            )}
          </div>

          {/* Trinity Widget */}
          <div className="flex justify-center gap-6 sm:gap-10 mb-6">
            <TrinityCard
              label="Sun"
              sign={displayedSunSign}
              description="Sun represents your core identity, vitality, and life direction."
            />
            <TrinityCard
              label="Moon"
              sign={displayedMoonSign}
              description="Moon reflects emotional needs, instinctive responses, and inner security."
            />
            <TrinityCard
              label="Rising"
              sign={displayedRisingSign}
              description="Rising sign shows your outward style, first impressions, and approach to life."
            />
          </div>

          {/* Planetary Signatures */}
          {outerPlanets.length > 0 && (
            <div className="mb-6">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Planetary Signatures</p>
              <div className="flex justify-center mb-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                      What does this mean?
                      <Info className="h-3 w-3" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-72 text-xs text-muted-foreground">
                    These placements describe how your personal drive (Mercury, Venus, Mars) and slower developmental cycles (Jupiter to Pluto) color your long-term pattern.
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {outerPlanets.map((planet) => (
                  <span
                    key={planet.name}
                    className="flex items-center gap-1.5 text-xs bg-white/5 border border-border/30 rounded-full px-3 py-1.5"
                  >
                    <span>{planet.symbol}</span>
                    <span className="text-muted-foreground">{planet.name}</span>
                    <span className={SIGN_COLORS[planet.sign] ?? "text-foreground"}>{planet.sign}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Asteroids & Points */}
          {asteroidPoints.length > 0 && (
            <div className="mb-6">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Asteroids & Points</p>
              <div className="flex justify-center mb-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                      About asteroid points
                      <Info className="h-3 w-3" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-72 text-xs text-muted-foreground">
                    Asteroids and points add nuance: Ceres (care), Pallas (strategy), Juno (commitment), Vesta (devotion), Eris (disruption), Lilith (raw truth), and Chiron (healing).
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {asteroidPoints.map(({ name, planet }) => (
                  <span
                    key={name}
                    className="flex items-center gap-1.5 text-xs border rounded-full px-3 py-1.5 bg-white/5 border-border/30"
                  >
                    <span>{planet?.symbol ?? "•"}</span>
                    <span className="text-muted-foreground">{name}</span>
                    <span className={planet ? (SIGN_COLORS[planet.sign] ?? "text-foreground") : "text-muted-foreground"}>
                      {planet?.sign ?? ""}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Current Vibe */}
          <div className="glass-panel rounded-xl p-3 text-center mb-6">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Sparkles className="h-3 w-3 text-accent" />
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Current Vibe</span>
            </div>
            {isEditing ? (
              <Input
                value={form.current_status}
                onChange={e => setForm(f => ({ ...f, current_status: e.target.value }))}
                placeholder='e.g., "Surviving my Saturn Return"'
                className="text-center bg-input/50 border-border/50 text-sm"
              />
            ) : (
              <p className="text-lg sm:text-xl font-serif text-foreground leading-relaxed">
                {form.current_status || "No status set..."}
              </p>
            )}
            {autoVibeStamp && (
              <p className="text-[10px] text-muted-foreground mt-2">
                Auto-generated from natal + today's transits
              </p>
            )}
          </div>

          {/* Edit / Save button */}
          <div className="flex items-center justify-center gap-2">
            <Button
              variant={isEditing ? "default" : "outline"}
              size="sm"
              onClick={isEditing ? handleSave : () => setIsEditing(true)}
              className="gap-2"
            >
              {isEditing ? <Save className="h-4 w-4" /> : <Edit2 className="h-4 w-4" />}
              {isEditing ? "Save" : "Edit Profile"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={signOut}
              className="gap-2"
            >
              Sign Out
            </Button>
          </div>
        </motion.div>

        {/* Daily transits on profile for quick context */}
        <DailyHookCard />

        {/* ── Zone 2: The Living Chart ── */}
        {birthData && chartData ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8">
            <ZodiacSystemSelector value={zodiacSystem} onChange={setZodiacSystem} />

            <div className="glass-panel rounded-xl p-3 mb-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider text-center mb-2">House System</p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {([
                  { id: "placidus", label: "Placidus" },
                  { id: "whole-sign", label: "Whole Sign" },
                  { id: "equal", label: "Equal" },
                ] as const).map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setHouseSystem(option.id)}
                    className={`px-3 py-1.5 rounded-md text-xs transition-colors ${
                      houseSystem === option.id
                        ? "bg-accent text-accent-foreground"
                        : "bg-secondary/50 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <NatalChartWheel
              onSelectPlanet={handleSelectPlanet}
              onSelectHouse={handleSelectHouse}
              selectedPlanet={selectedPlanet}
              selectedHouse={selectedHouse}
              houseSystem={houseSystem}
              chartData={chartData}
              partnerChartData={null}
              partnerName={undefined}
            />

            <div className="glass-panel rounded-xl p-4 sm:p-6 mt-6">
              <h3 className="font-serif text-lg text-foreground mb-4">House-by-House Interpretation</h3>
              <AllHousesGuide
                houses={chartData.houses}
                planets={chartData.planets}
                houseDescriptions={houseDescriptions}
                loadingDescriptions={houseDescriptionsLoading}
              />
            </div>

            <div className="glass-panel rounded-xl p-4 sm:p-6 mt-6 space-y-4">
              <h3 className="font-serif text-lg text-foreground">Natal Astrology Framework</h3>
              <p className="text-sm text-muted-foreground">
                Natal astrology interprets your birth chart as a sky snapshot from your exact birth time, date, and place, revealing personality, strengths, challenges, and life potential.
              </p>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p><span className="text-foreground font-medium">Core components:</span> Celestial bodies and points; zodiac signs; houses; aspects; and chart angles (Ascendant, Descendant, Midheaven, Imum Coeli).</p>
                <p><span className="text-foreground font-medium">Sign structure:</span> Elements (Fire, Earth, Air, Water), modalities (Cardinal, Fixed, Mutable), and polarities (Masculine/Feminine).</p>
                <p><span className="text-foreground font-medium">House grouping:</span> Angular houses (1, 4, 7, 10), succedent houses (2, 5, 8, 11), and cadent houses (3, 6, 9, 12).</p>
                <p><span className="text-foreground font-medium">Interpretive lenses:</span> Traditional, modern/psychological, and evolutionary astrology.</p>
                <p><span className="text-foreground font-medium">Extensions:</span> Progressions, transits, solar/lunar returns, and synastry/composite techniques.</p>
              </div>
            </div>
          </motion.div>
        ) : profile && !profile.sun_sign ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 glass-panel p-4 rounded-xl text-center cosmic-border"
          >
            <p className="text-sm text-muted-foreground">
              🌟 Your Big Three aren't set yet! Generate your natal chart to populate them.
            </p>
            <Button variant="outline" size="sm" className="mt-3 gap-2" onClick={() => navigate("/")}>
              <Sparkles className="h-4 w-4" />
              Generate My Chart
            </Button>
          </motion.div>
        ) : null}

      </main>

      {/* ── Planetary Drawer ── */}
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
            {selectedPlanet && chartData && (
              <PlanetDetails planet={selectedPlanet} />
            )}
            {selectedHouse && chartData && (
              <HouseDetails house={selectedHouse} planets={chartData.planets} />
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default ProfilePage;
