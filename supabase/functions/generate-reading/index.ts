import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface BirthData {
  name: string;
  birthDate: string;
  birthTime?: string;
  timeUnknown?: boolean;
  location?: string;
}

interface Planet {
  name: string;
  symbol: string;
  sign: string;
  house: number;
  degree: string;
  description: string;
}

interface RequestBody {
  birthData: BirthData;
  planets: Planet[];
  houseSystem: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { birthData, planets, houseSystem } = await req.json() as RequestBody;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build chart summary for AI
    const sunSign = planets.find(p => p.name === "Sun")?.sign || "Unknown";
    const moonSign = planets.find(p => p.name === "Moon")?.sign || "Unknown";
    const risingSign = "Aries"; // Would come from house 1 cusp
    
    const planetSummary = planets.map(p => 
      `${p.name} in ${p.sign} (${p.house}th house)`
    ).join(", ");

    const systemPrompt = `You are a warm, insightful astrologer creating a personalized audio reading. 
Your tone should be conversational, encouraging, and mystical - like a wise friend sharing cosmic wisdom.
Keep the reading concise (2-3 minutes when spoken aloud, approximately 300-400 words).
Structure: Opening greeting, Sun/Moon/Rising overview, 2-3 key planetary highlights, closing encouragement.
Use "you" directly to address the listener. Avoid overly technical jargon.
DO NOT use asterisks, bullet points, or formatting symbols - write in natural flowing paragraphs suitable for audio.`;

    const userPrompt = `Create a personalized natal chart audio reading for ${birthData.name}.

Birth Details:
- Date: ${birthData.birthDate}
${birthData.timeUnknown ? "- Time: Unknown" : `- Time: ${birthData.birthTime}`}
${birthData.location ? `- Location: ${birthData.location}` : ""}

Chart Overview:
- Sun Sign: ${sunSign}
- Moon Sign: ${moonSign}  
- Rising Sign: ${risingSign}
- House System: ${houseSystem}

Planetary Placements:
${planetSummary}

Generate a warm, personal audio reading script that highlights their unique cosmic blueprint. Make it feel like a conversation, not a report.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds to your workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const script = data.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ script }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("generate-reading error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
