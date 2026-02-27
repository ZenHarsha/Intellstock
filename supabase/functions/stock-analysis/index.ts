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
    const { symbol, companyName, sector, exchange } = await req.json();

    if (!symbol || !companyName) {
      return new Response(
        JSON.stringify({ error: "symbol and companyName are required" }),
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

    const systemPrompt = `You are a professional Indian stock market research analyst AI. You provide structured research analysis for Indian listed companies. You are NOT a SEBI registered advisor. All outputs are AI-based probabilistic research analysis.

CRITICAL: Return ONLY valid JSON. No markdown, no code blocks, no backticks, no explanation outside JSON. Start your response with { and end with }.`;

    const userPrompt = `Analyze the Indian stock: ${companyName} (${symbol}) listed on ${exchange}, sector: ${sector}.

Provide a comprehensive research analysis and return STRICTLY as JSON with this exact structure:
{
  "currentPrice": <realistic current price in INR as number>,
  "change": <daily price change as number>,
  "changePct": <daily change percentage as number>,
  "dayHigh": <day high price as number>,
  "dayLow": <day low price as number>,
  "volume": "<volume as string like '12.5M'>",
  "marketCap": "<market cap as string like '₹18.5L Cr'>",
  "pe": <PE ratio as number>,
  "priceHistory": [<array of 30 objects with "time" (like "01 Jan") and "price" (number), representing last 30 days>],
  "quarterlyResults": [<array of 8 objects with "quarter" (like "Q1 FY24"), "revenue" (number in Cr), "profit" (number in Cr), "eps" (number)>],
  "news": [<array of 5 objects with "title" (string), "source" (one of "Economic Times","Moneycontrol","LiveMint","CNBC TV18","Business Standard"), "time" (like "2h ago"), "sentiment" ("positive"|"neutral"|"negative")>],
  "sentiment": {
    "avg_sentiment": <number between -1 and 1>,
    "confidence": <number between 0 and 1>,
    "direction": "<POSITIVE|NEUTRAL|NEGATIVE>",
    "trend": "<STRENGTHENING|WEAKENING|STABLE>"
  },
  "aiAnalysis": {
    "newsSummary": [<5 bullet point strings summarizing key news>],
    "insight": "<detailed AI insight paragraph about the stock>",
    "buyPct": <buy percentage as integer>,
    "sellPct": <sell percentage as integer>,
    "holdPct": <hold percentage as integer, must sum to 100 with buy+sell>,
    "riskScore": "<Low|Medium|High>",
    "holdingPeriod": "<Short|Medium|Long>"
  },
  "decision": {
    "action": "<BUY|SELL|HOLD>",
    "confidence": <number between 0 and 1>,
    "explanation": "<human-readable explanation of the decision incorporating sentiment analysis>"
  }
}

Make the data realistic and consistent. Use recent approximate real-world data for ${companyName}. The quarterly results should reflect realistic revenue and profit figures for this company. News should be plausible recent headlines. Ensure buyPct + sellPct + holdPct = 100.`;

    const callProvider = async (opts: {
      name: string;
      url: string;
      model: string;
      apiKey: string;
    }): Promise<{ content?: string; status?: number; error?: string }> => {
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
            temperature: 0.7,
            response_format: { type: "json_object" },
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          console.error(`${opts.name} API error:`, response.status, errText);
          return {
            status: response.status,
            error: errText || `${opts.name} API error: ${response.status}`,
          };
        }

        const data = await response.json();
        const content = data?.choices?.[0]?.message?.content;
        if (!content) {
          return { error: `${opts.name} returned empty content` };
        }

        return { content };
      } catch (err) {
        return { error: err instanceof Error ? err.message : `${opts.name} request failed` };
      }
    };

    const attempts = [
      GROK_API_KEY
        ? {
            name: "Grok",
            url: "https://api.x.ai/v1/chat/completions",
            model: "grok-3-mini",
            apiKey: GROK_API_KEY,
          }
        : null,
      LOVABLE_API_KEY
        ? {
            name: "Lovable AI Gateway",
            url: "https://ai.gateway.lovable.dev/v1/chat/completions",
            model: "google/gemini-3-flash-preview",
            apiKey: LOVABLE_API_KEY,
          }
        : null,
    ].filter((a): a is { name: string; url: string; model: string; apiKey: string } => a !== null);

    let content: string | undefined;
    const providerErrors: Array<{ provider: string; status?: number; error?: string }> = [];

    for (const attempt of attempts) {
      const providerResult = await callProvider(attempt);
      if (providerResult.content) {
        content = providerResult.content;
        break;
      }

      providerErrors.push({
        provider: attempt.name,
        status: providerResult.status,
        error: providerResult.error,
      });
    }

    if (!content) {
      return new Response(
        JSON.stringify({
          error: "All AI providers failed",
          providers: providerErrors,
        }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse JSON from the response, stripping any markdown code blocks
    let parsed;
    try {
      // Strip markdown fences, leading/trailing whitespace, and any non-JSON prefix/suffix
      let cleaned = content.trim();
      // Remove ```json ... ``` or ``` ... ```
      cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/g, "").trim();
      // Find the first { and last } to extract JSON object
      const firstBrace = cleaned.indexOf("{");
      const lastBrace = cleaned.lastIndexOf("}");
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        cleaned = cleaned.substring(firstBrace, lastBrace + 1);
      }
      parsed = JSON.parse(cleaned);
    } catch (e) {
      console.error("Failed to parse AI response:", content.substring(0, 200));
      return new Response(
        JSON.stringify({ error: "Failed to parse AI response", raw: content.substring(0, 100) }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("stock-analysis error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
