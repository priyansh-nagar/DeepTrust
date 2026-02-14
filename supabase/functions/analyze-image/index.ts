import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `You are an expert AI image forensics analyst specialized in detecting AI-generated images. Your task is to analyze images and determine their authenticity.

Analyze the provided image for signs of AI generation. Consider these detection signals:

1. **Texture Anomalies**: Look for unnatural smoothness, repetitive patterns, or inconsistent textures
2. **Anatomical Errors**: Check for distorted hands, fingers, teeth, ears, asymmetric features
3. **Lighting Inconsistencies**: Analyze shadow directions, light source consistency, reflection accuracy
4. **Background Artifacts**: Look for warped backgrounds, impossible geometry, blended objects
5. **Edge Quality**: Check for soft/blurry edges around subjects, halo effects, unnatural blending
6. **Detail Coherence**: Examine if fine details (hair, fabric, text) are consistent throughout
7. **Compression Artifacts**: Unusual compression patterns not typical of real cameras
8. **Semantic Errors**: Objects that don't make physical sense, floating elements, impossible perspectives

You must respond with a JSON object containing:
- "confidence": number between 1-100 (100 = definitely AI-generated, 1 = definitely real)
- "verdict": "AI_GENERATED" | "LIKELY_AI" | "UNCERTAIN" | "LIKELY_REAL" | "REAL"
- "signals": array of objects with "name", "detected" (boolean), "severity" (low/medium/high), and "description"
- "summary": brief 2-3 sentence explanation of your analysis

Be thorough and precise. Look for subtle signs that humans might miss.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl, imageBase64 } = await req.json();
    
    if (!imageUrl && !imageBase64) {
      return new Response(
        JSON.stringify({ error: 'Please provide either imageUrl or imageBase64' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare image content for the model
    let imageContent: any;
    if (imageBase64) {
      imageContent = {
        type: "image_url",
        image_url: {
          url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`
        }
      };
    } else {
      imageContent = {
        type: "image_url",
        image_url: { url: imageUrl }
      };
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

  const hfResponse = await fetch(
  "https://api-inference.huggingface.co/models/openai/clip-vit-base-patch32",
  {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${Deno.env.get("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")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      inputs: {
        image: imageContent,
        candidate_labels: ["AI-generated image", "Real photograph"],
      },
    }),
  }
);

if (!hfResponse.ok) {
  throw new Error("Hugging Face API error");
}

const result = await hfResponse.json();

const top = result[0];

const analysis = {
  verdict:
    top.label === "AI-generated image" ? "AI Generated" : "Real",
  confidence: Math.round(top.score * 100),
  signals: [],
  summary: "Detection powered by Hugging Face model",
};

return new Response(
  JSON.stringify(analysis),
  { headers: { ...corsHeaders, "Content-Type": "application/json" } }
);
