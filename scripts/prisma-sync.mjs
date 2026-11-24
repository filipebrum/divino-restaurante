import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

function loadDotEnvIfNeeded() {
  if (process.env.DATABASE_URL) return;
  const envPath = path.join(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) {
      process.env[key] = val;
    }
  }
}

loadDotEnvIfNeeded();

const databaseUrl = process.env.DATABASE_URL || "file:./dev.db";
const isPostgres =
  databaseUrl.startsWith("postgres://") ||
  databaseUrl.startsWith("postgresql://");

const schema = isPostgres
  ? "prisma/schema.postgres.prisma"
  : "prisma/schema.prisma";

const mode = process.argv[2] || "generate";

function run(cmd) {
  console.log(`[prisma-sync] (${isPostgres ? "postgresql" : "sqlite"}) ${cmd}`);
  execSync(cmd, { stdio: "inherit" });
}

if (mode === "generate") {
  run(`npx prisma generate --schema=${schema}`);
} else if (mode === "deploy") {
  run(`npx prisma generate --schema=${schema}`);
  run(`npx prisma db push --schema=${schema}`);
  run("npx tsx prisma/seed.ts");
} else {
  console.error(`Modo desconhecido: ${mode}`);
  process.exit(1);
}
