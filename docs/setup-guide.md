# Setup & Development Guide

This guide covers everything required to run, seed, test, and containerize the Upstride Backend locally and in staging environments.

---

## 1. Prerequisites

- **Node.js**: `v20.x` or higher
- **Package Manager**: `pnpm` (`v10.x` recommended) or `npm`
- **MongoDB**: `v7.0` or higher
- **Redis**: `v7.0` or higher
- **Docker & Docker Compose**: (Optional, for containerized workflows)

---

## 2. Local Environment Setup

1. **Clone the repository**:

   ```bash
   git clone https://github.com/mohammedbilalns/upstride-backend.git
   cd upstride-backend
   ```

2. **Install project dependencies**:

   ```bash
   pnpm install
   ```

3. **Configure environment variables**:

   ```bash
   cp .env.example .env
   # Update variables in .env according to docs/configuration.md
   ```

---

## 3. Database Seeding

Upstride includes seeder scripts in `scripts/` to populate necessary reference data, taxonomies, and admin accounts:

```bash
# Seed taxonomy catalogs (Interests, Professions, Skills)
npm run seed

# Seed default Superadmin account
npm run seed:superadmin

# (Optional) Seed mock users for development testing
npm run seed:users

# (Optional) Seed synthetic platform transactions
npm run seed:platform-transactions
```

### Seeder Scripts Reference:

- `scripts/seed-skills.ts`: Adds technical and professional skills with category groupings.
- `scripts/seed-professions.ts`: Populates standard industry professions.
- `scripts/seed-interests.ts`: Adds interest tags used in discovery algorithms.
- `scripts/seed-superadmin.ts`: Provisions initial superadmin credentials for system administration.
- `scripts/seed-users.ts`: Creates sample mentees and mentors with pre-populated availability schedules.

---

## 4. Running the Application

Upstride requires two processes for full platform functionality: the **API Server** and the **Background Worker**.

### Run in Development Mode

In Terminal 1 (API Server + WebSockets):
```bash
npm run dev
```

In Terminal 2 (BullMQ Background Worker):
```bash
npm run dev:worker
```

### Run in Production Mode

Build TypeScript code:
```bash
npm run build
```

Run production processes:
```bash
# API Server
npm start

# Worker Process
npm run start:worker
```

---

## 5. Docker Compose

To run the entire platform with Redis in Docker:

```bash
# Start all services (Redis, API, Worker)
docker-compose up --build -d

# Check running container statuses
docker-compose ps

# Tail logs
docker-compose logs -f
```

---

## 6. Testing & Quality Assurance

Upstride utilizes **Vitest** for unit and integration testing, alongside **Biome** for lightning-fast linting and code formatting:

```bash
# Run unit and integration tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate test coverage report
npm run test:coverage

# Perform TypeScript static typecheck without emitting files
npm run type-check

# Format and lint codebase with Biome
npm run lint-format
```
