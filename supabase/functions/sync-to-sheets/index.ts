import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProAccessRequest {
  email: string;
  name: string | null;
  source: string;
  submittedAt: string;
}

/**
 * Generate a JWT for Google Sheets API authentication
 */
async function createGoogleJWT(clientEmail: string, privateKey: string): Promise<string> {
  const header = { alg: "RS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: clientEmail,
    scope: "https://www.googleapis.com/auth/spreadsheets",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  const encoder = new TextEncoder();
  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const payloadB64 = btoa(JSON.stringify(payload)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const unsignedToken = `${headerB64}.${payloadB64}`;

  // Fix: Handle escaped newlines in private key (common when stored as env var)
  const formattedPrivateKey = privateKey.replace(/\\n/g, '\n');
  
  // Parse the private key
  const pemContents = formattedPrivateKey
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\n/g, "")
    .trim();
  
  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
  
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    encoder.encode(unsignedToken)
  );

  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  return `${unsignedToken}.${signatureB64}`;
}

/**
 * Exchange JWT for Google access token
 */
async function getGoogleAccessToken(jwt: string): Promise<string> {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get access token: ${error}`);
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Append a row to Google Sheets
 */
async function appendToSheet(
  accessToken: string,
  spreadsheetId: string,
  values: string[]
): Promise<void> {
  const range = "Sheet1!A:E"; // Columns: Name, Email, Date, Action, Notes
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      values: [values],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to append to sheet: ${error}`);
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get secrets
    const clientEmail = Deno.env.get("GOOGLE_SHEETS_CLIENT_EMAIL");
    const privateKey = Deno.env.get("GOOGLE_SHEETS_PRIVATE_KEY");
    const spreadsheetId = Deno.env.get("GOOGLE_SHEETS_SPREADSHEET_ID");

    if (!clientEmail || !privateKey || !spreadsheetId) {
      console.error("Missing Google Sheets credentials");
      return new Response(
        JSON.stringify({ success: false, error: "Missing configuration" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const body: ProAccessRequest = await req.json();
    const { email, name, source, submittedAt } = body;

    if (!email) {
      return new Response(
        JSON.stringify({ success: false, error: "Email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Syncing Pro access request to Google Sheets: ${email}`);

    // Generate JWT and get access token
    const jwt = await createGoogleJWT(clientEmail, privateKey);
    const accessToken = await getGoogleAccessToken(jwt);

    // Append row to sheet - matching columns: Name, Email, Date, Action, Notes
    const rowValues = [
      name || "",                              // Column A: Name
      email,                                   // Column B: Email
      submittedAt || new Date().toISOString(), // Column C: Date
      source || "Pro Request – Beta",          // Column D: Action
      "",                                      // Column E: Notes (empty)
    ];

    await appendToSheet(accessToken, spreadsheetId, rowValues);

    console.log(`Successfully synced to Google Sheets: ${email}`);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error syncing to Google Sheets:", error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
