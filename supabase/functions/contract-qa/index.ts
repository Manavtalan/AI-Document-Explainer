import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: "Service not configured." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { originalText, analysisResult, messages } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "No messages provided." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = `You are DocBrief's Contract Q&A assistant. The user has already received a full analysis of their contract. They are now asking follow-up questions.

Here is the original contract text:
${originalText || "Not available"}

Here is the analysis that was already provided:
${JSON.stringify(analysisResult || {}, null, 2)}

Answer the user's question specifically about THIS contract. Be concise, specific, and use actual terms, dates, and amounts from the contract. If the question is about something not in the contract, say so clearly.

RULES:
- Keep answers to 2-4 paragraphs max
- Use specific numbers, dates, and terms from the contract
- Never give legal advice — say "you may want to consider" not "you should"
- If asked about market standards, give general context but note that terms vary by industry and jurisdiction
- If the user asks about something missing from the contract, acknowledge it's missing and suggest they discuss with the other party
- Be warm and helpful — contract review can be stressful
- If the user seems confused, offer to clarify the original analysis
- Respond in plain text, not JSON
- Do not use markdown formatting — just plain paragraphs`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages.map((m: any) => ({ role: m.role, content: m.content })),
        ],
        temperature: 0.3,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      console.error("AI gateway error:", response.status);
      return new Response(
        JSON.stringify({ success: false, error: "AI service unavailable." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "I couldn't generate a response. Please try again.";

    return new Response(
      JSON.stringify({ success: true, reply }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Q&A error:", err);
    return new Response(
      JSON.stringify({ success: false, error: "Something went wrong." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
