import { NextRequest } from "next/server";

import { AppError } from "@/lib/http/errors";

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

function getClientKey(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  return forwardedFor?.split(",")[0]?.trim() || "local";
}

export function assertRateLimit(request: NextRequest, bucket: string, limit: number, windowMs: number) {
  const now = Date.now();
  const key = `${bucket}:${getClientKey(request)}`;
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    buckets.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return;
  }

  if (current.count >= limit) {
    throw new AppError("RATE_LIMITED", "Too many requests. Please retry shortly.", 429, {
      retryAfterMs: current.resetAt - now,
    });
  }

  current.count += 1;
  buckets.set(key, current);
}
