/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Search, Sparkles, UserCheck, UserPlus, Send, Users, Smile, Image as ImageIcon, Paperclip, Mic, MicOff, Film } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import StarField from "@/components/StarField";
import { CosmicLoaderPage } from "@/components/ui/CosmicLoader";
import { useMatchFeed, MatchProfile } from "@/hooks/useMatchFeed";
import { useProfileDirectory, DirectoryProfile } from "@/hooks/useProfileDirectory";
import { useToggleFollow } from "@/hooks/useFollow";
import { useFriends } from "@/hooks/useFriends";
import { useConversation, useSendDirectMessage } from "@/hooks/useDirectMessages";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";
import { useFriendNotifications } from "@/hooks/useFriendNotifications";
import { BirthData } from "@/components/intake/BirthDataForm";
import { timezoneFromLongitude } from "@/lib/timezone";
import { calculateChartForProfile } from "@/lib/calculateChartForProfile";
import { calculateCompatibility } from "@/lib/synastry/compatibility";
import { useAuth as useClerkAuth } from "@clerk/clerk-react";
import { supabase } from "@/integrations/supabase/client";

const SIGN_SYMBOLS: Record<string, string> = {
  Aries: "♈", Taurus: "♉", Gemini: "♊", Cancer: "♋",
  Leo: "♌", Virgo: "♍", Libra: "♎", Scorpio: "♏",
  Sagittarius: "♐", Capricorn: "♑", Aquarius: "♒", Pisces: "♓",
};

const ASTRO_EMOJIS = ["♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓", "🌙", "☀️", "🪐", "✨"];
const EMOJI_LIBRARY = [
  "😀","😁","😂","🤣","😊","😍","🥰","😎","🤩","🥳","😴","🤯","😭","😡","🙏","💫","✨","🔥","🌙","☀️","⭐","🪐",
  "🌌","💜","💙","🩵","💚","🧡","❤️","🫶","💯","✅","📿","🧿","🔮","🕯️","📜","🎧","🎶","🎨","🧪","🛸","🪬","🌠",
];

type ChatAttachmentType = "image" | "gif" | "file" | "audio";
interface ChatAttachment {
  type: ChatAttachmentType;
  url: string;
  name?: string;
  size?: number;
}
interface ChatPayload {
  text: string;
  attachments?: ChatAttachment[];
}

function parseChatMessage(raw: string): ChatPayload {
  try {
    const parsed = JSON.parse(raw) as ChatPayload;
    if (parsed && typeof parsed.text === "string") return parsed;
  } catch {
    // Plain text fallback
  }
  return { text: raw };
}

function stringifyChatMessage(payload: ChatPayload) {
  return JSON.stringify(payload);
}

function scoreColor(score: number) {
  if (score >= 70) return "from-emerald-500 to-teal-400";
  if (score >= 45) return "from-amber-500 to-yellow-400";
  return "from-rose-500 to-pink-400";
}

function MatchCard({ match, onClick }: { match: MatchProfile; onClick: () => void }) {
  const { profile, score } = match;
  const placements = [
    profile.sun_sign ? `☀${SIGN_SYMBOLS[profile.sun_sign] ?? ""}` : null,
    profile.moon_sign ? `☽${SIGN_SYMBOLS[profile.moon_sign] ?? ""}` : null,
    profile.rising_sign ? `↑${SIGN_SYMBOLS[profile.rising_sign] ?? ""}` : null,
  ].filter(Boolean) as string[];

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
          {placements.length > 0 && (
            <p className="text-muted-foreground text-xs mt-0.5">{placements.join(" • ")}</p>
          )}
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

function DirectoryCard({
  profile,
  onClick,
}: {
  profile: DirectoryProfile;
  onClick: () => void;
}) {
  const toggleFollow = useToggleFollow(profile.user_id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel rounded-xl p-4"
    >
      <div className="flex items-center gap-3">
        <button onClick={onClick} className="flex-shrink-0">
          <Avatar className="h-10 w-10 border border-border/30">
            <AvatarImage src={profile.avatar_url ?? undefined} />
            <AvatarFallback className="bg-primary/20 text-primary text-sm font-serif">
              {(profile.display_name ?? "?").charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </button>

        <div className="min-w-0 flex-1">
          <button onClick={onClick} className="text-left">
            <p className="font-medium text-sm truncate">{profile.display_name ?? "Cosmic Traveler"}</p>
            <p className="text-xs text-muted-foreground truncate">
              {profile.current_status || "Open profile"}
            </p>
          </button>
        </div>

        <Button
          size="sm"
          variant={profile.is_following ? "outline" : "default"}
          disabled={toggleFollow.isPending}
          className="gap-1.5"
          onClick={() => toggleFollow.mutate(profile.is_following)}
        >
          {profile.is_following ? <UserCheck className="h-3.5 w-3.5" /> : <UserPlus className="h-3.5 w-3.5" />}
          {profile.is_following ? "Following" : "Add"}
        </Button>
      </div>
    </motion.div>
  );
}

export default function Friends() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { getToken } = useClerkAuth();
  const { profile } = useProfile();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [groupDraft, setGroupDraft] = useState("");
  const [groupSending, setGroupSending] = useState(false);
  const [groupLog, setGroupLog] = useState<Array<{ id: string; text: string; delivered: number; total: number }>>([]);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [gifOpen, setGifOpen] = useState(false);
  const [gifQuery, setGifQuery] = useState("astrology");
  const [gifResults, setGifResults] = useState<string[]>([]);
  const [gifLoading, setGifLoading] = useState(false);
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const notificationsRef = useRef<HTMLDivElement | null>(null);

  const { data: matches, isLoading, isError } = useMatchFeed();
  const { data: directory, isLoading: directoryLoading } = useProfileDirectory(search);
  const { data: friends, isLoading: friendsLoading } = useFriends();
  const { data: friendNotifications } = useFriendNotifications();

  const selectedFriend = useMemo(
    () => friends?.find((f) => f.user_id === selectedFriendId) ?? null,
    [friends, selectedFriendId]
  );
  const friendSynastryByUserId = useMemo(() => {
    const toBirthData = (p: {
      display_name: string | null;
      birth_date: string | null;
      birth_time: string | null;
      birth_location: string | null;
      birth_lat: number | null;
      birth_lng: number | null;
      time_unknown: boolean | null;
    }): BirthData | null => {
      if (!p.birth_date || !p.birth_lat || !p.birth_lng) return null;
      return {
        name: p.display_name ?? "Unknown",
        birthDate: p.birth_date,
        birthTime: p.birth_time ?? "12:00",
        timeUnknown: p.time_unknown ?? false,
        location: p.birth_location ?? "",
        latitude: p.birth_lat,
        longitude: p.birth_lng,
        timezone: timezoneFromLongitude(p.birth_lng),
      };
    };

    const map = new Map<string, number>();
    if (!profile || !friends || friends.length === 0) return map;
    const myBirthData = toBirthData(profile);
    if (!myBirthData) return map;
    const myChart = calculateChartForProfile(myBirthData);
    if (!myChart) return map;

    for (const friend of friends) {
      const friendBirthData = toBirthData(friend);
      if (!friendBirthData) continue;
      const friendChart = calculateChartForProfile(friendBirthData);
      if (!friendChart) continue;
      const { overall } = calculateCompatibility(myChart.planets, friendChart.planets);
      map.set(friend.user_id, overall);
    }
    return map;
  }, [friends, profile]);
  const normalizedCurrentGender = String(
    profile?.gender ?? ((user as unknown as { unsafeMetadata?: Record<string, unknown> })?.unsafeMetadata?.gender ?? "")
  )
    .trim()
    .toLowerCase();

  const { data: messages, isLoading: messagesLoading } = useConversation(selectedFriendId);
  const sendMessage = useSendDirectMessage(selectedFriendId);
  const stats = useMemo(() => ({
    notifications: friendNotifications?.count ?? 0,
    starseeds: friends?.length ?? 0,
    directory: directory?.length ?? 0,
    suggestions: matches?.length ?? 0,
  }), [friendNotifications?.count, friends?.length, directory?.length, matches?.length]);

  useEffect(() => {
    if (!selectedFriendId && friends && friends.length > 0) {
      setSelectedFriendId(friends[0].user_id);
    }
  }, [friends, selectedFriendId]);

  useEffect(() => {
    if (searchParams.get("view") !== "notifications") return;
    notificationsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [searchParams]);

  useEffect(() => {
    if (!gifOpen) return;
    const handle = setTimeout(() => {
      searchGifs(gifQuery.trim() || "astrology");
    }, 250);
    return () => clearTimeout(handle);
  }, [gifOpen, gifQuery]);

  const handleSend = async () => {
    const trimmed = draft.trim();
    if (!trimmed && attachments.length === 0) return;
    if (!selectedFriendId) {
      toast({
        variant: "destructive",
        title: "Select a friend first",
        description: "Choose a friend from the list before sending a message.",
      });
      return;
    }
    try {
      await sendMessage.mutateAsync(
        stringifyChatMessage({
          text: trimmed,
          attachments: attachments.length ? attachments : undefined,
        })
      );
      setDraft("");
      setAttachments([]);
      setEmojiOpen(false);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Message failed",
        description: err instanceof Error ? err.message : "Could not send message",
      });
    }
  };

  const handleGroupSend = async () => {
    const text = groupDraft.trim();
    if (!text) return;
    if (!user) return;
    const recipients = (friends ?? []).map((f) => f.user_id);
    if (recipients.length === 0) {
      toast({
        variant: "destructive",
        title: "No Starseeds to message",
        description: "Add mutual Starseeds first to use group chat.",
      });
      return;
    }

    try {
      setGroupSending(true);
      const token = await getToken({ template: "supabase" });
      if (!token) throw new Error("Could not get auth token");

      const outcomes = await Promise.allSettled(
        recipients.map((recipientUserId) =>
          supabase.functions.invoke("send-direct-message", {
            headers: { Authorization: `Bearer ${token}` },
            body: { userId: user.id, recipientUserId, content: text },
          })
        )
      );

      const delivered = outcomes.filter((o) => o.status === "fulfilled").length;
      setGroupLog((prev) => [
        {
          id: crypto.randomUUID(),
          text,
          delivered,
          total: recipients.length,
        },
        ...prev,
      ]);
      setGroupDraft("");
      toast({
        title: "Group message sent",
        description: `Delivered to ${delivered} of ${recipients.length} Starseeds.`,
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Group message failed",
        description: err instanceof Error ? err.message : "Could not send group message",
      });
    } finally {
      setGroupSending(false);
    }
  };

  const uploadAttachment = async (file: File, type: ChatAttachmentType) => {
    if (!user) return;
    setUploading(true);
    try {
      const ext = file.name.includes(".") ? file.name.split(".").pop() : "bin";
      const path = `${user.id}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("chat-uploads").upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });
      if (error) throw error;
      const { data } = supabase.storage.from("chat-uploads").getPublicUrl(path);
      setAttachments((prev) => [...prev, { type, url: data.publicUrl, name: file.name, size: file.size }]);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: err instanceof Error ? err.message : "Could not upload attachment",
      });
    } finally {
      setUploading(false);
    }
  };

  const searchGifs = async (term: string) => {
    try {
      setGifLoading(true);
      const apiKey = (import.meta as any).env?.VITE_GIPHY_API_KEY || "dc6zaTOxFJmzC";
      const endpoint = `https://api.giphy.com/v1/gifs/search?api_key=${encodeURIComponent(apiKey)}&q=${encodeURIComponent(term)}&limit=18&rating=pg-13`;
      const response = await fetch(endpoint);
      if (!response.ok) throw new Error("GIF search failed");
      const data = await response.json();
      const urls = (data?.data ?? [])
        .map((item: any) => item?.images?.fixed_height?.url as string | undefined)
        .filter(Boolean) as string[];
      setGifResults(urls);
    } catch {
      toast({
        variant: "destructive",
        title: "GIF search unavailable",
        description: "Could not load GIFs right now.",
      });
    } finally {
      setGifLoading(false);
    }
  };

  const startVoiceNote = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };
      recorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const file = new File([blob], `voice-note-${Date.now()}.webm`, { type: "audio/webm" });
        await uploadAttachment(file, "audio");
        stream.getTracks().forEach((t) => t.stop());
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
    } catch {
      toast({
        variant: "destructive",
        title: "Microphone blocked",
        description: "Allow microphone access to record a voice note.",
      });
    }
  };

  const stopVoiceNote = () => {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;
    setRecording(false);
  };

  if (friendsLoading) {
    return <CosmicLoaderPage />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <StarField />
      <main className="mx-auto w-full max-w-7xl px-4 pt-6 pb-28 md:px-8 md:pb-10 relative z-10">
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="kinetic-title text-2xl font-serif text-ethereal mb-4"
        >
          Starseeds
        </motion.h1>

        <section className="bento-grid mb-6">
          <article className="bento-tile col-span-6 lg:col-span-3 p-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Notifications</p>
            <p className="text-2xl font-serif text-foreground mt-1">{stats.notifications}</p>
          </article>
          <article className="bento-tile col-span-6 lg:col-span-3 p-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Starseeds</p>
            <p className="text-2xl font-serif text-foreground mt-1">{stats.starseeds}</p>
          </article>
          <article className="bento-tile col-span-6 lg:col-span-3 p-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Directory Results</p>
            <p className="text-2xl font-serif text-foreground mt-1">{stats.directory}</p>
          </article>
          <article className="bento-tile col-span-6 lg:col-span-3 p-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Synastry Matches</p>
            <p className="text-2xl font-serif text-foreground mt-1">{stats.suggestions}</p>
          </article>
        </section>

        <div className="grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
          <section className="space-y-4">
            <div
              ref={notificationsRef}
              className={`glass-panel rounded-xl p-4 ${searchParams.get("view") === "notifications" ? "ring-1 ring-accent/50" : ""}`}
            >
              <p className="text-sm font-medium mb-2">Starseed Notifications</p>
              {(friendNotifications?.profiles ?? []).length === 0 ? (
                <p className="text-xs text-muted-foreground">No new friend adds right now.</p>
              ) : (
                <div className="space-y-2">
                  {friendNotifications!.profiles.map((p) => (
                    <DirectoryCard
                      key={`notif-${p.user_id}`}
                      profile={{
                        user_id: p.user_id,
                        display_name: p.display_name,
                        avatar_url: p.avatar_url,
                        sun_sign: p.sun_sign,
                        moon_sign: null,
                        rising_sign: null,
                        current_status: "Added you",
                        is_public: true,
                        is_following: false,
                      }}
                      onClick={() => navigate(`/profile/${p.user_id}`)}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="glass-panel rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium">Find People</p>
              </div>
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by display name or user id..."
                className="bg-input/40 border-border/40"
              />
              <div className="mt-3 space-y-2 max-h-72 overflow-y-auto pr-1">
                {(directory ?? []).slice(0, 12).map((p) => (
                  <DirectoryCard
                    key={p.user_id}
                    profile={p}
                    onClick={() => navigate(`/profile/${p.user_id}`)}
                  />
                ))}
                {directoryLoading && (
                  <div className="text-xs text-muted-foreground py-2">Searching profiles...</div>
                )}
              </div>
            </div>

            <div className="glass-panel rounded-xl p-4">
              <p className="text-sm font-medium mb-2">Your Starseeds</p>
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {(friends ?? []).map((friend) => {
                  const active = friend.user_id === selectedFriendId;
                  const normalizedFriendGender = String(friend.gender ?? "").trim().toLowerCase();
                  const isKnownCurrent = ["male", "man", "female", "woman"].includes(normalizedCurrentGender);
                  const isKnownFriend = ["male", "man", "female", "woman"].includes(normalizedFriendGender);
                  const currentCanonical = ["female", "woman"].includes(normalizedCurrentGender) ? "female" : "male";
                  const friendCanonical = ["female", "woman"].includes(normalizedFriendGender) ? "female" : "male";
                  const oppositeGender = isKnownCurrent && isKnownFriend && currentCanonical !== friendCanonical;
                  const friendScore = friendSynastryByUserId.get(friend.user_id);
                  return (
                    <button
                      key={friend.user_id}
                      onClick={() => setSelectedFriendId(friend.user_id)}
                      className={`w-full text-left rounded-lg px-3 py-2 transition-colors ${
                        active ? "bg-primary/20" : "hover:bg-white/5"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8 border border-border/30">
                          <AvatarImage src={friend.avatar_url ?? undefined} />
                          <AvatarFallback className="bg-primary/20 text-primary text-xs font-serif">
                            {(friend.display_name ?? "?").charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-sm truncate">{friend.display_name ?? "Cosmic Traveler"}</p>
                          <div className="flex items-center gap-2">
                            <p className="text-[11px] text-muted-foreground truncate">
                              {friend.sun_sign ? `${SIGN_SYMBOLS[friend.sun_sign] ?? ""} ${friend.sun_sign}` : "No sun sign yet"}
                            </p>
                            {oppositeGender && typeof friendScore === "number" && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full border border-emerald-500/30 text-emerald-300">
                                {friendScore}% synastry
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
                {friendsLoading && (
                  <div className="text-xs text-muted-foreground py-2">Loading friends...</div>
                )}
                {!friendsLoading && (friends?.length ?? 0) === 0 && (
                  <p className="text-xs text-muted-foreground py-2">
                    No friends yet. Add someone, then wait for them to follow you back.
                  </p>
                )}
              </div>
            </div>

            <div>
              <h2 className="text-sm uppercase tracking-wider text-muted-foreground mb-3">Suggested Synastry</h2>
              {isLoading && (
                <div className="flex justify-center py-8" role="status" aria-label="Loading matches">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden="true" />
                </div>
              )}
              {isError && (
                <p className="text-center text-destructive py-4 text-sm">
                  Could not load suggestions.
                </p>
              )}
              {!isLoading && !isError && (!matches || matches.length === 0) && (
                <div className="text-center py-6 text-muted-foreground">
                  <Sparkles className="h-6 w-6 mx-auto mb-2 opacity-40" aria-hidden="true" />
                  <p className="text-xs">No suggestions yet.</p>
                </div>
              )}
              <div className="space-y-3">
                {(matches ?? []).slice(0, 5).map((match) => (
                  <MatchCard
                    key={match.profile.user_id}
                    match={match}
                    onClick={() => navigate(`/profile/${match.profile.user_id}`)}
                  />
                ))}
              </div>
            </div>
          </section>

          <section className="glass-panel rounded-xl p-4 min-h-[520px] flex flex-col">
            <div className="rounded-lg border border-border/30 bg-black/10 p-3 mb-3">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-accent" />
                <p className="text-sm font-medium">Starseed Group Chat</p>
              </div>
              <div className="flex gap-2">
                <Textarea
                  value={groupDraft}
                  onChange={(e) => setGroupDraft(e.target.value)}
                  placeholder="Send one message to all your Starseeds..."
                  className="min-h-[70px]"
                  disabled={groupSending}
                />
                <Button
                  type="button"
                  className="shrink-0 gap-1.5"
                  onClick={handleGroupSend}
                  disabled={groupSending || !groupDraft.trim()}
                >
                  <Send className="h-4 w-4" />
                  Blast
                </Button>
              </div>
              {groupLog.length > 0 && (
                <div className="mt-2 space-y-1.5 max-h-24 overflow-y-auto pr-1">
                  {groupLog.slice(0, 4).map((entry) => (
                    <p key={entry.id} className="text-xs text-muted-foreground">
                      {entry.text} · {entry.delivered}/{entry.total} delivered
                    </p>
                  ))}
                </div>
              )}
            </div>

            <div className="border-b border-border/30 pb-3 mb-3">
              <p className="text-sm font-medium">
                {selectedFriend ? `Chat with ${selectedFriend.display_name ?? "Friend"}` : "Select a friend to message"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Messaging is available for mutual friends.
              </p>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {messagesLoading && selectedFriendId && (
                <div className="text-xs text-muted-foreground">Loading messages...</div>
              )}
              {!selectedFriendId && (
                <p className="text-sm text-muted-foreground">Choose someone from your friends list to start chatting.</p>
              )}
              {selectedFriendId && (messages?.length ?? 0) === 0 && (
                <p className="text-sm text-muted-foreground">No messages yet. Send the first cosmic note.</p>
              )}

              {(messages ?? []).map((message) => {
                const mine = message.sender_id === user?.id;
                const parsed = parseChatMessage(message.content);
                return (
                  <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                        mine ? "bg-primary/25 border border-primary/30" : "bg-white/5 border border-border/40"
                      }`}
                    >
                      {parsed.text}
                      {parsed.attachments?.length ? (
                        <div className="mt-2 space-y-2">
                          {parsed.attachments.map((a, idx) => (
                            <div key={`${a.url}-${idx}`}>
                              {a.type === "image" || a.type === "gif" ? (
                                <img src={a.url} alt={a.name ?? a.type} className="max-h-48 rounded-md border border-border/30" />
                              ) : a.type === "audio" ? (
                                <audio controls src={a.url} className="w-full" />
                              ) : (
                                <a className="text-xs underline text-accent" href={a.url} target="_blank" rel="noreferrer">
                                  {a.name ?? "Open file"}
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 mt-3 border-t border-border/30 space-y-2">
              <div className="flex items-center flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setEmojiOpen((v) => !v);
                    setGifOpen(false);
                  }}
                  className="h-8 min-w-8 rounded-md bg-white/5 hover:bg-white/10 px-2"
                  aria-label="Open emoji picker"
                >
                  <Smile className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setGifOpen((v) => !v);
                    setEmojiOpen(false);
                  }}
                  className="h-8 min-w-8 rounded-md bg-white/5 hover:bg-white/10 px-2"
                  aria-label="Open GIF picker"
                >
                  <Film className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => imageInputRef.current?.click()} className="h-8 min-w-8 rounded-md bg-white/5 hover:bg-white/10 px-2" aria-label="Add image">
                  <ImageIcon className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => fileInputRef.current?.click()} className="h-8 min-w-8 rounded-md bg-white/5 hover:bg-white/10 px-2" aria-label="Add file">
                  <Paperclip className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={recording ? stopVoiceNote : startVoiceNote}
                  className={`h-8 min-w-8 rounded-md px-2 ${recording ? "bg-red-500/30 text-red-200" : "bg-white/5 hover:bg-white/10"}`}
                  aria-label={recording ? "Stop voice note" : "Record voice note"}
                >
                  {recording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </button>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) uploadAttachment(f, "image");
                    e.currentTarget.value = "";
                  }}
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) uploadAttachment(f, "file");
                    e.currentTarget.value = "";
                  }}
                />
              </div>
              {gifOpen && (
                <div className="rounded-lg border border-border/30 bg-card/50 p-2 space-y-2">
                  <Input
                    value={gifQuery}
                    onChange={(e) => setGifQuery(e.target.value)}
                    placeholder="Search GIPHY..."
                    className="h-8"
                  />
                  <div className="grid grid-cols-3 gap-1.5 max-h-48 overflow-y-auto">
                    {gifLoading && (
                      <div className="col-span-3 text-xs text-muted-foreground py-3 text-center">Loading GIFs...</div>
                    )}
                    {!gifLoading && gifResults.map((url) => (
                      <button
                        key={url}
                        type="button"
                        className="rounded-md overflow-hidden border border-border/30 hover:border-accent/40"
                        onClick={() => {
                          setAttachments((prev) => [...prev, { type: "gif", url }]);
                          setGifOpen(false);
                        }}
                      >
                        <img src={url} alt="GIF" className="h-20 w-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {emojiOpen && (
                <div className="rounded-lg border border-border/30 bg-card/50 p-2 max-h-40 overflow-y-auto">
                  <div className="flex flex-wrap gap-1">
                    {[...EMOJI_LIBRARY, ...ASTRO_EMOJIS].map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => setDraft((v) => `${v}${emoji}`)}
                        className="h-7 min-w-7 rounded-md bg-white/5 hover:bg-white/10 text-sm px-1"
                        aria-label={`Insert ${emoji}`}
                        type="button"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {attachments.map((a, idx) => (
                    <span key={`${a.url}-${idx}`} className="text-[11px] rounded-full border border-border/40 bg-white/5 px-2 py-0.5">
                      {a.type}: {a.name ?? "attached"}
                    </span>
                  ))}
                  <button type="button" className="text-[11px] underline text-muted-foreground" onClick={() => setAttachments([])}>
                    Clear
                  </button>
                </div>
              )}
              <div className="rounded-lg border border-border/30 bg-black/10 p-2">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Community Guidelines</p>
                <p className="text-xs text-muted-foreground">
                  Be respectful and consent-based. No harassment, hate, or explicit content. No scams or misleading offers. Respect privacy and never share private data without permission.
                </p>
              </div>
              {recording && (
                <p className="text-xs text-red-200">Recording voice note... tap mic again to send.</p>
              )}
              <div className="flex items-center gap-2">
                <Input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder={selectedFriendId ? "Write a message..." : "Select a friend, then send your message"}
                  disabled={sendMessage.isPending || uploading}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                />
                <Button
                  onClick={handleSend}
                  disabled={!selectedFriendId || (!draft.trim() && attachments.length === 0) || sendMessage.isPending || uploading}
                  className="gap-1.5"
                >
                  <Send className="h-4 w-4" /> Send
                </Button>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
