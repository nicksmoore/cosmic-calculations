import { useRef, useCallback } from "react";
import { Loader2 } from "lucide-react";
import TodaysPlanetaryBar from "@/components/TodaysPlanetaryBar";
import DailyHookCard from "@/components/feed/DailyHookCard";
import PostCard from "@/components/feed/PostCard";
import StarField from "@/components/StarField";
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
    <div className="min-h-screen bg-background text-foreground">
      <StarField />
      <main className="container mx-auto px-4 pt-6 pb-28 max-w-2xl relative z-10">
        {/* Sky Header */}
        {chartData && (
          <div className="mb-4">
            <TodaysPlanetaryBar chartData={chartData} />
          </div>
        )}

        {/* Sticky Daily Hook */}
        <DailyHookCard />

        {/* Feed */}
        <FeedList />
      </main>
    </div>
  );
}
