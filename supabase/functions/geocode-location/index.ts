import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Sanitize location query to prevent injection attacks
 * Allows alphanumeric characters, spaces, commas, periods, hyphens, apostrophes,
 * and common international characters for city names
 */
function sanitizeLocationQuery(query: string): string {
  if (!query || typeof query !== 'string') return '';
  
  return query
    // Remove potentially harmful characters (angle brackets, braces, brackets)
    .replace(/[<>{}[\]\\]/g, '')
    // Allow letters (including Unicode), numbers, spaces, and common location punctuation
    .replace(/[^\p{L}\p{N}\s,.'\-]/gu, '')
    .trim()
    .slice(0, 200); // Max length to prevent abuse
}

/**
 * Validate and sanitize limit parameter
 */
function validateLimit(limitParam: string | null): number {
  const parsed = parseInt(limitParam ?? '5', 10);
  if (isNaN(parsed) || parsed < 1) return 5;
  return Math.min(parsed, 10); // Cap at 10 results
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Authorization required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !data?.user) {
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const url = new URL(req.url);
    
    // Sanitize and validate the query parameter
    const rawQuery = url.searchParams.get("q") ?? "";
    const q = sanitizeLocationQuery(rawQuery);
    const limit = validateLimit(url.searchParams.get("limit"));

    // Validate minimum length after sanitization
    if (q.length < 3) {
      return new Response(JSON.stringify([]), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Nominatim usage policy recommends identifying the application.
    // Browsers cannot reliably send a custom User-Agent, so we proxy it here.
    const upstream = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        q
      )}&limit=${limit}&addressdetails=1`,
      {
        headers: {
          "User-Agent": "CelestialSync/1.0 (Lovable Cloud)",
          Accept: "application/json",
        },
      }
    );

    if (!upstream.ok) {
      const text = await upstream.text();
      console.error("geocode-location upstream error:", upstream.status, text);
      return new Response(JSON.stringify({ error: "Geocoding failed" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const responseData = await upstream.json();
    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("geocode-location error:", error);
    return new Response(JSON.stringify({ error: "An error occurred" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
