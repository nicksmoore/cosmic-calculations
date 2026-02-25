import { useMemo } from "react";
import { motion } from "framer-motion";
import { Video, Radio } from "lucide-react";
import StarField from "@/components/StarField";
import { useAuth } from "@/hooks/useAuth";

const LIVEKIT_MEET_URL = "https://meet.livekit.io/";

export default function LiveVideo() {
  const { user } = useAuth();

  const displayName = useMemo(() => {
    return user?.name?.trim() || user?.email?.split("@")[0] || "Starseed";
  }, [user?.name, user?.email]);

  const livekitPreviewUrl = useMemo(() => {
    const params = new URLSearchParams({
      name: displayName,
    });
    return `${LIVEKIT_MEET_URL}?${params.toString()}`;
  }, [displayName]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <StarField />

      <main className="mx-auto w-full max-w-6xl px-4 pt-6 pb-28 md:px-8 md:pb-10 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="liquid-glass rounded-2xl p-4 sm:p-6 mb-4 overflow-hidden relative"
        >
          <div className="flex items-center gap-2 mb-2 relative">
            <Video className="h-5 w-5 text-accent" />
            <h1 className="kinetic-title text-2xl font-serif text-ethereal">The Eleventh House</h1>
            <div className="ml-auto inline-flex items-center gap-1 rounded-full border border-red-400/40 bg-red-500/20 px-2.5 py-1 text-[11px] text-red-200">
              <Radio className="h-3 w-3" />
              Live Hangout
            </div>
          </div>
          <p className="text-sm text-muted-foreground relative">
            LiveKit preview. If embed permissions are blocked by the browser, open it in a new tab.
          </p>
        </motion.div>

        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel rounded-xl p-2 sm:p-3"
        >
          <div className="mb-2 flex justify-end">
            <a
              href={livekitPreviewUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-md border border-border/40 bg-card/60 px-3 py-1.5 text-xs text-foreground hover:bg-card/80 transition-colors"
            >
              Open LiveKit in New Tab
            </a>
          </div>
          <div className="relative w-full overflow-hidden rounded-lg border border-fuchsia-400/30 bg-black/40">
            <div className="aspect-[16/10] w-full">
              <iframe
                src={livekitPreviewUrl}
                title="Eleventh House Live"
                allow="camera; microphone; fullscreen; display-capture; autoplay"
                className="h-full w-full border-0"
                referrerPolicy="origin"
              />
            </div>
          </div>
        </motion.section>
      </main>
    </div>
  );
}
