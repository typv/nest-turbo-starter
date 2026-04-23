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
  yarn install
```

## 2. Migrate database

### 2.1. Create migration file

```bash
  yarn migrate:create src/database/migrations/your_migration_name
```

### 2.2. Migrate

```bash
  yarn build
  yarn migrate:run
```

### 2.3. Revert

```bash
  yarn migrate:revert
```

## 3. Running the app

```bash
# development
$ yarn start

# watch mode
$ yarn start:dev

# production mode
$ yarn start:prod
```

## 4. Other

### 4.1. Run seed

```bash
  yarn seed:run
```

# II. Build with Docker

## 1. Setup docker

```bash
  docker compose up -d
  docker compose exec node npm i -g @nestjs/cli
  docker compose exec node yarn
```

## 3. Migrate database

## 3.1. Migrate

```bash
  docker compose exec node yarn migrate:run
```

## 3.2. Revert Migration

```bash
  docker compose exec node yarn migrate:revert
```

## 4. Run dev mode

```bash
  docker compose exec node yarn start:dev
```

## 5. Other

### 5.1. Run seed

```bash
  docker compose exec node yarn seed:run
```

### 5.2. Local url

http://localhost:31004
