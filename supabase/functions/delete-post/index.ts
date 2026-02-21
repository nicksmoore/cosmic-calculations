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

interface DeletePostBody {
  userId: string;
  postId: string;
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

    const { userId, postId } = (await req.json()) as DeletePostBody;
    if (!userId || !postId) {
      return new Response(JSON.stringify({ error: "userId and postId are required" }), {
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

    const { data: post, error: postLookupError } = await supabaseAdmin
      .from("posts")
      .select("id, user_id, deleted_at")
      .eq("id", postId)
      .maybeSingle();

    if (postLookupError) {
      return new Response(JSON.stringify({ error: postLookupError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!post) {
      return new Response(JSON.stringify({ error: "Post not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (post.user_id !== userId) {
      return new Response(JSON.stringify({ error: "Not allowed to delete this post" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (post.deleted_at) {
      return new Response(JSON.stringify({ ok: true, alreadyDeleted: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error: deleteError } = await supabaseAdmin
      .from("posts")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", postId);

    if (deleteError) {
      return new Response(JSON.stringify({ error: deleteError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
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
