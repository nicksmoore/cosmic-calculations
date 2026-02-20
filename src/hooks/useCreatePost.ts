import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth as useClerkAuth } from "@clerk/clerk-react";
import { getAuthenticatedClient } from "@/integrations/supabase/authClient";
import { TransitTag } from "@/lib/transitEngine";
import { useAuth } from "@/hooks/useAuth";

interface CreatePostInput {
  content: string;
  transitTags: TransitTag[];
}

export function useCreatePost() {
  const { getToken } = useClerkAuth();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ content, transitTags }: CreatePostInput) => {
      if (!user) throw new Error("Must be signed in to post");

      const token = await getToken({ template: "supabase" });
      if (!token) throw new Error("Could not get auth token — check Clerk JWT template setup");

      const client = getAuthenticatedClient(token);

      const { data: post, error: postError } = await (client as any)
        .from("posts")
        .insert({
          user_id:  user.id,
          content,
          is_public: true,
        })
        .select("id")
        .single();

      if (postError) throw postError;

      if (transitTags.length > 0) {
        const tagRows = transitTags.map(tag => ({
          post_id:           post.id,
          transit_key:       tag.transit_key,
          transiting_planet: tag.transiting_planet,
          aspect:            tag.aspect,
          natal_point:       tag.natal_point,
          display_name:      tag.display_name,
          orb:               tag.orb,
          is_primary:        tag.is_primary,
          is_personal:       tag.is_personal,
          is_applying:       tag.is_applying,
        }));

        const { error: tagsError } = await (client as any)
          .from("post_transit_tags")
          .insert(tagRows);

        if (tagsError) {
          console.error("Transit tags insert failed:", tagsError);
        }
      }

      return post;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });
}
