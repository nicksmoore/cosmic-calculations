import { useRef, useCallback } from "react";
import { CosmicLoader } from "@/components/ui/CosmicLoader";
import TodaysPlanetaryBar from "@/components/TodaysPlanetaryBar";
import DailyHookCard from "@/components/feed/DailyHookCard";
import PostCard from "@/components/feed/PostCard";
import StarField from "@/components/StarField";
import { useFeed } from "@/hooks/useFeed";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useEphemeris } from "@/hooks/useEphemeris";
import { BirthData } from "@/components/intake/BirthDataForm";
import { timezoneFromLongitude } from "@/lib/timezone";

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
        <CosmicLoader size="md" />
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
      {posts.map((post, i) => (
        <PostCard key={post.id} post={post} currentUserId={user?.id} index={i} />
      ))}
      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-4" />
      {isFetchingNextPage && (
        <div className="flex justify-center py-4">
          <CosmicLoader size="sm" />
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
        timezone: timezoneFromLongitude(profile.birth_lng),
      }
    : null;

  const { chartData } = useEphemeris(birthData);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <StarField />
      <main className="mx-auto w-full max-w-6xl px-4 pt-6 pb-28 md:px-8 md:pb-10 relative z-10">
        <section className="bento-grid mb-4">
          {/* Sky Header */}
          {chartData && (
            <div className="bento-tile col-span-12 p-3">
              <TodaysPlanetaryBar chartData={chartData} />
            </div>
          )}

          {/* Sticky Daily Hook */}
          <div className="col-span-12">
            <DailyHookCard />
          </div>
        </section>

        {/* Feed */}
        <FeedList />
      </main>
    </div>
  );
}
