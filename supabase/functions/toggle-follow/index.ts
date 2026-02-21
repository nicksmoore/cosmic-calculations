import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { createRemoteJWKSet, jwtVerify } from "https://esm.sh/jose@5.9.6";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CLERK_ISSUER = "https://national-lamb-67.clerk.accounts.dev";
const CLERK_JWKS_URL = new URL(`${CLERK_ISSUER}/.well-known/jwks.json`);
const JWKS = createRemoteJWKSet(CLERK_JWKS_URL);

interface ToggleFollowBody {
  userId: string;
  targetUserId: string;
  follow: boolean;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Authorization required" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: CLERK_ISSUER,
      audience: "authenticated",
    });

    const { userId, targetUserId, follow } = (await req.json()) as ToggleFollowBody;
    if (!userId || !targetUserId || userId === targetUserId) {
      return new Response(JSON.stringify({ error: "Invalid follow request" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (payload.sub !== userId) {
      return new Response(JSON.stringify({ error: "Token subject mismatch" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    if (follow) {
      const { error } = await supabaseAdmin
        .from("follows")
        .upsert({ follower_id: userId, following_id: targetUserId }, { onConflict: "follower_id,following_id" });

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      const { error } = await supabaseAdmin
        .from("follows")
        .delete()
        .eq("follower_id", userId)
        .eq("following_id", targetUserId);

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({ ok: true, follow }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
