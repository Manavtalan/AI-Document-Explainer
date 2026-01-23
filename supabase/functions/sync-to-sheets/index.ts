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
    'Access-Control-Allow-Origin': isOriginAllowed(origin) ? origin! : '',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
}

interface ProAccessRequest {
  email: string;
  name: string | null;
}

// ============= Input Validation & Sanitization =============

/**
 * Validates email format server-side
 */
function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * Sanitizes input to prevent CSV/formula injection in Google Sheets
 * Prefixes dangerous characters with single quote to prevent formula execution
 */
function sanitizeForSheets(value: string, maxLength: number = 500): string {
  if (!value || typeof value !== 'string') return '';
  
  // Prevent formula injection by prefixing with single quote if starts with dangerous chars
  let sanitized = value;
  if (/^[=+\-@\t\r]/.test(sanitized)) {
    sanitized = "'" + sanitized;
  }
  
  // Trim and limit length
  return sanitized.substring(0, maxLength).trim();
}

/**
 * Validates that a request originated from our application by checking
 * the database for a matching pro_access_request entry
 */
async function validateRequestExists(email: string): Promise<boolean> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing Supabase credentials for validation");
    return false;
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  // Check if a pro_access_request with this email was created in the last 5 minutes
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  
  const { data, error } = await supabase
    .from('pro_access_requests')
    .select('id')
    .eq('email', email.toLowerCase().trim())
    .gte('created_at', fiveMinutesAgo)
    .limit(1);
  
  if (error) {
    console.error("Error validating request:", error);
    return false;
  }
  
  return data && data.length > 0;
}

// ============= Google Sheets Authentication =============

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
  let formattedPrivateKey = privateKey;
  formattedPrivateKey = formattedPrivateKey.replace(/\\\\n/g, '\n');
  formattedPrivateKey = formattedPrivateKey.replace(/\\n/g, '\n');
  
  // Parse the private key - handle both with and without headers
  let pemContents = formattedPrivateKey;
  
  if (pemContents.includes('-----BEGIN')) {
    pemContents = pemContents
      .replace(/-----BEGIN PRIVATE KEY-----/g, "")
      .replace(/-----END PRIVATE KEY-----/g, "")
      .replace(/-----BEGIN RSA PRIVATE KEY-----/g, "")
      .replace(/-----END RSA PRIVATE KEY-----/g, "");
  }
  
  pemContents = pemContents.replace(/[\n\r\s]/g, "").trim();
  
  if (pemContents.length < 100) {
    throw new Error(`Private key appears malformed (length: ${pemContents.length}). Please re-enter the full private key from your service account JSON file.`);
  }
  
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
  const range = "Sheet1!A:E";
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

// ============= Main Handler =============

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  // Reject requests from disallowed origins
  const origin = req.headers.get('origin');
  if (origin && !isOriginAllowed(origin)) {
    console.warn(`Rejected sync request from disallowed origin: ${origin}`);
    return new Response(
      JSON.stringify({ success: false, error: "Origin not allowed" }),
      { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    // Get Google Sheets secrets
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
    
    // Check if private key looks valid (should be ~1700+ chars when properly stored)
    const cleanedKeyLength = privateKey
      .replace(/-----BEGIN.*?-----/g, "")
      .replace(/-----END.*?-----/g, "")
      .replace(/[\n\r\s\\]/g, "")
      .length;
    
    if (cleanedKeyLength < 1000) {
      console.error(`Google Sheets private key appears truncated (${cleanedKeyLength} chars). Sync disabled.`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Google Sheets sync temporarily disabled - private key needs reconfiguration",
          note: "Pro request was still saved to database"
        }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse and validate request body
    let body: ProAccessRequest;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid JSON body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const { email, name } = body;

    // ============= Server-Side Validation =============
    
    // Validate email format
    if (!email || !isValidEmail(email)) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid email format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Validate name length if provided
    if (name && (typeof name !== 'string' || name.length > 200)) {
      return new Response(
        JSON.stringify({ success: false, error: "Name too long (max 200 characters)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // ============= Authorization: Verify Database Entry Exists =============
    // This ensures only legitimate requests (that went through our frontend 
    // and successfully inserted into the database) can trigger the sync
    const isValid = await validateRequestExists(email);
    if (!isValid) {
      console.warn(`Rejected sync request - no matching database entry for: ${email}`);
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized request" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Syncing Pro access request to Google Sheets: ${email}`);

    // Generate JWT and get access token
    const jwt = await createGoogleJWT(clientEmail, privateKey);
    const accessToken = await getGoogleAccessToken(jwt);

    // ============= Sanitized & Server-Controlled Values =============
    // Use server-side timestamp (don't trust client)
    // Use fixed source value (don't accept from client)
    const rowValues = [
      sanitizeForSheets(name || "", 200),           // Column A: Name (sanitized)
      sanitizeForSheets(email.toLowerCase(), 254),  // Column B: Email (sanitized, lowercase)
      new Date().toISOString(),                     // Column C: Date (server-side timestamp)
      "Pro Request – Beta",                         // Column D: Action (server-controlled)
      "",                                           // Column E: Notes (empty)
    ];

    await appendToSheet(accessToken, spreadsheetId, rowValues);

    console.log(`Successfully synced to Google Sheets: ${email}`);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error syncing to Google Sheets:", errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
