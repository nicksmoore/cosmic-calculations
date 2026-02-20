import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, MessageCircle, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { FeedPost } from "@/hooks/useFeed";
import { useToggleLike } from "@/hooks/useToggleLike";
import { useComments, useAddComment, Comment } from "@/hooks/useComments";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const PLANET_GLYPHS: Record<string, string> = {
  Sun: "☀", Moon: "☽", Mercury: "☿", Venus: "♀", Mars: "♂",
  Jupiter: "♃", Saturn: "♄", Uranus: "♅", Neptune: "♆", Pluto: "♇",
};

const SIGN_GLYPHS: Record<string, string> = {
  Aries: "♈", Taurus: "♉", Gemini: "♊", Cancer: "♋",
  Leo: "♌", Virgo: "♍", Libra: "♎", Scorpio: "♏",
  Sagittarius: "♐", Capricorn: "♑", Aquarius: "♒", Pisces: "♓",
};

function BigThreeGlyphs({
  sun,
  moon,
  rising,
}: {
  sun: string | null;
  moon: string | null;
  rising: string | null;
}) {
  if (!sun && !moon && !rising) return null;
  return (
    <span className="text-muted-foreground text-sm">
      {sun && `☉${SIGN_GLYPHS[sun] ?? ""}`}
      {moon && ` ☽${SIGN_GLYPHS[moon] ?? ""}`}
      {rising && ` ↑${SIGN_GLYPHS[rising] ?? ""}`}
    </span>
  );
}

function TransitPillBadge({ tag }: { tag: FeedPost["transit_tags"][0] }) {
  const colorClass = !tag.is_personal
    ? "bg-blue-500/15 text-blue-300 border-blue-500/25"
    : tag.is_primary
    ? "bg-yellow-500/15 text-yellow-300 border-yellow-500/25"
    : "bg-white/5 text-muted-foreground border-border/20";

  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border ${colorClass}`}>
      {tag.display_name}
    </span>
  );
}

function TransitStamp({
  snapshot,
}: {
  snapshot: NonNullable<FeedPost["transit_snapshot"]>;
}) {
  const glyphs = snapshot.map(s => PLANET_GLYPHS[s.planet] ?? s.planet[0]).join(" ");

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          aria-label="View sky snapshot at time of post"
          className="text-[11px] text-muted-foreground/60 hover:text-muted-foreground transition-colors flex-shrink-0 px-1"
        >
          {glyphs}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 glass-panel border-border/30 p-3" side="top">
        <p className="text-xs font-medium text-foreground mb-2">Sky at time of post</p>
        <ul className="space-y-1.5">
          {snapshot.map((s, i) => (
            <li key={i} className="text-xs text-muted-foreground">
              <span className="mr-1">{PLANET_GLYPHS[s.planet] ?? "✦"}</span>
              <span className="font-medium text-foreground">{s.display_name}</span>
              {s.vibe && <span> — {s.vibe}</span>}
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

function CommentsSection({ postId }: { postId: string }) {
  const [newComment, setNewComment] = useState("");
  const { data: comments, isLoading } = useComments(postId, true);
  const addComment = useAddComment(postId);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!newComment.trim()) return;
    try {
      await addComment.mutateAsync(newComment.trim());
      setNewComment("");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      toast({ variant: "destructive", title: "Comment failed", description: message });
    }
  };

  if (isLoading) {
    return (
      <div className="py-2 text-center text-xs text-muted-foreground">Loading...</div>
    );
  }

  return (
    <div className="mt-3 pt-3 border-t border-border/20 space-y-2">
      {(comments ?? []).slice(0, 3).map((c: Comment) => (
        <div key={c.id} className="flex gap-2 items-start">
          {c.avatar_url ? (
            <img
              src={c.avatar_url}
              alt=""
              className="w-6 h-6 rounded-full flex-shrink-0 mt-0.5"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-muted flex-shrink-0 mt-0.5" />
          )}
          <div>
            <span className="text-xs font-medium">{c.display_name ?? "Anonymous"}</span>
            <p className="text-xs text-muted-foreground">{c.content}</p>
          </div>
        </div>
      ))}
      {(comments?.length ?? 0) > 3 && (
        <p className="text-xs text-muted-foreground">
          + {(comments?.length ?? 0) - 3} more
        </p>
      )}
      {user && (
        <div className="flex gap-2 mt-2">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="resize-none text-xs h-8 min-h-0 py-1.5"
            maxLength={280}
          />
          <Button
            size="sm"
            variant="ghost"
            onClick={handleSubmit}
            disabled={!newComment.trim() || addComment.isPending}
            aria-label="Submit comment"
            className="h-8 px-2 flex-shrink-0"
          >
            {addComment.isPending ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              "→"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

interface PostCardProps {
  post: FeedPost;
  currentUserId?: string;
}

export default function PostCard({ post, currentUserId }: PostCardProps) {
  const toggleLike = useToggleLike();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showComments, setShowComments] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  const handleLike = async () => {
    if (!user) return;
    const originalLiked = isLiked;
    setIsLiked(!isLiked);
    try {
      await toggleLike.mutateAsync({ postId: post.id, isLiked: originalLiked });
    } catch {
      setIsLiked(originalLiked);
    }
  };

  const timeAgo = (() => {
    const ms = Date.now() - new Date(post.created_at).getTime();
    const m = Math.floor(ms / 60_000);
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`;
    return `${Math.floor(h / 24)}d`;
  })();

  const visibleTags = post.transit_tags.slice(0, 5);
  const extraTagCount = post.transit_tags.length - 5;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel rounded-xl p-4"
    >
      <div className="flex items-start gap-3 mb-3">
        <button
          onClick={() => navigate(`/profile/${post.user_id}`)}
          className="flex-shrink-0 focus:outline-none"
          aria-label={`View ${post.display_name ?? "user"}'s profile`}
        >
          {post.avatar_url ? (
            <img
              src={post.avatar_url}
              alt=""
              className="w-8 h-8 rounded-full hover:opacity-80 transition-opacity"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-muted hover:opacity-80 transition-opacity" />
          )}
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2 flex-wrap">
            <button
              onClick={() => navigate(`/profile/${post.user_id}`)}
              className="font-medium text-sm truncate hover:underline focus:outline-none text-left"
            >
              {post.display_name ?? "Anonymous"}
            </button>
            <BigThreeGlyphs
              sun={post.sun_sign}
              moon={post.moon_sign}
              rising={post.rising_sign}
            />
            <div className="flex items-center gap-1 ml-auto flex-shrink-0">
              {post.transit_snapshot && post.transit_snapshot.length > 0 && (
                <TransitStamp snapshot={post.transit_snapshot} />
              )}
              <span className="text-muted-foreground text-xs">{timeAgo}</span>
            </div>
          </div>
        </div>
      </div>

      <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
        {post.content}
      </p>

      {visibleTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {visibleTags.map((tag) => (
            <TransitPillBadge key={tag.transit_key} tag={tag} />
          ))}
          {extraTagCount > 0 && (
            <span className="text-xs text-muted-foreground self-center">
              +{extraTagCount} more
            </span>
          )}
        </div>
      )}

      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/20">
        <button
          onClick={handleLike}
          disabled={!user || toggleLike.isPending}
          aria-label={`Like post, ${post.likes_count + (isLiked ? 1 : 0)} likes`}
          className={`flex items-center gap-1.5 text-xs transition-colors ${
            isLiked
              ? "text-rose-400"
              : "text-muted-foreground hover:text-rose-400"
          }`}
        >
          <Heart className={`h-4 w-4 ${isLiked ? "fill-rose-400" : ""}`} />
          {post.likes_count + (isLiked ? 1 : 0)}
        </button>

        <button
          onClick={() => setShowComments((v) => !v)}
          aria-label={`${showComments ? "Hide" : "Show"} comments, ${post.comments_count}`}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <MessageCircle className="h-4 w-4" />
          {post.comments_count}
        </button>
      </div>

      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: "hidden" }}
          >
            <CommentsSection postId={post.id} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
