import { FilterParams, PatientsResponse, PatientDetailResponse, CreatePatientResponse, ScoreResponse, ChatResponse } from './types';

// Get the base URL correctly for both server and client environments
const getBaseUrl = () => {
  // Check if we're in a browser environment
  if (typeof window !== 'undefined') {
    // Use window.location.origin for absolute URLs in the browser
    return window.location.origin + (process.env.NEXT_PUBLIC_API_BASE || '');
  }
  
  // For server-side rendering in development, use a full URL
  // This is needed because fetch() requires absolute URLs in Node.js
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000' + (process.env.NEXT_PUBLIC_API_BASE || '');
  }
  
  // For production server-side rendering, you might need to set an actual domain
  // or use a relative URL that Next.js can handle internally
  return process.env.NEXT_PUBLIC_API_BASE || '';
};

const API_BASE = getBaseUrl();

// Utility to build query string from filter params
function buildQueryString(params: FilterParams): string {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        value.forEach(v => searchParams.append(key, v.toString()));
      } else {
        searchParams.append(key, value.toString());
      }
    }
  });
  
  return searchParams.toString();
}

// Get patients with filtering and pagination
export async function getPatients(params: FilterParams = {}): Promise<PatientsResponse> {
  const queryString = buildQueryString(params);
  const url = `${API_BASE}/v1/patients${queryString ? `?${queryString}` : ''}`;
  
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch patients: ${response.statusText}`);
  }
  
  return response.json();
}

// Get single patient detail
export async function getPatient(patientNbr: string): Promise<PatientDetailResponse> {
  const response = await fetch(`${API_BASE}/v1/patients/${patientNbr}`, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch patient: ${response.statusText}`);
  }
  
  return response.json();
}

// Create or update patient
export async function createPatient(patientData: Record<string, any>): Promise<CreatePatientResponse> {
  const response = await fetch(`${API_BASE}/v1/patients`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(patientData),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to create patient: ${response.statusText}`);
  }
  
  return response.json();
}

// What-if scoring (no persistence)
export async function getWhatIfScore(scenarioData: Record<string, any>): Promise<ScoreResponse> {
  const response = await fetch(`${API_BASE}/v1/score`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(scenarioData),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to get score: ${response.statusText}`);
  }
  
  return response.json();
}

// Chat with LLM
// Replace your existing sendChatMessage with this exact function
// Replace existing sendChatMessage with this
export async function sendChatMessage(
  message: string,
  scope: 'global' | 'patient' = 'global',
  patientNbr?: string,
  whatIf?: Record<string, any>
): Promise<ChatResponse> {
  const prefix = '/api';
  let url = `${prefix}/v1/chat`; // <-- global goes here (matches app/api/v1/chat/route.ts)

  if (scope === 'patient') {
    if (!patientNbr) throw new Error('Patient chat requires patientNbr');
    url = `${prefix}/v1/chat/patient/${patientNbr}`;
  }

  console.log('[sendChatMessage] POST ->', url);

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      what_if: whatIf,
    }),
  });

  if (!response.ok) {
    const txt = await response.text().catch(() => response.statusText);
    throw new Error(`Failed to send chat message: ${response.status} ${txt}`);
  }

  return response.json();
}
/**
 * Send a message scoped to a particular patient.
 * POSTs to /api/v1/patients/:patientNbr
 */
export async function sendPatientChatMessage(patientNbr: string, message: string) {
  if (!patientNbr) throw new Error('patientNbr required');

  const url = `/api/v1/patients/${encodeURIComponent(patientNbr)}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Patient chat API error ${res.status}: ${text}`);
  }

  return res.json();
}