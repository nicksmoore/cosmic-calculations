import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useCreatePost } from "@/hooks/useCreatePost";
import { useDailyTransits } from "@/hooks/useDailyTransits";
import { getPersonalTransits, TransitTag } from "@/lib/transitEngine";
import { NatalChartData } from "@/data/natalChartData";
import { useToast } from "@/hooks/use-toast";

const MAX_CHARS = 280;

interface TransitPillProps {
  tag: TransitTag;
  onRemove?: () => void;
  isCollective?: boolean;
}

function TransitPill({ tag, onRemove, isCollective }: TransitPillProps) {
  const baseClass = isCollective
    ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
    : tag.is_primary
    ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
    : "bg-white/5 text-muted-foreground border-border/30";

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full border ${baseClass}`}
    >
      {tag.display_name}
      {tag.is_primary && !isCollective && (
        <span className="text-yellow-400 text-[10px]">●</span>
      )}
      {onRemove && (
        <button
          onClick={onRemove}
          className="ml-0.5 opacity-60 hover:opacity-100 text-[10px] leading-none"
          aria-label={`Remove ${tag.display_name}`}
        >
          ×
        </button>
      )}
    </span>
  );
}

interface PostComposerProps {
  chartData: NatalChartData | null;
  onPosted?: () => void;
}

export default function PostComposer({ chartData, onPosted }: PostComposerProps) {
  const { user } = useAuth();
  const { data: dailyTransits } = useDailyTransits();
  const createPost = useCreatePost();
  const { toast } = useToast();

  const [content, setContent] = useState("");
  const [personalTags, setPersonalTags] = useState<TransitTag[]>([]);
  const [tagsComputed, setTagsComputed] = useState(false);

  const handleFocus = useCallback(() => {
    if (tagsComputed || !chartData) return;
    const tags = getPersonalTransits(
      chartData.planets.map((p) => ({ name: p.name, longitude: p.longitude })),
      {
        ascendant: { longitude: chartData.angles.ascendant.longitude },
        midheaven: { longitude: chartData.angles.midheaven.longitude },
      }
    );
    setPersonalTags(tags);
    setTagsComputed(true);
  }, [chartData, tagsComputed]);

  const removeTag = (index: number) => {
    setPersonalTags((prev) => prev.filter((_, i) => i !== index));
  };

  const collectiveTag: TransitTag | null = dailyTransits
    ? {
        transit_key:       dailyTransits.transit_key,
        transiting_planet: dailyTransits.transits.find(t => t.transit_key === dailyTransits.transit_key)?.transiting_planet ?? dailyTransits.dominant_transit.split(" ")[0],
        aspect:            "collective",
        natal_point:       "collective",
        display_name:      dailyTransits.dominant_transit,
        orb:               0,
        is_primary:        true,
        is_personal:       false,
        is_applying:       true,
      }
    : null;

  const allTags: TransitTag[] = collectiveTag
    ? [collectiveTag, ...personalTags]
    : personalTags;

  const handleSubmit = async () => {
    if (!content.trim() || content.length > MAX_CHARS) return;

    const transitSnapshot = dailyTransits?.transits.slice(0, 3).map(t => ({
      planet:       t.transiting_planet,
      display_name: t.display_name,
      vibe:         t.vibe ?? "",
    })) ?? [];

    try {
      await createPost.mutateAsync({ content: content.trim(), transitTags: allTags, transitSnapshot });
      setContent("");
      setPersonalTags([]);
      setTagsComputed(false);
      toast({ title: "Posted to the cosmos ✨" });
      onPosted?.();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      toast({ variant: "destructive", title: "Post failed", description: message });
    }
  };

  if (!user) {
    return (
      <div className="glass-panel rounded-xl p-4 mb-6 text-center text-muted-foreground text-sm">
        Sign in to share your cosmic perspective
      </div>
    );
  }

  const charsLeft = MAX_CHARS - content.length;
  const isOverLimit = charsLeft < 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel rounded-xl p-4 mb-6"
    >
      <Textarea
        placeholder="What's the cosmic vibe today?"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onFocus={handleFocus}
        className="resize-none border-none bg-transparent focus-visible:ring-0 text-sm min-h-[80px]"
      />

      <AnimatePresence>
        {(tagsComputed || collectiveTag) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-wrap gap-1.5 mt-3"
          >
            {collectiveTag && (
              <TransitPill key="collective" tag={collectiveTag} isCollective />
            )}
            {personalTags.map((tag, i) => (
              <TransitPill
                key={tag.transit_key}
                tag={tag}
                onRemove={() => removeTag(i)}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between mt-3">
        <span
          className={`text-xs tabular-nums ${
            isOverLimit
              ? "text-destructive font-medium"
              : charsLeft < 40
              ? "text-yellow-400"
              : "text-muted-foreground"
          }`}
        >
          {charsLeft}
        </span>
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={!content.trim() || isOverLimit || createPost.isPending}
          className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
        >
          {createPost.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          Post
        </Button>
      </div>
    </motion.div>
  );
}
