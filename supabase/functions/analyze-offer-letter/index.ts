import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const MAX_DOCUMENT_LENGTH = 500000;

const SYSTEM_PROMPT = `You are DocBrief's Offer Letter Explainer — a senior career advisor with deep expertise in employment law, compensation structures, and corporate HR practices. Your job is to take a job offer letter and produce a comprehensive, structured, plain-English explanation that helps the user fully understand what they're being offered, what's favorable, what's risky, and what's missing.

CRITICAL RULES:
- You are NOT a lawyer. Never say "you should" or "I advise." Always say "this means..." or "you may want to consider..."
- Be specific with numbers. Don't say "this could be a problem." Say "this means if you leave before March 2027, you would owe back $15,000."
- Explain consequences in real scenarios, not abstract definitions
- Flag what is MISSING — the absence of severance terms, remote work policy, or equity acceleration is just as important as what's present
- Calculate when possible — show monthly vesting amounts, per-paycheck salary, total Year 1 comp
- If a section doesn't exist in the offer letter, still include it with status "missing" and explain why it matters
- For equity in startups where valuation is unknown, note this clearly and explain the structure without guessing value
- Treat contractor/freelance agreements differently — adjust sections for payment terms, scope, IP instead of benefits/equity

RESPONSE FORMAT — You MUST respond in valid JSON with this exact structure:

{
  "document_type_detected": "offer_letter | employment_agreement | contractor_agreement | not_offer_letter",
  "company_name": "extracted company name or 'Not specified'",
  "role_title": "extracted role/position or 'Not specified'",
  "confidence_score": 85,
  "total_compensation_summary": {
    "base_salary": {
      "annual": "$120,000",
      "monthly": "$10,000",
      "per_paycheck": "$4,615 (bi-weekly, pre-tax)",
      "notes": "any relevant notes"
    },
    "equity": {
      "type": "RSUs | ISOs | NSOs | Stock Options | Phantom Stock | None",
      "total_grant": "10,000 shares",
      "estimated_value": "$150,000 (based on current valuation)",
      "year_1_value": "$37,500",
      "notes": "any relevant notes"
    },
    "signing_bonus": {
      "amount": "$15,000",
      "clawback": "Must repay if leaving within 12 months",
      "notes": "any relevant notes"
    },
    "performance_bonus": {
      "target": "15% of base ($18,000)",
      "type": "Discretionary | Guaranteed | Performance-based",
      "notes": "any relevant notes"
    },
    "benefits_estimate": {
      "annual_value": "~$12,000",
      "breakdown": "Health, dental, vision, 401(k) 4% match",
      "notes": "any relevant notes"
    },
    "total_year_1": "$202,500",
    "total_annual_ongoing": "$187,500"
  },
  "sections": [
    {
      "id": "base_compensation",
      "title": "Base Compensation",
      "status": "green | yellow | red | missing",
      "status_label": "Standard | Caution | Risk | Missing",
      "original_text": "relevant quote from the offer letter",
      "explanation": "Plain English explanation.",
      "key_figures": ["$120,000/year"],
      "action_items": ["any actions to consider"]
    }
  ],
  "red_flags": [
    {
      "severity": "red",
      "section": "section title",
      "issue": "one-line description",
      "detail": "detailed explanation"
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
      "term": "RSU",
      "definition": "Restricted Stock Unit — a promise to give you company shares after a vesting period."
    }
  ],
  "negotiation_tips": [
    "Specific, actionable negotiation suggestion based on this particular offer letter"
  ]
}

The sections array MUST include these 14 sections (in this order): base_compensation, equity, vesting_schedule, signing_bonus, performance_bonus, benefits, non_compete, non_solicitation, confidentiality_nda, intellectual_property, clawback, employment_terms, termination, contingencies.

SECTION STATUS RULES:
- "green": Standard or favorable terms. No concerns.
- "yellow": Unusual or potentially unfavorable. User should understand before signing.
- "red": Potentially harmful. User should consider negotiating or seeking professional advice.
- "missing": This section was expected but not found in the offer letter.

If a section is "missing", still include it but set original_text to "Not found in offer letter" and explain why this section matters.

IMPORTANT: If the uploaded document is NOT an offer letter, set document_type_detected to "not_offer_letter" and include a brief explanation in the first section about what type of document it appears to be.

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
        JSON.stringify({
          success: false,
          error: "Service not configured. Please try again later.",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const body = await req.json();
    const { documentText } = body;

    if (!documentText || typeof documentText !== "string") {
      return new Response(
        JSON.stringify({
          success: false,
          error: "No document content provided.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (documentText.trim().length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Document is empty.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (documentText.length > MAX_DOCUMENT_LENGTH) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Document too large. Please upload a smaller document.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(
      `Analyzing offer letter: ${documentText.length} characters`
    );

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            {
              role: "user",
              content: `Here is my offer letter. Please analyze it:\n\n${documentText}`,
            },
          ],
          temperature: 0.2,
          max_tokens: 8000,
        }),
      }
    );

    if (!response.ok) {
      const status = response.status;
      console.error("AI gateway error:", status);

      if (status === 429) {
        return new Response(
          JSON.stringify({
            success: false,
            error:
              "We're experiencing high demand. Please wait a moment and try again.",
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      return new Response(
        JSON.stringify({
          success: false,
          error:
            "We couldn't analyze this offer letter right now. Please try again.",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error("Empty response from AI");
      return new Response(
        JSON.stringify({
          success: false,
          error:
            "We couldn't analyze this offer letter right now. Please try again.",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
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
      console.error("Raw content:", content.substring(0, 500));

      // Retry once
      try {
        const retryResponse = await fetch(
          "https://ai.gateway.lovable.dev/v1/chat/completions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-3-flash-preview",
              messages: [
                { role: "system", content: SYSTEM_PROMPT },
                {
                  role: "user",
                  content: `Here is my offer letter. Please analyze it:\n\n${documentText}`,
                },
              ],
              temperature: 0.1,
              max_tokens: 8000,
            }),
          }
        );

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
          JSON.stringify({
            success: false,
            error:
              "We had trouble processing this document. Please try again or paste the text directly.",
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    console.log("Analysis complete:", analysis.document_type_detected);

    return new Response(
      JSON.stringify({ success: true, analysis }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({
        success: false,
        error:
          "We couldn't analyze this offer letter right now. Please try again.",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
