/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface FriendNotificationProfile {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  sun_sign: string | null;
}

export function useFriendNotifications() {
  const { user } = useAuth();

  return useQuery<{ count: number; profiles: FriendNotificationProfile[] }>({
    queryKey: ["friend-notifications", user?.id],
    enabled: !!user,
    staleTime: 15_000,
    refetchInterval: 20_000,
    queryFn: async () => {
      if (!user) return { count: 0, profiles: [] };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const [followersRes, followingRes] = await Promise.all([
        (supabase as any)
          .from("follows")
          .select("follower_id")
          .eq("following_id", user.id),
        (supabase as any)
          .from("follows")
          .select("following_id")
          .eq("follower_id", user.id),
      ]);

      const followerIds = new Set((followersRes.data ?? []).map((r: { follower_id: string }) => r.follower_id));
      const followingIds = new Set((followingRes.data ?? []).map((r: { following_id: string }) => r.following_id));

      const pendingIds = [...followerIds].filter((id) => !followingIds.has(id));
      if (pendingIds.length === 0) return { count: 0, profiles: [] };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profiles } = await (supabase as any)
        .from("profiles")
        .select("user_id, display_name, avatar_url, sun_sign")
        .in("user_id", pendingIds)
        .order("display_name", { ascending: true });

      return {
        count: pendingIds.length,
        profiles: (profiles ?? []) as FriendNotificationProfile[],
      };
    },
  });
}
