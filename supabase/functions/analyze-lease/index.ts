import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const MAX_DOCUMENT_LENGTH = 500000;

const SYSTEM_PROMPT = `You are DocBrief's Lease Agreement Explainer — an expert tenant rights advisor and real estate analyst with deep knowledge of residential rental law, landlord-tenant regulations, and lease contract standards across jurisdictions. Your job is to take a lease or rental agreement and produce a comprehensive, structured, plain-English explanation that helps the user (typically a renter/tenant) fully understand every term, obligation, right, risk, and hidden cost in their lease.

CRITICAL RULES:
- You are NOT a lawyer. Never say "you should" or "I advise." Say "this means..." or "you may want to consider..." or "under most jurisdictions, this..."
- Be specific with numbers, dates, and dollar amounts. Don't say "there might be a penalty." Say "if you break the lease before August 2027, you would owe $3,200 (2 months rent) as an early termination fee."
- Explain consequences with real-life scenarios: "If your sink breaks at 2 AM, this clause means YOU are responsible for calling and paying for the plumber, not the landlord."
- Flag what is MISSING — the absence of a move-out inspection process, subletting policy, or grace period for late rent is just as important as what's present
- Flag anything that may be ILLEGAL or UNENFORCEABLE under common tenant protection laws. Note: You don't know the exact jurisdiction, so say "in many US states, this clause may be unenforceable because..." and recommend checking local laws
- Calculate the TOTAL COST of the lease: monthly rent x term + deposits + fees + estimated utilities to show the real financial commitment
- Always side with clarity for the tenant — if something is ambiguous, flag it and suggest the tenant ask for clarification in writing before signing

RESPONSE FORMAT — You MUST respond in valid JSON with this exact structure:

{
  "document_type_detected": "residential_lease | commercial_lease | sublease | room_rental | month_to_month | lease_renewal | not_a_lease",
  "landlord_name": "extracted landlord/property management name or 'Not specified'",
  "property_address": "extracted property address or 'Not specified'",
  "lease_type": "Fixed-term | Month-to-month | Sublease | Room rental | Other",
  "confidence_score": 85,

  "financial_summary": {
    "monthly_rent": {
      "amount": "$1,800",
      "due_date": "1st of each month",
      "payment_methods": "Online portal, check, or money order",
      "notes": "any relevant notes"
    },
    "security_deposit": {
      "amount": "$3,600",
      "refund_conditions": "Returned within 30 days of move-out minus deductions for damages beyond normal wear and tear",
      "max_legal_limit_note": "In many states, security deposit cannot exceed 1-2 months rent. This deposit equals 2 months rent.",
      "notes": "any relevant notes"
    },
    "additional_deposits": {
      "pet_deposit": "$500 (non-refundable pet fee)",
      "key_deposit": "$50",
      "other": "any other deposits",
      "notes": "any relevant notes"
    },
    "move_in_costs": {
      "first_month": "$1,800",
      "last_month": "$1,800 (if required)",
      "security_deposit": "$3,600",
      "other_fees": "$200 (application fee, admin fee, etc.)",
      "total_move_in": "$7,400",
      "notes": "any relevant notes"
    },
    "late_fees": {
      "grace_period": "5 days",
      "late_fee_amount": "$75 or 5% of rent, whichever is greater",
      "compounding": "Does not compound / Compounds daily at $X/day",
      "notes": "any relevant notes"
    },
    "total_lease_cost": {
      "lease_term": "12 months",
      "total_rent": "$21,600 (12 x $1,800)",
      "total_deposits": "$4,150",
      "total_fees": "$200",
      "grand_total_commitment": "$25,950",
      "notes": "This is the total financial commitment if you complete the full lease term"
    },
    "rent_increases": {
      "allowed": "Yes/No",
      "terms": "Landlord may increase rent by up to 5% upon renewal with 60 days written notice",
      "notes": "any relevant notes"
    }
  },

  "sections": [
    {
      "id": "lease_term_duration",
      "title": "Lease Term & Duration",
      "status": "green | yellow | red | missing",
      "status_label": "Standard | Caution | Risk | Missing",
      "original_text": "relevant quote from the lease",
      "explanation": "Plain English explanation.",
      "key_figures": ["Start: Sept 1, 2025", "End: Aug 31, 2026", "12-month term"],
      "action_items": ["any actions the tenant should consider"],
      "tenant_tip": "a practical tip specific to this section"
    }
  ],

  "red_flags": [
    {
      "severity": "red",
      "section": "section title",
      "issue": "one-line description",
      "detail": "detailed explanation of why this is a concern and whether it may be unenforceable"
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
      "why_it_matters": "explanation of why this missing item is important for a tenant"
    }
  ],

  "potentially_illegal_clauses": [
    {
      "section": "section title",
      "clause": "description of the clause",
      "concern": "why this may violate tenant protection laws",
      "recommendation": "what the tenant should do"
    }
  ],

  "tenant_rights_notes": [
    "Important general tenant right that applies to this lease"
  ],

  "glossary": [
    {
      "term": "Quiet Enjoyment",
      "definition": "Your legal right to live in your rental peacefully without unreasonable interference from the landlord."
    }
  ],

  "negotiation_tips": [
    "Specific, actionable negotiation suggestion based on this particular lease"
  ],

  "move_in_checklist": [
    "Take timestamped photos/videos of EVERY room before moving furniture in",
    "Test all appliances, faucets, outlets, lights, smoke detectors, and locks",
    "Document any existing damage in writing and send to landlord via email",
    "Confirm how to submit maintenance requests and get emergency contact info",
    "Set a calendar reminder for lease end date and required notice period"
  ]
}

The sections array MUST include these 20 sections (in this order): lease_term_duration, rent_payment, security_deposit, maintenance_repairs, utilities_services, move_in_move_out, early_termination, subletting_assignment, pets_policy, guests_occupancy, alterations_modifications, landlord_entry, noise_conduct, insurance, parking_storage, renewal_terms, eviction_default, liability_indemnification, dispute_resolution, special_clauses.

SECTION STATUS RULES:
- "green": Standard or tenant-favorable terms. No concerns.
- "yellow": Unusual, one-sided, or potentially unfavorable to the tenant.
- "red": Potentially harmful, exploitative, or may violate tenant protection laws.
- "missing": Expected but not found in the lease. Important protections may be absent.

If a section is "missing", still include it with original_text "Not found in lease agreement" and explain why it matters.

SPECIAL INSTRUCTIONS:
- For "potentially_illegal_clauses": Flag clauses that violate common tenant protection laws but note legality varies by jurisdiction.
- For "tenant_rights_notes": Include general rights most tenants have regardless of lease terms.
- The "move_in_checklist" should be customized based on the specific lease.

IMPORTANT: If the document is NOT a lease/rental agreement, set document_type_detected to "not_a_lease" and explain what type of document it appears to be.

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

    console.log(`Analyzing lease agreement: ${documentText.length} characters`);

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
          { role: "user", content: `Here is my lease agreement. Please analyze it:\n\n${documentText}` },
        ],
        temperature: 0.2,
        max_tokens: 10000,
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
      if (status === 402) {
        return new Response(
          JSON.stringify({ success: false, error: "Service credits exhausted. Please try again later." }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: false, error: "We couldn't analyze this lease right now. Please try again." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error("Empty response from AI");
      return new Response(
        JSON.stringify({ success: false, error: "We couldn't analyze this lease right now. Please try again." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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
              { role: "user", content: `Here is my lease agreement. Please analyze it:\n\n${documentText}` },
            ],
            temperature: 0.1,
            max_tokens: 10000,
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

    console.log("Lease analysis complete:", analysis.document_type_detected);

    return new Response(
      JSON.stringify({ success: true, analysis }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ success: false, error: "We couldn't analyze this lease right now. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
