import patientDetail from '@/app/api/_fixtures/patientDetail_86047875.json';

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

export async function GET(
  _req: Request,
  { params }: { params: { patient_nbr: string } }
) {
  await sleep(400);

  // Minimal branching: return known fixture for ID 86047875, else 404
  if (params.patient_nbr === '86047875') {
    return Response.json(patientDetail, { status: 200 });
  }

  return Response.json({ patient: null }, { status: 404 });
}
