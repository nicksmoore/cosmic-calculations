import { useState, useEffect, useCallback } from "react";
import { useAuth as useClerkAuth } from "@clerk/clerk-react";
import { supabase } from "@/integrations/supabase/client";
import { getAuthenticatedClient } from "@/integrations/supabase/authClient";
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
  const { getToken } = useClerkAuth();
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
      try {
        let token: string | null = null;
        try {
          token = await getToken({ template: "supabase" });
        } catch (tokenError) {
          // Token can fail right after OAuth or if template is missing; fall back to anon client.
          console.warn("Supabase token unavailable during profile fetch:", tokenError);
        }

        if (token) {
          const { data: fnData, error: fnError } = await supabase.functions.invoke("upsert-profile", {
            body: { mode: "fetch", userId: user.id },
            headers: { Authorization: `Bearer ${token}` },
          });

          if (!fnError) {
            setProfile((fnData?.profile as Profile | null) ?? null);
            return;
          }
        }

        const client = token ? getAuthenticatedClient(token) : supabase;
        const { data, error } = await (client as any)
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();

        const isJwtKeyError =
          error &&
          ((typeof error.message === "string" &&
            error.message.toLowerCase().includes("no suitable key or wrong key type")) ||
            error.code === "PGRST301");

        if (isJwtKeyError && token) {
          const { data: fnData, error: fnError } = await supabase.functions.invoke("upsert-profile", {
            body: { mode: "fetch", userId: user.id },
            headers: { Authorization: `Bearer ${token}` },
          });

          if (!fnError) {
            setProfile((fnData?.profile as Profile | null) ?? null);
            return;
          }
        }

        if (error && error.code !== "PGRST116") {
          console.error("Error fetching profile:", error);
          setProfile(null);
          return;
        }

        setProfile(data as Profile | null);
      } catch (err) {
        console.error("Unexpected profile fetch error:", err);
        setProfile(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const updateProfile = useCallback(async (updates: Partial<Profile>) => {
    if (!user) return false;

    try {
      let token: string | null = null;
      try {
        token = await getToken({ template: "supabase" });
      } catch (tokenError) {
        console.warn("Supabase token unavailable during profile update:", tokenError);
      }

      if (token) {
        const { data: fnData, error: fnError } = await supabase.functions.invoke("upsert-profile", {
          body: { mode: "upsert", userId: user.id, updates },
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!fnError && fnData?.profile) {
          setProfile(fnData.profile as Profile);
          toast({ title: "Profile updated" });
          return true;
        }
      }

      const client = token ? getAuthenticatedClient(token) : supabase;

      const { data, error } = await (client as any)
        .from("profiles")
        .upsert({ ...updates, user_id: user.id }, { onConflict: "user_id" })
        .select("*")
        .single();

      if (error) {
        const isJwtKeyError =
          typeof error.message === "string" &&
          error.message.toLowerCase().includes("no suitable key or wrong key type");

        if (isJwtKeyError && token) {
          const { data: fnData, error: fnError } = await supabase.functions.invoke("upsert-profile", {
            body: { userId: user.id, updates },
            headers: { Authorization: `Bearer ${token}` },
          });

          if (!fnError && fnData?.profile) {
            setProfile(fnData.profile as Profile);
            toast({ title: "Profile updated" });
            return true;
          }
        }

        console.error("Error updating profile:", error);
        toast({ variant: "destructive", title: "Update failed", description: error.message });
        return false;
      }

      setProfile(data as Profile);
      toast({ title: "Profile updated" });
      return true;
    } catch (err) {
      console.error("Unexpected profile update error:", err);
      toast({
        variant: "destructive",
        title: "Update failed",
        description: err instanceof Error ? err.message : "Unknown error",
      });
      return false;
    }
  }, [user, toast, getToken]);

  return { profile, isLoading, updateProfile };
}
