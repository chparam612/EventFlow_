/**
 * EventFlow V2 — Gemini AI Module
 * Uses gemini-2.0-flash for high-performance crowd insights.
 */

// NOTE: Key is injected via build.js (see .env → GEMINI_API_KEY)
const GEMINI_KEY = 'YOUR_GEMINI_KEY_HERE';
const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

/**
 * Core API call with official System Instructions & JSON Schema support
 */
async function callGemini(prompt, systemInstruction = "", responseType = "text", maxTokens = 500) {
  if (!GEMINI_KEY || GEMINI_KEY === 'YOUR_GEMINI_KEY_HERE') return null;

  const url = `${GEMINI_BASE_URL}?key=${GEMINI_KEY}`;
  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.2, // Lower temp for more deterministic business logic
      maxOutputTokens: maxTokens,
      topP: 0.95,
      responseMimeType: responseType === "json" ? "application/json" : "text/plain"
    }
  };

  if (systemInstruction) {
    payload.systemInstruction = { parts: [{ text: systemInstruction }] };
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.status === 429) return "Notice: AI rate limit reached. Fallback logic active.";
    if (!res.ok) throw new Error(`Gemini API Error: ${res.status}`);

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    return text || null;
  } catch (e) {
    console.warn('[Gemini] Execution failure:', e.message);
    return null;
  }
}

// ─── Attendee Chat ─────────────────────────────────────────────────────────
const ATTENDEE_SYSTEM = `You are EventFlow AI at Narendra Modi Stadium (Ahmedabad). 
Role: Friendly crowd assistant.
Rules: Friendly, max 2 short sentences, 1 clear recommendation. 
Never cause panic. Use real locations: Gates A-I, Parking P1-P4.`;

export async function askAttendee(message, crowdContext) {
  const contextText = crowdContext ? `\nLive Crowd context: ${JSON.stringify(crowdContext)}` : "";
  
  try {
    const reply = await callGemini(message + contextText, ATTENDEE_SYSTEM, "text", 200);
    if (!reply || reply.includes("Notice:")) throw new Error("Fallback needed");
    return reply;
  } catch (e) {
    // Intelligent Fallback Logic
    return "Gate B (North) usually has the fastest entry. Follow staff for live directions.";
  }
}

// ─── Control Room AI Insights ──────────────────────────────────────────────
const CONTROL_SYSTEM = `You are the EventFlow Command AI. Analyze stadium zone densities and provide three actionable JSON insights.
Response MUST be valid JSON with this structure:
{"insights": [{"type": "warning|info|action", "zone": "string", "message": "string", "action": "string"}]}`;

export async function getAIInsights(densities) {
  const summary = Object.entries(densities).map(([z, d]) => `${z}:${Math.round(d * 100)}%`).join(', ');
  const prompt = `Densities: ${summary}`;

  try {
    const raw = await callGemini(prompt, CONTROL_SYSTEM, "json", 500);
    
    if (!raw || raw.includes("Notice:")) throw new Error("Fallback mode");
    
    const parsed = JSON.parse(raw);
    if (parsed.insights) return parsed;
    throw new Error("Invalid format");
  } catch (e) {
    // Deterministic Fallback for critical dashboards
    const critical = Object.entries(densities).find(([, d]) => d > 0.85);
    return {
      insights: [
        critical 
          ? { type: 'warning', zone: critical[0], message: 'Critical density detected via fallback', action: 'Deploy staff' }
          : { type: 'info', zone: 'Stadium', message: 'All zones stable', action: 'Monitor' }
      ]
    };
  }
}
