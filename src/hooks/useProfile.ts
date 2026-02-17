import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  birth_date: string | null;
  birth_time: string | null;
  birth_location: string | null;
  birth_lat: number | null;
  birth_lng: number | null;
  time_unknown: boolean;
  sun_sign: string | null;
  moon_sign: string | null;
  rising_sign: string | null;
  mercury_bio: string | null;
  venus_bio: string | null;
  mars_bio: string | null;
  current_status: string | null;
  status_updated_at: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export function useProfile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setIsLoading(false);
      return;
    }

    const fetchProfile = async () => {
      setIsLoading(true);
      const { data, error } = await (supabase as any)
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching profile:", error);
      }
      setProfile(data as Profile | null);
      setIsLoading(false);
    };

    fetchProfile();
  }, [user]);

  const updateProfile = useCallback(async (updates: Partial<Profile>) => {
    if (!user) return;

    const { error } = await (supabase as any)
      .from("profiles")
      .update(updates)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error updating profile:", error);
      toast({ variant: "destructive", title: "Update failed", description: error.message });
      return false;
    }

    setProfile(prev => prev ? { ...prev, ...updates } : null);
    toast({ title: "Profile updated" });
    return true;
  }, [user, toast]);

  return { profile, isLoading, updateProfile };
}
