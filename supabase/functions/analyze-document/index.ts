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

    const systemPrompt = `You are a legal document analyst. Your job is to explain contracts and legal documents in simple, plain English that anyone can understand. 

You must analyze the document and return a JSON object with exactly these 7 sections:

1. "What this contract is" - A brief overview of the document type and purpose
2. "Who is involved" - The parties mentioned in the document
3. "What you are agreeing to" - Key obligations and commitments
4. "Money & payments" - Any financial terms, amounts, payment schedules
5. "Duration & termination" - How long it lasts and how to end it
6. "Risks & red flags" - Potential concerns or unusual clauses (use ⚠️ emoji for warnings)
7. "What you should be careful about" - Practical advice and things to watch for (use bullet points with •)

Return ONLY a valid JSON array with objects containing "title" and "content" keys. No markdown, no explanation, just the JSON array.`;

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
          { role: "system", content: systemPrompt },
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
