import patientsIndex from '@/app/api/_fixtures/patientsIndex.json';
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const GEMINI_GENERATE_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

/**
 * Helper: read a patient fixture if it exists (dev convenience).
 */
function loadPatientFixture(patientNbr: string) {
  try {
    const fixturePath = path.join(process.cwd(), 'app', 'api', '_fixtures', 'patients', `${patientNbr}.json`);
    if (fs.existsSync(fixturePath)) {
      const raw = fs.readFileSync(fixturePath, 'utf8');
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Failed to load patient fixture:', e);
  }
  return null;
}

/**
 * Build a fallback PatientDetail from patientsIndex.json
 */
function buildPatientFromIndex(patientNbr: string) {
  const patients = (patientsIndex as any).patients ?? [];
  const found = patients.find((p: any) => String(p.patient_nbr) === String(patientNbr));
  if (!found) return null;
  return {
    demographics: {
      age: found.age ?? null,
      gender: found.gender ?? 'unknown',
      race: found.race ?? 'unknown',
    },
    last_encounter: {
      admission_type: found.last_admission_type ?? 'unknown',
      discharge_disposition: 'unknown',
      admission_source: 'unknown',
      time_in_hospital: found.time_in_hospital ?? 0,
      date: new Date().toISOString(),
    },
    utilization: {
      outpatient: 0,
      inpatient: 0,
      emergency: 0,
    },
    diagnoses_timeline: [],
    labs_timeline: { a1c: [], glucose: [] },
    medications_timeline: [],
    risk: {
      prob: found.risk_prob ?? 0,
      group: found.risk_group ?? 'low',
      local_factors: Object.keys(found.med_summary ?? {}),
      recommendations: [],
    },
  };
}

/**
 * Extract readable text from common Gemini response shapes
 */
function extractTextFromGeminiResponse(geminiJson: any): string {
  try {
    if (!geminiJson) return '';
    if (Array.isArray(geminiJson.candidates) && geminiJson.candidates.length) {
      const candidate = geminiJson.candidates[0];
      if (candidate?.content) {
        const content = candidate.content;
        if (Array.isArray(content.parts) && content.parts.length) {
          return content.parts.map((p: any) => p.text ?? '').join('').trim();
        }
        if (Array.isArray(content) && content.length) {
          return content.map((c: any) => c.text ?? '').join('').trim();
        }
      }
    }
    if (Array.isArray(geminiJson.output) && geminiJson.output.length) {
      const parts = geminiJson.output
        .flatMap((o: any) => o.content ?? [])
        .map((c: any) => c.text ?? '')
        .filter(Boolean);
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
 * Try to parse the first JSON object found in the model text.
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
 * Call Gemini Developer REST with a system prompt and user message.
 */
async function callGeminiForPatientAnalysis(systemPrompt: string, userMessage: string) {
  const GEMINI_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_KEY) throw new Error('GEMINI_API_KEY not configured');

  const finalPrompt = `${systemPrompt}\n\nPatient context:\n${userMessage}\n\nRespond ONLY with a valid JSON object in the following shape:\n{ "summary": "<one-line summary>", "recommendations": ["r1","r2", ...] }\nDo not include extra commentary or markdown.`;

  const body = { contents: [{ parts: [{ text: finalPrompt }] }] };

  const res = await fetch(GEMINI_GENERATE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': GEMINI_KEY },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`Gemini error ${res.status}: ${txt}`);
  }

  const raw = await res.json().catch(() => null);
  const text = extractTextFromGeminiResponse(raw) || '';
  return { text, raw };
}

/**
 * GET /api/v1/patients/[patient_nbr]
 */
export async function GET(_req: Request, { params }: { params: { patient_nbr?: string } }) {
  try {
    const patientNbr = params?.patient_nbr;
    if (!patientNbr) return NextResponse.json({ error: 'patient_nbr required' }, { status: 400 });

    const fixture = loadPatientFixture(patientNbr);
    const patientDetail = fixture ?? buildPatientFromIndex(patientNbr);
    if (!patientDetail) return NextResponse.json({ error: 'patient not found' }, { status: 404 });

    const GEMINI_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_KEY) return NextResponse.json({ patient: patientDetail }, { status: 200 });

    const cohortSummary = (patientsIndex as any).summary ?? {};
    const systemPrompt = `You are a clinical assistant. Given the patient record (JSON) and cohort summary, produce a short "summary" (1-2 sentences) describing the patient's main risk factors and a short list of actionable "recommendations" (2-4 items). Use clinical tone.`;

    const patientContext = JSON.stringify(patientDetail);

    let geminiResult;
    try {
      geminiResult = await callGeminiForPatientAnalysis(
        `${systemPrompt}\nCohort summary: ${JSON.stringify(cohortSummary)}`,
        patientContext
      );
    } catch (err) {
      console.error('Gemini call failed:', err);
      return NextResponse.json({ patient: patientDetail, insights: { summary: 'Gemini call failed', recommendations: [] } }, { status: 200 });
    }

    const parsed = parseFirstJsonObjectFromText(geminiResult.text || '');
    if (parsed && (parsed.summary || Array.isArray(parsed.recommendations))) {
      const recs = Array.isArray(parsed.recommendations) ? parsed.recommendations.map((r: any) => String(r)) : [];
      const insights = { summary: String(parsed.summary ?? '').trim(), recommendations: recs };
      return NextResponse.json({ patient: patientDetail, insights, gemini_raw: geminiResult.raw ?? null }, { status: 200 });
    }

    const fallbackSummary = geminiResult.text ? String(geminiResult.text).slice(0, 2000) : 'No insights';
    return NextResponse.json({ patient: patientDetail, insights: { summary: fallbackSummary, recommendations: [] }, gemini_raw: geminiResult.raw ?? null }, { status: 200 });
  } catch (err) {
    console.error('GET /api/v1/patients/[patient_nbr] error:', err);
    return NextResponse.json({ error: 'internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/v1/patients/[patient_nbr]
 * Body: { message?: string }
 */
export async function POST(req: Request, { params }: { params: { patient_nbr?: string } }) {
  try {
    const patientNbr = params?.patient_nbr;
    if (!patientNbr) return NextResponse.json({ error: 'patient_nbr required' }, { status: 400 });

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }
    const userMessage = String(body?.message ?? '').trim();

    const fixture = loadPatientFixture(patientNbr);
    const patientDetail = fixture ?? buildPatientFromIndex(patientNbr);
    if (!patientDetail) return NextResponse.json({ error: 'patient not found' }, { status: 404 });

    const GEMINI_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_KEY) {
      return NextResponse.json({ patient: patientDetail, insights: { summary: 'Gemini not configured', recommendations: [] } }, { status: 200 });
    }

    const cohortSummary = (patientsIndex as any).summary ?? {};
    const systemPrompt = `You are a clinical assistant. Given the patient record (JSON) and cohort summary, produce a short "summary" (1-2 sentences) describing the patient's main risk factors and a short list of actionable "recommendations" (2-4 items). Use clinical tone.`;
    const patientContext = JSON.stringify(patientDetail);
    const userContext = userMessage ? `\nUser message: ${userMessage}` : '';

    let geminiResult;
    try {
      geminiResult = await callGeminiForPatientAnalysis(
        `${systemPrompt}\nCohort summary: ${JSON.stringify(cohortSummary)}`,
        `${patientContext}${userContext}`
      );
    } catch (err) {
      console.error('Gemini call failed (POST):', err);
      return NextResponse.json({ patient: patientDetail, insights: { summary: 'Gemini call failed', recommendations: [] } }, { status: 200 });
    }

    const parsed = parseFirstJsonObjectFromText(geminiResult.text || '');
    if (parsed && (parsed.summary || Array.isArray(parsed.recommendations))) {
      const recs = Array.isArray(parsed.recommendations) ? parsed.recommendations.map((r: any) => String(r)) : [];
      const insights = { summary: String(parsed.summary ?? '').trim(), recommendations: recs };
      return NextResponse.json({ patient: patientDetail, insights, gemini_raw: geminiResult.raw ?? null }, { status: 200 });
    }

    const fallbackSummary = geminiResult.text ? String(geminiResult.text).slice(0, 2000) : 'No insights';
    return NextResponse.json({ patient: patientDetail, insights: { summary: fallbackSummary, recommendations: [] }, gemini_raw: geminiResult.raw ?? null }, { status: 200 });
  } catch (err) {
    console.error('POST /api/v1/patients/[patient_nbr] error:', err);
    return NextResponse.json({ error: 'internal server error' }, { status: 500 });
  }
}