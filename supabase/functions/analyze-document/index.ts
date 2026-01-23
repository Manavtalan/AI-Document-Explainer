import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
}

// Default value for missing/unclear content
const DEFAULT_VALUE = "Not clearly specified in this contract.";

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
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    
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

    const { documentText } = await req.json();

    if (!documentText || documentText.trim().length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "No document content provided. Please upload a valid document.",
        } as AnalysisResponse),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // User prompt - ONLY the contract text, no extra instructions
    const userPrompt = documentText;

    console.log(`Processing document with ${documentText.length} characters`);

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

      // Validate: Check for legal advice language (safety check)
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

      // Validate: Check tone is neutral (no scary words in risks)
      const scaryWords = ["unfair", "illegal", "bad deal", "terrible", "dangerous", "scam"];
      for (const word of scaryWords) {
        if (explanation.risks.toLowerCase().includes(word)) {
          console.warn(`Scary word detected in risks: "${word}"`);
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
