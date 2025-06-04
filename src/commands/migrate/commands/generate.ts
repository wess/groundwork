import { promises as fs } from "node:fs";
import path from "node:path";

export async function migrateGenerate(): Promise<void> {
  const schemaDir = path.resolve("src/db/schema");

  // Check if schema folder exists
  const schemaExists = await fs
    .access(schemaDir)
    .then(() => true)
    .catch(() => false);
  if (!schemaExists) {
    console.log(
      "❌ No schema folder found. Please run 'grwo generate <openapi.yml>' first to generate schemas.",
    );
    process.exit(0);
  }

  // Get all schema files
  const schemaFiles = await fs.readdir(schemaDir);
  const tsFiles = schemaFiles.filter((file) => file.endsWith(".ts"));

  if (tsFiles.length === 0) {
    console.log(
      "❌ No schema files found in src/db/schema/. Please run 'grwo generate <openapi.yml>' first.",
    );
    process.exit(0);
  }

  // Parse schema files to extract table information
  const tableDefinitions: string[] = [];
  const dropStatements: string[] = [];

  for (const file of tsFiles) {
    const filePath = path.join(schemaDir, file);
    const content = await fs.readFile(filePath, "utf8");

    // Extract interface name and properties from the TypeScript file
    const interfaceMatch = content.match(/export interface (\w+)\s*{([^}]+)}/);
    if (!interfaceMatch) {
      continue;
    }

    const interfaceName = interfaceMatch[1];
    const propertiesBlock = interfaceMatch[2];

    // Convert interface name to table name (pluralize and lowercase)
    const tableName = interfaceName.toLowerCase().endsWith("s")
      ? interfaceName.toLowerCase()
      : `${interfaceName.toLowerCase()}s`;

    // Parse properties to create SQL columns
    const columns: string[] = [];
    const propertyLines = propertiesBlock
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line);

    for (const line of propertyLines) {
      // Match property patterns like: id: number; or name?: string;
      const propMatch = line.match(/(\w+)(\?)?:\s*([^;]+);?/);
      if (!propMatch) {
        continue;
      }

      const [, propName, optional, propType] = propMatch;
      const isRequired = !optional;

      let sqlType = "TEXT";
      let constraints = "";

      // Map TypeScript types to SQL types
      if (propType.includes("number")) {
        if (propName === "id") {
          sqlType = "SERIAL PRIMARY KEY";
        } else {
          sqlType = "INTEGER";
        }
      } else if (propType.includes("boolean")) {
        sqlType = "BOOLEAN";
      } else if (propType.includes("Date")) {
        sqlType = "TIMESTAMP";
      } else if (propType.includes("string[]")) {
        sqlType = "TEXT[]";
      } else if (propType.includes("number[]")) {
        sqlType = "INTEGER[]";
      }

      // Add NOT NULL constraint for required fields (except primary key)
      if (isRequired && propName !== "id") {
        constraints = " NOT NULL";
      }

      columns.push(`  ${propName} ${sqlType}${constraints}`);
    }

    if (columns.length > 0) {
      const createTable = `CREATE TABLE IF NOT EXISTS ${tableName} (\n${columns.join(",\n")}\n);`;
      tableDefinitions.push(createTable);
      dropStatements.unshift(`DROP TABLE IF EXISTS ${tableName};`); // Reverse order for drops
    }
  }

  if (tableDefinitions.length === 0) {
    console.log("❌ No valid schema interfaces found to generate migrations from.");
    process.exit(0);
  }

  // Create migration
  const migrationsDir = path.resolve("migrations");

  // Ensure migrations folder exists
  if (
    !(await fs
      .access(migrationsDir)
      .then(() => true)
      .catch(() => false))
  ) {
    await fs.mkdir(migrationsDir);
    console.log("✔ Created migrations/");
  }

  // Build timestamped migration directory name
  const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, "");
  const dirName = `${timestamp}_generate_schema_tables`;
  const migrationPath = path.join(migrationsDir, dirName);

  // Create the migration directory
  await fs.mkdir(migrationPath);

  // Generate up.sql with CREATE TABLE statements
  const upSql = `-- Generated migration from schema files
-- Creates tables based on TypeScript interfaces in src/db/schema/

${tableDefinitions.join("\n\n")}
`;

  // Generate down.sql with DROP TABLE statements
  const downSql = `-- Rollback migration: drop all generated tables

${dropStatements.join("\n")}
`;

  await fs.writeFile(path.join(migrationPath, "up.sql"), upSql);
  await fs.writeFile(path.join(migrationPath, "down.sql"), downSql);

  console.log(`✔ Created migration ${dirName}`);
  console.log(`✔ Generated SQL for ${tableDefinitions.length} table(s) based on schema files`);
}
