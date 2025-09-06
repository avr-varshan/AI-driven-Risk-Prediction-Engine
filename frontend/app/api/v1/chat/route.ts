import chatGlobal from '@/app/api/_fixtures/chat_global.json';
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

export async function POST() {
  await sleep(300);
  // You can read the payload and branch on scope if you want:
  // const body = await request.json(); if (body.scope === 'patient') { ... }
  return Response.json(chatGlobal, { status: 200 });
}
