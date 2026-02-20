import { useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const PAGE_SIZE = 20;

export interface FeedPost {
  id: string;
  user_id: string;
  content: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
  display_name: string | null;
  avatar_url: string | null;
  sun_sign: string | null;
  moon_sign: string | null;
  rising_sign: string | null;
  transit_snapshot: Array<{ planet: string; display_name: string; vibe: string }> | null;
  transit_tags: Array<{
    transit_key: string;
    display_name: string;
    orb: number;
    is_primary: boolean;
    is_personal: boolean;
    is_applying: boolean;
  }>;
}

export function useFeed() {
  return useInfiniteQuery<FeedPost[], Error>({
    queryKey: ["feed"],
    initialPageParam: 0,
    staleTime: 60_000,
    queryFn: async ({ pageParam = 0 }) => {
      const from = (pageParam as number) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data: posts, error: postsError } = await (supabase as any)
        .from("posts")
        .select("id, user_id, content, likes_count, comments_count, created_at, transit_snapshot")
        .eq("is_public", true)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .range(from, to);

      if (postsError) throw postsError;
      if (!posts || posts.length === 0) return [];

      const postIds = posts.map((p: any) => p.id);
      const userIds = [...new Set(posts.map((p: any) => p.user_id))];

      const { data: profiles } = await (supabase as any)
        .from("profiles")
        .select("user_id, display_name, avatar_url, sun_sign, moon_sign, rising_sign")
        .in("user_id", userIds);

      const profileMap = new Map(
        (profiles ?? []).map((p: any) => [p.user_id, p])
      );

      const { data: tags } = await (supabase as any)
        .from("post_transit_tags")
        .select("post_id, transit_key, display_name, orb, is_primary, is_personal, is_applying")
        .in("post_id", postIds);

      const tagsMap = new Map<string, any[]>();
      for (const tag of (tags ?? [])) {
        const list = tagsMap.get(tag.post_id) ?? [];
        list.push(tag);
        tagsMap.set(tag.post_id, list);
      }

      return posts.map((post: any) => {
        const profile = profileMap.get(post.user_id) ?? {};
        return {
          ...post,
          display_name:      profile.display_name ?? null,
          avatar_url:        profile.avatar_url ?? null,
          sun_sign:          profile.sun_sign ?? null,
          moon_sign:         profile.moon_sign ?? null,
          rising_sign:       profile.rising_sign ?? null,
          transit_snapshot:  post.transit_snapshot ?? null,
          transit_tags:      tagsMap.get(post.id) ?? [],
        } as FeedPost;
      });
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length < PAGE_SIZE ? undefined : allPages.length;
    },
  });
}
