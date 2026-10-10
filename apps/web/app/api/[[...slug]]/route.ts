import { NextResponse } from "next/server";

export const runtime = "edge";

type Params = { slug?: string[] };

function jsonNotFound() {
  return NextResponse.json(
    { error: "Not found. See /api-docs for API documentation." },
    { status: 404 },
  );
}

function redirectToApiDocs(req: Request) {
  const url = new URL(req.url);
  url.pathname = "/api-docs";
  url.search = "";
  return NextResponse.redirect(url, 307);
}

/** GET /api → redirect to /api-docs; anything else unmatched → 404 JSON. */
export async function GET(req: Request, { params }: { params: Promise<Params> }) {
  const { slug } = await params;
  if (!slug || slug.length === 0) return redirectToApiDocs(req);
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
