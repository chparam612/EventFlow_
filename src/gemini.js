const GEMINI_KEY = 'AIzaSyB-jD9f3q0xDxL_C3IEsdZ9VRlPA_ilRQw';
const URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + GEMINI_KEY;

const SYSTEM = `You are EventFlow AI, a helpful crowd assistant at 
Narendra Modi Stadium (NMS), Ahmedabad — capacity 132,000.
Help cricket fans navigate safely and comfortably.
Rules: be friendly, concise (max 2 sentences), 
give ONE clear recommendation, mention specific 
gates or zones, never cause panic, always positive framing.
Gates A-I around stadium. Stands: North, South, East, West.
Parking: P1 North, P2 South, P3 East, P4 West.`;

async function callGemini(prompt, maxTokens = 150) {
  try {
    const res = await fetch(URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: maxTokens, topP: 0.8 }
      })
    });
    if (!res.ok) throw new Error('API error ' + res.status);
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
  } catch (e) {
    console.error('Gemini error:', e);
    return null;
  }
}

export async function askAttendee(message, crowdContext) {
  const ctx = crowdContext ? '\\nLive crowd data: ' + JSON.stringify(crowdContext) : '';
  const reply = await callGemini(SYSTEM + ctx + '\\nFan: ' + message);
  return reply || 'AI assistant is temporarily unavailable. Check venue screens for updates.';
}

export async function getAIInsights(densities) {
  const summary = Object.entries(densities)
    .map(([z, d]) => z + ':' + Math.round(d * 100) + '%').join(', ');
  const prompt = `Control room AI at NMS. Densities: ${summary}
Return exactly 3 JSON insights (no markdown, no extra text):
{"insights":[{"type":"warning|info|action","zone":"name","message":"under 12 words","action":"under 8 words"}]}`;
  const raw = await callGemini(prompt, 300);
  if (!raw) return { insights: [] };
  try {
    const clean = raw.replace(/\`\`\`json|\`\`\`/g, '').trim();
    return JSON.parse(clean);
  } catch (e) { return { insights: [] }; }
}
