import type { NextRequest } from "next/server";

type JsonReadResult<T> =
  | { data: T; error: null; status: 200 }
  | { data: null; error: string; status: 400 | 413 | 415 };

const encoder = new TextEncoder();

export function validateSameOriginMutation(request: NextRequest) {
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite === "cross-site") return false;

  const origin = request.headers.get("origin");
  return !origin || origin === request.nextUrl.origin;
}

export async function readJsonBody<T>(request: NextRequest, maxBytes = 16_384): Promise<JsonReadResult<T>> {
  const contentType = request.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase();
  if (contentType !== "application/json") {
    return { data: null, error: "Content-Type must be application/json", status: 415 };
  }

  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    return { data: null, error: "Request body is too large", status: 413 };
  }

  const text = await request.text().catch(() => "");
  if (!text || encoder.encode(text).byteLength > maxBytes) {
    return { data: null, error: text ? "Request body is too large" : "Invalid JSON", status: text ? 413 : 400 };
  }

  try {
    return { data: JSON.parse(text) as T, error: null, status: 200 };
  } catch {
    return { data: null, error: "Invalid JSON", status: 400 };
  }
}

export const PRIVATE_NO_STORE_HEADERS = {
  "Cache-Control": "private, no-store, max-age=0",
  Pragma: "no-cache",
};
