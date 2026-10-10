import { describe, expect, it } from "vitest";
import { DELETE, GET, HEAD, OPTIONS, PATCH, POST, PUT } from "../app/api/[[...slug]]/route";

const makeReq = (path = "/api") =>
  new Request(`https://nahthatsai.com${path}`, { method: "GET" });

describe("/api root route handler", () => {
  it("GET /api redirects to /api-docs", async () => {
    const res = await GET(makeReq("/api"), { params: Promise.resolve({ slug: [] }) });
    expect(res.status).toBe(307);
    expect(new URL(res.headers.get("location")!, "https://nahthatsai.com").pathname).toBe("/api-docs");
  });

  it("GET /api/unknown returns JSON 404", async () => {
    const res = await GET(makeReq("/api/unknown"), { params: Promise.resolve({ slug: ["unknown"] }) });
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body).toEqual({ error: "Not found. See /api-docs for API documentation." });
  });

  it("returns JSON 404 for POST, PUT, PATCH, DELETE, OPTIONS, HEAD", async () => {
    for (const handler of [POST, PUT, PATCH, DELETE, OPTIONS, HEAD]) {
      const res = await handler();
      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body).toEqual({ error: "Not found. See /api-docs for API documentation." });
    }
  });
});
