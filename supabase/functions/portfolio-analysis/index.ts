import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { stocks } = await req.json();

    if (!stocks || !Array.isArray(stocks) || stocks.length === 0) {
      return new Response(
        JSON.stringify({ error: "stocks array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const GROK_API_KEY = Deno.env.get("GROK_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!GROK_API_KEY && !LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "No AI provider key configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const stocksSummary = stocks
      .map((s: any) => `${s.symbol}: qty=${s.quantity}, avg=₹${s.avg_buy_price}, cmp=₹${s.current_price}, P/L=₹${s.pl} (${s.plPct}%)`)
      .join("\n");

    const systemPrompt = `You are a professional Indian stock market portfolio analyst. Return ONLY valid JSON. No markdown, no code blocks.`;

    const userPrompt = `Analyze this Indian stock portfolio and provide structured analysis:

${stocksSummary}

Return STRICTLY as JSON:
{
  "summary": "<2-3 sentence overall portfolio health assessment>",
  "rankings": [
    {
      "symbol": "<stock symbol>",
      "rank": <number 1-N>,
      "recommendation": "<BUY|SELL|HOLD>",
      "reasoning": "<1-2 sentence explanation>",
      "buy_levels": [<array of 2-3 price levels to average down, only for loss-making stocks, null otherwise>],
      "exit_range": [<min_exit_price, max_exit_price>, only for loss-making stocks, null otherwise]
    }
  ]
}

Rules:
- Rank ALL stocks from best to worst performer
- For loss-making (negative P/L) stocks: provide buy_levels and exit_range
- For profit-making stocks: set buy_levels and exit_range to null
- Use realistic Indian market price levels
- Rankings should consider P/L %, sector outlook, and risk`;

    const extractJsonFromResponse = (response: string) => {
      let cleaned = response
        .replace(/```json\s*/gi, "")
        .replace(/```\s*/g, "")
        .trim();

      const jsonStart = cleaned.search(/[\{\[]/);
      if (jsonStart === -1) {
        throw new Error("No JSON start found in provider response");
      }

      const isArray = cleaned[jsonStart] === "[";
      const jsonEnd = cleaned.lastIndexOf(isArray ? "]" : "}");
      if (jsonEnd === -1 || jsonEnd <= jsonStart) {
        throw new Error("No complete JSON payload found in provider response");
      }

      cleaned = cleaned.substring(jsonStart, jsonEnd + 1);

      try {
        return JSON.parse(cleaned);
      } catch {
        cleaned = cleaned
          .replace(/,\s*}/g, "}")
          .replace(/,\s*]/g, "]")
          .replace(/[\x00-\x1F\x7F]/g, "");
        return JSON.parse(cleaned);
      }
    };

    const callProvider = async (opts: {
      name: string;
      url: string;
      model: string;
      apiKey: string;
    }): Promise<any | null> => {
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const response = await fetch(opts.url, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${opts.apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: opts.model,
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
              ],
              temperature: 0.4,
              response_format: { type: "json_object" },
              max_tokens: 2500,
            }),
          });

          if (!response.ok) {
            console.error(`${opts.name} provider error (attempt ${attempt}):`, response.status);
            continue;
          }

          const data = await response.json();
          const content = data?.choices?.[0]?.message?.content;
          if (!content) {
            console.error(`${opts.name} returned empty content (attempt ${attempt})`);
            continue;
          }

          try {
            return extractJsonFromResponse(content);
          } catch (parseErr) {
            console.error(
              `${opts.name} parse failed (attempt ${attempt}):`,
              parseErr,
              content.substring(0, 300)
            );
          }
        } catch (err) {
          console.error(`${opts.name} provider call failed (attempt ${attempt}):`, err);
        }
      }

      return null;
    };

    let parsed: any = null;

    if (GROK_API_KEY) {
      parsed = await callProvider({
        name: "Grok",
        url: "https://api.x.ai/v1/chat/completions",
        model: "grok-3-mini",
        apiKey: GROK_API_KEY,
      });
    }

    if (!parsed && LOVABLE_API_KEY) {
      parsed = await callProvider({
        name: "Lovable AI Gateway",
        url: "https://ai.gateway.lovable.dev/v1/chat/completions",
        model: "google/gemini-3-flash-preview",
        apiKey: LOVABLE_API_KEY,
      });
    }

    if (!parsed) {
      return new Response(
        JSON.stringify({ error: "All AI providers failed" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("portfolio-analysis error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
