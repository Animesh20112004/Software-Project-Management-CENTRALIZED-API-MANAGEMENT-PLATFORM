export const dynamic = 'force-dynamic';

export async function GET() {
  return Response.json({
    status: 'ok',
    service: 'centralized-api-platform',
    timestamp: new Date().toISOString(),
  });
}
