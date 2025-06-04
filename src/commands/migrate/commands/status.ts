import { Pool } from "pg";
import { promises as fs } from "node:fs";
import path from "node:path";

export async function migrateStatus(
  options: { exitCode?: boolean; quiet?: boolean } = {},
): Promise<void> {
  // 1) Grab DATABASE_URL (or POSTGRES_URL) from env
  const envUrl = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
  if (!envUrl) {
    console.error("⚠️ Missing DATABASE_URL or POSTGRES_URL environment variable");
    process.exit(1);
  }

  // 2) Ensure migrations directory exists
  const migrationsDir = path.resolve(process.cwd(), "migrations");
  try {
    const stat = await fs.stat(migrationsDir);
    if (!stat.isDirectory()) {
      throw new Error();
    }
  } catch {
    console.log("No migrations directory found. Run `grwo migrate init` first.");
    process.exit(1);
  }

  // 3) Spin up a throw-away pool for status checks
  const statusPool = new Pool({ connectionString: envUrl });
  const client = await statusPool.connect();

  try {
    // 4) Fetch applied migrations
    const { rows: appliedRows } = await client.query<{
      name: string;
      run_on: Date;
    }>(
      `SELECT name, run_on
         FROM migrations
     ORDER BY run_on ASC`,
    );
    const appliedMap = new Map<string, Date>(appliedRows.map((r) => [r.name, r.run_on]));

    // 5) Discover all migration folders
    const entries = await fs.readdir(migrationsDir, { withFileTypes: true });
    const allMigs = entries
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
      .sort((a, b) => a.localeCompare(b));

    const pending = allMigs.filter((name) => !appliedMap.has(name));
    const applied = allMigs.filter((name) => appliedMap.has(name));

    // 6) Print status
    if (options.quiet) {
      console.log(`Applied: ${applied.length}, Pending: ${pending.length}`);
    } else {
      console.log("Migration status:");
      for (const name of allMigs) {
        if (appliedMap.has(name)) {
          const appliedDate = appliedMap.get(name);
          if (appliedDate) {
            console.log(`  [X] ${name} — applied at ${appliedDate.toISOString()}`);
          } else {
            console.log(`  [X] ${name} — applied at unknown time`);
          }
        } else {
          console.log(`  [ ] ${name}`);
        }
      }
    }

    // 7) Exit with code=1 if requested and there are pending migrations
    if (options.exitCode && pending.length > 0) {
      process.exit(1);
    }
  } catch (err: any) {
    console.error("❌ Error checking migration status:", err.message || err);
    process.exit(1);
  } finally {
    client.release();
    await statusPool.end();
  }
}
