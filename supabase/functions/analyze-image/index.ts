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
    const { imageBase64, imageUrl } = await req.json();

    if (!imageBase64 && !imageUrl) {
      return new Response(
        JSON.stringify({ error: "Please provide imageBase64 or imageUrl" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const imageInput = imageBase64 || imageUrl;

    // Read the secret token
    const HUGGINGFACE_TOKEN = Deno.env.get("HUGGINGFACE_TOKEN");
    if (!HUGGINGFACE_TOKEN) throw new Error("Hugging Face token not set");

    // Call Hugging Face CLIP model
  const hfResponse = await fetch(
  "https://api-inference.huggingface.co/models/openai/clip-vit-base-patch32",
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${Deno.env.get("HUGGINGFACE_TOKEN")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      inputs: {
        image: imageContent,  // base64 string or public URL
        text: ["AI-generated image", "Real photograph"]
      }
    }),
  }
);
