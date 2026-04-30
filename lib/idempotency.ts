import { headers } from "next/headers";

export async function getRequestIdempotencyKey() {
  const requestHeaders = await headers();
  return requestHeaders.get("x-idempotency-key") ?? undefined;
}
