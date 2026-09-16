/**
 * Resume parser with OpenAI → Gemini fallback.
 *
 * Flow:
 *  1. Try OpenAI (gpt-4o)
 *  2. If quota/rate-limit error → try Gemini (gemini-1.5-flash)
 *  3. If Gemini also fails → try OpenAI one more time
 *  4. If all fail → throw a user-friendly error
 */

import OpenAI from "openai";

// ─── Prompt ───────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a resume parsing assistant. Extract all information from the resume and return it in the exact JSON format specified. Be thorough and extract all available information. If a field is not present in the resume, use null or empty array as appropriate.`;

const USER_PROMPT = `Parse this resume and extract all information into the following JSON structure:

{
  "summary": "string (overview/about me section)",
  "workHistory": [{
    "title": "string",
    "company": "string",
    "location": "string",
    "type": "job | internship | volunteer | co-op",
    "period": { "start": "YYYY-MM-DD", "end": "YYYY-MM-DD or null", "isCurrent": boolean },
    "responsibilities": ["string"],
    "achievements": ["string"]
  }],
  "education": [{
    "institution": "string",
    "field": { "type": "string (e.g., B.S., M.S.)", "course": "string (e.g., Computer Science)" },
    "period": { "start": "YYYY-MM-DD", "end": "YYYY-MM-DD or null", "isCurrent": boolean },
    "output": "string (GPA, honors, thesis)"
  }],
  "skills": [{
    "field": "string (e.g., Backend Development)",
    "yearsOfExperience": number,
    "lastUsed": "YYYY-MM-DD",
    "tools": [{ "name": "string", "score": number or null }]
  }],
  "projects": [{
    "title": "string",
    "role": "string",
    "links": { "repo": "string", "live": "string or undefined", "demo": "string or undefined" },
    "techStack": ["string"],
    "problemStatement": "string or null",
    "metrics": ["string"],
    "technicalChallenges": ["string"],
    "description": ["string"],
    "architecture": "string"
  }],
  "certifications": [{
    "name": "string", "issuer": "string", "skillsEarned": ["string"], "type": "string", "date": "YYYY-MM-DD"
  }],
  "languages": [{ "lang": "string", "proficiency": "string", "score": "string or undefined" }],
  "publications": [{
    "title": "string", "platform": "string", "type": "paper | article | talk",
    "link": "string", "keywords": ["string"], "date": "YYYY-MM-DD"
  }],
  "affiliations": [{
    "organization": "string", "role": "string", "type": "string", "impact": ["string"],
    "period": { "start": "YYYY-MM-DD", "end": "YYYY-MM-DD or null", "isCurrent": boolean }
  }],
  "awards": [{ "name": "string", "issuingBody": "string", "date": "YYYY-MM-DD", "justification": "string" }],
  "interests": [{ "activity": "string", "description": "string", "commitmentMetric": "string or undefined" }],
  "metaDetails": {
    "name": "string", "phone_no": "string", "email": "string",
    "github_profile": "string or null", "linkedin": "string or null",
    "address": { "city": "string", "country": "string", "postal_code": "string" },
    "extra_links": [{ "name": "string", "link": "string" }]
  }
}

Return ONLY the JSON object, no additional text or markdown formatting.`;

// ─── Quota / rate-limit detection ─────────────────────────────────────────────

function isQuotaError(err: unknown): boolean {
  if (err instanceof OpenAI.APIError) {
    return err.status === 429;
  }
  // Gemini fetch errors have .status attached manually
  if (typeof (err as any)?.status === "number") {
    return (err as any).status === 429;
  }
  const msg = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
  return (
    msg.includes("quota") ||
    msg.includes("rate limit") ||
    msg.includes("rate_limit") ||
    msg.includes("insufficient_quota") ||
    msg.includes("resource_exhausted") ||
    msg.includes("429")
  );
}

// ─── OpenAI parser ────────────────────────────────────────────────────────────

async function parseWithOpenAI(pdfBuffer: Buffer): Promise<any> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");

  const openai = new OpenAI({ apiKey });
  const base64Pdf = pdfBuffer.toString("base64");

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          { type: "text", text: USER_PROMPT },
          { type: "image_url", image_url: { url: `data:application/pdf;base64,${base64Pdf}` } },
        ],
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.1,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("No response from OpenAI");
  return JSON.parse(content);
}

// ─── Gemini parser ────────────────────────────────────────────────────────────

async function parseWithGemini(pdfBuffer: Buffer): Promise<any> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");

  const base64Pdf = pdfBuffer.toString("base64");

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: `${SYSTEM_PROMPT}\n\n${USER_PROMPT}` },
              { inline_data: { mime_type: "application/pdf", data: base64Pdf } },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: "application/json",
        },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: { message: res.statusText } }));
    const message = err?.error?.message ?? res.statusText;
    const error = new Error(`Gemini API error ${res.status}: ${message}`);
    (error as any).status = res.status;
    throw error;
  }

  const json = await res.json();
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini returned no content");

  // Strip markdown fences just in case
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  return JSON.parse(cleaned);
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function parseResumeWithAI(pdfBuffer: Buffer): Promise<any> {
  let geminiError: unknown;
  let openAiError: unknown;

  // 1. Try Gemini FIRST (since OpenAI has no credits)
  try {
    console.log("[resumeParser] Trying Gemini (primary)...");
    const result = await parseWithGemini(pdfBuffer);
    console.log("[resumeParser] Gemini succeeded.");
    return result;
  } catch (err) {
    geminiError = err;
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[resumeParser] Gemini failed — message: ${msg}`);
  }

  // 2. Try OpenAI as fallback
  try {
    console.log("[resumeParser] Trying OpenAI (fallback)...");
    const result = await parseWithOpenAI(pdfBuffer);
    console.log("[resumeParser] OpenAI succeeded.");
    return result;
  } catch (err) {
    openAiError = err;
    const msg = err instanceof Error ? err.message : String(err);
    const status = err instanceof OpenAI.APIError ? err.status : "N/A";
    console.warn(`[resumeParser] OpenAI failed — status: ${status}, message: ${msg}`);
  }

  // 3. Retry Gemini once more if OpenAI had quota issues
  if (isQuotaError(openAiError)) {
    try {
      console.log("[resumeParser] Retrying Gemini after OpenAI quota hit...");
      const result = await parseWithGemini(pdfBuffer);
      console.log("[resumeParser] Gemini retry succeeded.");
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[resumeParser] Gemini retry also failed — message: ${msg}`);
    }
  }

  // 4. All failed — log full errors for debugging then throw user-friendly message
  console.error("[resumeParser] ── ALL PROVIDERS FAILED ──────────────────────");
  console.error("[resumeParser] Gemini error:", geminiError);
  console.error("[resumeParser] OpenAI error:", openAiError);
  console.error("[resumeParser] ─────────────────────────────────────────────");

  // Provide specific error message
  if (geminiError) {
    const geminiMsg = geminiError instanceof Error ? geminiError.message : String(geminiError);
    if (geminiMsg.includes("API key not valid")) {
      throw new Error("Gemini API key is invalid. Please check your GEMINI_API_KEY in .env.local. Get a free key from https://aistudio.google.com/app/apikey");
    }
  }
  if (openAiError && isQuotaError(openAiError)) {
    throw new Error("OpenAI has no credits and Gemini API is not configured properly. Please add a valid GEMINI_API_KEY to .env.local");
  }

  throw new Error("Resume parsing failed. Please check your API keys (GEMINI_API_KEY or OPENAI_API_KEY) in .env.local");
}
