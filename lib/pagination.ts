import { AppError } from "@/lib/http/errors";

export interface CursorPayload {
  createdAt: string;
  id: string;
}

export function encodeCursor(payload: CursorPayload) {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

export function decodeCursor(cursor?: string): CursorPayload | null {
  if (!cursor) {
    return null;
  }

  try {
    const decoded = Buffer.from(cursor, "base64url").toString("utf8");
    const payload = JSON.parse(decoded) as CursorPayload;

    if (!payload.createdAt || !payload.id) {
      throw new Error("Invalid cursor shape");
    }

    return payload;
  } catch {
    throw new AppError("INVALID_CURSOR", "The pagination cursor is invalid.", 400);
  }
}
