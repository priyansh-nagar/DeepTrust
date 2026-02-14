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
          Authorization: `Bearer ${HUGGINGFACE_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: {
            image: imageInput,
            text: ["AI-generated image", "Real photograph"]
          }
        }),
      }
    );

    if (!hfResponse.ok) {
      const error = await hfResponse.json();
      throw new Error(`Hugging Face API error: ${error.error || "Unknown error"}`);
    }

    const hfResult = await hfResponse.json();

    // Process the CLIP model output
    const scores = hfResult[0];
    const aiScore = scores[0]?.score || 0;
    const realScore = scores[1]?.score || 0;

    // Determine verdict based on scores
    let verdict: 'AI_GENERATED' | 'LIKELY_AI' | 'UNCERTAIN' | 'LIKELY_REAL' | 'REAL';
    if (aiScore > 0.7) verdict = 'AI_GENERATED';
    else if (aiScore > 0.55) verdict = 'LIKELY_AI';
    else if (realScore > 0.7) verdict = 'REAL';
    else if (realScore > 0.55) verdict = 'LIKELY_REAL';
    else verdict = 'UNCERTAIN';

    const analysisResult = {
      confidence: Math.max(aiScore, realScore),
      verdict,
      signals: [
        {
          name: "AI Pattern Detection",
          detected: aiScore > 0.5,
          severity: aiScore > 0.7 ? 'high' : aiScore > 0.5 ? 'medium' : 'low',
          description: `CLIP model detected ${(aiScore * 100).toFixed(1)}% AI-generated characteristics`
        },
        {
          name: "Authenticity Score",
          detected: realScore > 0.5,
          severity: realScore > 0.7 ? 'high' : realScore > 0.5 ? 'medium' : 'low',
          description: `${(realScore * 100).toFixed(1)}% authenticity indicators detected`
        }
      ],
      summary: `Based on multimodal AI analysis, this image is ${verdict.replace(/_/g, ' ').toLowerCase()}. Confidence: ${(Math.max(aiScore, realScore) * 100).toFixed(1)}%`
    };

    return new Response(
      JSON.stringify(analysisResult),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Analysis failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
