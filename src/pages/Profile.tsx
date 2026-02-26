// src/pages/Profile.tsx
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Edit2, Save, Globe, Lock, Sparkles, Info, Loader2 } from "lucide-react";
import { CosmicLoaderPage } from "@/components/ui/CosmicLoader";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { useHouseDescriptions } from "@/hooks/useAstroCopy";
import NatalChartWheel from "@/components/NatalChartWheel";
import PlanetDetails from "@/components/PlanetDetails";
import HouseDetails from "@/components/HouseDetails";
import AllHousesGuide from "@/components/AllHousesGuide";
import AstroFlashcards from "@/components/AstroFlashcards";
import AstrologyHistory from "@/components/AstrologyHistory";
import { Planet, House, zodiacSigns } from "@/data/natalChartData";
import { BirthData } from "@/components/intake/BirthDataForm";
import { timezoneFromLongitude } from "@/lib/timezone";
import { ZodiacSystem } from "@/components/ZodiacSystemSelector";

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

const SIGN_MODALITIES = Object.fromEntries(
  zodiacSigns.map((s) => [s.name, s.modality])
) as Record<string, string>;

const SIGN_ELEMENTS = Object.fromEntries(
  zodiacSigns.map((s) => [s.name, s.element])
) as Record<string, string>;

// --- Trinity Widget ---

function TrinityCard({
  label, sign, description, onOpenMeaning,
}: {
  label: string;
  sign: string | null;
  description: string;
  onOpenMeaning: (label: string, sign: string) => void;
}) {
  const symbol = sign ? SIGN_SYMBOLS[sign] ?? "?" : "?";
  const color  = sign ? SIGN_COLORS[sign] ?? "text-foreground" : "text-muted-foreground";

  return (
    <div className="flex flex-col items-center gap-1.5">
      <button
        onClick={() => sign && onOpenMeaning(label, sign)}
        aria-label={sign ? `${label} in ${sign} meaning` : `${label} unavailable`}
        disabled={!sign}
        className={`w-16 h-16 rounded-full glass-panel flex items-center justify-center ${
          sign ? "animate-[pulse-ring_3s_ease-in-out_infinite] hover:ring-2 hover:ring-primary/40 transition-all" : "opacity-50"
        }`}
      >
        <span className={`text-2xl ${color}`}>{symbol}</span>
      </button>
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
        {sign ? (
          <button
            onClick={() => onOpenMeaning(label, sign)}
            className="hover:text-primary transition-colors"
          >
            {sign}
          </button>
        ) : "—"}
      </p>
    </div>
  );
}

// --- Main ---

// --- Main ---

const ProfilePage = () => {
  type HouseSystem = "placidus" | "whole-sign" | "equal";
  const navigate   = useNavigate();
  const { user, signOut }   = useAuth();
  const { profile, isLoading, updateProfile } = useProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    display_name:   "",
    is_public:      true,
  });
  const [selectedPlanet, setSelectedPlanet] = useState<Planet | null>(null);
  const [selectedHouse,  setSelectedHouse]  = useState<House | null>(null);
  const [drawerOpen,     setDrawerOpen]     = useState(false);
  const [houseSystem, setHouseSystem] = useState<HouseSystem>("placidus");
  const [zodiacSystem, setZodiacSystem] = useState<ZodiacSystem>("tropical");
  const lastBigThreeSyncRef = useRef<string | null>(null);

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
  const { data: houseDescriptions, isLoading: houseDescriptionsLoading } = useHouseDescriptions(chartData);

  const outerPlanets = useMemo(
    () => chartData?.planets.filter((p) =>
      ["Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto"].includes(p.name)
    ) ?? [],
    [chartData]
  );

  const displayedSunSign = useMemo(
    () => chartData?.planets.find((p) => p.name === "Sun")?.sign ?? profile?.sun_sign ?? null,
    [chartData, profile?.sun_sign]
  );

  const displayedMoonSign = useMemo(
    () => chartData?.planets.find((p) => p.name === "Moon")?.sign ?? profile?.moon_sign ?? null,
    [chartData, profile?.moon_sign]
  );

  const displayedRisingSign = useMemo(
    () => chartData?.angles.ascendant.sign ?? profile?.rising_sign ?? null,
    [chartData, profile?.rising_sign]
  );

  const sunModality = useMemo(
    () => displayedSunSign ? SIGN_MODALITIES[displayedSunSign] : null,
    [displayedSunSign]
  );

  const sunElement = useMemo(
    () => displayedSunSign ? SIGN_ELEMENTS[displayedSunSign] : null,
    [displayedSunSign]
  );

  const asteroidPoints = useMemo(
    () => ASTEROID_POINTS.map((name) => ({
      name,
      planet: chartData?.planets.find((p) => p.name === name),
    })).filter((item) => Boolean(item.planet)),
    [chartData]
  );

  // Keep profile Big Three in sync with current chart computation.
  useEffect(() => {
    if (!chartData || !profile) return;
    if (zodiacSystem !== "tropical" || houseSystem !== "placidus") return;
    const today = new Date().toISOString().slice(0, 10);
    if (lastBigThreeSyncRef.current === today) return;
    const sun    = chartData.planets.find(p => p.name === "Sun")?.sign ?? null;
    const moon   = chartData.planets.find(p => p.name === "Moon")?.sign ?? null;
    const rising = chartData.angles.ascendant.sign ?? null;
    const changed =
      sun !== profile.sun_sign ||
      moon !== profile.moon_sign ||
      rising !== profile.rising_sign;

    if (sun && moon && rising && changed) {
      updateProfile({ sun_sign: sun, moon_sign: moon, rising_sign: rising });
      lastBigThreeSyncRef.current = today;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chartData, profile?.sun_sign, profile?.moon_sign, profile?.rising_sign, zodiacSystem, houseSystem]);

  useEffect(() => {
    if (profile) {
      setForm({
        display_name:   profile.display_name   ?? "",
        is_public:      profile.is_public ?? true,
      });
    }
  }, [profile]);

  const handleSave = async () => {
    const success = await updateProfile({ ...form });
    if (success) setIsEditing(false);
  };

  const openMeaning = (placement: string, sign: string) => {
    navigate(`/meaning?sign=${encodeURIComponent(sign)}&label=${encodeURIComponent(`${placement} in ${sign}`)}`);
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

  if (!profile) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <StarField />
        <div className="text-center relative z-10">
          {isLoading ? (
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          ) : (
            <>
              <h2 className="text-xl font-serif mb-2">No profile data</h2>
              <p className="text-sm text-muted-foreground mb-4">Unable to load your profile. Please try refreshing.</p>
              <Button variant="outline" onClick={() => window.location.reload()}>
                Refresh Page
              </Button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <StarField />
      <main className="mx-auto w-full max-w-6xl px-4 pt-6 pb-28 md:px-8 md:pb-10 relative z-10">

        {/* ── Zone 1: Identity Header ── */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          {/* Avatar with conic gradient ring */}
          <div className="relative w-24 h-24 mx-auto mb-4">
            <div
              className="absolute inset-[-3px] rounded-full z-0"
              style={{
                background: "conic-gradient(from 0deg, hsl(275 80% 62%), hsl(45 100% 50%), hsl(200 80% 65%), hsl(275 80% 62%))",
                animation: "orbit 5s linear infinite",
              }}
            />
            <div className="absolute inset-[2px] rounded-full bg-background z-10" />
            <Avatar className="h-full w-full relative z-20">
              <AvatarImage src={user?.user_metadata?.avatar_url || user?.user_metadata?.picture} />
              <AvatarFallback className="bg-primary/20 text-primary text-2xl font-serif">
                {(form.display_name || user?.email || "?").charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>

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
              description={
                displayedSunSign && sunModality && sunElement
                  ? `Sun represents your core identity, vitality, and life direction. ${displayedSunSign} is a ${sunElement} sign with ${sunModality.toLowerCase()} modality.`
                  : "Sun represents your core identity, vitality, and life direction."
              }
              onOpenMeaning={openMeaning}
            />
            <TrinityCard
              label="Moon"
              sign={displayedMoonSign}
              description="Moon reflects emotional needs, instinctive responses, and inner security."
              onOpenMeaning={openMeaning}
            />
            <TrinityCard
              label="Rising"
              sign={displayedRisingSign}
              description="Rising sign shows your outward style, first impressions, and approach to life."
              onOpenMeaning={openMeaning}
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
                  <button
                    key={planet.name}
                    className="flex items-center gap-1.5 text-xs bg-white/5 border border-border/30 rounded-full px-3 py-1.5 hover:border-primary/40 transition-colors"
                    onClick={() => openMeaning(planet.name, planet.sign)}
                  >
                    <span>{planet.symbol}</span>
                    <span className="text-muted-foreground">{planet.name}</span>
                    <span className={SIGN_COLORS[planet.sign] ?? "text-foreground"}>{planet.sign}</span>
                  </button>
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
                  <button
                    key={name}
                    className="flex items-center gap-1.5 text-xs border rounded-full px-3 py-1.5 bg-white/5 border-border/30 hover:border-primary/40 transition-colors"
                    onClick={() => planet?.sign && openMeaning(name, planet.sign)}
                    disabled={!planet?.sign}
                  >
                    <span>{planet?.symbol ?? "•"}</span>
                    <span className="text-muted-foreground">{name}</span>
                    <span className={planet ? (SIGN_COLORS[planet.sign] ?? "text-foreground") : "text-muted-foreground"}>
                      {planet?.sign ?? ""}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

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

        <Tabs defaultValue="chart" className="w-full">
          <div className="flex justify-center mb-4">
            <TabsList className="glass-panel border border-border/30 p-1.5 gap-1">
              <TabsTrigger
                value="chart"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-accent/30 data-[state=active]:to-primary/25 data-[state=active]:text-foreground data-[state=active]:shadow-[0_0_22px_hsl(var(--accent)/0.45)]"
              >
                Chart
              </TabsTrigger>
              <TabsTrigger
                value="learn"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-accent/30 data-[state=active]:to-primary/25 data-[state=active]:text-foreground data-[state=active]:shadow-[0_0_22px_hsl(var(--accent)/0.45)]"
              >
                Learn
              </TabsTrigger>
              <TabsTrigger
                value="history"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-accent/30 data-[state=active]:to-primary/25 data-[state=active]:text-foreground data-[state=active]:shadow-[0_0_22px_hsl(var(--accent)/0.45)]"
              >
                History
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="chart">
            {/* Daily transits on profile for quick context */}
            <DailyHookCard />

            {/* ── Zone 2: The Living Chart ── */}
            {birthData && chartData ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8">
            <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)] items-start">
              <div className="glass-panel rounded-xl p-4 space-y-4 lg:sticky lg:top-6">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Zodiac System</p>
                  <div className="flex flex-wrap gap-2">
                    {([
                      { id: "tropical", label: "Western" },
                      { id: "sidereal", label: "Vedic" },
                    ] as const).map((option) => (
                      <button
                        key={option.id}
                        onClick={() => setZodiacSystem(option.id)}
                        className={`px-3 py-1.5 rounded-md text-xs transition-colors ${
                          zodiacSystem === option.id
                            ? "bg-accent text-accent-foreground"
                            : "bg-secondary/50 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">House System</p>
                  <div className="flex flex-wrap gap-2">
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
                <p className="text-xs text-muted-foreground">
                  Current: {zodiacSystem === "tropical" ? "Western" : "Vedic"} +{" "}
                  {houseSystem === "placidus" ? "Placidus" : houseSystem === "whole-sign" ? "Whole Sign" : "Equal"}.
                </p>
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
            </div>

            <div className="glass-panel rounded-xl p-4 sm:p-6 mt-6">
              <h3 className="font-serif text-lg text-foreground mb-4">House-by-House Interpretation</h3>
              <AllHousesGuide
                houses={chartData.houses}
                planets={chartData.planets}
                houseDescriptions={houseDescriptions}
                loadingDescriptions={houseDescriptionsLoading}
              />
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
          </TabsContent>

          <TabsContent value="learn">
            <AstroFlashcards />
          </TabsContent>

          <TabsContent value="history">
            <AstrologyHistory />
          </TabsContent>
        </Tabs>

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
