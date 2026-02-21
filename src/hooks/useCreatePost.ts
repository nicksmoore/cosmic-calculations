import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth as useClerkAuth } from "@clerk/clerk-react";
import { supabase } from "@/integrations/supabase/client";
import { TransitTag } from "@/lib/transitEngine";
import { useAuth } from "@/hooks/useAuth";

interface CreatePostInput {
  content: string;
  transitTags: TransitTag[];
  transitSnapshot?: Array<{ planet: string; display_name: string; vibe: string }>;
}

export function useCreatePost() {
  const { getToken } = useClerkAuth();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ content, transitTags, transitSnapshot }: CreatePostInput) => {
      if (!user) throw new Error("Must be signed in to post");

      const token = await getToken({ template: "supabase" });
      if (!token) throw new Error("Could not get auth token — check Clerk JWT template setup");

      const { data, error } = await supabase.functions.invoke("create-post", {
        headers: { Authorization: `Bearer ${token}` },
        body: {
          userId: user.id,
          content,
          transitSnapshot: transitSnapshot ?? null,
          transitTags,
        },
      });

      if (error) throw error;
      if (!data?.post) {
        throw new Error("Post creation did not return a post id");
      }

      return data.post;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });
}
