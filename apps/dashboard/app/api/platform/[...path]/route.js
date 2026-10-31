export const dynamic = 'force-dynamic';

async function bridge(request, { params }) {
  const { path } = await params;
  if (!['admin', 'proxy', 'health', 'system'].includes(path[0]))
    return Response.json({ error: 'Unknown endpoint.' }, { status: 404 });
  if (path.some((part) => part === '.' || part === '..' || part.includes('/') || part.includes('\\')))
    return Response.json({ error: 'Invalid path.' }, { status: 400 });
  try {
    const headers = {};
    for (const name of ['cookie', 'content-type', 'x-api-key', 'origin']) {
      const value = request.headers.get(name);
      if (value) headers[name] = value;
    }
    const body = ['GET', 'HEAD'].includes(request.method) ? undefined : await request.text();
    if (body && Buffer.byteLength(body) > 1048576)
      return Response.json({ error: 'Maximum request size is 1 MB.' }, { status: 413 });
    const query = new URL(request.url).search;
    const upstream = await fetch(
      `${process.env.GATEWAY_URL || 'http://127.0.0.1:4000'}/${path.map(encodeURIComponent).join('/')}${query}`,
      {
        method: request.method,
        headers,
        body: body || undefined,
        cache: 'no-store',
        redirect: 'manual',
        signal: AbortSignal.timeout(15000),
      },
    );
    const responseHeaders = new Headers({ 'Cache-Control': 'no-store' });
    for (const name of [
      'content-type',
      'set-cookie',
      'retry-after',
      'x-ratelimit-limit',
      'x-ratelimit-remaining',
      'x-content-type-options',
    ]) {
      const value = upstream.headers.get(name);
      if (value) responseHeaders.set(name, value);
    }
    return new Response(
      [204, 304].includes(upstream.status) || request.method === 'HEAD' ? null : await upstream.arrayBuffer(),
      { status: upstream.status, headers: responseHeaders },
    );
  } catch {
    return Response.json(
      { error: 'Gateway unavailable. Start the platform and try again.' },
      { status: 502 },
    );
  }
}
export { bridge as GET, bridge as POST, bridge as PUT, bridge as PATCH, bridge as DELETE, bridge as HEAD };
