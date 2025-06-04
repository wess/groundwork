import path from "node:path";
import { promises as fs } from "node:fs";
import yaml from "yaml";
import { ensureDir, renderTemplate } from "../utils/file_helpers";
import type { Property, SchemaInfo, GenerationPaths, GenerationOptions } from "../types";

// Import templates with { type: "file" }
import connectionTemplate from "../templates/connection.njk" with { type: "file" };
import providerTemplate from "../templates/provider.njk" with { type: "file" };
import routeTemplate from "../templates/route.njk" with { type: "file" };
import schemaTemplate from "../templates/schema.njk" with { type: "file" };

async function setupDirectories(cwd: string): Promise<GenerationPaths> {
  const baseSrc = path.join(cwd, "src");
  const dbDir = path.join(baseSrc, "db");
  const schemaDir = path.join(dbDir, "schema");
  const providersDir = path.join(dbDir, "providers");
  const routesDir = path.join(baseSrc, "routes");

  // Ensure directories exist
  await ensureDir(schemaDir);
  await ensureDir(providersDir);
  await ensureDir(routesDir);

  return {
    baseSrc,
    dbDir,
    schemaDir,
    providersDir,
    routesDir,
  };
}

async function generateConnection(dbDir: string): Promise<void> {
  const connectionOut = path.join(dbDir, "connection.ts");
  await renderTemplate(connectionTemplate, connectionOut, {});
}

function mapPropertyType(propDef: any): string {
  switch (propDef.type) {
    case "string":
      return "string";
    case "integer":
    case "number":
      return "number";
    case "boolean":
      return "boolean";
    case "array":
      if (propDef.items?.type === "string") {
        return "string[]";
      }
      if (propDef.items?.type === "integer" || propDef.items?.type === "number") {
        return "number[]";
      }
      return "any[]";
    case "object":
      return "Record<string, any>";
    default:
      return "any";
  }
}

function buildSchemaInfo(schemaName: string, schemaDef: any): SchemaInfo | null {
  const Name = schemaName;
  const lowerCaseName = schemaName.charAt(0).toLowerCase() + schemaName.slice(1);
  const tableName = lowerCaseName.endsWith("s") ? lowerCaseName : `${lowerCaseName}s`;

  const properties = schemaDef.properties || {};
  const requiredFields: string[] = schemaDef.required || [];

  const allFields: Property[] = Object.entries<any>(properties).map(([propName, propDef]) => {
    const tsType = mapPropertyType(propDef);
    const required = requiredFields.includes(propName);

    return {
      name: propName,
      tsType,
      required,
      column: propName,
    };
  });

  // Must have an 'id' field
  const idField = allFields.find((f) => f.name === "id");
  if (!idField) {
    console.warn(`Skipping schema "${Name}" (no 'id' property)`);
    return null;
  }

  const updatableFields = allFields.filter((f) => f.name !== "id");
  const fieldListNoId = updatableFields.map((f) => f.column).join(", ");
  const paramPlaceholdersNoId = updatableFields.map((_, idx) => `$${idx + 1}`).join(", ");
  const paramListNoId = updatableFields.map((f) => `data.${f.name}`).join(", ");
  const idTsType = idField.tsType;

  return {
    Name,
    lowerCaseName,
    tableName,
    fields: allFields,
    idField,
    updatableFields,
    fieldListNoId,
    paramPlaceholdersNoId,
    paramListNoId,
    idTsType,
  };
}

async function generateSchemaFiles(schemaInfo: SchemaInfo, paths: GenerationPaths): Promise<void> {
  // Generate interface → src/db/schema/<entity>.ts
  const schemaOut = path.join(paths.schemaDir, `${schemaInfo.lowerCaseName}.ts`);
  await renderTemplate(schemaTemplate, schemaOut, {
    Name: schemaInfo.Name,
    lowerCaseName: schemaInfo.lowerCaseName,
    fields: schemaInfo.fields.map((f) => ({
      name: f.name,
      tsType: f.tsType,
      required: f.required,
    })),
  });

  // Generate provider → src/db/providers/<entity>.ts
  const providerOut = path.join(paths.providersDir, `${schemaInfo.lowerCaseName}.ts`);
  await renderTemplate(providerTemplate, providerOut, {
    Name: schemaInfo.Name,
    lowerCaseName: schemaInfo.lowerCaseName,
    tableName: schemaInfo.tableName,
    fieldListNoId: schemaInfo.fieldListNoId,
    paramPlaceholdersNoId: schemaInfo.paramPlaceholdersNoId,
    paramListNoId: schemaInfo.paramListNoId,
    idTsType: schemaInfo.idTsType,
    updatableFields: schemaInfo.updatableFields.map((f) => ({
      name: f.name,
      column: f.column,
    })),
  });

  // Generate route → src/routes/<entity>.ts
  const routeOut = path.join(paths.routesDir, `${schemaInfo.lowerCaseName}.ts`);
  await renderTemplate(routeTemplate, routeOut, {
    Name: schemaInfo.Name,
    lowerCaseName: schemaInfo.lowerCaseName,
  });
}

export async function generate(options: GenerationOptions): Promise<void> {
  const specContent = await fs.readFile(options.specPath, "utf8");
  const spec = yaml.parse(specContent) as any;

  const paths = await setupDirectories(options.cwd);
  await generateConnection(paths.dbDir);

  const schemas = spec.components?.schemas || {};

  for (const [schemaName, schemaDef] of Object.entries<any>(schemas)) {
    const schemaInfo = buildSchemaInfo(schemaName, schemaDef);

    if (schemaInfo) {
      await generateSchemaFiles(schemaInfo, paths);
    }
  }

  console.log("✅ Groundwork scaffolding complete!");
}
