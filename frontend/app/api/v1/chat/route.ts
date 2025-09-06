// frontend/app/api/v1/chat/route.ts
import patientsIndex from '@/app/api/_fixtures/patientsIndex.json';
import chatGlobalMock from '@/app/api/_fixtures/chat_global.json';
import { NextResponse } from 'next/server';

type ReqBody = { message?: string; what_if?: Record<string, any> };
type ChatResponse = { answer: string; used_data?: any; links?: string[] };

const GEMINI_GENERATE_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

/** Utility to normalize link-like shapes -> href string[] */
function normalizeLinks(raw: any): string[] {
  if (!raw) return [];
  if (Array.isArray(raw) && raw.every((i) => typeof i === 'string')) return raw as string[];
  if (Array.isArray(raw)) {
    const mapped = raw
      .map((r: any) => {
        if (!r) return undefined;
        if (typeof r === 'string') return r;
        if (typeof r.href === 'string' && r.href.trim()) return r.href;
        if (typeof r.url === 'string' && r.url.trim()) return r.url;
        if (typeof r.link === 'string') return r.link;
        return undefined;
      })
      .filter(Boolean) as string[];
    return Array.from(new Set(mapped));
  }
  if (typeof raw === 'object') {
    const single =
      (typeof raw.href === 'string' && raw.href) ||
      (typeof raw.url === 'string' && raw.url) ||
      (typeof raw.link === 'string' && raw.link) ||
      undefined;
    return single ? [single] : [];
  }
  return [];
}

/** Build a short human answer and used_data from patientsIndex fixture */
function answerFromPatientsIndex(limit = 10) {
  const allPatients = (patientsIndex as any).patients ?? [];
  // sort descending by risk_prob
  const sorted = [...allPatients].sort((a: any, b: any) => (b.risk_prob ?? 0) - (a.risk_prob ?? 0));
  const top = sorted.slice(0, limit);

  // Build friendly one-liner answer
  const topIds = top.map((p: any) => `${p.patient_nbr} (${Math.round((p.risk_prob ?? 0) * 100) / 100})`);
  const answer = `Top ${top.length} high-risk patients: ${topIds.join(', ')}. Main cohort drivers (from summary): ${((patientsIndex as any).summary?.top_comorbidities ?? [])
    .map((c: any) => c.label)
    .filter(Boolean)
    .join(', ') || 'N/A' }.`;

  // used_data example: include top patient and cohort drivers and numeric values
  const used_data = {
    top_patients: top.map((p: any) => ({ patient_nbr: p.patient_nbr, risk_prob: p.risk_prob })),
    drivers: [
      // infer drivers from summary / labs
      ...((patientsIndex as any).summary?.top_comorbidities ?? []).map((c: any) => c.label),
      (patientsIndex as any).summary?.labs ? 'A1C_result_stats' : undefined,
    ].filter(Boolean),
  };

  // map to link hrefs for each top patient (frontend expects internal link paths)
  const links = top.map((p: any) => `/patients/${p.patient_nbr}`);

  return { answer, used_data, links };
}

/** A minimal extractor for Gemini JSON shapes (safe) */
function extractTextFromGeminiResponse(geminiJson: any): string {
  try {
    if (!geminiJson) return '';
    if (Array.isArray(geminiJson.candidates) && geminiJson.candidates.length) {
      const candidate = geminiJson.candidates[0];
      if (candidate?.content) {
        const content = candidate.content;
        if (Array.isArray(content.parts)) {
          const text = content.parts.map((p: any) => (typeof p.text === 'string' ? p.text : '')).join('');
          if (text.trim()) return text.trim();
        }
        if (Array.isArray(content)) {
          const text = content.map((c: any) => (typeof c.text === 'string' ? c.text : '')).join('');
          if (text.trim()) return text.trim();
        }
      }
    }
    if (Array.isArray(geminiJson.output) && geminiJson.output.length) {
      const parts = geminiJson.output.flatMap((o: any) => o.content ?? []).map((c: any) => c.text ?? '').filter(Boolean);
      if (parts.length) return parts.join('');
    }
    if (typeof geminiJson.text === 'string') return geminiJson.text;
    if (typeof geminiJson.outputText === 'string') return geminiJson.outputText;
    return '';
  } catch (err) {
    console.error('extractTextFromGeminiResponse error', err);
    return '';
  }
}

/** Calls Gemini Developer REST (non-streaming) with given system/context + user message */
async function callGeminiWithContext(systemContext: string, userMessage: string) {
  const GEMINI_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_KEY) throw new Error('GEMINI_API_KEY not configured');

  const prompt = `${systemContext}\n\nUser: ${userMessage}\nAssistant:`;

  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    // optional tuning: temperature, maxOutputTokens etc.
  };

  const res = await fetch(GEMINI_GENERATE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': GEMINI_KEY },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`Gemini error: ${res.status} ${txt}`);
  }

  const json = await res.json().catch(() => null);
  const text = extractTextFromGeminiResponse(json) || '';
  return { text, raw: json };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as ReqBody;
    const message = (body.message || '').toString().trim();
    const whatIf = body.what_if;

    if (!message) return NextResponse.json({ error: 'message is required' }, { status: 400 });

    // Simple intent heuristics: if message asks for top/high-risk patients -> compute from fixture
    const lower = message.toLowerCase();
    const asksTopHighRisk =
      lower.includes('top') && lower.includes('high') && (lower.includes('risk') || lower.includes('risk patients') || lower.includes('high-risk'));
    const asksTop10 = lower.includes('top 10') || lower.includes('top ten');

    if (asksTopHighRisk || asksTop10) {
      // determine limit: top 10 or fewer if we don't have 10 patients
      const limit = asksTop10 ? 10 : 5;
      const { answer, used_data, links } = answerFromPatientsIndex(limit);
      const resp: ChatResponse = {
        answer,
        used_data,
        links: normalizeLinks(links),
      };
      return NextResponse.json(resp, { status: 200 });
    }

    // If we reach here: not a direct cohort query. If Gemini key exists, call Gemini with context from fixtures.
    const GEMINI_KEY = process.env.GEMINI_API_KEY;
    if (GEMINI_KEY) {
      // Prepare a concise system context that includes summary + top patients
      const summary = (patientsIndex as any).summary ?? {};
      const summaryText = `Cohort summary: total_patients=${summary.total_patients ?? 'N/A'}, avg_time_in_hospital=${summary.avg_time_in_hospital ?? 'N/A'}, avg_num_diagnoses=${summary.avg_num_diagnoses ?? 'N/A'}. Top comorbidities: ${((summary.top_comorbidities ?? []) as any[])
        .map((c: any) => (typeof c === 'string' ? c : c.label ?? ''))
        .filter(Boolean)
        .join(', ') || 'N/A'}.`;
      // include short patient index as context (ids and risk)
      const patientsShort = ((patientsIndex as any).patients ?? [])
        .map((p: any) => `${p.patient_nbr}:${Math.round((p.risk_prob ?? 0) * 100) / 100}`)
        .join(', ');

      const systemContext = `Use the following cohort data for context. Do NOT invent patient identifiers beyond those listed.\n${summaryText}\nPatients (patient_nbr:risk_prob): ${patientsShort}`;

      // Call Gemini and return its text as answer. Optionally, you could request structured output in the prompt.
      const { text: geminiText, raw } = await callGeminiWithContext(systemContext, message);

      // attempt to extract links from model raw output if it included any (unlikely). fallback to fixture
      const possibleLinks = raw?.links ?? chatGlobalMock?.links ?? undefined;
      const links = normalizeLinks(possibleLinks);

      const chatResp: ChatResponse = { answer: geminiText || (chatGlobalMock as any)?.answer || '', used_data: undefined, links };
      return NextResponse.json(chatResp, { status: 200 });
    }

    // No Gemini key: fall back to chatGlobalMock
    const fallbackLinks = normalizeLinks((chatGlobalMock as any)?.links);
    const fallbackResp: ChatResponse = {
      answer: (chatGlobalMock as any)?.answer ?? 'Mock response: GEMINI_API_KEY not configured.',
      used_data: (chatGlobalMock as any)?.used_data ?? undefined,
      links: fallbackLinks,
    };
    return NextResponse.json(fallbackResp, { status: 200 });
  } catch (err) {
    console.error('Global chat route error:', err);
    return NextResponse.json({ error: 'internal server error' }, { status: 500 });
  }
}