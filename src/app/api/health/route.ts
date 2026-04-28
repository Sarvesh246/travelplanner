export const dynamic = "force-dynamic";

const HEADERS = {
  "Cache-Control": "no-store, max-age=0",
};

export function GET() {
  return new Response(null, {
    status: 204,
    headers: HEADERS,
  });
}

export function HEAD() {
  return new Response(null, {
    status: 204,
    headers: HEADERS,
  });
}
