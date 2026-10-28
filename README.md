# Upstride Backend

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Express.js](https://img.shields.io/badge/Express-5.3-black.svg)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose%209-green.svg)](https://mongoosejs.com/)
[![Redis](https://img.shields.io/badge/Redis-7-red.svg)](https://redis.io/)
[![BullMQ](https://img.shields.io/badge/BullMQ-5.8-orange.svg)](https://bullmq.io/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.8-lightgrey.svg)](https://socket.io/)

Upstride is a scalable, enterprise-grade backend platform for 1-on-1 mentorship, session scheduling, and professional networking. Built with **Node.js**, **TypeScript**, **Express 5**, **MongoDB**, and **Redis**, it follows **Clean Architecture (Hexagonal / Ports and Adapters)** and an **Event-Driven Architecture**.

---

## Documentation Index

Comprehensive guides and architectural deep-dives are maintained in the [`docs/`](docs/) directory:

- 🏛️ [**System Architecture**](docs/architecture.md) — Clean Architecture layers, topology, and dependency injection.
- 🔄 [**Workflows & Lifecycles**](docs/workflows.md) — Booking, payments, WebRTC video calls, collaborative whiteboard, and BullMQ worker flows.
- 🗄️ [**Domain Data Model**](docs/data-model.md) — Entity Relationship Diagram (ERD), domain entities, and Redis ephemeral stores.
- 🔌 [**API & WebSocket Reference**](docs/api-and-events.md) — REST API endpoints and Socket.IO real-time event matrix.
- ⚙️ [**Configuration Reference**](docs/configuration.md) — Environment variables reference and third-party integrations.
- 🚀 [**Setup & Development Guide**](docs/setup-guide.md) — Local installation, database seeding, Docker Compose, and testing.

---

## Core Features

- **Authentication & Security**: Argon2 password hashing, Redis-backed OTPs, Google/LinkedIn OAuth 2.0, JWT with token revocation blacklisting, rate limiting, and CSRF protection.
- **Mentor Discovery & Applications**: Multi-step mentor verification, taxonomy catalog (skills, professions, interests), search, and bookmarking.
- **Scheduling & Bookings**: Concurrency-safe mentor slot management, recurring availability, and Stripe checkout sessions.
- **Live Collaboration**: WebRTC 1-on-1 audio/video calls via Socket.IO with Redis Sharded Adapter, synchronized collaborative whiteboard, and in-call messaging.
- **Wallets & Settlements**: Digital wallets, Stripe webhook processing, automated post-session payouts, refunds, and PDFKit receipt generation.
- **Articles & Community**: Rich article publishing, LRU feed caching, comments, reactions, and content reporting.
- **Asynchronous Workers**: Dedicated BullMQ worker process handling reminder jobs, settlement calculations, emails (Nodemailer), and Web Push (VAPID).

> 📖 **Reference:** For details on each module, see [System Architecture](docs/architecture.md) and [API & WebSocket Reference](docs/api-and-events.md).

---

## Architecture Overview

Upstride Backend strictly adheres to **Clean Architecture** principles. High-level business policies do not depend on low-level implementation details; dependencies point strictly inward toward the domain layer.

```text
Presentation Layer (HTTP & WebSockets)
       │
       ▼
Application Layer (Use Cases, Ports & Event Handlers)
       │
       ▼
Domain Layer (Entities, Policies & Domain Events)
       ▲
       │
Infrastructure Layer (MongoDB, Redis, BullMQ, Stripe, S3)
```

The system runs behind an **Nginx** reverse proxy (handling SSL termination, connection limits, and WebSocket upgrade forwarding) and separates the **API Service** (Express 5 + Socket.IO) and the **Worker Service** (BullMQ) into independently scalable processes coordinated via Redis and MongoDB.

> 📖 **Reference:** Read the complete architecture breakdown, Inversify DI container setup, and system topology diagram in [docs/architecture.md](docs/architecture.md).

---

## Core Workflows & Lifecycles

1. **Booking & Settlement Lifecycle**: Mentee reserves slot &rarr; Stripe Checkout &rarr; Webhook confirmation &rarr; BullMQ schedules reminders & settlement &rarr; Live WebRTC session &rarr; Automated payout or refund calculation.
2. **WebRTC & Collaborative Whiteboard**: Socket.IO room signaling (`offer`, `answer`, `ice-candidate`) paired with Redis-backed canvas state caching.
3. **Event-Driven Processing**: In-memory event bus emits domain events that dispatch delayed background jobs to BullMQ queues (`notification-queue` and `booking-settlement-queue`).

> 📖 **Reference:** See complete Mermaid sequence and flow diagrams in [docs/workflows.md](docs/workflows.md).

---

## Data Model

The platform uses **MongoDB** (via Mongoose) for persistent entity storage and **Redis** for ephemeral data (OTP codes, token revocation, sliding-window rate limits, and whiteboard state).

Key domain entities include:
- `User`, `Mentor`, `Availability`, `Booking`, `Session`
- `Wallet`, `PaymentTransaction`, `CoinTransaction`
- `Article`, `ArticleComment`, `ArticleReaction`
- `Review`, `Report`, `PushSubscription`

> 📖 **Reference:** View the full Entity Relationship Diagram (ERD) and entity specifications in [docs/data-model.md](docs/data-model.md).

---

## Project Structure

```text
upstride-backend/
├── docs/                 # Detailed architectural and technical documentation
├── nginx/                # Nginx reverse proxy configuration & setup scripts
├── scripts/              # Database seeders (skills, professions, superadmin, etc.)
├── src/
│   ├── application/      # Use cases, ports, DTOs, and event handlers
│   ├── domain/           # Core entities, policies, repository interfaces, and events
│   ├── infrastructure/   # Repositories (MongoDB/Redis), BullMQ workers, external services
│   ├── presentation/     # Express HTTP controllers, routes, and Socket.IO WebRTC server
│   ├── main/             # App entry points (index.ts, worker.ts) and DI container bindings
│   └── shared/           # Configuration, constants, logger, and types
├── tests/                # Unit, integration, and factory tests (Vitest)
├── docker-compose.yml    # Multi-container service configuration
└── package.json          # Dependencies and scripts
```

> 📖 **Reference:** For an in-depth tour of layers and module boundaries, see [docs/architecture.md](docs/architecture.md).

---

## API & Real-Time Events

- **REST API (`/api/v1`)**: Auth, Catalog, Mentors, Mentor Lists, Availabilities, Bookings, Payments, Wallet, Chats, Articles, Storage, Reviews, Reports, Users, and Admin Dashboard.
- **Webhooks**: `/api/webhooks/stripe` for real-time payment reconciliation.
- **WebSockets (`/socket.io`)**: WebRTC signaling (`call:join`, `call:signal:*`), media controls, collaborative whiteboard synchronization (`whiteboard:sync`), and in-call chat.

> 📖 **Reference:** See the full endpoints and socket events matrix in [docs/api-and-events.md](docs/api-and-events.md).

---

## Configuration

Environment variables are validated at startup using Zod. Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Key environment configurations include database connection strings (`MONGODB_URI`, `REDIS_URI`), JWT secrets, Stripe keys, AWS S3 credentials, SMTP mail credentials, and VAPID keys for Web Push.

> 📖 **Reference:** See the complete environment variable table and integration setup in [docs/configuration.md](docs/configuration.md).

---

## Getting Started

### 1. Installation

```bash
# Clone the repository
git clone https://github.com/mohammedbilalns/upstride-backend.git
cd upstride-backend

# Install dependencies
pnpm install

# Copy environment config
cp .env.example .env
```

### 2. Database Seeding

```bash
# Seed skills, professions, and interests
npm run seed

# Seed default Superadmin account
npm run seed:superadmin
```

### 3. Run the Services

```bash
# Terminal 1: Start API Server & WebSockets
npm run dev

# Terminal 2: Start BullMQ Background Worker
npm run dev:worker
```

Alternatively, run everything via Docker Compose:
```bash
docker-compose up --build -d
```

> 📖 **Reference:** Detailed setup instructions and seeder references are in [docs/setup-guide.md](docs/setup-guide.md).

---

## Testing & Quality Assurance

```bash
# Run test suite
npm test

# Run tests in watch mode
npm run test:watch

# Type check TypeScript without emitting files
npm run type-check

# Format and lint with Biome
npm run lint-format
```

> 📖 **Reference:** More testing and coverage details are available in [docs/setup-guide.md#6-testing--quality-assurance](docs/setup-guide.md#6-testing--quality-assurance).
