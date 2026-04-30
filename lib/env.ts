import { z } from "zod";
import { AppError } from "@/lib/http/errors";

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  ADMIN_EMAIL_ALLOWLIST: z.string().optional(),
  APP_BASE_URL: z.url().optional(),
});

const parsed = envSchema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  ADMIN_EMAIL_ALLOWLIST: process.env.ADMIN_EMAIL_ALLOWLIST,
  APP_BASE_URL: process.env.APP_BASE_URL,
});

if (!parsed.success) {
  console.warn("Environment validation skipped:", parsed.error.flatten().fieldErrors);
}

const fallback = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  ADMIN_EMAIL_ALLOWLIST: process.env.ADMIN_EMAIL_ALLOWLIST,
  APP_BASE_URL: process.env.APP_BASE_URL,
};

export const env = parsed.success ? parsed.data : fallback;

export function getAdminAllowlist(): string[] {
  return (env.ADMIN_EMAIL_ALLOWLIST ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function assertSupabaseEnv() {
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new AppError(
      "MISSING_SUPABASE_ENV",
      "Supabase environment variables are not configured.",
      503,
      {
        required: [
          "NEXT_PUBLIC_SUPABASE_URL",
          "NEXT_PUBLIC_SUPABASE_ANON_KEY",
          "SUPABASE_SERVICE_ROLE_KEY",
        ],
      },
    );
  }
}

export function assertServiceRoleEnv() {
  assertSupabaseEnv();

  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new AppError(
      "MISSING_SUPABASE_SERVICE_ROLE_KEY",
      "SUPABASE_SERVICE_ROLE_KEY is not configured.",
      503,
    );
  }
}
