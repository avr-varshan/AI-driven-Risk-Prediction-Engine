// app/api/v1/score/route.ts
import score from '@/app/api/_fixtures/score.json';

const GEMINI_GENERATE_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Extract plain text from common Gemini response shapes
 */
function extractTextFromGeminiResponse(geminiJson: any): string {
  try {
    if (!geminiJson) return '';
    if (Array.isArray(geminiJson.candidates) && geminiJson.candidates.length) {
      const candidate = geminiJson.candidates[0];
      const content = candidate?.content;
      if (content) {
        if (Array.isArray(content.parts) && content.parts.length) {
          return content.parts.map((p: any) => p.text ?? '').join('').trim();
        }
        if (Array.isArray(content) && content.length) {
          return content.map((c: any) => c.text ?? '').join('').trim();
        }
      }
    }
    if (Array.isArray(geminiJson.output) && geminiJson.output.length) {
      const parts = geminiJson.output.flatMap((o: any) => o.content ?? []).map((c: any) => c.text ?? '').filter(Boolean);
      if (parts.length) return parts.join('').trim();
    }
    if (typeof geminiJson.text === 'string') return geminiJson.text.trim();
    if (typeof geminiJson.outputText === 'string') return geminiJson.outputText.trim();
    return '';
  } catch (err) {
    console.error('extractTextFromGeminiResponse error', err);
    return '';
  }
}

/**
 * Try to parse the first JSON object found in free-form text.
 * Returns null if none found.
 */
function parseFirstJsonObjectFromText(text: string): any | null {
  if (!text) return null;
  const first = text.indexOf('{');
  const last = text.lastIndexOf('}');
  if (first === -1 || last === -1 || last <= first) {
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  }
  const candidate = text.slice(first, last + 1);
  try {
    return JSON.parse(candidate);
  } catch {
    // brute-force attempt: expand outward if necessary
    for (let i = first; i >= 0; i--) {
      for (let j = last; j < text.length; j++) {
        const sub = text.slice(i, j + 1);
        try {
          return JSON.parse(sub);
        } catch {
          /* continue */
        }
      }
    }
    return null;
  }
}

/**
 * Call Gemini with a tight system prompt asking for a JSON estimate.
 * Returns { raw, text, parsed } where parsed is the first JSON object (or null).
 */
async function callGeminiForScore(scenario: any, geminiKey: string) {
  const systemPrompt = `You are a clinical assistant. Given the scenario JSON, respond ONLY with a JSON object in this shape:
{
  "prob": 0.12,                // probability between 0.0 and 1.0
  "group": "low"|"medium"|"high",
  "local_factors": ["factor1","factor2"],
  "explanation": "<one-line explanation>"
}
Be concise and return only valid JSON.`;

  const finalPrompt = `${systemPrompt}\n\nScenario:\n${JSON.stringify(scenario)}`;

  const body = { contents: [{ parts: [{ text: finalPrompt }] }] };

  const res = await fetch(GEMINI_GENERATE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': geminiKey },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`Gemini error ${res.status}: ${txt}`);
  }

  const raw = await res.json().catch(() => null);
  const text = extractTextFromGeminiResponse(raw) || '';
  const parsed = parseFirstJsonObjectFromText(text);
  return { raw, text, parsed };
}

/**
 * POST handler: returns score (fixture) normally; if GEMINI_API_KEY set,
 * call Gemini for an estimated JSON and merge.
 */
export async function POST(req?: Request) {
  // small dev latency to mimic previous behavior
  await sleep(300);

  // Read incoming payload (what-if scenario). If no req (rare), treat as empty.
  let payload: any = {};
  try {
    if (req) {
      payload = await req.json().catch(() => ({}));
    }
  } catch {
    payload = {};
  }

  // Base response: the existing fixture (unchanged behavior)
  const base = (score as any) ?? {};

  // If no GEMINI key, return the fixture merged with safe normalized fields
  const GEMINI_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_KEY) {
    // Normalize top-level fields so clients see prob/group/local_factors/explanation
    const prob = Number(base.prob ?? base.probability ?? base.risk_prob ?? 0);
    const group = String(base.group ?? base.risk_group ?? (prob >= 0.5 ? 'high' : prob >= 0.2 ? 'medium' : 'low'));
    const local_factors = Array.isArray(base.local_factors)
      ? base.local_factors
      : Array.isArray(base.localFactors)
      ? base.localFactors
      : [];
    const explanation = String(base.explanation ?? base.summary ?? base.message ?? '');

    const finalNoGemini = {
      ...base,
      gemini: null,
      prob,
      group,
      local_factors,
      explanation,
    };

    return Response.json(finalNoGemini, { status: 200 });
  }

  // If GEMINI_KEY present -> call Gemini (but be defensive)
  let geminiResult: any = null;
  try {
    // send payload to Gemini for an estimate
    geminiResult = await callGeminiForScore(payload, GEMINI_KEY);
  } catch (err) {
    console.error('Gemini call failed:', err);
    geminiResult = null;
  }

  // If parsed JSON returned from Gemini, prefer its values; otherwise fallback to base fixture
  if (geminiResult && geminiResult.parsed) {
    const parsed = geminiResult.parsed;
    const prob = Math.max(0, Math.min(1, Number(parsed.prob ?? parsed.probability ?? base.prob ?? 0)));
    const group = String(parsed.group ?? base.group ?? (prob >= 0.5 ? 'high' : prob >= 0.2 ? 'medium' : 'low'));
    const local_factors = Array.isArray(parsed.local_factors)
      ? parsed.local_factors.map((f: any) => (typeof f === 'string' ? f : JSON.stringify(f)))
      : Array.isArray(parsed.localFactors)
      ? parsed.localFactors.map((f: any) => (typeof f === 'string' ? f : JSON.stringify(f)))
      : Array.isArray(base.local_factors)
      ? base.local_factors
      : [];

    const explanation = String(parsed.explanation ?? parsed.summary ?? base.explanation ?? base.summary ?? '');

    const merged = {
      ...base,
      gemini: { raw: geminiResult.raw ?? null, text: geminiResult.text ?? '' },
      prob,
      group,
      local_factors,
      explanation,
    };

    return Response.json(merged, { status: 200 });
  }

  // If Gemini didn't return parseable JSON, fall back to base fixture but include gemini text
  const a1c = Number(payload.a1c_result ?? payload.a1c ?? 0);
  // small heuristic guess only for explanation context (not overriding base prob)
  let probGuess = 0.05 + Math.min(Math.max((a1c - 5) * 0.03, 0), 0.6);
  if (payload.on_insulin) probGuess += 0.05;
  probGuess = Math.max(0, Math.min(0.99, probGuess));

  const finalFallback = {
    ...base,
    gemini: { raw: geminiResult?.raw ?? null, text: geminiResult?.text ?? null },
    // do not overwrite base.prob unless you want to; keep a merged visible field too
    prob: base.prob ?? probGuess,
    group: base.group ?? (probGuess >= 0.5 ? 'high' : probGuess >= 0.2 ? 'medium' : 'low'),
    local_factors: Array.isArray(base.local_factors) ? base.local_factors : [],
    explanation:
      (base.explanation ?? base.summary) ||
      (geminiResult?.text ? String(geminiResult.text).slice(0, 1000) : 'No parseable JSON from model'),
  };

  return Response.json(finalFallback, { status: 200 });
}