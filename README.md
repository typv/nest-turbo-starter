# 🧠 Nest Turbo Starter

A high-performance, monorepo microservices platform built with NestJS, optimized for speed using Turborepo and the pnpm package manager. The system is containerized with Docker and features dynamic traffic management and security via API Gateway (Apache APISIX / Kong).

## 🚀 Getting Started

### 🏗️ System Architecture
This project implements a robust, containerized microservices architecture designed for high availability and scalability. All core services—built on NestJS and Node.js—reside within a secure Private Subnet, adhering to the principle of service autonomy where each microservice owns its PostgreSQL database. External client requests are strictly managed by Apache APISIX, which serves as the central API Gateway for routing, security, and policy enforcement via HTTP. Internal service-to-service communication is handled via efficient TCP connections, while Kafka is optionally integrated to enable scalable, asynchronous communication and event-driven processing, minimizing service coupling.

<p align="center">
  <img src="docs/images/architecture.png" alt="Nest Turbo Starter Microservices Architecture" width="342"/>
</p>

---

### ✅ Tech Stacks

#### 🚀 Core Backend
| Component | Version | Description |
|------------|---------|-------------|
| Node.js | 22.15   | JavaScript runtime |
| NestJS | 11      | Backend framework |
| TypeScript | 5.x     | Type-safe language |
| PostgreSQL | 16      | Main relational DB |
| Redis | 8.0     | Cache & queue backend |
| pnpm | 10.x    | Monorepo package manager |
| Kafka (optional) | 4.x     | Event streaming & async communication |


#### 🌐 API Gateway & Service Mesh
| Component | Version | Description |
|------------|----------|-------------|
| Apache APISIX | 3.14 | Default API Gateway |
| Etcd | 3.5.1 | APISIX config store |
| Kong | 3.12 | Optional alternative gateway |

#### ⚙️ Infrastructure & DevOps
| Component | Version | Description |
|------------|----------|-------------|
| Docker / Compose | latest | Containerization |
| ADC | latest | APISIX config sync |
| deck | latest | Kong config sync |
| Redis Insight | latest | Redis visualization |
| Kafka UI | latest | Kafka management UI |
| Kong Manager | 3.12 | Kong dashboard |

#### 🧰 Developer Tools
| Tool | Description |
|------|--------------|
| ESLint / Prettier | Linting & formatting |
| Jest | Unit testing |
| Swagger | API documentation |
| Husky + lint-staged | Git pre-commit checks |
| Dotenv | Env management |
---

## ⚙️ Installation Preparation

1. **Default Base Path**

   ```bash
   /home/app.user/nest-turbo-starter
   ```

2. **Environment Variables**

   Copy the sample environment file:

  ```bash
  cp .env.example .env
  ```

  ```bash
  cd apps/service_name & cp .env.example .env
  ```
> ⚠️ **Note:**
> - The project require additional environment variables both at the **root** of the monorepo/turborepo and for each individual microservice
> - Make sure to add these variables of **root** to turbo.json (or your monorepo configuration)
---

# 🐳 I. Build with Docker

### 1️⃣ Setup Docker

Build and start all containers:

```bash
docker compose up -d --build
```

---

### 2️⃣ Install Dependencies

Install dependencies inside the Node container:

```bash
docker compose exec node pnpm install
```

---

### 3️⃣ Build Services

#### Build all services

```bash
docker compose exec node pnpm build
```

#### Build a single service

```bash
docker compose exec node pnpm --filter=auth-service build
```

---

### 4️⃣ Run Database Migrations

#### Run migrations for all services

  ```bash
  docker compose exec node pnpm migrate
  ```

#### Run migrations for a specific service

  ```bash
  docker compose exec node pnpm --filter=service_name migrate:up
  # Example:
  docker compose exec node pnpm --filter=auth-service migrate:up
  ```

---

### 5️⃣ Start Microservices

#### 🧩 Development Mode

* Start all services:

  ```bash
  docker compose exec node pnpm dev
  ```

* Start a single service:

  ```bash
  docker compose exec node pnpm dev --filter=service_name
  # Example:
  docker compose exec node pnpm dev --filter=auth-service
  ```

#### 🚀 Production Mode

* Start all services:

  ```bash
  docker compose exec node pnpm prod
  ```

* Start a single service:

  ```bash
  docker compose exec node pnpm prod --filter=service_name
  ```

---

# 🧑‍💻 II. Manual Build

If you prefer to run the Node application **without Docker**, follow these steps.

---

### 1️⃣ Prerequisites

### 🧩 Create Only Required Docker Containers

If you want to run microservices **manually** while still using Docker for dependencies (e.g., database, Redis, API gateway), you can start only the required containers.

#### Option 1 — Using `docker-compose-dev.yml`

Start all necessary infrastructure containers (e.g., PostgreSQL, Redis, APISIX):

```bash
docker compose -f docker-compose-dev.yml up -d --build
```

#### Option 2 — Start Specific Containers

You can also start individual containers as needed:

```bash
docker compose up -d db
docker compose up -d redis
docker compose up -d apisix
```

> 💡 **Tip:** This approach is ideal for local development when running Node.js services directly on your host machine instead of inside Docker.


#### `pnpm` installed globally:
  ```bash
  npm install -g pnpm
  ```

---

### 2️⃣ Environment Setup

Copy and configure environment variables:

```bash
cp .env.example .env
```

Edit `.env` with correct values for database, Redis, Kafka, and gateway settings.

---

### 3️⃣ Install Dependencies

Install all workspace dependencies:

```bash
pnpm install
```

Or install only for a single service:

```bash
pnpm --filter=auth-service install
```

---

### 4️⃣ Build

Build all microservices:

```bash
pnpm build
```

Or build one specific service:

```bash
pnpm --filter=auth-service build
```

---

### 5️⃣ Run Database Migrations

Run migrations for all services:

```bash
pnpm migrate
```

Or for one service:

```bash
pnpm --filter=auth-service migrate:up
```

---

### 6️⃣ Start Microservices

#### Development mode

Start all services:

```bash
pnpm dev
```

Start one specific service:

```bash
pnpm dev --filter=auth-service
```

#### Production mode

Start all services:

```bash
pnpm prod
```

Start one specific service:

```bash
pnpm prod --filter=auth-service
```

---

## 🌐 API Gateway Configuration

> ⚠️ **Note:**
> - The current setup uses **Kong Gateway (Free / OSS Edition)**, which lacks several advanced enterprise features such as rate limiting, JWT key rotation, analytics, and RBAC management.
> - To address these limitations and support more advanced features, **Apache APISIX** is chosen as the **default API gateway** for this system.  
> - Key reasons include:
>   - Free & open source
>   - High performance and low latency
>   - Easy integration with etcd for declarative configuration
>   - Rich plugin ecosystem (rate limiting, JWT auth, logging, etc.)
>   - Active community and rapid development
> - The system is currently under active development to integrate and extend these features.

### 1️⃣  Apache APISIX (Default Gateway)

#### Sync configuration from file

```bash
docker compose run --rm adc adc sync -f apisix-${environment}.yaml
# Example:
docker compose run --rm adc adc sync -f apisix-dev.yaml
```

#### Dump configuration from DB for verification

```bash
docker compose run --rm adc adc dump -o adc/adc.yaml
```

---

### 2️⃣  Kong Gateway (Alternative Option)

Sync configuration using `deck`:

```bash
docker compose run --rm kong-deck gateway sync /app/kong-dev.yaml
```

---

# 🌍 Access URLs

## 🧭 API Gateways

| Gateway              | URL Example                                                                         |
| -------------------- | ----------------------------------------------------------------------------------- |
| **APISIX Node**      | [http://localhost:`APISIX_NODE_LISTEN`](http://localhost:`APISIX_NODE_LISTEN`)      |
| **APISIX Dashboard** | http://localhost:`APISIX_NODE_LISTEN`/ui |

---

## ⚙️ Microservices

| Type             | Example                                                                                  |
|------------------|------------------------------------------------------------------------------------------|
| **Direct Access** | http://localhost:port/api                                                                |
| **Via APISIX**   | http://localhost:`APISIX_NODE_LISTEN`/`service_name`/api                                 |
| Example          | [http://localhost:9080/auth-service/api](http://localhost:9080/auth-service/api)         |
| Swagger          | [http://localhost:9080/auth-service/swagger](http://localhost:9080/auth-service/swagger) |

---

## 🧰 Tools & Management UI

| Tool          | URL                                              |
| ------------- | ------------------------------------------------ |
| Redis Insight | [http://localhost:5534](http://localhost:5534)   |
| Kafka UI      | [http://localhost:18082](http://localhost:18082) |
| Kong Manager  | [http://localhost:18086](http://localhost:18086) |

---

# 📘 Notes

* Make sure `.env` and configuration files (`apisix-*.yaml`, `kong-*.yaml`) are properly set before running migrations or gateway sync commands.
* Use `pnpm --filter=<service>` to target specific microservices efficiently.
* If using Docker, ensure Docker and Docker Compose are running before executing commands.
---

**© Nest Turbo Starter — Monorepo, Microservice Backend System**
