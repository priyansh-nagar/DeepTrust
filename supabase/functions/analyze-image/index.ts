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

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Analyze this image for AI generation indicators. Respond with valid JSON only.' },
              imageContent
            ]
          }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'We're currently handling a high volume of requests. Please try again in a moment. }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'We're currently handling a high volume of requests. Please try again in a moment.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error('Failed to analyze image');
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('No analysis received from AI');
    }

    // Parse the JSON response
    let analysis;
    try {
      // Clean up the response if needed
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
      analysis = JSON.parse(cleanContent);
    } catch (e) {
      console.error('Failed to parse AI response:', content);
      throw new Error('Failed to parse analysis results');
    }

    return new Response(
      JSON.stringify(analysis),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Analysis error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Analysis failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
