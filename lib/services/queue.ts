/* eslint-disable @typescript-eslint/no-explicit-any */
import { AppError } from "@/lib/http/errors";
import { unwrapRpcResponse } from "@/lib/http/response";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { decodeCursor, encodeCursor } from "@/lib/pagination";
import { mapQueueToken } from "@/lib/services/mappers";
import type { PaginatedResponse, QueueTokenDto } from "@/types/domain";
import type { Database } from "@/types/database";

type QueueRowWithUser = Database["public"]["Tables"]["queue_tokens"]["Row"] & {
  users?: { name: string | null; email: string } | null;
};

export async function joinQueue(idempotencyKey?: string) {
  const supabase = (await createServerSupabaseClient()) as any;
  const { data, error } = await supabase.rpc("join_queue", {
    p_idempotency_key: idempotencyKey ?? null,
  });

  if (error) {
    throw new AppError("QUEUE_JOIN_FAILED", error.message, 400, error);
  }

  return unwrapRpcResponse<{ queue_token?: QueueTokenDto; error?: unknown; replayed?: boolean }>(data);
}

export async function assignQueueToken(input: {
  queueTokenId: string;
  barberId: string;
  idempotencyKey?: string;
}) {
  const supabase = (await createServerSupabaseClient()) as any;
  const { data, error } = await supabase.rpc("assign_queue_token", {
    p_queue_token_id: input.queueTokenId,
    p_barber_id: input.barberId,
    p_idempotency_key: input.idempotencyKey ?? null,
  });

  if (error) {
    throw new AppError("QUEUE_ASSIGN_FAILED", error.message, 400, error);
  }

  return unwrapRpcResponse<{ queue_token?: QueueTokenDto; error?: unknown; replayed?: boolean }>(data);
}

export async function completeQueueToken(input: {
  queueTokenId: string;
  idempotencyKey?: string;
}) {
  const supabase = (await createServerSupabaseClient()) as any;
  const { data, error } = await supabase.rpc("complete_queue_token", {
    p_queue_token_id: input.queueTokenId,
    p_idempotency_key: input.idempotencyKey ?? null,
  });

  if (error) {
    throw new AppError("QUEUE_COMPLETE_FAILED", error.message, 400, error);
  }

  return unwrapRpcResponse<{ queue_token?: QueueTokenDto; error?: unknown; replayed?: boolean }>(data);
}

export async function listQueue(input: {
  role: "customer" | "barber" | "admin";
  userId: string;
  barberId: string | null;
  limit: number;
  cursor?: string;
  status?: string;
  barberIdFilter?: string;
  queueDate?: string;
  search?: string;
}): Promise<PaginatedResponse<QueueTokenDto>> {
  const supabase = createAdminSupabaseClient() as any;
  const cursor = decodeCursor(input.cursor);
  let query = supabase
    .from("queue_tokens")
    .select("*, users(name,email)")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(input.limit + 1);

  if (input.role === "customer") {
    query = query.eq("user_id", input.userId);
  } else if (input.role === "barber" && input.barberId) {
    query = query.eq("barber_id", input.barberId);
  }

  if (input.status) query = query.eq("status", input.status as Database["public"]["Tables"]["queue_tokens"]["Row"]["status"]);
  if (input.barberIdFilter) query = query.eq("barber_id", input.barberIdFilter);
  if (input.queueDate) query = query.eq("queue_date", input.queueDate);
  if (cursor) query = query.lt("created_at", cursor.createdAt);

  const { data, error } = await query;

  if (error) {
    throw new AppError("QUEUE_LOOKUP_FAILED", "Unable to load queue.", 500, error);
  }

  let rows = (data ?? []) as QueueRowWithUser[];
  if (input.search) {
    const search = input.search.toLowerCase();
    rows = rows.filter((row) => {
      const name = row.users?.name?.toLowerCase() ?? "";
      const email = row.users?.email?.toLowerCase() ?? "";
      return name.includes(search) || email.includes(search);
    });
  }

  const sliced = rows.slice(0, input.limit);
  const next = rows.length > input.limit ? rows[input.limit - 1] : null;

  return {
    data: sliced.map(mapQueueToken),
    nextCursor: next ? encodeCursor({ createdAt: next.created_at, id: next.id }) : null,
  };
}
