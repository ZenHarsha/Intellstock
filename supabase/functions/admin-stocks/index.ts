import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ADMIN_EMAIL = "test123@gmail.com";
const ADMIN_PASS = "911";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action } = body;

    // Login action - no auth needed
    if (action === "login") {
      const { email, password } = body;
      if (email === ADMIN_EMAIL && password === ADMIN_PASS) {
        // Simple token: base64 of email+timestamp
        const token = btoa(`${ADMIN_EMAIL}:${Date.now()}`);
        return json({ success: true, token });
      }
      return json({ error: "Invalid credentials" }, 401);
    }

    // All other actions require admin token
    const adminToken = body.token;
    if (!adminToken) {
      return json({ error: "Unauthorized" }, 401);
    }
    try {
      const decoded = atob(adminToken);
      if (!decoded.startsWith(ADMIN_EMAIL + ":")) {
        return json({ error: "Invalid token" }, 401);
      }
    } catch {
      return json({ error: "Invalid token" }, 401);
    }

    // Use service role for DB operations
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    if (action === "list") {
      const { data, error } = await supabase
        .from("featured_stocks")
        .select("*")
        .order("display_order", { ascending: true });
      if (error) return json({ error: error.message }, 500);
      return json({ stocks: data });
    }

    if (action === "add") {
      const { symbol, company_name, exchange, sector, display_order } = body;
      if (!symbol || !company_name) {
        return json({ error: "symbol and company_name are required" }, 400);
      }
      const { data, error } = await supabase
        .from("featured_stocks")
        .upsert(
          {
            symbol: symbol.toUpperCase().trim(),
            company_name: company_name.trim(),
            exchange: exchange || "NSE",
            sector: sector || "General",
            display_order: display_order ?? 0,
            is_active: true,
          },
          { onConflict: "symbol" }
        )
        .select()
        .single();
      if (error) return json({ error: error.message }, 500);
      return json({ stock: data });
    }

    if (action === "delete") {
      const { id } = body;
      if (!id) return json({ error: "id required" }, 400);
      const { error } = await supabase
        .from("featured_stocks")
        .delete()
        .eq("id", id);
      if (error) return json({ error: error.message }, 500);
      return json({ success: true });
    }

    if (action === "toggle") {
      const { id, is_active } = body;
      if (!id) return json({ error: "id required" }, 400);
      const { data, error } = await supabase
        .from("featured_stocks")
        .update({ is_active })
        .eq("id", id)
        .select()
        .single();
      if (error) return json({ error: error.message }, 500);
      return json({ stock: data });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    console.error("admin-stocks error:", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
