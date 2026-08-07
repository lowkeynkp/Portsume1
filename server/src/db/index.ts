import { isSupabaseMode } from "../config/index.js";
import { logger } from "../lib/logger.js";
import { memoryStore } from "./memory.js";
import type { Store } from "./store.js";

export type { Store } from "./store.js";
export type * from "./store.js";

let storeInstance: Store | null = null;

export async function getStore(): Promise<Store> {
  if (storeInstance) return storeInstance;
  if (isSupabaseMode) {
    const { SupabaseStore } = await import("./supabase.js");
    logger.info("data store", { provider: "supabase" });
    storeInstance = new SupabaseStore();
  } else {
    logger.warn("SUPABASE credentials missing — running with in-memory store", { hint: "server/.env" });
    storeInstance = memoryStore;
  }
  return storeInstance;
}
