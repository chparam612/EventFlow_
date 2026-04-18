/**
 * EventFlow V2 — Gemini AI Module
 * Uses gemini-2.0-flash for high-performance crowd insights.
 */

// NOTE: Key is injected via build.js (see .env → GEMINI_API_KEY)
const GEMINI_KEY = 'YOUR_GEMINI_KEY_HERE';
const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

/**
 * Structured logging helper
 * @param {'info'|'warn'|'error'} level 
 * @param {string} message 
 * @param {object} [data] 
 */
function log(level, message, data) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(data && { data })
  };
  console[level === 'error' ? 'error' : 'log'](JSON.stringify(entry));
}

/**
 * Core API call with official System Instructions & JSON Schema support
 * @param {string} prompt 
 * @param {string} [systemInstruction] 
 * @param {'text'|'json'} [responseType] 
 * @param {number} [maxTokens] 
 * @returns {Promise<string|null>}
 */
async function callGemini(prompt, systemInstruction = "", responseType = "text", maxTokens = 500) {
  if (!GEMINI_KEY || GEMINI_KEY === 'YOUR_GEMINI_KEY_HERE') return null;

  const url = `${GEMINI_BASE_URL}?key=${GEMINI_KEY}`;
  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.1, // Near-deterministic for business logic
      maxOutputTokens: maxTokens,
      responseMimeType: responseType === "json" ? "application/json" : "text/plain"
    }
  };

  // Add formal JSON Schema for structured data (Service Upgrade)
  if (responseType === "json") {
    payload.generationConfig.responseSchema = {
      type: "OBJECT",
      properties: {
        insights: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              type: { type: "STRING", enum: ["warning", "info", "action"] },
              zone: { type: "STRING" },
              message: { type: "STRING" },
              action: { type: "STRING" }
            },
            required: ["type", "zone", "message", "action"]
          }
        }
      },
      required: ["insights"]
    };
  }

  if (systemInstruction) {
    payload.systemInstruction = { parts: [{ text: systemInstruction }] };
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.status === 429) {
      // Return a special identifier for rate limits that the caller can catch
      return "__RATE_LIMIT_FALLBACK__";
    }
    if (!res.ok) throw new Error(`Gemini API Error: ${res.status}`);

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    return text || null;
  } catch (e) {
    // Only log for unexpected errors, not rate limits or aborts
    if (e.message !== 'Aborted') {
      log('error', 'Gemini Request failure', { error: e.message });
    }
    return null;
  }
}

// ─── Attendee Chat ─────────────────────────────────────────────────────────
const ATTENDEE_SYSTEM = `You are EventFlow AI, the real-time crowd guide for Narendra Modi Stadium (NMS), Ahmedabad. 
STRICT RULES:
1. Fresh Analysis: Treat every question uniquely.
2. Context Guard: ALWAYS use the [LIVE STADIUM DATA] provided.
3. Relevant Only: Answer only the specific question asked.
4. Fallback: If live data is missing, say "Live data unavailable right now — generally..."
5. Concise: Max 2-3 short sentences.
6. No Defaults: Never assume Gate B unless data confirms it.
7. Format: Plain text only. NO markdown, NO bullet points.
Stadium safety is your top priority.`;

export async function askAttendee(userMessage, ctx) {
  const zones = ctx?.zones || {};
  const liveContext = `
[LIVE STADIUM DATA]
Current time: ${ctx?.matchPhase || 'unknown'}
User gate: ${ctx?.userGate || 'unknown'}
User stand: ${ctx?.userStand || 'unknown'}
Zone status: North=${zones.north || 0}, South=${zones.south || 0}, East=${zones.east || 0}, West=${zones.west || 0}
Active nudge: ${ctx?.activeNudge || 'none'}
[END DATA]

User question: ${userMessage}
`;
  
  try {
    const reply = await callGemini(liveContext, ATTENDEE_SYSTEM, "text", 200);
    if (!reply || reply === "__RATE_LIMIT_FALLBACK__") throw new Error("Fallback mode");
    // Clean markdown if AI included it anyway
    return reply.replace(/[*_#`]/g, '').trim();
  } catch (e) {
    return "Please follow stadium signage and staff directions for the safest route. Live AI updates are temporarily delayed.";
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
    if (!raw || raw === "__RATE_LIMIT_FALLBACK__") throw new Error("Fallback mode");
    
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
