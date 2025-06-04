import { promises as fs } from "fs";
import fsSync from "fs";
import path from "path";

export async function migrateInit(): Promise<void> {
  const migrationsDir = path.resolve("migrations");

  if (!fsSync.existsSync(migrationsDir)) {
    await fs.mkdir(migrationsDir);
    console.log("✔ Created migrations/");
  } else {
    console.log("✔ migrations/ already exists");
  }

  console.log("\n⚠️  Be sure to set your DATABASE_URL before running migrations:");
  console.log("   export DATABASE_URL=\"postgres://user:pass@localhost:5432/db\"\n");
}
