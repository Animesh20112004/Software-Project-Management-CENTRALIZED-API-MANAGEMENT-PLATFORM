export const dynamic = 'force-dynamic';
export async function GET(_request, { params }) {
  const { action } = await params;
  const paths = { health: '/health', system: '/system/health' };
  if (!Object.hasOwn(paths, action)) return Response.json({ error: 'Unknown endpoint' }, { status: 404 });
  try {
    const upstream = await fetch(`${process.env.GATEWAY_URL || 'http://127.0.0.1:4000'}${paths[action]}`, {
      cache: 'no-store', signal: AbortSignal.timeout(5000),
    });
    return Response.json(await upstream.json(), { status: upstream.status });
  } catch {
    return Response.json({ error: 'Gateway unavailable. Start the platform with npm run dev and try again.' }, { status: 502 });
  }
}
