# NestV11

# Getting Started

## Server Requirements

- Node.js 22
- PostgreSQL 16

## Installing preparation

1. Default Application $BASEPATH : `/home/app.user/nestv11`

2. Copy the .env file from .env.example under $BASEPATH, fill your config in .env file instead of example config

# I. Build the app (manual)

## 1. Dependencies Installation

```bash
  pnpm install
```

## 2. Migrate database

### 2.1. Create migration file

```bash
  # Generate migration file from entities
  pnpm migration:create src/database/migrations/your_migration_name
```

```bash
  # Create empty migration file
  pnpm migration:createEmpty src/database/migrations/your_migration_name
```

### 2.2. Migrate

```bash
  pnpm build
  pnpm migration:up
```

### 2.3. Revert

```bash
  pnpm migration:down
```

## 3. Running the app

```bash
# development
$ pnpm start

# watch mode
$ pnpm start:dev

# production mode
$ pnpm start:prod
```