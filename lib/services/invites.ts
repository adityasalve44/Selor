/* eslint-disable @typescript-eslint/no-explicit-any */
import crypto from "node:crypto";

import QRCode from "qrcode";

import { AppError } from "@/lib/http/errors";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { mapInvite } from "@/lib/services/mappers";
import { getShopSettings } from "@/lib/services/settings";
import type { InviteDto } from "@/types/domain";
import type { Json } from "@/types/database";

function buildInviteToken() {
  return crypto.randomBytes(18).toString("base64url");
}

export async function createInvite(input: {
  inviterId: string;
  expiresInHours: number;
  metadata: Record<string, unknown>;
}) {
  const supabase = createAdminSupabaseClient() as any;
  const settings = await getShopSettings();
  const token = buildInviteToken();
  const expiresAt = new Date(Date.now() + input.expiresInHours * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("invites")
    .insert({
      token,
      inviter_id: input.inviterId,
      expires_at: expiresAt,
      metadata: input.metadata as Json,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new AppError("INVITE_CREATE_FAILED", "Unable to create invite.", 500, error);
  }

  await supabase.from("notification_events").insert({
    event_type: "invite.created",
    entity_type: "invite",
    entity_id: data.id,
    user_id: input.inviterId,
    payload: {
      invite_id: data.id,
      token: data.token,
    },
  });

  await supabase.from("audit_logs").insert({
    actor_user_id: input.inviterId,
    actor_role: "barber",
    entity_type: "invite",
    entity_id: data.id,
    action: "created",
    after_data: data,
  });

  return mapInvite(data, `${settings.inviteBaseUrl}?invite=${data.token}`);
}

export async function getInviteByToken(token: string): Promise<InviteDto> {
  const supabase = createAdminSupabaseClient() as any;
  const settings = await getShopSettings();
  const { data, error } = await supabase
    .from("invites")
    .select("*")
    .eq("token", token)
    .is("deleted_at", null)
    .single();

  if (error || !data) {
    throw new AppError("INVITE_NOT_FOUND", "Invite not found.", 404, error);
  }

  const now = new Date();
  if (data.status === "revoked" || (data.expires_at && now > new Date(data.expires_at))) {
    throw new AppError("INVITE_EXPIRED", "Invite has expired.", 410);
  }

  return mapInvite(data, `${settings.inviteBaseUrl}?invite=${data.token}`);
}

export async function getInviteQrSvg(inviteId: string) {
  const supabase = createAdminSupabaseClient() as any;
  const settings = await getShopSettings();
  const { data, error } = await supabase
    .from("invites")
    .select("id, token")
    .eq("id", inviteId)
    .single();

  if (error || !data) {
    throw new AppError("INVITE_NOT_FOUND", "Invite not found.", 404, error);
  }

  return QRCode.toString(`${settings.inviteBaseUrl}?invite=${data.token}`, {
    type: "svg",
    margin: 1,
    width: 256,
  });
}
