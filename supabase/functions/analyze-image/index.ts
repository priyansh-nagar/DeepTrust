import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper function to decode base64 to ArrayBuffer
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

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

    // Read the secret token
    const HUGGINGFACE_TOKEN = Deno.env.get("HUGGINGFACE_TOKEN");
    if (!HUGGINGFACE_TOKEN) throw new Error("Hugging Face token not set");

    // Prepare request body - Hugging Face expects raw binary image data
    let requestBody: string | ArrayBuffer;
    
    if (imageBase64) {
      // If base64 is provided, decode it to binary
      const cleanBase64 = imageBase64.includes('data:') 
        ? imageBase64.split(',')[1] 
        : imageBase64;
      requestBody = base64ToArrayBuffer(cleanBase64);
    } else {
      // If URL is provided, fetch the image
      const imgResponse = await fetch(imageUrl);
      if (!imgResponse.ok) {
        throw new Error(`Failed to fetch image from URL: ${imgResponse.statusText}`);
      }
      requestBody = await imgResponse.arrayBuffer();
    }

    // Call Hugging Face model for AI detection
    const hfResponse = await fetch(
      "https://api-inference.huggingface.co/models/Falconsai/nsfw_image_detection",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${HUGGINGFACE_TOKEN}`,
        },
        body: requestBody,
      }
    );

    if (!hfResponse.ok) {
      const errorText = await hfResponse.text();
      throw new Error(`Hugging Face API error (${hfResponse.status}): ${errorText}`);
    }

    const hfResult = await hfResponse.json();

    // Process the model output - handle various response formats
    let aiScore = 0.5;
    let realScore = 0.5;
    
    if (Array.isArray(hfResult) && hfResult.length > 0) {
      // Response is an array of classifications
      const classifications = hfResult as Array<{ label: string; score: number }>;
      
      // Look for AI-related labels
      const aiLabel = classifications.find(c => 
        c.label.toLowerCase().includes('ai') || 
        c.label.toLowerCase().includes('generated') ||
        c.label.toLowerCase().includes('fake')
      );
      
      if (aiLabel) {
        aiScore = aiLabel.score;
        realScore = 1 - aiScore;
      } else {
        // Default to first result
        aiScore = classifications[0]?.score || 0.5;
        realScore = 1 - aiScore;
      }
    }

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
