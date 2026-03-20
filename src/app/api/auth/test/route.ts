// src/app/api/auth/test/route.ts
export async function GET() {
  try {
    const { getSession } = await import("@/lib/auth");
    const session = await getSession();
    return Response.json({ ok: true, session });
  } catch (e: any) {
    return Response.json({ error: e.message, stack: e.stack });
  }
}