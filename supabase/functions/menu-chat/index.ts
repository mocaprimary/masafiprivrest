import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    
    console.log("Menu chat request:", { messageCount: messages?.length });

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Fetch menu items for context
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: menuItems, error: menuError } = await supabase
      .from("menu_items")
      .select("name, name_ar, description, category, price, is_vegan, is_vegetarian, is_gluten_free, is_spicy, ingredients, allergens, calories")
      .eq("is_available", true);

    if (menuError) {
      console.error("Error fetching menu:", menuError);
    }

    // Build menu context
    const menuContext = menuItems?.map(item => {
      const dietary: string[] = [];
      if (item.is_vegan) dietary.push("vegan");
      if (item.is_vegetarian) dietary.push("vegetarian");
      if (item.is_gluten_free) dietary.push("gluten-free");
      if (item.is_spicy) dietary.push("spicy");
      
      return `- ${item.name} (${item.name_ar}): ${item.description || 'No description'}. Category: ${item.category}. Price: ${item.price} AED. ${dietary.length ? `Dietary: ${dietary.join(", ")}.` : ""} ${item.ingredients?.length ? `Ingredients: ${item.ingredients.join(", ")}.` : ""} ${item.allergens?.length ? `Allergens: ${item.allergens.join(", ")}.` : ""} ${item.calories ? `Calories: ${item.calories}` : ""}`;
    }).join("\n") || "No menu items available.";

    const systemPrompt = `You are a friendly and knowledgeable menu assistant for an upscale Middle Eastern restaurant. Your role is to help customers explore the menu, make recommendations, and answer questions about dishes.

CURRENT MENU:
${menuContext}

GUIDELINES:
- Be warm, helpful, and enthusiastic about the food
- When recommending dishes, consider dietary restrictions the customer mentions
- Highlight signature dishes and popular items
- If asked about ingredients or allergens, provide accurate information from the menu
- For questions outside your knowledge (reservations, hours, etc.), politely suggest they contact the restaurant directly
- Keep responses concise but informative (2-4 sentences typically)
- You can suggest wine pairings or complementary dishes when appropriate
- If someone asks in Arabic, respond in Arabic

IMPORTANT:
- Only recommend dishes that are actually on the menu
- Be accurate about prices, ingredients, and dietary information
- If you don't know something, say so rather than making it up`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "I'm a bit busy right now. Please try again in a moment!" }), 
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "The chat service is temporarily unavailable." }), 
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    // Stream the response back
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });

  } catch (error) {
    console.error("Error in menu-chat:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Something went wrong" }), 
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
