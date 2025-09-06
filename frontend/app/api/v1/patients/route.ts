import patientsIndex from '@/app/api/_fixtures/patientsIndex.json';

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

export async function GET() {
  await sleep(400);
  return Response.json(patientsIndex, { status: 200 });
}

export async function POST(request: Request) {
  await sleep(400);
  // You can inspect the body if you like: const body = await request.json();
  return Response.json(
    {
      patient_nbr: 'NEW123',
      saved: true,
      risk: {
        prob: 0.76,
        group: 'high',
        local_factors: [
          { feature: 'A1Cresult_gt8', impact: '+0.16' },
          { feature: 'insulin_Up', impact: '+0.05' }
        ]
      }
    },
    { status: 200 }
  );
}
