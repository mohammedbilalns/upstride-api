# Upstride Backend

Upstride Backend is a scalable backend platform for mentorship and professional networking, built with Node.js, TypeScript, Express, and MongoDB.

It powers a complete mentorship ecosystem with secure authentication, mentor discovery, personalized content feeds, session scheduling, live video call support, payments, wallet management, notifications, and media storage. The application follows a modular Clean Architecture with an event-driven design, enabling maintainable, scalable, and extensible business logic.

---

## Features

* User authentication and authorization
* Mentor profile and discovery
* Session scheduling and booking
* Live call session handling
* Article publishing platform
* Comments and reactions
* Content reporting and moderation
* Stripe payment integration
* Wallet and transaction management
* Session settlement and refunds
* Media uploads with AWS S3
* Background job processing
* Redis caching
* Event-driven architecture
* Worker-based asynchronous processing

---

## Tech Stack

### Backend

* Node.js
* TypeScript
* Express.js
* MongoDB
* Mongoose
* InversifyJS
* Zod
* Socket.IO
* Redis
* Stripe
* AWS S3

### Development Tools

* Docker

---

## Architecture

* Clean Architecture
* Repository Pattern
* Event-Driven Architecture
* Dependency Injection
* SOLID Principles

---

## Project Structure

```text
upstride-api/
├── src/
│   ├── application/
│   │   ├── events/
│   │   ├── modules/
│   │   ├── ports/
│   │   └── services/
│   │
│   ├── domain/
│   │   ├── entities/
│   │   ├── events/
│   │   ├── policies/
│   │   └── repositories/
│   │
│   ├── infrastructure/
│   │   ├── cache/
│   │   ├── database/
│   │   ├── mail/
│   │   ├── notifications/
│   │   ├── queue/
│   │   │   └── workers/
│   │   └── services/
│   │
│   └── main/
│       ├── app.ts
│       ├── di/
│       └── worker.ts
│
├── docker-compose.dev.yml
├── docker-compose.yml
├── package.json
└── README.md
```
