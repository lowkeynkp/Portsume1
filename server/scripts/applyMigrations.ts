/**
 * Apply Supabase migrations via the Management API when a token is available,
 * otherwise print instructions. Runs migrations idempotently.
 */
import { readFile, readdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Resolve from this file (server/scripts/) rather than cwd, which differs
// between `npm run db:migrate` at the root and inside the workspace.
const MIGRATIONS_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "supabase", "migrations");

async function main() {
  const files = (await readdir(MIGRATIONS_DIR)).filter((f) => f.endsWith(".sql")).sort();
  console.log(`Found ${files.length} migration(s)`);

  const url = process.env.SUPABASE_URL;
  const token = process.env.SUPABASE_ACCESS_TOKEN;
  const projectRef = process.env.SUPABASE_PROJECT_REF;

  if (!url || !token || !projectRef) {
    console.log("\nNo SUPABASE_ACCESS_TOKEN / SUPABASE_PROJECT_REF set.");
    console.log("Apply manually: open Supabase → SQL editor → paste supabase/migrations/*.sql");
    console.log("Or run: supabase db push --db-url <connection string>");
    return;
  }

  for (const file of files) {
    const sql = await readFile(join(MIGRATIONS_DIR, file), "utf8");
    const endpoint = `https://api.supabase.com/v1/projects/${projectRef}/database/query`;
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ query: sql }),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Migration ${file} failed: ${res.status} ${body.slice(0, 500)}`);
    }
    console.log(`Applied ${file}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
