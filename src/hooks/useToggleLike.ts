import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth as useClerkAuth } from "@clerk/clerk-react";
import { getAuthenticatedClient } from "@/integrations/supabase/authClient";
import { useAuth } from "@/hooks/useAuth";

export function useToggleLike() {
  const { getToken } = useClerkAuth();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, isLiked }: { postId: string; isLiked: boolean }) => {
      if (!user) throw new Error("Must be signed in to like");
      const token = await getToken({ template: "supabase" });
      if (!token) throw new Error("Could not get auth token");
      const client = getAuthenticatedClient(token);

      if (isLiked) {
        const { error } = await (client as any)
          .from("post_likes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", user.id);
        if (error) throw error;
      } else {
        const { error } = await (client as any)
          .from("post_likes")
          .insert({ post_id: postId, user_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });
}
