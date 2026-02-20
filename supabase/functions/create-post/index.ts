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

type TransitTagInput = {
  transit_key: string;
  transiting_planet?: string | null;
  aspect?: string | null;
  natal_point?: string | null;
  display_name: string;
  orb?: number;
  is_primary?: boolean;
  is_personal?: boolean;
  is_applying?: boolean;
};

interface CreatePostBody {
  userId: string;
  content: string;
  transitSnapshot?: Array<{ planet: string; display_name: string; vibe: string }> | null;
  transitTags?: TransitTagInput[];
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

    const body = (await req.json()) as CreatePostBody;
    if (!body.userId || payload.sub !== body.userId) {
      return new Response(JSON.stringify({ error: "Token subject mismatch" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const content = body.content?.trim();
    if (!content) {
      return new Response(JSON.stringify({ error: "Post content is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: post, error: postError } = await supabaseAdmin
      .from("posts")
      .insert({
        user_id: body.userId,
        content,
        is_public: true,
        transit_snapshot: body.transitSnapshot ?? null,
      })
      .select("id")
      .single();

    if (postError) {
      return new Response(JSON.stringify({ error: postError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tags = body.transitTags ?? [];
    if (tags.length > 0) {
      const rows = tags.map((tag) => ({
        post_id: post.id,
        transit_key: tag.transit_key,
        transiting_planet: tag.transiting_planet ?? null,
        aspect: tag.aspect ?? null,
        natal_point: tag.natal_point ?? null,
        display_name: tag.display_name,
        orb: typeof tag.orb === "number" ? tag.orb : 0,
        is_primary: Boolean(tag.is_primary),
        is_personal: Boolean(tag.is_personal),
        is_applying: tag.is_applying !== false,
      }));

      const { error: tagsError } = await supabaseAdmin.from("post_transit_tags").insert(rows);
      if (tagsError) {
        return new Response(JSON.stringify({ error: tagsError.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({ post }), {
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
