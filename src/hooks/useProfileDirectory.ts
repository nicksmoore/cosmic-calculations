/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery } from "@tanstack/react-query";
import { useAuth as useClerkAuth } from "@clerk/clerk-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface DirectoryProfile {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  sun_sign: string | null;
  moon_sign: string | null;
  rising_sign: string | null;
  current_status: string | null;
  is_public: boolean;
  is_following: boolean;
}

export function useProfileDirectory(searchQuery: string) {
  const { getToken } = useClerkAuth();
  const { user } = useAuth();

  return useQuery<DirectoryProfile[]>({
    queryKey: ["profile-directory", user?.id, searchQuery],
    enabled: !!user,
    staleTime: 30_000,
    queryFn: async () => {
      if (!user) return [];

      const token = await getToken({ template: "supabase" });
      if (!token) throw new Error("Could not get auth token");

      const { data, error } = await supabase.functions.invoke("search-profiles", {
        headers: { Authorization: `Bearer ${token}` },
        body: { userId: user.id, query: searchQuery.trim(), limit: 25 },
      });

      if (error) throw error;

      const profiles = (data?.profiles ?? []) as Omit<DirectoryProfile, "is_following">[];
      if (profiles.length === 0) return [];

      const targetIds = profiles.map((p) => p.user_id);
      const { data: follows, error: followsError } = await (supabase as any)
        .from("follows")
        .select("following_id")
        .eq("follower_id", user.id)
        .in("following_id", targetIds);

      if (followsError) {
        return profiles.map((p) => ({ ...p, is_following: false }));
      }

      const followingSet = new Set((follows ?? []).map((f: any) => f.following_id));
      return profiles.map((p) => ({
        ...p,
        is_following: followingSet.has(p.user_id),
      }));
    },
  });
}
