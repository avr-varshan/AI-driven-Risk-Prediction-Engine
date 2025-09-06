// frontend/app/api/v1/patients/[patient_nbr]/route.ts
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
        // content.parts (object) or content may be array-like
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
 * Try to parse the first JSON object found in the model text.
 * Returns null if parsing fails.
 */
function parseFirstJsonObjectFromText(text: string): any | null {
  if (!text) return null;
  const first = text.indexOf('{');
  const last = text.lastIndexOf('}');
  if (first === -1 || last === -1 || last <= first) {
    // no obvious JSON braces; try direct parse
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  }
  const candidate = text.slice(first, last + 1);
  try {
    return JSON.parse(candidate);
  } catch (e) {
    // last attempt: extract braces progressively
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
 * Returns { text, rawJson } where text is extracted plain text and rawJson is parsed response body.
 */
async function callGeminiForPatientAnalysis(systemPrompt: string, userMessage: string) {
  const GEMINI_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_KEY) throw new Error('GEMINI_API_KEY not configured');

  // Build a compact prompt asking for JSON output with fields: summary, recommendations (array)
  const finalPrompt = `${systemPrompt}\n\nPatient context:\n${userMessage}\n\nRespond ONLY with a valid JSON object in the following shape:\n{ "summary": "<one-line summary>", "recommendations": ["r1","r2", ...] }\nDo not include extra commentary or markdown.`;

  const body = {
    contents: [{ parts: [{ text: finalPrompt }] }],
    // optional tuning: temperature: 0.0
  };

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

export async function GET(_req: Request, { params }: { params: { patient_nbr?: string } }) {
  try {
    const patientNbr = params?.patient_nbr;
    if (!patientNbr) return NextResponse.json({ error: 'patient_nbr required' }, { status: 400 });

    // 1) Load local fixture or build from index
    const fixture = loadPatientFixture(patientNbr);
    const patientDetail = fixture ?? buildPatientFromIndex(patientNbr);

    if (!patientDetail) return NextResponse.json({ error: 'patient not found' }, { status: 404 });

    // 2) If Gemini configured, call it to produce insights
    const GEMINI_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_KEY) {
      // return patient detail without insights
      return NextResponse.json({ patient: patientDetail }, { status: 200 });
    }

    // Build a concise system prompt including cohort summary (from patientsIndex)
    const cohortSummary = (patientsIndex as any).summary ?? {};
    const systemPrompt = `You are a clinical assistant. Given the patient record (JSON) and cohort summary, produce a short "summary" (1-2 sentences) describing the patient's main risk factors and a short list of actionable "recommendations" (2-4 items). Use clinical tone.`;

    // Provide patient context as JSON string (safe length—if large, trim)
    const patientContext = JSON.stringify(patientDetail);

    // Call Gemini
    let geminiResult;
    try {
      geminiResult = await callGeminiForPatientAnalysis(
        `${systemPrompt}\nCohort summary: ${JSON.stringify(cohortSummary)}`,
        patientContext
      );
    } catch (err) {
      console.error('Gemini call failed:', err);
      // return patient detail without insights but indicate the failure
      return NextResponse.json({ patient: patientDetail, insights: { summary: 'Gemini call failed', recommendations: [] } }, { status: 200 });
    }

    // Parse JSON from model text
    const parsed = parseFirstJsonObjectFromText(geminiResult.text || '');
    if (parsed && (parsed.summary || Array.isArray(parsed.recommendations))) {
      // normalize recommendations to string[]
      const recs = Array.isArray(parsed.recommendations) ? parsed.recommendations.map((r: any) => String(r)) : [];
      const insights = { summary: String(parsed.summary ?? '').trim(), recommendations: recs };
      return NextResponse.json({ patient: patientDetail, insights, gemini_raw: geminiResult.raw ?? null }, { status: 200 });
    }

    // If parsing failed, return the extracted text as a fallback "summary"
    const fallbackSummary = geminiResult.text ? String(geminiResult.text).slice(0, 2000) : 'No insights';
    return NextResponse.json(
      {
        patient: patientDetail,
        insights: { summary: fallbackSummary, recommendations: [] },
        gemini_raw: geminiResult.raw ?? null,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('GET /api/v1/patients/[patient_nbr] error:', err);
    return NextResponse.json({ error: 'internal server error' }, { status: 500 });
  }
}