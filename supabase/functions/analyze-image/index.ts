import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl, imageBase64 } = await req.json();

    if (!imageUrl && !imageBase64) {
      return new Response(
        JSON.stringify({ error: "Please provide imageBase64 or imageUrl" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const HUGGINGFACE_TOKEN = Deno.env.get("HUGGINGFACE_TOKEN");
    if (!HUGGINGFACE_TOKEN) {
      return new Response(
        JSON.stringify({ error: "HUGGINGFACE_TOKEN is not set in environment variables" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload = imageBase64 || imageUrl; // Hugging Face can accept either

    const hfResponse = await fetch(
      "https://api-inference.huggingface.co/models/facebook/bart-large-mnli",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${HUGGINGFACE_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: "This image appears to be: " + payload,
          parameters: {
            candidate_labels: ["AI-generated image", "Real photograph"],
          },
        }),
      }
    );

    if (!hfResponse.ok) {
      const errText = await hfResponse.text();
      return new Response(
        JSON.stringify({ error: `Hugging Face API failed: ${errText}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = await hfResponse.json();

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
