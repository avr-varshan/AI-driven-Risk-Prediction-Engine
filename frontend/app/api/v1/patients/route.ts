// frontend/app/api/v1/patients/route.ts
import patientsIndex from '@/app/api/_fixtures/patientsIndex.json';
import { NextResponse } from 'next/server';

const GEMINI_GENERATE_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function extractTextFromGeminiResponse(geminiJson: any): string {
  try {
    if (!geminiJson) return '';
    if (Array.isArray(geminiJson.candidates) && geminiJson.candidates.length) {
      const candidate = geminiJson.candidates[0];
      if (candidate?.content) {
        const content = candidate.content;
        // handle content.parts or content being an array
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
 * Small heuristic fallback risk computation if the model doesn't return usable JSON.
 * You can replace this with your real scoring logic later.
 */
function heuristicRiskFromPatient(patientData: any) {
  const medSummary = patientData?.med_summary ?? {};
  let prob = 0.1;
  if (patientData?.num_diagnoses) prob += Math.min(0.2, (patientData.num_diagnoses / 20));
  if (typeof patientData?.risk_prob === 'number') prob = Math.max(prob, patientData.risk_prob);
  if (medSummary.insulin && String(medSummary.insulin).toLowerCase() === 'up') prob += 0.15;
  // clamp
  prob = Math.max(0, Math.min(0.99, prob));
  const group = prob >= 0.7 ? 'high' : prob >= 0.4 ? 'medium' : 'low';
  const drivers: string[] = [];
  if (medSummary.insulin && medSummary.insulin.toLowerCase() === 'up') drivers.push('insulin_Up');
  if (patientData?.num_diagnoses && patientData.num_diagnoses >= 7) drivers.push('multiple_diagnoses');
  return { prob, group, local_factors: drivers };
}

export async function GET() {
  await sleep(400);
  return Response.json(patientsIndex, { status: 200 });
}

export async function POST(request: Request) {
  await sleep(400);

  try {
    const body = await request.json().catch(() => ({}));
    // body contains the new/updated patient data
    const patientData = body || {};

    // Build a minimal response holder
    const baseResponse = {
      patient_nbr: patientData.patient_nbr ?? 'NEW123',
      saved: true,
      risk: {
        prob: 0.76,
        group: 'high',
        local_factors: [
          { feature: 'A1Cresult_gt8', impact: '+0.16' },
          { feature: 'insulin_Up', impact: '+0.05' },
        ],
      },
    };

    const GEMINI_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_KEY) {
      // No key -> return the existing mock behavior (but we apply a small heuristic)
      const heuristic = heuristicRiskFromPatient(patientData);
      return Response.json(
        {
          patient_nbr: patientData.patient_nbr ?? 'NEW123',
          saved: true,
          risk: {
            prob: heuristic.prob,
            group: heuristic.group,
            local_factors: heuristic.local_factors.map((f: string) => ({ feature: f, impact: '' })),
          },
        },
        { status: 200 }
      );
    }

    // Build a concise system prompt asking Gemini to return only JSON
    // IMPORTANT: instruct model to output valid JSON only (no extra commentary)
    const systemPrompt = `
You are an assistant that analyzes a single patient record and returns a compact JSON object describing risk.
Given the patient record below, return a JSON object EXACTLY in this shape:

{
  "prob": <number between 0 and 1>,
  "group": "high" | "medium" | "low",
  "local_factors": [ "feature_name1", "feature_name2", ... ]
}

Do not include any extra text, explanation, or markup. Return strictly valid JSON.
`;

    const patientContext = `Patient record: ${JSON.stringify(patientData)}`;
    const userMessage = `${patientContext}\n\nPlease assess risk following the instructions above.`;

    const geminiReqBody = {
      contents: [
        {
          parts: [{ text: `${systemPrompt}\n\n${userMessage}` }],
        },
      ],
      // optional: tuning knobs
    };

    const geminiRes = await fetch(GEMINI_GENERATE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_KEY,
      },
      body: JSON.stringify(geminiReqBody),
    });

    if (!geminiRes.ok) {
      const txt = await geminiRes.text().catch(() => '');
      console.error('Gemini returned non-OK for patients POST:', geminiRes.status, txt);
      // fallback to heuristic
      const heuristic = heuristicRiskFromPatient(patientData);
      return Response.json(
        {
          patient_nbr: patientData.patient_nbr ?? 'NEW123',
          saved: true,
          risk: {
            prob: heuristic.prob,
            group: heuristic.group,
            local_factors: heuristic.local_factors.map((f: string) => ({ feature: f, impact: '' })),
          },
        },
        { status: 200 }
      );
    }

    const geminiJson = await geminiRes.json().catch((e) => {
      console.error('Failed to parse Gemini JSON:', e);
      return null;
    });

    const text = extractTextFromGeminiResponse(geminiJson);

    // Try to parse JSON from model text
    let parsed: any = null;
    if (text) {
      try {
        // Trim and try to find first JSON object in text
        const firstBrace = text.indexOf('{');
        const lastBrace = text.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          const candidate = text.slice(firstBrace, lastBrace + 1);
          parsed = JSON.parse(candidate);
        } else {
          // try direct parse (maybe model returned exactly JSON)
          parsed = JSON.parse(text);
        }
      } catch (e) {
        // parsing failed
        console.warn('Failed to parse JSON from Gemini text. Text:', text);
        parsed = null;
      }
    }

    if (parsed && typeof parsed.prob === 'number' && typeof parsed.group === 'string') {
      // success: normalized output to match your risk shape
      const normalized = {
        patient_nbr: patientData.patient_nbr ?? 'NEW123',
        saved: true,
        risk: {
          prob: Math.max(0, Math.min(1, parsed.prob)),
          group: parsed.group,
          local_factors: Array.isArray(parsed.local_factors) ? parsed.local_factors.map((f: any) => ({ feature: String(f), impact: '' })) : [],
        },
      };
      return Response.json(normalized, { status: 200 });
    }

    // If we couldn't get structured JSON, fallback to heuristic
    const heuristic = heuristicRiskFromPatient(patientData);
    return Response.json(
      {
        patient_nbr: patientData.patient_nbr ?? 'NEW123',
        saved: true,
        risk: {
          prob: heuristic.prob,
          group: heuristic.group,
          local_factors: heuristic.local_factors.map((f: string) => ({ feature: f, impact: '' })),
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('POST /api/v1/patients error:', err);
    return Response.json({ error: 'internal' }, { status: 500 });
  }
}