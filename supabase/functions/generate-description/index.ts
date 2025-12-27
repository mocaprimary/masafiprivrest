import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, category, ingredients, isVegan, isSpicy, isGlutenFree } = await req.json();
    
    console.log("Generating description for:", { name, category, ingredients });

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build dietary info string
    const dietaryInfo: string[] = [];
    if (isVegan) dietaryInfo.push("vegan");
    if (isSpicy) dietaryInfo.push("spicy");
    if (isGlutenFree) dietaryInfo.push("gluten-free");
    const dietaryText = dietaryInfo.length > 0 ? ` This dish is ${dietaryInfo.join(", ")}.` : "";

    const ingredientsList = ingredients?.length > 0 
      ? `Key ingredients include: ${ingredients.join(", ")}.` 
      : "";

    const prompt = `You are a professional restaurant menu writer specializing in Middle Eastern and Arabic cuisine. 
Generate an enticing, appetizing menu description for a dish with the following details:

Dish Name: ${name}
Category: ${category}
${ingredientsList}${dietaryText}

Requirements:
- Write exactly 2-3 sentences
- Use sensory language (taste, texture, aroma)
- Highlight what makes this dish special
- Keep it elegant and sophisticated
- Do not use overly flowery or exaggerated language
- Do not mention the price

Respond with ONLY the English description, nothing else.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "user", content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), 
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }), 
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const description = data.choices?.[0]?.message?.content?.trim();
    
    console.log("Generated description:", description);

    if (!description) {
      throw new Error("No description generated");
    }

    // Now generate Arabic description
    const arabicPrompt = `Translate the following restaurant menu description to Modern Standard Arabic. 
Keep the same elegant and appetizing tone. Respond with ONLY the Arabic translation, nothing else.

Description: ${description}`;

    const arabicResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "user", content: arabicPrompt }
        ],
      }),
    });

    if (!arabicResponse.ok) {
      console.error("Failed to generate Arabic description, returning English only");
      return new Response(
        JSON.stringify({ description, description_ar: null }), 
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const arabicData = await arabicResponse.json();
    const descriptionAr = arabicData.choices?.[0]?.message?.content?.trim();
    
    console.log("Generated Arabic description:", descriptionAr);

    return new Response(
      JSON.stringify({ description, description_ar: descriptionAr }), 
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error generating description:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to generate description" }), 
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
