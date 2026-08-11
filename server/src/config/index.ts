import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(8787),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),

  SUPABASE_URL: z.string().optional(),
  // Supabase renamed its API keys: anon → publishable, service_role → secret.
  // Accept either spelling so old and new projects both work.
  SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_PUBLISHABLE_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  SUPABASE_SECRET_KEY: z.string().optional(),

  OPENAI_API_KEY: z.string().optional(),

  SESSION_SECRET: z.string().default("dev-secret-change-me"),
  STORAGE_BUCKET: z.string().default("resumes"),
  PUBLIC_BASE_URL: z.string().default("http://localhost:8787"),
  PUBLIC_SUBDOMAIN_ROOT: z.string().default("localhost"),
  MAX_UPLOAD_MB: z.coerce.number().default(15),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  throw new Error(`Invalid environment configuration: ${JSON.stringify(parsed.error.flatten().fieldErrors)}`);
}

const env = parsed.data;

const supabaseSecretKey = env.SUPABASE_SERVICE_ROLE_KEY ?? env.SUPABASE_SECRET_KEY;
const supabasePublishableKey = env.SUPABASE_ANON_KEY ?? env.SUPABASE_PUBLISHABLE_KEY;

/** True when no Supabase credentials are present → server uses the in-memory store. */
export const isSupabaseMode = Boolean(env.SUPABASE_URL && supabaseSecretKey);

export const config = {
  env: env.NODE_ENV,
  isDev: env.NODE_ENV !== "production",
  isProd: env.NODE_ENV === "production",
  port: env.PORT,
  corsOrigin: env.CORS_ORIGIN.split(",").map((s) => s.trim()),
  sessionSecret: env.SESSION_SECRET,
  storageBucket: env.STORAGE_BUCKET,
  publicBaseUrl: env.PUBLIC_BASE_URL,
  publicSubdomainRoot: env.PUBLIC_SUBDOMAIN_ROOT,
  maxUploadBytes: env.MAX_UPLOAD_MB * 1024 * 1024,
  supabase: {
    url: env.SUPABASE_URL,
    anonKey: supabasePublishableKey,
    serviceRoleKey: supabaseSecretKey,
  },
  openai: {
    apiKey: env.OPENAI_API_KEY,
  },
  pipeline: {
    // Give local/synchronous workers these budgets before they are parked.
    // In production these would map to queue concurrency + worker pools.
    queueConcurrency: 2,
    stageTimeoutMs: 60_000,
  },
} as const;

export type Config = typeof config;
