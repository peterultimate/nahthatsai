import { NextResponse } from "next/server";

export const runtime = "edge";

type Params = { slug?: string[] };

function jsonNotFound() {
  return NextResponse.json(
    { error: "Not found. See /api-docs for API documentation." },
    { status: 404 },
  );
}

function redirectToApiDocs() {
  // Relative Location keeps the user on the current host (avoids proxy-induced
  // localhost redirects when running behind Railway/nginx).
  return new Response(null, {
    status: 307,
    headers: { Location: "/api-docs" },
  });
}

/** GET /api → redirect to /api-docs; anything else unmatched → 404 JSON. */
export async function GET(_req: Request, { params }: { params: Promise<Params> }) {
  const { slug } = await params;
  if (!slug || slug.length === 0) return redirectToApiDocs();
  return jsonNotFound();
}

export async function POST() {
  return jsonNotFound();
}

export async function PUT() {
  return jsonNotFound();
}

export async function PATCH() {
  return jsonNotFound();
}

export async function DELETE() {
  return jsonNotFound();
}

export async function OPTIONS() {
  return jsonNotFound();
}

export async function HEAD() {
  return jsonNotFound();
}
