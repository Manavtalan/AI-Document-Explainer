import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Allowed origins for CORS - restrict to known domains
const ALLOWED_ORIGINS = [
  'https://simple-doc-sense.lovable.app',
  'http://localhost:5173',
  'http://localhost:8080',
];

// Allow Lovable preview domains
function isLovablePreview(origin: string): boolean {
  return /^https:\/\/.*\.lovable\.app$/.test(origin);
}

function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  if (isLovablePreview(origin)) return true;
  return false;
}

function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('origin');
  return {
    "Access-Control-Allow-Origin": isOriginAllowed(origin) ? origin! : '',
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-founder-key",
  };
}

// Input validation constants
const MAX_DOCUMENT_LENGTH = 500000; // 500KB - prevents excessive OpenAI token consumption
const MAX_FINGERPRINT_LENGTH = 100;
const FINGERPRINT_PATTERN = /^fp_[a-z0-9]+$/;

// Fixed JSON response structure - Phase 3 requirement
interface ContractExplanation {
  what_is_this: string;
  who_is_involved: string;
  agreements: string;
  payments: string;
  duration: string;
  risks: string;
  be_careful: string;
}

interface AnalysisResponse {
  success: boolean;
  explanation?: ContractExplanation;
  error?: string;
  errorCode?: string;
}

// Default value for missing/unclear content
const DEFAULT_VALUE = "Not clearly specified in this contract.";

// Founder bypass secret - set this in Supabase secrets
const FOUNDER_KEY = Deno.env.get("FOUNDER_BYPASS_KEY") || "";

/**
 * Check if this is a founder/admin request that bypasses rate limits
 */
function isFounderRequest(req: Request): boolean {
  if (!FOUNDER_KEY) return false;
  const providedKey = req.headers.get("x-founder-key");
  return providedKey === FOUNDER_KEY;
}

/**
 * Check if fingerprint has been used today
 * Returns true if already used (should block), false if available
 */
async function hasUsedToday(supabase: any, fingerprint: string): Promise<boolean> {
  if (!fingerprint) return false; // Fail open if no fingerprint
  
  try {
    // Get start of today in UTC
    const now = new Date();
    const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    
    const { count, error } = await supabase
      .from("usage_tracking")
      .select("*", { count: "exact", head: true })
      .eq("fingerprint", fingerprint)
      .gte("used_at", startOfDay.toISOString());
    
    if (error) {
      console.error("Error checking usage:", error);
      return false; // Fail open
    }
    
    return (count ?? 0) > 0;
  } catch (error) {
    console.error("Error in hasUsedToday:", error);
    return false; // Fail open
  }
}

/**
 * Record usage for this fingerprint
 */
async function recordUsage(
  supabase: any, 
  fingerprint: string, 
  ipAddress: string | null
): Promise<void> {
  if (!fingerprint) return;
  
  try {
    const { error } = await supabase
      .from("usage_tracking")
      .insert({
        fingerprint,
        ip_address: ipAddress,
      });
    
    if (error) {
      console.error("Error recording usage:", error);
    }
  } catch (error) {
    console.error("Error in recordUsage:", error);
  }
}

// LOCKED SYSTEM PROMPT - V1.0.0
// DO NOT MODIFY WITHOUT TESTING
const SYSTEM_PROMPT = `You are a legal document analyst helping non-technical users understand contracts. Your job is to explain contracts in simple, plain English that anyone can understand.

## CRITICAL RULES (MUST FOLLOW)

1. **Explain ONLY what is written** - Describe what the document says, never what it should say.
2. **NEVER provide legal advice** - No recommendations, no suggestions, no "you should".
3. **NEVER invent information** - If something is not in the document, say "Not clearly specified in this contract."
4. **NEVER use scary language** - Remain calm, neutral, and informative. No alarmist tone.
5. **NEVER use legal jargon** - Replace complex terms with simple explanations.
6. **Admit uncertainty** - If something is unclear, use words like "may", "could", "appears to be".

## OUTPUT FORMAT (STRICT - DO NOT DEVIATE)

Return a JSON object with EXACTLY these 7 keys. Every key MUST exist. Every value MUST be a non-empty string.

{
  "what_is_this": "Type of contract and its main purpose. One paragraph maximum.",
  "who_is_involved": "List all parties and explain their roles simply.",
  "agreements": "Main obligations and commitments. What does each party promise to do?",
  "payments": "Financial terms: amounts, schedules, penalties. If none, say so clearly.",
  "duration": "How long it lasts, how it can be ended, notice periods.",
  "risks": "Concerning clauses using cautious language (may, could, appears). No scary words.",
  "be_careful": "Practical points to pay attention to. Focus on awareness, not advice."
}

## FIELD REQUIREMENTS

### what_is_this
- Type of contract (e.g., freelance agreement, employment contract, NDA)
- Purpose explained simply
- One short paragraph

### who_is_involved  
- Clearly identify Party A and Party B
- Explain their roles in simple terms
- Avoid legal entity jargon

### agreements
- Explain what each party is agreeing to do
- Include responsibilities, deliverables, obligations
- Break complex clauses into simple points
- Do NOT advise or judge

### payments
- Fees or salary amounts
- Payment schedule
- Late fees or penalties (if any)
- If no payment info exists, say "No payment terms are specified in this contract."

### duration
- Start date (if mentioned)
- End date or ongoing nature
- How termination works (notice period, conditions)
- Explain in plain English

### risks
- Highlight clauses that are vague, one-sided, or could create obligations
- Use cautious language: "may", "could", "is unclear", "appears to"
- Do NOT say "unfair", "illegal", "bad", or other judgmental words
- If nothing concerning, say "No significant concerns identified in this contract."

### be_careful
- Plain-English awareness points
- Things the reader should pay attention to
- No action recommendations or advice
- Focus on awareness, not what to do

## TONE GUIDELINES

- Write as if explaining to a friend over coffee
- Use short sentences
- Avoid words like "pursuant to", "hereinafter", "notwithstanding"
- If a clause is complex, explain it in 2-3 simple sentences
- Be helpful but not advisory
- Stay calm and neutral

## CRITICAL FORMAT RULES

- Return ONLY valid JSON with the exact 7 keys above
- Every value MUST be a non-empty string
- Never return null, undefined, empty strings, or missing keys
- Do NOT wrap the response in markdown code blocks
- Do NOT include any text before or after the JSON`;

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  // Reject requests from disallowed origins
  const origin = req.headers.get('origin');
  if (origin && !isOriginAllowed(origin)) {
    console.warn(`Rejected request from disallowed origin: ${origin}`);
    return new Response(
      JSON.stringify({ success: false, error: "Origin not allowed" }),
      { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    // Check if API key exists
    if (!OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY is not configured");
      return new Response(
        JSON.stringify({
          success: false,
          error: "We couldn't confidently analyze this contract right now. Please try again in a moment.",
        } as AnalysisResponse),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create Supabase client for usage tracking
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    const body = await req.json();
    const { documentText, fingerprint } = body;

    // ============= Input Validation =============
    
    // Validate documentText type
    if (!documentText || typeof documentText !== 'string') {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid document content provided.",
        } as AnalysisResponse),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate documentText is not empty
    if (documentText.trim().length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "No document content provided. Please upload a valid document.",
        } as AnalysisResponse),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate documentText length to prevent resource exhaustion
    if (documentText.length > MAX_DOCUMENT_LENGTH) {
      console.warn(`Document too large: ${documentText.length} chars (max: ${MAX_DOCUMENT_LENGTH})`);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Document too large. Please upload a smaller document (max 500KB of text).",
          errorCode: "DOCUMENT_TOO_LARGE",
        } as AnalysisResponse),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate fingerprint if provided (don't reject, just sanitize)
    let validFingerprint = fingerprint;
    if (fingerprint) {
      if (typeof fingerprint !== 'string') {
        console.warn('Invalid fingerprint type provided, treating as missing');
        validFingerprint = null;
      } else if (fingerprint.length > MAX_FINGERPRINT_LENGTH) {
        console.warn('Fingerprint too long, treating as invalid');
        validFingerprint = null;
      } else if (!FINGERPRINT_PATTERN.test(fingerprint)) {
        console.warn('Fingerprint does not match expected pattern');
        // Still use it for rate limiting, but log the anomaly
      }
    }

    // Get client IP for additional tracking
    const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;

    // Check for founder bypass
    const isFounder = isFounderRequest(req);
    
    // Server-side rate limiting (unless founder)
    if (!isFounder && validFingerprint) {
      const alreadyUsed = await hasUsedToday(supabase, validFingerprint);
      if (alreadyUsed) {
        console.log(`Rate limit hit for fingerprint: ${validFingerprint.substring(0, 10)}...`);
        return new Response(
          JSON.stringify({
            success: false,
            error: "You've used your free explanation for today. Upgrade to Pro for unlimited access.",
            errorCode: "RATE_LIMIT_EXCEEDED",
          } as AnalysisResponse),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // User prompt - ONLY the contract text, no extra instructions
    const userPrompt = documentText;

    console.log(`Processing document with ${documentText.length} characters (founder: ${isFounder})`);

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 3000,
        response_format: { type: "json_object" },
      }),
    });

    // Handle API errors gracefully - never expose provider names
    if (!response.ok) {
      const status = response.status;
      console.error("AI provider error:", status);

      return new Response(
        JSON.stringify({
          success: false,
          error: "We couldn't confidently analyze this contract right now. Please try again in a moment.",
        } as AnalysisResponse),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    // Empty response = failure
    if (!content) {
      console.error("Empty response from AI");
      return new Response(
        JSON.stringify({
          success: false,
          error: "We couldn't confidently analyze this contract right now. Please try again in a moment.",
        } as AnalysisResponse),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Debug logging
    console.log("Raw AI response (first 500 chars):", content.substring(0, 500));

    // Parse and validate the JSON response
    let explanation: ContractExplanation;
    try {
      // Clean up any markdown artifacts
      let cleanedContent = content.trim();
      if (cleanedContent.startsWith("```json")) {
        cleanedContent = cleanedContent.slice(7);
      }
      if (cleanedContent.startsWith("```")) {
        cleanedContent = cleanedContent.slice(3);
      }
      if (cleanedContent.endsWith("```")) {
        cleanedContent = cleanedContent.slice(0, -3);
      }
      cleanedContent = cleanedContent.trim();

      const parsed = JSON.parse(cleanedContent);

      // Required keys for Phase 3
      const requiredKeys: (keyof ContractExplanation)[] = [
        "what_is_this",
        "who_is_involved", 
        "agreements",
        "payments",
        "duration",
        "risks",
        "be_careful"
      ];

      // Build the explanation object with validation
      explanation = {
        what_is_this: DEFAULT_VALUE,
        who_is_involved: DEFAULT_VALUE,
        agreements: DEFAULT_VALUE,
        payments: DEFAULT_VALUE,
        duration: DEFAULT_VALUE,
        risks: DEFAULT_VALUE,
        be_careful: DEFAULT_VALUE,
      };

      // Populate from parsed response, coercing to strings
      for (const key of requiredKeys) {
        const value = parsed[key];
        if (value !== undefined && value !== null && value !== "") {
          explanation[key] = String(value).trim() || DEFAULT_VALUE;
        }
      }

      // Task 8: Validate - Check for legal advice language (safety check)
      const allContent = Object.values(explanation).join(" ").toLowerCase();
      const advicePatterns = [
        "you should",
        "i recommend",
        "i suggest",
        "you must",
        "you need to",
        "i advise",
        "seek legal counsel",
        "consult a lawyer",
        "get legal advice"
      ];
      
      for (const pattern of advicePatterns) {
        if (allContent.includes(pattern)) {
          console.warn(`Legal advice pattern detected: "${pattern}"`);
          // Don't fail, just log - the prompt should prevent this
        }
      }

      // Task 8: Risk Language Stress Testing - Check for forbidden words
      const forbiddenRiskWords = [
        "unfair", 
        "illegal", 
        "bad deal", 
        "terrible", 
        "dangerous", 
        "scam",
        "you should negotiate",
        "you should avoid signing",
        "avoid this",
        "do not sign",
        "don't sign"
      ];
      
      for (const word of forbiddenRiskWords) {
        if (allContent.includes(word)) {
          console.warn(`Forbidden risk word detected: "${word}"`);
          // Log for monitoring - prompt should prevent this
        }
      }

      console.log("Successfully parsed explanation with all 7 fields");
      
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      console.error("Raw content was:", content.substring(0, 1000));
      return new Response(
        JSON.stringify({
          success: false,
          error: "We couldn't confidently analyze this contract right now. Please try again in a moment.",
        } as AnalysisResponse),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Record usage AFTER successful analysis (unless founder)
    if (!isFounder && validFingerprint) {
      await recordUsage(supabase, validFingerprint, clientIP);
      console.log(`Recorded usage for fingerprint: ${validFingerprint.substring(0, 10)}...`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        explanation,
      } as AnalysisResponse),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "We couldn't confidently analyze this contract right now. Please try again in a moment.",
      } as AnalysisResponse),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
