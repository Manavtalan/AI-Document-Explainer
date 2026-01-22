import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ExplanationSection {
  title: string;
  content: string;
}

interface AnalysisResponse {
  success: boolean;
  sections?: ExplanationSection[];
  error?: string;
}

// LOCKED SYSTEM PROMPT - DO NOT MODIFY WITHOUT TESTING
// Version 1.0.0
const SYSTEM_PROMPT = `You are a legal document analyst helping non-technical users understand contracts. Your job is to explain contracts in simple, plain English that anyone can understand.

## CRITICAL RULES

1. **Never provide legal advice** - You explain what the document says, not what the user should do.
2. **Never invent information** - If something is not in the document, say "Not clearly specified in this document."
3. **Never use scary language** - Remain calm, neutral, and informative. No alarmist tone.
4. **Never use legal jargon** - Replace complex terms with simple explanations.
5. **Admit uncertainty** - If something is unclear, say so. Don't guess.

## OUTPUT FORMAT

You MUST return a JSON array with EXACTLY 7 sections in this order. Each section is an object with "title" and "content" keys.

### Section 1: What this contract is
Briefly describe the type of document and its main purpose. One paragraph maximum.

### Section 2: Who is involved  
List all parties mentioned in the document. Explain their roles simply.

### Section 3: What you are agreeing to
Summarize the main obligations and commitments. What does each party promise to do?

### Section 4: Money & payments
Detail any financial terms: amounts, payment schedules, penalties, currencies. If none, say "No payment terms specified in this document."

### Section 5: Duration & termination
How long does this last? How can it be ended? Notice periods? Renewal terms?

### Section 6: Risks & red flags
Use ⚠️ emoji to highlight concerning clauses. Focus on:
- Unusual limitations
- Hidden obligations  
- One-sided terms
- Potential penalties
If nothing concerning, say "No significant red flags identified."

### Section 7: What you should be careful about
Practical points to pay attention to. Use bullet points with • symbol. Focus on:
- Deadlines the user shouldn't miss
- Clauses that might have unexpected consequences
- Things to verify before signing
- Potential negotiation points

## TONE GUIDELINES

- Write as if explaining to a friend over coffee
- Use short sentences
- Avoid words like "pursuant to", "hereinafter", "notwithstanding"
- If a clause is complex, explain it in 2-3 simple sentences
- Be helpful but not advisory

Return ONLY the JSON array. No markdown code blocks. No explanatory text before or after.`;

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
          error: "We're unable to process your document right now. Please try again later.",
        } as AnalysisResponse),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { documentText, fileName } = await req.json();

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

    const userPrompt = `Please analyze this document${fileName ? ` (${fileName})` : ""} and explain it in plain English:

${documentText}`;

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
        max_tokens: 2000,
      }),
    });

    // Handle API errors gracefully
    if (!response.ok) {
      const status = response.status;
      console.error("OpenAI API error:", status);

      let errorMessage = "We're unable to process your document right now. Please try again later.";
      
      if (status === 401) {
        console.error("Invalid API key");
        errorMessage = "We're experiencing a service configuration issue. Please try again later.";
      } else if (status === 429) {
        console.error("Rate limited");
        errorMessage = "Our service is experiencing high demand. Please wait a moment and try again.";
      } else if (status === 500 || status === 503) {
        console.error("OpenAI service error");
        errorMessage = "The analysis service is temporarily unavailable. Please try again in a few minutes.";
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: errorMessage,
        } as AnalysisResponse),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error("No content in OpenAI response");
      return new Response(
        JSON.stringify({
          success: false,
          error: "We couldn't analyze your document. Please try uploading it again.",
        } as AnalysisResponse),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Parse the JSON response
    let sections: ExplanationSection[];
    try {
      // Clean up the response in case it has markdown code blocks
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

      sections = JSON.parse(cleanedContent);
      
      // Validate that we have the expected structure
      if (!Array.isArray(sections) || sections.length === 0) {
        throw new Error("Invalid response structure");
      }
      
      // Ensure each section has title and content
      for (const section of sections) {
        if (typeof section.title !== 'string' || typeof section.content !== 'string') {
          throw new Error("Invalid section structure");
        }
      }
      
    } catch (parseError) {
      console.error("Failed to parse OpenAI response:", parseError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "We had trouble interpreting the analysis. Please try again.",
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
        sections,
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
        error: "Something went wrong. Please try again later.",
      } as AnalysisResponse),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
