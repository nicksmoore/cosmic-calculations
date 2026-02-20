// src/pages/Profile.tsx
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Edit2, Save, Globe, Lock, Sparkles, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import StarField from "@/components/StarField";
import DailyHookCard from "@/components/feed/DailyHookCard";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { useEphemeris } from "@/hooks/useEphemeris";
import NatalChartWheel from "@/components/NatalChartWheel";
import PlanetDetails from "@/components/PlanetDetails";
import HouseDetails from "@/components/HouseDetails";
import { Planet, House } from "@/data/natalChartData";
import { BirthData } from "@/components/intake/BirthDataForm";
import { timezoneFromLongitude } from "@/lib/timezone";

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

// --- Trinity Widget ---

function TrinityCard({
  label, sign,
}: { label: string; sign: string | null }) {
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
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="text-sm font-serif font-bold uppercase tracking-wide text-foreground">
        {sign ?? "—"}
      </p>
    </div>
  );
}

// --- Pill Chip ---

function PlanetChip({
  glyph, label, sign, house,
}: { glyph: string; label: string; sign: string; house?: number }) {
  const color = SIGN_COLORS[sign] ?? "text-muted-foreground";
  const text  = house ? `${sign} · ${house}th` : sign;

  return (
    <span className="flex-shrink-0 flex items-center gap-1 text-xs bg-white/5 border border-border/30 rounded-full px-3 py-1.5">
      <span>{glyph}</span>
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-medium ${color}`}>{text}</span>
    </span>
  );
}

// --- Main ---

const ProfilePage = () => {
  const navigate   = useNavigate();
  const { user }   = useAuth();
  const { profile, isLoading, updateProfile } = useProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    display_name:   "",
    bio:            "",
    mercury_bio:    "",
    venus_bio:      "",
    mars_bio:       "",
    current_status: "",
    is_public:      true,
  });
  const [selectedPlanet, setSelectedPlanet] = useState<Planet | null>(null);
  const [selectedHouse,  setSelectedHouse]  = useState<House | null>(null);
  const [drawerOpen,     setDrawerOpen]     = useState(false);

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

  const { chartData } = useEphemeris(birthData);

  const mercuryPlanet = chartData?.planets.find(p => p.name === "Mercury");
  const venusPlanet   = chartData?.planets.find(p => p.name === "Venus");
  const marsPlanet    = chartData?.planets.find(p => p.name === "Mars");

  // Keep profile Big Three in sync with current chart computation.
  useEffect(() => {
    if (!chartData || !profile) return;
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
  }, [chartData, profile?.sun_sign, profile?.moon_sign, profile?.rising_sign]);

  useEffect(() => {
    if (profile) {
      setForm({
        display_name:   profile.display_name   ?? "",
        bio:            profile.bio             ?? "",
        mercury_bio:    profile.mercury_bio     ?? "",
        venus_bio:      profile.venus_bio       ?? "",
        mars_bio:       profile.mars_bio        ?? "",
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
            <TrinityCard label="Sun"    sign={profile?.sun_sign    ?? null} />
            <TrinityCard label="Moon"   sign={profile?.moon_sign   ?? null} />
            <TrinityCard label="Rising" sign={profile?.rising_sign ?? null} />
          </div>

          {/* Pill Tags: Mercury / Venus / Mars */}
          {chartData && (mercuryPlanet || venusPlanet || marsPlanet) && (
            <ScrollArea className="w-full mb-6">
              <div className="flex gap-2 pb-2 justify-center">
                {mercuryPlanet && (
                  <PlanetChip
                    glyph="☿" label="Mercury"
                    sign={mercuryPlanet.sign} house={mercuryPlanet.house}
                  />
                )}
                {venusPlanet && (
                  <PlanetChip
                    glyph="♀" label="Venus"
                    sign={venusPlanet.sign} house={venusPlanet.house}
                  />
                )}
                {marsPlanet && (
                  <PlanetChip
                    glyph="♂" label="Mars"
                    sign={marsPlanet.sign} house={marsPlanet.house}
                  />
                )}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
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
              <p className="text-sm font-serif text-foreground italic">
                {form.current_status || "No status set..."}
              </p>
            )}
          </div>

          {/* Edit / Save button */}
          <Button
            variant={isEditing ? "default" : "outline"}
            size="sm"
            onClick={isEditing ? handleSave : () => setIsEditing(true)}
            className="gap-2"
          >
            {isEditing ? <Save className="h-4 w-4" /> : <Edit2 className="h-4 w-4" />}
            {isEditing ? "Save" : "Edit Profile"}
          </Button>
        </motion.div>

        {/* Daily transits on profile for quick context */}
        <DailyHookCard />

        {/* ── Zone 2: The Living Chart ── */}
        {birthData && chartData ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8">
            <NatalChartWheel
              onSelectPlanet={handleSelectPlanet}
              onSelectHouse={handleSelectHouse}
              selectedPlanet={selectedPlanet}
              selectedHouse={selectedHouse}
              houseSystem="placidus"
              chartData={chartData}
              partnerChartData={null}
              partnerName={undefined}
            />
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

        {/* ── Zone 3: Astro-Bio ── */}
        <div className="space-y-4">
          {/* About */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-panel p-4 sm:p-6 rounded-xl">
            <h3 className="font-serif text-lg text-foreground mb-3">About</h3>
            {isEditing ? (
              <Textarea
                value={form.bio}
                onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                placeholder="Tell the cosmos about yourself..."
                className="bg-input/50 border-border/50 min-h-[100px]"
              />
            ) : (
              <p className="text-sm text-muted-foreground">{form.bio || "No bio yet..."}</p>
            )}
          </motion.div>

          {/* Mercury */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-panel p-4 sm:p-6 rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">☿</span>
              <div>
                <h3 className="font-serif text-foreground">My Mercury</h3>
                <p className="text-xs text-muted-foreground">How I communicate</p>
              </div>
            </div>
            {isEditing ? (
              <Textarea
                value={form.mercury_bio}
                onChange={e => setForm(f => ({ ...f, mercury_bio: e.target.value }))}
                placeholder="How I communicate..."
                className="bg-input/50 border-border/50 min-h-[80px]"
              />
            ) : (
              <p className="text-sm text-muted-foreground italic">
                {form.mercury_bio || "No Mercury description yet..."}
              </p>
            )}
          </motion.div>

          {/* Venus */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-panel p-4 sm:p-6 rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">♀</span>
              <div>
                <h3 className="font-serif text-foreground">My Venus</h3>
                <p className="text-xs text-muted-foreground">How I love</p>
              </div>
            </div>
            {isEditing ? (
              <Textarea
                value={form.venus_bio}
                onChange={e => setForm(f => ({ ...f, venus_bio: e.target.value }))}
                placeholder="How I love..."
                className="bg-input/50 border-border/50 min-h-[80px]"
              />
            ) : (
              <p className="text-sm text-muted-foreground italic">
                {form.venus_bio || "No Venus description yet..."}
              </p>
            )}
          </motion.div>

          {/* Mars */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-panel p-4 sm:p-6 rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">♂</span>
              <div>
                <h3 className="font-serif text-foreground">My Mars</h3>
                <p className="text-xs text-muted-foreground">How I work & fight</p>
              </div>
            </div>
            {isEditing ? (
              <Textarea
                value={form.mars_bio}
                onChange={e => setForm(f => ({ ...f, mars_bio: e.target.value }))}
                placeholder="How I work & fight..."
                className="bg-input/50 border-border/50 min-h-[80px]"
              />
            ) : (
              <p className="text-sm text-muted-foreground italic">
                {form.mars_bio || "No Mars description yet..."}
              </p>
            )}
          </motion.div>
        </div>
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
