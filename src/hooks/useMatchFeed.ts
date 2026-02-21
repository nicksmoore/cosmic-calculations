// src/hooks/useMatchFeed.ts
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile, Profile } from "@/hooks/useProfile";
import { useEphemeris } from "@/hooks/useEphemeris";
import { calculateChartForProfile } from "@/lib/calculateChartForProfile";
import { calculateCompatibility } from "@/lib/synastry/compatibility";
import { BirthData } from "@/components/intake/BirthDataForm";
import { timezoneFromLongitude } from "@/lib/timezone";

export interface MatchProfile {
  profile: Profile;
  score:   number; // 0–100
}

function profileToBirthData(p: Profile): BirthData | null {
  if (!p.birth_date || !p.birth_lat || !p.birth_lng) return null;
  return {
    name:        p.display_name ?? "Unknown",
    birthDate:   p.birth_date,
    birthTime:   p.birth_time ?? "12:00",
    timeUnknown: p.time_unknown ?? false,
    location:    p.birth_location ?? "",
    latitude:    p.birth_lat,
    longitude:   p.birth_lng,
    timezone:    timezoneFromLongitude(p.birth_lng),
  };
}

export function useMatchFeed() {
  const { profile: myProfile } = useProfile();
  const myBirthData = myProfile ? profileToBirthData(myProfile) : null;
  const { chartData: myChartData } = useEphemeris(myBirthData);

  return useQuery<MatchProfile[]>({
    queryKey:  ["match-feed", myProfile?.user_id],
    enabled:   !!myChartData && !!myProfile,
    staleTime: 5 * 60 * 1000, // cache for 5 mins — scoring is expensive
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profiles, error } = await (supabase as any)
        .from("profiles")
        .select("*")
        .eq("is_public", true)
        .not("birth_date", "is", null)
        .not("birth_lat", "is", null)
        .neq("user_id", myProfile!.user_id)
        .limit(50);

      if (error || !profiles) return [];

      const results: MatchProfile[] = [];
      for (const p of profiles as Profile[]) {
        const bd = profileToBirthData(p);
        if (!bd) continue;
        const theirChart = calculateChartForProfile(bd);
        if (!theirChart) continue;
        const { overall } = calculateCompatibility(myChartData!.planets, theirChart.planets);
        results.push({ profile: p, score: overall });
      }

      return results.sort((a, b) => b.score - a.score);
    },
  });
}
