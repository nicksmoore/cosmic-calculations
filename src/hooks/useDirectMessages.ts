import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth as useClerkAuth } from "@clerk/clerk-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface DirectMessage {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  created_at: string;
}

export function useConversation(friendId: string | null) {
  const { user } = useAuth();
  const { getToken } = useClerkAuth();

  return useQuery<DirectMessage[]>({
    queryKey: ["conversation", user?.id, friendId],
    enabled: !!user && !!friendId,
    staleTime: 2_000,
    refetchInterval: 5_000,
    queryFn: async () => {
      if (!user || !friendId) return [];
      const token = await getToken({ template: "supabase" });
      if (!token) throw new Error("Could not get auth token");

      const { data, error } = await supabase.functions.invoke("list-direct-messages", {
        headers: { Authorization: `Bearer ${token}` },
        body: {
          userId: user.id,
          friendUserId: friendId,
          limit: 500,
        },
      });

      if (error || !data?.messages) return [];
      return data.messages as DirectMessage[];
    },
  });
}

export function useSendDirectMessage(friendId: string | null) {
  const { user } = useAuth();
  const { getToken } = useClerkAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (content: string) => {
      if (!user || !friendId) throw new Error("Select a friend first");
      const token = await getToken({ template: "supabase" });
      if (!token) throw new Error("Could not get auth token");

      const { data, error } = await supabase.functions.invoke("send-direct-message", {
        headers: { Authorization: `Bearer ${token}` },
        body: {
          userId: user.id,
          recipientUserId: friendId,
          content: content.trim(),
        },
      });
      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || "Could not send message");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversation", user?.id, friendId] });
    },
  });
}
