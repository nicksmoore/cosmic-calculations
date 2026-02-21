import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type CopyType = "vibe" | "houses" | "forecast" | "transit-energy";

interface PlanetInput {
  name: string;
  sign: string;
  house: number;
  degree?: number;
}

interface HouseInput {
  number: number;
  sign: string;
  theme?: string;
}

interface TransitInput {
  display_name: string;
  vibe?: string | null;
  orb?: number;
  aspect?: string;
  transiting_planet?: string;
  target_planet?: string;
}

interface AstroCopyBody {
  type: CopyType;
  planets?: PlanetInput[];
  houses?: HouseInput[];
  transits?: TransitInput[];
  dominantTransit?: string;
}

function sanitize(input: string, max = 160): string {
  if (!input || typeof input !== "string") return "";
  return input.replace(/[\n\r<>{}[\]]/g, " ").trim().slice(0, max);
}

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function callGemini(systemPrompt: string, userPrompt: string) {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

  const model = Deno.env.get("ASTRO_COPY_MODEL") || "google/gemini-3.1";
  const fallbackModel = "google/gemini-3-flash-preview";

  const requestBody = (targetModel: string) => ({
    model: targetModel,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.85,
  });

  let response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody(model)),
  });

  if (!response.ok && model !== fallbackModel) {
    response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody(fallbackModel)),
    });
  }

  if (!response.ok) {
    const txt = await response.text();
    throw new Error(`AI gateway error: ${response.status} ${txt}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() ?? "";
}

async function parseJsonFromModel(raw: string): Promise<Record<string, unknown> | null> {
  const fenced = raw.match(/```json\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    try {
      return JSON.parse(fenced[1]);
    } catch {
      // continue
    }
  }

  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;
  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as AstroCopyBody;
    const type = body.type;

    if (!type || !["vibe", "houses", "forecast", "transit-energy"].includes(type)) {
      return jsonResponse({ error: "Invalid type" }, 400);
    }

    const planets = (body.planets ?? []).slice(0, 30).map((p) => ({
      name: sanitize(p.name, 30),
      sign: sanitize(p.sign, 20),
      house: Math.min(12, Math.max(1, Number(p.house) || 1)),
      degree: typeof p.degree === "number" ? p.degree : undefined,
    }));
    const houses = (body.houses ?? []).slice(0, 12).map((h) => ({
      number: Math.min(12, Math.max(1, Number(h.number) || 1)),
      sign: sanitize(h.sign, 20),
      theme: sanitize(h.theme ?? "", 40),
    }));
    const transits = (body.transits ?? []).slice(0, 20).map((t) => ({
      display_name: sanitize(t.display_name, 120),
      vibe: sanitize(t.vibe ?? "", 220),
      orb: typeof t.orb === "number" ? Math.round(t.orb * 10) / 10 : undefined,
      aspect: sanitize(t.aspect ?? "", 20),
      transiting_planet: sanitize(t.transiting_planet ?? "", 24),
      target_planet: sanitize(t.target_planet ?? "", 24),
    }));
    const dominantTransit = sanitize(body.dominantTransit ?? "", 120);

    if (type === "vibe") {
      const systemPrompt = `You are a human astrologer writing authentic profile status text.
Write in plain, natural English. No cliches, no mystical filler, no markdown.
Output exactly one sentence in first person ("I..."). Keep it under 28 words.`;

      const userPrompt = `Natal placements:\n${JSON.stringify(planets)}\nTop transits:\n${JSON.stringify(transits.slice(0, 4))}`;
      const vibe = await callGemini(systemPrompt, userPrompt);
      return jsonResponse({ vibe });
    }

    if (type === "forecast") {
      const systemPrompt = `You are a skilled astrologer writing engaging daily forecast copy.
Use grounded, authentic English.
Return strict JSON with keys:
summary (string, 90-150 words), details (array of objects with title and meaning, each 18-45 words).
The summary must synthesize the entire transit set provided, not just one transit.`;

      const userPrompt = `Dominant transit: ${dominantTransit}\nTransit set:\n${JSON.stringify(transits)}`;
      const raw = await callGemini(systemPrompt, userPrompt);
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return jsonResponse({ error: "Invalid forecast format" }, 500);
      const parsed = JSON.parse(jsonMatch[0]);
      return jsonResponse({ forecast: parsed });
    }

    if (type === "transit-energy") {
      const systemPrompt = `You are an expert astrologer writing one high-quality paragraph for today's personal transit energy.
Write one paragraph, 85-140 words, in authentic and engaging English.
Synthesize the whole transit picture into a coherent day narrative.
Be specific, but readable. No bullet points, no markdown, no hype clichés.`;

      const userPrompt = `Dominant transit: ${dominantTransit}\nPersonal transit aspects:\n${JSON.stringify(transits)}`;
      const summary = await callGemini(systemPrompt, userPrompt);
      return jsonResponse({ summary });
    }

    const systemPrompt = `You are a professional natal astrologer.
Write useful, concrete, non-generic interpretations in authentic modern English.
Return strict JSON object where keys are "1" through "12".
Each value must be a detailed paragraph of 90-140 words.
Each house interpretation must connect house sign + life domain + planets in that house when present.
No markdown, no bullets, no preamble.`;

    const planetsByHouse: Record<number, string[]> = {};
    for (const p of planets) {
      planetsByHouse[p.house] = planetsByHouse[p.house] ?? [];
      planetsByHouse[p.house].push(`${p.name} in ${p.sign}`);
    }

    const housePayload = houses.map((h) => ({
      number: h.number,
      sign: h.sign,
      theme: h.theme,
      planets: planetsByHouse[h.number] ?? [],
    }));

    const userPrompt = `Interpret these houses:\n${JSON.stringify(housePayload)}`;
    const raw = await callGemini(systemPrompt, userPrompt);
    let parsed = await parseJsonFromModel(raw);

    if (!parsed) {
      const strictRetryPrompt = `${userPrompt}\n\nReturn ONLY valid JSON. No prose outside JSON.`;
      const retryRaw = await callGemini(systemPrompt, strictRetryPrompt);
      parsed = await parseJsonFromModel(retryRaw);
    }

    if (!parsed) {
      return jsonResponse({ error: "Invalid houses format" }, 500);
    }

    const houseDescriptions = parsed;
    return jsonResponse({ houseDescriptions });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return jsonResponse({ error: message }, 500);
  }
});
