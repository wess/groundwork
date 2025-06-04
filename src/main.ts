#!/usr/bin/env bun

import { Command } from "commander";
import path from 'path';
import { 
  generate,
  migrateInit,
  migrateNew,
  migrateUp,
  migrateDown,
  migrateStatus,
  migrateCreate,
  migrateDrop,
  migrateGenerate
} from './commands';
import { GenerationOptions } from './types';

const cli = new Command()
  .name("grwo")
  .description("Groundwork - API generation and database migration tool")
  .version("0.0.1");

// Generate command for OpenAPI
cli
  .command("generate <spec-path>")
  .description("Generate API code from OpenAPI specification")
  .action(async (specPath: string) => {
    const resolvedPath = path.resolve(specPath);
    const cwd = process.cwd();

    const options: GenerationOptions = {
      specPath: resolvedPath,
      cwd,
    };

    await generate(options);
  });

// Migration commands
const migrateCmd = cli
  .command("migrate")
  .description("Database migration commands");

// Initialize migrations
migrateCmd
  .command("init")
  .description("Initialize migrations folder")
  .action(async () => {
    await migrateInit();
  });

// Create new migration
migrateCmd
  .command("new <name>")
  .description("Generate a new migration")
  .action(async (name: string) => {
    await migrateNew(name);
  });

// Run migrations
migrateCmd
  .command("up")
  .description("Create DB if needed and run pending migrations")
  .action(async () => {
    await migrateUp();
  });

// Rollback migration
migrateCmd
  .command("down")
  .description("Roll back the most recent migration")
  .action(async () => {
    await migrateDown();
  });

// Migration status
migrateCmd
  .command("status")
  .description("Show status of all migrations")
  .option("--exit-code", "Exit with code=1 if there are pending migrations")
  .option("--quiet", "Only print summary")
  .action(async (options) => {
    await migrateStatus(options);
  });

// Create database
migrateCmd
  .command("create")
  .description("Create the database")
  .action(async () => {
    await migrateCreate();
  });

// Drop database
migrateCmd
  .command("drop")
  .description("Drop the database")
  .action(async () => {
    await migrateDrop();
  });

// Generate migration from schemas
migrateCmd
  .command("generate")
  .description("Generate migration from existing schema files")
  .action(async () => {
    await migrateGenerate();
  });

// Parse and execute
cli.parse(process.argv);
