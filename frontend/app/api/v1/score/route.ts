import score from '@/app/api/_fixtures/score.json';
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

export async function POST() {
  await sleep(300);
  return Response.json(score, { status: 200 });
}
