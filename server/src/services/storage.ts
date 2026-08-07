import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { mkdir, readFile, writeFile, rm } from "node:fs/promises";
import { join, basename } from "node:path";
import { config } from "../config/index.js";
import { logger } from "../lib/logger.js";
import { isSupabaseMode } from "../config/index.js";

const log = logger.child("storage");

const LOCAL_DIR = join(process.cwd(), ".data", "uploads");

export interface StorageService {
  put(key: string, data: Buffer, contentType: string): Promise<{ path: string; url: string }>;
  get(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
  /** Public URL for a stored object (null when not publicly reachable). */
  publicUrl(key: string): string | null;
}

class LocalStorage implements StorageService {
  private resolve(key: string): string {
    const safe = basename(key);
    return join(LOCAL_DIR, safe);
  }

  async put(key: string, data: Buffer, contentType: string): Promise<{ path: string; url: string }> {
    await mkdir(LOCAL_DIR, { recursive: true });
    await writeFile(this.resolve(key), data);
    log.info("stored locally", { key, bytes: data.length, contentType });
    return { path: key, url: `${config.publicBaseUrl}/files/${key}` };
  }

  async get(key: string): Promise<Buffer> {
    return readFile(this.resolve(key));
  }

  async delete(key: string): Promise<void> {
    await rm(this.resolve(key), { force: true });
  }

  publicUrl(key: string): string {
    // Files are stored flat on disk; the public URL must match the flat key.
    return `${config.publicBaseUrl}/files/${encodeURIComponent(basename(key))}`;
  }
}

class SupabaseStorage implements StorageService {
  private readonly admin: SupabaseClient;

  constructor() {
    if (!config.supabase.url || !config.supabase.serviceRoleKey) {
      throw new Error("SupabaseStorage requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
    }
    this.admin = createClient(config.supabase.url, config.supabase.serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  async put(key: string, data: Buffer, contentType: string): Promise<{ path: string; url: string }> {
    const { error } = await this.admin.storage
      .from(config.storageBucket)
      .upload(key, data, { contentType, upsert: true });
    if (error) throw error;
    const url = this.publicUrl(key);
    log.info("stored in supabase", { key, bytes: data.length });
    return { path: key, url };
  }

  async get(key: string): Promise<Buffer> {
    const { data, error } = await this.admin.storage.from(config.storageBucket).download(key);
    if (error) throw error;
    return Buffer.from(await data.arrayBuffer());
  }

  async delete(key: string): Promise<void> {
    const { error } = await this.admin.storage.from(config.storageBucket).remove([key]);
    if (error) log.warn("failed to remove object", { key, error });
  }

  publicUrl(key: string): string {
    return this.admin.storage.from(config.storageBucket).getPublicUrl(key).data.publicUrl;
  }
}

let storageInstance: StorageService | null = null;

export async function getStorage(): Promise<StorageService> {
  if (storageInstance) return storageInstance;
  storageInstance = isSupabaseMode ? new SupabaseStorage() : new LocalStorage();
  return storageInstance;
}
