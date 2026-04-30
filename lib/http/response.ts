import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { AppError, isAppError } from "@/lib/http/errors";

export function jsonResponse<T>(body: T, init?: ResponseInit) {
  return NextResponse.json(body, init);
}

export function handleRouteError(error: unknown) {
  if (error instanceof ZodError) {
    return jsonResponse(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Request validation failed.",
          details: error.flatten(),
        },
      },
      { status: 422 },
    );
  }

  if (isAppError(error)) {
    return jsonResponse(
      {
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      },
      { status: error.statusCode },
    );
  }

  console.error(error);

  return jsonResponse(
    {
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Something went wrong.",
      },
    },
    { status: 500 },
  );
}

export function unwrapRpcResponse<T extends object>(response: unknown): {
  statusCode: number;
  body: T;
} {
  if (
    typeof response === "object" &&
    response !== null &&
    "status_code" in response &&
    "body" in response &&
    typeof response.status_code === "number"
  ) {
    return {
      statusCode: response.status_code,
      body: response.body as T,
    };
  }

  throw new AppError("INVALID_RPC_RESPONSE", "Unexpected RPC response.", 500, response);
}
