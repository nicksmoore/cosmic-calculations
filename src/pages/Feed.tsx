import { useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import DailyHookCard from "@/components/feed/DailyHookCard";
import PostComposer from "@/components/feed/PostComposer";
import PostCard from "@/components/feed/PostCard";
import UserMenu from "@/components/UserMenu";
import { useFeed } from "@/hooks/useFeed";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useEphemeris } from "@/hooks/useEphemeris";
import { BirthData } from "@/components/intake/BirthDataForm";

function FeedList() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } = useFeed();
  const { user } = useAuth();

  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useCallback((node: HTMLDivElement | null) => {
    if (observerRef.current) observerRef.current.disconnect();
    if (!node) return;
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    });
    observerRef.current.observe(node);
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return (
      <p className="text-center text-destructive py-8 text-sm">Failed to load feed. Try refreshing.</p>
    );
  }

  const posts = data?.pages.flat() ?? [];

  if (posts.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="font-serif text-lg mb-2">The cosmos awaits your first post</p>
        <p className="text-sm">Share what's on your mind today.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map(post => (
        <PostCard key={post.id} post={post} currentUserId={user?.id} />
      ))}
      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-4" />
      {isFetchingNextPage && (
        <div className="flex justify-center py-4">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      )}
      {!hasNextPage && posts.length > 0 && (
        <p className="text-center text-xs text-muted-foreground py-4">
          You've reached the beginning of time. ✨
        </p>
      )}
    </div>
  );
}

export default function Feed() {
  const { profile } = useProfile();

  // Reconstruct BirthData from profile for transit calculation
  const birthData: BirthData | null = (profile?.birth_date && profile?.birth_lat && profile?.birth_lng)
    ? {
        name: profile.display_name ?? "You",
        birthDate: profile.birth_date,
        birthTime: profile.birth_time ?? "12:00",
        timeUnknown: profile.time_unknown ?? false,
        location: profile.birth_location ?? "",
        latitude: profile.birth_lat,
        longitude: profile.birth_lng,
        timezone: "UTC+0",
      }
    : null;

  const { chartData } = useEphemeris(birthData);

  return (
    <div className="min-h-screen">
      {/* Fixed header */}
      <div className="fixed top-4 right-4 z-50">
        <UserMenu />
      </div>

      <main className="container mx-auto px-4 pt-6 pb-24 max-w-2xl">
        {/* Back link */}
        <div className="mb-4">
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Chart
          </Link>
        </div>

        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-serif text-ethereal mb-6"
        >
          Astro Feed
        </motion.h1>

        {/* Sticky Daily Hook */}
        <DailyHookCard />

        {/* Post Composer (only if birth data is loaded) */}
        <PostComposer chartData={chartData} />

        {/* Feed */}
        <FeedList />
      </main>
    </div>
  );
}
