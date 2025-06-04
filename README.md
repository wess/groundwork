# 🏗️ Groundwork

A powerful CLI tool kit for:
- API generation from OpenAPI specifications 
- Database migration management.
- And more to come.

## Installation

Install groundwork using Homebrew:

```bash
brew install wess/packages/groundwork
```

## Usage

Groundwork provides two main sets of commands: `generate` for API code generation and `migrate` for database migration management.

### API Generation

Generate API code from OpenAPI specifications:

```bash
grwo generate <path-to-openapi-spec>
```

**Example:**
```bash
grwo generate ./api-spec.yaml
```

This command will analyze your OpenAPI specification and generate the corresponding API code structure.

### Database Migrations

Groundwork includes a comprehensive migration system for managing database schema changes.

#### Initialize Migration System

Set up the migration system in your project:

```bash
grwo migrate init
```

#### Create a New Migration

Generate a new migration file:

```bash
grwo migrate new <migration-name>
```

**Example:**
```bash
grwo migrate new create-users-table
```

#### Generate Migration from Schema

Generate a migration based on existing TypeScript schema files:

```bash
grwo migrate generate
```

This command analyzes the TypeScript interfaces in `src/db/schema/` (created by `grwo generate`) and automatically creates SQL migration files. It maps TypeScript types to appropriate SQL column types and generates both `up.sql` (CREATE TABLE statements) and `down.sql` (DROP TABLE statements).

**Note:** This command requires that you have already run `grwo generate <openapi-spec>` to create the schema files first.

#### Run Migrations

Execute all pending migrations:

```bash
grwo migrate up
```

This command will also create the database if it doesn't exist.

#### Rollback Migration

Roll back the most recent migration:

```bash
grwo migrate down
```

#### Check Migration Status

View the status of all migrations:

```bash
grwo migrate status
```

**Options:**
- `--exit-code`: Exit with code 1 if there are pending migrations
- `--quiet`: Only print summary information

#### Database Management

Create the database:

```bash
grwo migrate create
```

Drop the database:

```bash
grwo migrate drop
```

## Examples

### Complete Workflow Example

```bash
# Generate API code from your OpenAPI spec
grwo generate ./openapi.yaml

# Initialize migrations in your project
grwo migrate init

# Generate migration from the created schema files
grwo migrate generate

# Run migrations to set up your database
grwo migrate up

# Check migration status
grwo migrate status
```

### Alternative Manual Migration Workflow

```bash
# Initialize migrations in your project
grwo migrate init

# Create your first migration manually
grwo migrate new initial-schema

# Edit the migration files as needed, then run migrations
grwo migrate up
```

## Getting Help

For detailed help on any command, use the `--help` flag:

```bash
grwo --help
grwo generate --help
grwo migrate --help
```

---

**Version:** 0.0.1  
**License:** See LICENSE file for details
