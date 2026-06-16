# Upstride Backend

### Backend API powering the [Upstride](https://upstride.bilalnsmuhammed.in)

Built with **TypeScript**, **Clean Architecture****, and **event-driven patterns**

---

## Features

### Authentication & Security

- Email registration & login
- Social login (Google)
- JWT access & refresh sessions
- OTP verification flows
- Secure password hashing using [Argon2](https://www.npmjs.com/package/argon2)
- Session management & token revocation

### Mentorship Platform

- Mentor registration & moderation
- Mentor discovery
- Mentor availability scheduling
- Booking & rescheduling sessions
- Reviews & ratings

### Real-Time Communication

- One-to-one chat
- Real-time messaging using [Socket.IO](https://socket.io/)
- Notifications
- Live call session handling

### Content Platform

- Article publishing
- Comments & reactions
- Reporting & moderation

### Payments & Wallet

- [Stripe](https://stripe.com/) checkout integration
- Wallet transactions
- Session settlement
- Refund handling

### Media & Storage

- Presigned uploads
- File deletion
- Media storage using [AWS S3](https://aws.amazon.com/s3/)

### Infrastructure

- [Redis](https://redis.io/) caching
- Background job processing
- Worker-based async processing
- Event bus architecture
- Dockerized environments

---

## Tech Stack

- [Node.js](https://nodejs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Express.js](https://expressjs.com/)
- [MongoDB](https://www.mongodb.com/)
- [Mongoose](https://mongoosejs.com/)
- [InversifyJS](https://inversify.io/)
- [Zod](https://zod.dev/)
- [Socket.IO](https://socket.io/)
- [Redis](https://redis.io/)
- [Stripe](https://stripe.com/)
- [AWS S3](https://aws.amazon.com/s3/)
- [Docker](https://www.docker.com/)

---

## Architecture

This project follows:

- Clean Architecture
- Domain-Driven Design
- Repository Pattern
- Event-Driven Architecture
- Dependency Injection using [InversifyJS](https://inversify.io/)
- SOLID Principles

---

## Project Structure

```bash
.
├── src
│   ├── application
│   │   ├── modules
│   │   ├── events
│   │   ├── services
│   │   └── ports
│   │
│   ├── domain
│   │   ├── entities
│   │   ├── repositories
│   │   ├── events
│   │   └── policies
│   │
│   ├── infrastructure
│   │   ├── database
│   │   ├── cache
│   │   ├── queue
│   │   │   └── workers
│   │   ├── notifications
│   │   ├── services
│   │   └── mail
│   │
│   └── main
│       ├── di
│       ├── app.ts
│       └── worker.ts
```

---

## Installation

Clone repository:

```bash
git clone https://github.com/mohammedbilalns/upstride-backend.git
cd upstride-backend
```

Install dependencies:

```bash
pnpm install
```

---

## Environment Setup

Environment variables are already provided in:

```bash
.env.example
```

Create your local environment:

```bash
cp .env.example .env
```

---

## Running with Docker

Development:

```bash
docker compose -f docker-compose.dev.yml up
```

Production:

```bash
docker compose up
```

---

## Running Locally

API Server:

```bash
pnpm dev
```

Background Workers:

```bash
pnpm worker
```

Build:

```bash
pnpm build
```

Start Production:

```bash
pnpm start
```

---

## Database Seeding

Available scripts:

```bash
pnpm seed:users
pnpm seed:skills
pnpm seed:interests
pnpm seed:professions
pnpm seed:superadmin
```

---

## License

MIT
