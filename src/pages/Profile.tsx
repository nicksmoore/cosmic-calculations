import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Edit2, Save, Globe, Lock, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import StarField from "@/components/StarField";
import AuthGate from "@/components/AuthGate";
import { useProfile, Profile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";

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

function BigThreeHeader({ profile }: { profile: Profile }) {
  const signs = [
    { label: "Sun", sign: profile.sun_sign, desc: "Your core identity" },
    { label: "Moon", sign: profile.moon_sign, desc: "Your emotional self" },
    { label: "Rising", sign: profile.rising_sign, desc: "How others see you" },
  ];

  return (
    <div className="flex justify-center gap-4 sm:gap-8 mb-8">
      {signs.map(({ label, sign, desc }) => (
        <motion.div
          key={label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
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
  );
}

function PlanetaryBioSection({ icon, label, subtitle, value, isEditing, onChange }: {
  icon: string;
  label: string;
  subtitle: string;
  value: string;
  isEditing: boolean;
  onChange: (v: string) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="glass-panel p-4 sm:p-6 rounded-xl"
    >
      <div className="flex items-center gap-3 mb-3">
        <span className="text-2xl">{icon}</span>
        <div>
          <h3 className="font-serif text-foreground text-lg">{label}</h3>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      {isEditing ? (
        <Textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={`Tell people about ${subtitle.toLowerCase()}...`}
          className="bg-input/50 border-border/50 min-h-[80px]"
        />
      ) : (
        <p className="text-sm text-muted-foreground italic">
          {value || `No ${label.toLowerCase()} description yet...`}
        </p>
      )}
    </motion.div>
  );
}

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, isLoading, updateProfile } = useProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    display_name: "",
    bio: "",
    mercury_bio: "",
    venus_bio: "",
    mars_bio: "",
    current_status: "",
    is_public: true,
  });

  useEffect(() => {
    if (profile) {
      setForm({
        display_name: profile.display_name || "",
        bio: profile.bio || "",
        mercury_bio: profile.mercury_bio || "",
        venus_bio: profile.venus_bio || "",
        mars_bio: profile.mars_bio || "",
        current_status: profile.current_status || "",
        is_public: profile.is_public,
      });
    }
  }, [profile]);

  const handleSave = async () => {
    const success = await updateProfile({
      ...form,
      status_updated_at: form.current_status !== (profile?.current_status || "") ? new Date().toISOString() : profile?.status_updated_at || null,
    });
    if (success) setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <AuthGate>
      <div className="min-h-screen bg-background text-foreground">
        <StarField />

        <main className="container mx-auto px-4 pt-6 pb-24 max-w-2xl relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <Button
              variant={isEditing ? "default" : "outline"}
              size="sm"
              onClick={isEditing ? handleSave : () => setIsEditing(true)}
              className="gap-2"
            >
              {isEditing ? <Save className="h-4 w-4" /> : <Edit2 className="h-4 w-4" />}
              {isEditing ? "Save" : "Edit"}
            </Button>
          </div>

          {/* Avatar & Name */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6">
            <Avatar className="h-24 w-24 mx-auto mb-4 border-2 border-primary/30 nebula-glow">
              <AvatarImage src={user?.user_metadata?.avatar_url || user?.user_metadata?.picture} />
              <AvatarFallback className="bg-primary/20 text-primary text-2xl font-serif">
                {(form.display_name || user?.email || "?").charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            {isEditing ? (
              <Input
                value={form.display_name}
                onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))}
                className="max-w-xs mx-auto text-center text-xl font-serif bg-input/50 border-border/50"
                placeholder="Your display name"
              />
            ) : (
              <h1 className="text-3xl font-serif text-ethereal">{form.display_name || "Cosmic Traveler"}</h1>
            )}

            {/* Visibility toggle */}
            <div className="flex items-center justify-center gap-2 mt-3">
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
          </motion.div>

          {/* Big Three */}
          {profile && <BigThreeHeader profile={profile} />}

          {/* Transit Status */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-panel p-4 rounded-xl mb-6 text-center"
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-accent" />
              <span className="text-xs uppercase tracking-wider text-muted-foreground">Current Vibe</span>
            </div>
            {isEditing ? (
              <Input
                value={form.current_status}
                onChange={e => setForm(f => ({ ...f, current_status: e.target.value }))}
                placeholder='e.g., "Surviving my Saturn Return"'
                className="text-center bg-input/50 border-border/50"
              />
            ) : (
              <p className="text-sm font-serif text-foreground italic">
                {form.current_status || "No status set..."}
              </p>
            )}
          </motion.div>

          {/* Bio */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-panel p-4 sm:p-6 rounded-xl mb-6">
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

          {/* Planetary Bio Sections */}
          <div className="space-y-4">
            <PlanetaryBioSection
              icon="☿"
              label="My Mercury"
              subtitle="How I communicate"
              value={form.mercury_bio}
              isEditing={isEditing}
              onChange={v => setForm(f => ({ ...f, mercury_bio: v }))}
            />
            <PlanetaryBioSection
              icon="♀"
              label="My Venus"
              subtitle="How I love"
              value={form.venus_bio}
              isEditing={isEditing}
              onChange={v => setForm(f => ({ ...f, venus_bio: v }))}
            />
            <PlanetaryBioSection
              icon="♂"
              label="My Mars"
              subtitle="How I work & fight"
              value={form.mars_bio}
              isEditing={isEditing}
              onChange={v => setForm(f => ({ ...f, mars_bio: v }))}
            />
          </div>

          {/* Tip to populate Big Three */}
          {profile && !profile.sun_sign && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 glass-panel p-4 rounded-xl text-center cosmic-border"
            >
              <p className="text-sm text-muted-foreground">
                🌟 Your Big Three aren't set yet! Go back and generate your natal chart — your Sun, Moon & Rising signs will automatically populate here.
              </p>
              <Button variant="outline" size="sm" className="mt-3 gap-2" onClick={() => navigate("/")}>
                <Sparkles className="h-4 w-4" />
                Generate My Chart
              </Button>
            </motion.div>
          )}
        </main>
      </div>
    </AuthGate>
  );
};

export default ProfilePage;
