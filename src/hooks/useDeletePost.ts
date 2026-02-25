import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth as useClerkAuth } from "@clerk/clerk-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useDeletePost() {
  const { getToken } = useClerkAuth();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      if (!user) throw new Error("Must be signed in to delete posts");

      const token = await getToken({ template: "supabase" });
      if (!token) throw new Error("Could not get auth token");

      const { data, error } = await supabase.functions.invoke("delete-post", {
        headers: { Authorization: `Bearer ${token}` },
        body: { userId: user.id, postId },
      });

      if (error) throw error;
      if (!data?.ok) throw new Error("Post was not deleted");
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });
}
