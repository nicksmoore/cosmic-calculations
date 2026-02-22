import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Video, Mic, MicOff, Camera, CameraOff, Users, Radio, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import StarField from "@/components/StarField";
import { useFriends } from "@/hooks/useFriends";
import { useToast } from "@/hooks/use-toast";

export default function LiveVideo() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedInvitees, setSelectedInvitees] = useState<string[]>([]);
  const [pulledInIds, setPulledInIds] = useState<string[]>([]);
  const [inviteCandidate, setInviteCandidate] = useState("");
  const { data: friends } = useFriends();
  const { toast } = useToast();
  const liveParticipants = useMemo(() => {
    const list = friends ?? [];
    return [...list].sort((a, b) => {
      const aPulled = pulledInIds.includes(a.user_id) ? 2 : selectedInvitees.includes(a.user_id) ? 1 : 0;
      const bPulled = pulledInIds.includes(b.user_id) ? 2 : selectedInvitees.includes(b.user_id) ? 1 : 0;
      return bPulled - aPulled;
    });
  }, [friends, selectedInvitees, pulledInIds]);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  useEffect(() => {
    return () => {
      if (!stream) return;
      for (const track of stream.getTracks()) track.stop();
    };
  }, [stream]);

  const startCamera = async () => {
    setError(null);
    try {
      const nextStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setStream(nextStream);
      setCameraOn(true);
      setMicOn(true);
    } catch {
      setError("Camera or microphone access was denied.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      for (const track of stream.getTracks()) track.stop();
    }
    setStream(null);
    setCameraOn(false);
    setMicOn(false);
  };

  const toggleMic = () => {
    if (!stream) return;
    const audioTracks = stream.getAudioTracks();
    const nextMic = !micOn;
    for (const track of audioTracks) track.enabled = nextMic;
    setMicOn(nextMic);
  };

  const inviteStarseeds = async () => {
    const selectedFriends = (friends ?? []).filter((f) => selectedInvitees.includes(f.user_id));
    if (selectedFriends.length === 0) {
      toast({
        variant: "destructive",
        title: "Pick Starseeds first",
        description: "Select at least one friend avatar to invite to live.",
      });
      return;
    }

    setPulledInIds((prev) => Array.from(new Set([...prev, ...selectedInvitees])));
    toast({
      title: "Starseeds pulled in",
      description: `${selectedFriends.map((f) => f.display_name ?? "Starseed").join(", ")} added to live.`,
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <StarField />
      <main className="mx-auto w-full max-w-6xl px-4 pt-6 pb-28 md:px-8 md:pb-10 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="liquid-glass rounded-2xl p-4 sm:p-6 mb-6 overflow-hidden relative"
        >
          <div className="absolute -top-20 -right-16 h-44 w-44 rounded-full bg-fuchsia-500/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-10 h-52 w-52 rounded-full bg-cyan-500/15 blur-3xl pointer-events-none" />
          <div className="flex items-center gap-2 mb-3 relative">
            <Video className="h-5 w-5 text-accent" />
            <h1 className="kinetic-title text-2xl font-serif text-ethereal">The Eleventh House</h1>
            <div className="ml-auto inline-flex items-center gap-1 rounded-full border border-red-400/40 bg-red-500/20 px-2.5 py-1 text-[11px] text-red-200">
              <Radio className="h-3 w-3" />
              Live Hangout
            </div>
          </div>
          <p className="text-sm text-muted-foreground relative">
            Cosmic video lounge for real-time Starseed conversations with a shared stage and active participant wall.
          </p>
        </motion.div>

        <section className="glass-panel rounded-xl p-4 mb-6">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Starseeds Online · Add from Dropdown</p>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <select
              value={inviteCandidate}
              onChange={(e) => setInviteCandidate(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm min-w-[220px]"
            >
              <option value="">Select Starseed to auto-pull in</option>
              {(friends ?? []).map((friend) => (
                <option key={friend.user_id} value={friend.user_id}>
                  {friend.display_name ?? "Starseed"}
                </option>
              ))}
            </select>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (!inviteCandidate) return;
                setSelectedInvitees((prev) => (prev.includes(inviteCandidate) ? prev : [...prev, inviteCandidate]));
                setInviteCandidate("");
              }}
            >
              Add to Live
            </Button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {(friends ?? []).map((friend) => (
              <button
                key={friend.user_id}
                className="flex-shrink-0 text-center"
                onClick={() =>
                  setSelectedInvitees((prev) =>
                    prev.includes(friend.user_id)
                      ? prev.filter((id) => id !== friend.user_id)
                      : [...prev, friend.user_id]
                  )
                }
                type="button"
              >
                <div
                  className={`h-16 w-16 rounded-full p-[2px] ${
                    pulledInIds.includes(friend.user_id)
                      ? "bg-gradient-to-br from-emerald-300 to-cyan-400"
                      : selectedInvitees.includes(friend.user_id)
                      ? "bg-gradient-to-br from-accent to-fuchsia-400"
                      : "bg-gradient-to-br from-pink-500 to-yellow-400"
                  }`}
                >
                  {friend.avatar_url ? (
                    <img
                      src={friend.avatar_url}
                      alt={friend.display_name ?? "Starseed"}
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full rounded-full bg-background/90 flex items-center justify-center font-serif">
                      {(friend.display_name ?? "?").charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {friend.display_name ?? "Starseed"} {pulledInIds.includes(friend.user_id) ? "●" : selectedInvitees.includes(friend.user_id) ? "✓" : ""}
                </p>
              </button>
            ))}
            {(friends ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground py-2">No Starseeds online yet.</p>
            )}
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel rounded-xl p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Main Stage</p>
              <div className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-accent" />
                {(friends ?? []).length + (cameraOn ? 1 : 0)} in session
              </div>
            </div>
            <div className="relative aspect-video w-full rounded-xl border border-fuchsia-400/30 bg-black/40 overflow-hidden mb-4">
              <div className="absolute inset-0 bg-gradient-to-tr from-fuchsia-500/20 via-transparent to-cyan-400/15 pointer-events-none" />
              {cameraOn ? (
                <video ref={videoRef} className="h-full w-full object-cover" autoPlay muted playsInline />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-sm text-muted-foreground">
                  Camera preview is off. Start your stage below.
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {!cameraOn ? (
                <Button type="button" onClick={startCamera} className="gap-2 bg-gradient-to-r from-fuchsia-500 to-indigo-500 text-white border-0">
                  <Camera className="h-4 w-4" />
                  Go Live Preview
                </Button>
              ) : (
                <Button type="button" variant="outline" onClick={stopCamera} className="gap-2">
                  <CameraOff className="h-4 w-4" />
                  End Hangout
                </Button>
              )}

              <Button
                type="button"
                variant="outline"
                onClick={toggleMic}
                disabled={!cameraOn}
                className="gap-2"
              >
                {micOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                {micOn ? "Mute Mic" : "Unmute Mic"}
              </Button>
              <Button type="button" className="gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white border-0" onClick={inviteStarseeds}>
                <Users className="h-4 w-4" />
                Pull In Starseeds ({selectedInvitees.length})
              </Button>
            </div>

            {error && <p className="text-sm text-destructive mt-3">{error}</p>}
          </motion.section>

          <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-panel rounded-xl p-4 sm:p-5 h-fit">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Participants</p>
            <div className="grid grid-cols-2 gap-3">
              {liveParticipants.map((friend) => (
                <motion.div
                  key={friend.user_id}
                  whileHover={{ y: -3, scale: 1.01 }}
                  className={`rounded-lg border p-3 ${
                    selectedInvitees.includes(friend.user_id)
                      ? "border-accent/50 bg-accent/10"
                      : "border-border/40 bg-card/50"
                  }`}
                >
                  <div className="aspect-square rounded-md bg-black/40 overflow-hidden mb-2">
                    {friend.avatar_url ? (
                      <img src={friend.avatar_url} alt={friend.display_name ?? "Participant"} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                        {(friend.display_name ?? "?").charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{friend.display_name ?? "Starseed"}</p>
                  {pulledInIds.includes(friend.user_id) && (
                    <p className="text-[10px] text-emerald-300 mt-1">On Live</p>
                  )}
                </motion.div>
              ))}
              {(friends ?? []).length === 0 && (
                <p className="text-sm text-muted-foreground col-span-2">
                  When your Starseeds join, they’ll appear here as participant tiles.
                </p>
              )}
            </div>
          </motion.section>
        </div>
      </main>
    </div>
  );
}
