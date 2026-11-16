import { Pool, type PoolClient, type QueryResultRow } from "pg";

const tableNames = /\b(profiles|sessions|rooms|messages|invitations)\b/g;
let pool: Pool | undefined;
export function databaseSchema() {
  const name = process.env.DATABASE_SCHEMA || "mimi_nini";
  if (!/^[a-z_][a-z0-9_]{0,62}$/.test(name))
    throw Error("DATABASE_SCHEMA invalide.");
  return name;
}
function connection() {
  if (!process.env.DATABASE_URL)
    throw Error("DATABASE_URL doit être configurée sur Vercel.");
  pool ??= new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 3,
    idleTimeoutMillis: 20000,
    connectionTimeoutMillis: 10000,
  });
  return pool;
}
function normalize<T>(row: QueryResultRow): T {
  const numeric = new Set([
    "version",
    "capacity",
    "round_limit",
    "updated",
    "created",
    "failures",
    "locked_until",
    "expires",
    "played",
    "wins",
    "n",
  ]);
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => [
      key,
      numeric.has(key) && value !== null ? Number(value) : value,
    ]),
  ) as T;
}
class Statement {
  constructor(
    private sql: string,
    private values: unknown[] = [],
  ) {}
  bind(...values: unknown[]) {
    return new Statement(this.sql, values);
  }
  async execute(client: Pool | PoolClient = connection()) {
    let index = 0;
    const sql = this.sql
      .replace(tableNames, (name) => `"${databaseSchema()}"."${name}"`)
      .replace(/\?/g, () => `$${++index}`);
    return client.query(sql, this.values);
  }
  async first<T = Record<string, unknown>>() {
    const result = await this.execute();
    return result.rows[0] ? normalize<T>(result.rows[0]) : null;
  }
  async all<T = Record<string, unknown>>() {
    const result = await this.execute();
    return { results: result.rows.map((row) => normalize<T>(row)) };
  }
  async run() {
    const result = await this.execute();
    return { meta: { changes: result.rowCount || 0 } };
  }
}
export function database() {
  return {
    prepare(sql: string) {
      return new Statement(sql);
    },
    async batch(statements: Statement[]) {
      const client = await connection().connect();
      try {
        await client.query("BEGIN");
        const results = [];
        for (const statement of statements)
          results.push(await statement.execute(client));
        await client.query("COMMIT");
        return results;
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    },
  };
}
