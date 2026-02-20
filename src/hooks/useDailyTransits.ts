import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { publicSupabase } from "@/integrations/supabase/publicClient";
import { getDailyCollectiveTransits, CollectiveTransit } from "@/lib/transitEngine";
import { useAuth as useClerkAuth } from "@clerk/clerk-react";
import { getAuthenticatedClient } from "@/integrations/supabase/authClient";

export interface DailyTransitsRow {
  date: string;
  dominant_transit: string;
  transit_key: string;
  description: string | null;
  aspect_precision: string | null;
  transits: CollectiveTransit[];
}

export function useDailyTransits() {
  const { getToken } = useClerkAuth();

  return useQuery<DailyTransitsRow | null>({
    queryKey: ["daily-transits", new Date().toISOString().slice(0, 10)],
    staleTime: 24 * 60 * 60 * 1000,
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10);

      const { data, error } = await (publicSupabase as any)
        .from("daily_transits")
        .select("*")
        .eq("date", today)
        .maybeSingle();

      if (error) {
        console.error("daily_transits fetch error:", error);
        return null;
      }

      if (data) {
        return data as DailyTransitsRow;
      }

      const computed = getDailyCollectiveTransits();
      const row = {
        date:             today,
        dominant_transit: computed.dominant_transit,
        transit_key:      computed.transit_key,
        description:      computed.description,
        aspect_precision: computed.aspect_precision,
        transits:         computed.transits,
        computed_at:      new Date().toISOString(),
      };

      try {
        const token = await getToken({ template: "supabase" });
        const client = token ? getAuthenticatedClient(token) : (supabase as any);
        await (client as any)
          .from("daily_transits")
          .upsert(row, { onConflict: "date", ignoreDuplicates: true });
      } catch {
        console.warn("Could not persist daily_transits row.");
      }

      return {
        date:             today,
        dominant_transit: computed.dominant_transit,
        transit_key:      computed.transit_key,
        description:      computed.description,
        aspect_precision: computed.aspect_precision,
        transits:         computed.transits,
      };
    },
  });
}
