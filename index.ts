import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  try {
    const body = await req.json();
    const image = body.imageUrl || body.imageBase64;

    if (!image) {
      return new Response(
        JSON.stringify({ error: "No image provided" }),
        { status: 400 }
      );
    }

    const hfResponse = await fetch(
      "https://api-inference.huggingface.co/models/facebook/deit-base-distilled-patch16-224",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${Deno.env.get("HUGGINGFACE_TOKEN")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs: image }),
      }
    );

    const result = await hfResponse.json();

    return new Response(
      JSON.stringify({
        verdict: "Analysis complete",
        raw: result,
      }),
      { headers: { "Content-Type": "application/json" } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    );
  }
});
