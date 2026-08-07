import { randomUUID, createHash, randomBytes } from "node:crypto";

export const uid = (): string => randomUUID();

export const nanoId = (size = 12): string =>
  randomBytes(Math.ceil((size * 6) / 8))
    .toString("base64url")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, size);

export const sha256 = (data: Buffer | string): string =>
  createHash("sha256").update(data).digest("hex");

/** Slugify a name for portfolio subdomains/slugs, e.g. "Ada Lovelace" → "ada-lovelace". */
export const slugify = (input: string): string =>
  input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

export const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));
