import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface FriendProfile {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  gender: string | null;
  birth_date: string | null;
  birth_time: string | null;
  birth_location: string | null;
  birth_lat: number | null;
  birth_lng: number | null;
  time_unknown: boolean | null;
  sun_sign: string | null;
  moon_sign: string | null;
  rising_sign: string | null;
}

export function useFriends() {
  const { user } = useAuth();

  return useQuery<FriendProfile[]>({
    queryKey: ["friends", user?.id],
    enabled: !!user,
    staleTime: 30_000,
    queryFn: async () => {
      if (!user) return [];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const [followingRes, followerRes] = await Promise.all([
        (supabase as any)
          .from("follows")
          .select("following_id")
          .eq("follower_id", user.id),
        (supabase as any)
          .from("follows")
          .select("follower_id")
          .eq("following_id", user.id),
      ]);

      const followingIds = new Set((followingRes.data ?? []).map((r: { following_id: string }) => r.following_id));
      const mutualFriendIds = (followerRes.data ?? [])
        .map((r: { follower_id: string }) => r.follower_id)
        .filter((id: string) => followingIds.has(id));

      if (mutualFriendIds.length === 0) return [];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profiles, error } = await (supabase as any)
        .from("profiles")
        .select("user_id, display_name, avatar_url, gender, birth_date, birth_time, birth_location, birth_lat, birth_lng, time_unknown, sun_sign, moon_sign, rising_sign")
        .in("user_id", mutualFriendIds)
        .order("display_name", { ascending: true });

      if (error || !profiles) return [];
      return profiles as FriendProfile[];
    },
  });
}
