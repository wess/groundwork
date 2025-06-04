import { promises as fs } from "node:fs";
import path from "node:path";

export async function migrateNew(name: string): Promise<void> {
  const migrationsDir = path.resolve("migrations");

  // 1) Ensure top-level migrations folder exists
  if (
    !(await fs
      .access(migrationsDir)
      .then(() => true)
      .catch(() => false))
  ) {
    await fs.mkdir(migrationsDir);
    console.log("✔ Created migrations/");
  }

  // 2) Build timestamped migration directory name
  const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, "");
  const dirName = `${timestamp}_${name}`;
  const migrationPath = path.join(migrationsDir, dirName);

  // 3) Create the migration directory
  await fs.mkdir(migrationPath);

  // 4) Scaffold up.sql and down.sql
  await fs.writeFile(path.join(migrationPath, "up.sql"), "-- Write your UP migration SQL here\n");
  await fs.writeFile(
    path.join(migrationPath, "down.sql"),
    "-- Write your DOWN migration SQL here\n",
  );

  console.log(`✔ Created migration ${dirName}`);
}
