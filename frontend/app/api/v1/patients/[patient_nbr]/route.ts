import fs from 'fs';
import path from 'path';

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

export async function GET(
  _req: Request,
  { params }: { params: { patient_nbr: string } }
) {
  await sleep(400);

  const filePath = path.join(
    process.cwd(),
    'app/api/_fixtures',
    `patientDetail_${params.patient_nbr}.json`
  );

  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    return Response.json(JSON.parse(data), { status: 200 });
  } catch (err) {

    return Response.json({ patient: null }, { status: 404 });
  }
}
