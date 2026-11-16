import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import { Pool } from "pg";
for (const file of [".env.local", ".env"])
  if (existsSync(file)) process.loadEnvFile(file);
const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!databaseUrl) {
  if (process.env.VERCEL_ENV === "production")
    throw Error(
      "Configure DATABASE_URL (PostgreSQL) dans Vercel avant le déploiement.",
    );
  console.log("Compilation sans migration : DATABASE_URL absente.");
} else {
  const schema = process.env.DATABASE_SCHEMA || "mimi_nini";
  if (!/^[a-z_][a-z0-9_]{0,62}$/.test(schema))
    throw Error("DATABASE_SCHEMA invalide.");
  const sql = (
    await fs.readFile(
      new URL("../db/migrations/001-postgres.sql", import.meta.url),
      "utf8",
    )
  ).replace(/\bmimi_nini\b/g, `"${schema}"`);
  const pool = new Pool({
    connectionString: databaseUrl,
    max: 1,
    connectionTimeoutMillis: 10000,
  });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(sql);
    await client.query("COMMIT");
    console.log("Schéma PostgreSQL prêt : " + schema);
  } catch (error) {
    await client.query("ROLLBACK");
    throw new Error(
      "Migration PostgreSQL échouée : " + (error.code || "erreur de connexion"),
    );
  } finally {
    client.release();
    await pool.end();
  }
}
