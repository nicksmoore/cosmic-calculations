// src/hooks/useFollow.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getAuthenticatedClient } from "@/integrations/supabase/authClient";
import { useAuth as useClerkAuth } from "@clerk/clerk-react";
import { useAuth } from "@/hooks/useAuth";

/** Check if the current user is following a given user. */
export function useFollowStatus(targetUserId: string | undefined) {
  const { user } = useAuth();

  return useQuery<boolean>({
    queryKey: ["follow-status", user?.id, targetUserId],
    enabled: !!user && !!targetUserId,
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("follows")
        .select("follower_id")
        .eq("follower_id", user!.id)
        .eq("following_id", targetUserId)
        .maybeSingle();

      if (error) return false;
      return data !== null;
    },
  });
}

/** Get follower and following counts for a user. */
export function useFollowCounts(userId: string | undefined) {
  return useQuery<{ followers: number; following: number }>({
    queryKey: ["follow-counts", userId],
    enabled: !!userId,
    staleTime: 30_000,
    queryFn: async () => {
      const [followersRes, followingRes] = await Promise.all([
        (supabase as any)
          .from("follows")
          .select("*", { count: "exact", head: true })
          .eq("following_id", userId),
        (supabase as any)
          .from("follows")
          .select("*", { count: "exact", head: true })
          .eq("follower_id", userId),
      ]);
      return {
        followers: followersRes.count ?? 0,
        following: followingRes.count ?? 0,
      };
    },
  });
}

/** Toggle follow/unfollow for a target user. */
export function useToggleFollow(targetUserId: string | undefined) {
  const { getToken } = useClerkAuth();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (isFollowing: boolean) => {
      if (!user || !targetUserId) throw new Error("Not signed in");
      const token = await getToken({ template: "supabase" });
      if (!token) throw new Error("Could not get auth token");
      const client = getAuthenticatedClient(token);

      if (isFollowing) {
        const { error } = await (client as any)
          .from("follows")
          .delete()
          .eq("follower_id", user.id)
          .eq("following_id", targetUserId);
        if (error) throw error;
      } else {
        const { error } = await (client as any)
          .from("follows")
          .insert({ follower_id: user.id, following_id: targetUserId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["follow-status", user?.id, targetUserId] });
      queryClient.invalidateQueries({ queryKey: ["follow-counts", targetUserId] });
    },
  });
}
