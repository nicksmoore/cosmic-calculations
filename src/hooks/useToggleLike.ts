import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth as useClerkAuth } from "@clerk/clerk-react";
import { supabase } from "@/integrations/supabase/client";
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

      const { data, error } = await supabase.functions.invoke("toggle-like", {
        headers: { Authorization: `Bearer ${token}` },
        body: {
          userId: user.id,
          postId,
          like: !isLiked,
        },
      });

      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || "Could not update like");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });
}
