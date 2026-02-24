import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const MAX_DOCUMENT_LENGTH = 500000;

const SYSTEM_PROMPT = `You are DocBrief's Contract Explainer — a senior legal analyst with deep expertise in contract law, commercial agreements, and regulatory compliance. Your job is to take any contract or legal agreement and produce a comprehensive, structured, plain-English explanation that helps the user fully understand what they're agreeing to, what's favorable, what's risky, and what's missing.

CRITICAL RULES:
- You are NOT a lawyer. Never say "you should" or "I advise." Always say "this means..." or "you may want to consider..."
- Be specific with numbers, dates, and obligations. Don't say "this could be a problem." Say "this means you must deliver by March 2027 or face a $5,000 penalty per day."
- Explain consequences in real scenarios, not abstract definitions
- Flag what is MISSING — the absence of liability caps, termination for convenience, or data protection clauses is just as important as what's present
- Calculate when possible — show total contract value, payment milestones, penalty amounts
- If a section doesn't exist in the contract, still include it with status "missing" and explain why it matters

RESPONSE FORMAT — You MUST respond in valid JSON with this exact structure:

{
  "document_type_detected": "contract | nda | lease | service_agreement | employment_agreement | partnership_agreement | licensing_agreement | other",
  "party_a": "Company/Entity A name or 'Not specified'",
  "party_b": "Company/Entity B name or 'Not specified'",
  "contract_title": "extracted or inferred title",
  "confidence_score": 85,

  "key_terms_summary": {
    "contract_value": { "amount": "$50,000 or N/A", "notes": "any relevant notes" },
    "payment_schedule": { "terms": "Net 30 or N/A", "notes": "any relevant notes" },
    "effective_date": { "date": "March 1, 2026 or Not specified", "notes": "any relevant notes" },
    "termination_date": { "date": "February 28, 2027 or Not specified", "notes": "any relevant notes" },
    "governing_law": { "jurisdiction": "State of California or Not specified", "notes": "any relevant notes" }
  },

  "sections": [
    {
      "id": "section_id",
      "title": "Section Title",
      "status": "green | yellow | red | missing",
      "status_label": "Standard | Caution | Risk | Missing",
      "original_text": "relevant quote from the contract",
      "explanation": "Plain English explanation of what this means for the user. Be specific. Use real numbers and scenarios.",
      "key_figures": ["$50,000 total", "Net 30 payment"],
      "action_items": ["any actions the user should consider"]
    }
  ],

  "red_flags": [
    {
      "severity": "red",
      "section": "section title",
      "issue": "one-line description of the issue",
      "detail": "detailed explanation of why this is a concern and what it means in practice"
    }
  ],

  "caution_items": [
    {
      "severity": "yellow",
      "section": "section title",
      "issue": "one-line description",
      "detail": "detailed explanation"
    }
  ],

  "missing_items": [
    {
      "section": "section title",
      "why_it_matters": "explanation of why this missing item is important"
    }
  ],

  "glossary": [
    {
      "term": "Indemnification",
      "definition": "A promise by one party to cover the other party's losses or damages if certain things go wrong."
    }
  ],

  "negotiation_tips": [
    "Specific, actionable negotiation suggestion based on this particular contract"
  ]
}

The sections array MUST include these 14 sections (in this order): contract_type, parties, scope_of_work, payment_terms, duration, termination, liability, indemnification, confidentiality, ip_ownership, non_compete, dispute_resolution, governing_law, amendments.

Additional section "risks_and_red_flags" can be added as the 15th section if the contract has notable risk areas not covered by the above.

SECTION STATUS RULES:
- "green": Standard or favorable terms. No concerns.
- "yellow": Unusual or potentially unfavorable. User should understand before signing.
- "red": Potentially harmful. User should consider negotiating or seeking professional advice.
- "missing": This section was expected but not found in the contract.

If a section is "missing", still include it but set original_text to "Not found in contract" and explain why this section matters.

IMPORTANT: If the uploaded document is NOT a contract or legal agreement, set document_type_detected to "not_contract" and include a brief explanation in the first section about what type of document it appears to be and which DocBrief tool would be more appropriate.

Respond with ONLY the JSON. No markdown, no backticks, no explanation outside the JSON.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ success: false, error: "Service not configured. Please try again later." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { documentText } = body;

    if (!documentText || typeof documentText !== "string") {
      return new Response(
        JSON.stringify({ success: false, error: "No document content provided." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (documentText.trim().length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "Document is empty." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (documentText.length > MAX_DOCUMENT_LENGTH) {
      return new Response(
        JSON.stringify({ success: false, error: "Document too large. Please upload a smaller document." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Analyzing contract: ${documentText.length} characters`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Here is my contract. Please analyze it:\n\n${documentText}` },
        ],
        temperature: 0.2,
        max_tokens: 8000,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      console.error("AI gateway error:", status);

      if (status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: "We're experiencing high demand. Please wait a moment and try again." }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: false, error: "We couldn't analyze this contract right now. Please try again." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error("Empty response from AI");
      return new Response(
        JSON.stringify({ success: false, error: "We couldn't analyze this contract right now. Please try again." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse JSON response
    let analysis;
    try {
      let cleaned = content.trim();
      if (cleaned.startsWith("```json")) cleaned = cleaned.slice(7);
      if (cleaned.startsWith("```")) cleaned = cleaned.slice(3);
      if (cleaned.endsWith("```")) cleaned = cleaned.slice(0, -3);
      cleaned = cleaned.trim();
      analysis = JSON.parse(cleaned);
    } catch (parseError) {
      console.error("JSON parse failed, retrying...", parseError);

      // Retry once
      try {
        const retryResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              { role: "user", content: `Here is my contract. Please analyze it:\n\n${documentText}` },
            ],
            temperature: 0.1,
            max_tokens: 8000,
          }),
        });

        if (retryResponse.ok) {
          const retryData = await retryResponse.json();
          const retryContent = retryData.choices?.[0]?.message?.content;
          if (retryContent) {
            let cleaned2 = retryContent.trim();
            if (cleaned2.startsWith("```json")) cleaned2 = cleaned2.slice(7);
            if (cleaned2.startsWith("```")) cleaned2 = cleaned2.slice(3);
            if (cleaned2.endsWith("```")) cleaned2 = cleaned2.slice(0, -3);
            analysis = JSON.parse(cleaned2.trim());
          }
        }
      } catch {
        // Retry also failed
      }

      if (!analysis) {
        return new Response(
          JSON.stringify({ success: false, error: "We had trouble processing this document. Please try again or paste the text directly." }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    console.log("Contract analysis complete:", analysis.document_type_detected);

    return new Response(
      JSON.stringify({ success: true, analysis }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ success: false, error: "We couldn't analyze this contract right now. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
