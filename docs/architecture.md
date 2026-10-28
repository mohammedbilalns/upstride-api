# System Architecture

Upstride Backend is engineered following **Clean Architecture (Hexagonal / Ports and Adapters)**, **Domain-Driven Design (DDD)** principles, and an **Event-Driven Architecture**.

The system separates concerns cleanly: business logic remains independent of external frameworks, databases, messaging queues, and UI protocols.

---

## High-Level System Topology

The platform separates the **REST / WebSocket API server** and the **Background Worker** into isolated, independently scalable processes coordinated via Redis and MongoDB.

```mermaid
flowchart TD
    subgraph Clients["Clients & Gateways"]
        WebClient["Web / Mobile Client"]
        Nginx["Nginx Reverse Proxy<br/>(SSL Termination, Gzip,<br/>Rate Limiting & WS Upgrade)"]
    end

    subgraph Compute["Application Tier"]
        API["Upstride API Service<br/>(Express 5 + Socket.IO Server)"]
        Worker["Upstride Worker Service<br/>(BullMQ Job Processor)"]
    end

    subgraph Persistence["Data & State Tier"]
        MongoDB[("MongoDB<br/>(Mongoose Document Store)")]
        RedisDB[("Redis<br/>(Cache, Token Blacklist, OTP,<br/>BullMQ Queues & Socket.IO Adapter)")]
    end

    subgraph ThirdParty["External Services"]
        S3["AWS S3<br/>(Media & Receipts)"]
        Stripe["Stripe<br/>(Checkout & Webhooks)"]
        OAuth["Google & LinkedIn<br/>(OAuth 2.0)"]
        SMTP["SMTP Server<br/>(Nodemailer)"]
        WebPushSvc["Web Push Service<br/>(web-push / VAPID)"]
        Loki["Grafana Loki<br/>(pino-loki)"]
    end

    WebClient -->|HTTPS and WSS| Nginx
    Nginx -->|REST API Requests| API
    Nginx -->|WebSocket and WebRTC Signaling| API

    API -->|Read and Write Documents| MongoDB
    API -->|Session and Cache Store| RedisDB
    API -->|Push Jobs to Queues| RedisDB
    API -->|Uploads and Presigned URLs| S3
    API -->|Create Checkout Sessions| Stripe
    API -->|Social Authentication| OAuth
    API -->|Structured JSON Logs| Loki

    Stripe -->|Webhook Events| API

    Worker -->|Fetch and Process Jobs| RedisDB
    Worker -->|Update Settlements and Bookings| MongoDB
    Worker -->|Send Emails| SMTP
    Worker -->|Send Push Notifications| WebPushSvc
    Worker -->|Upload PDF Receipts| S3
    Worker -->|Structured JSON Logs| Loki
```

---

## Clean Architecture Layers

Dependencies point strictly inward toward the domain layer. Outer layers can depend on inner layers, but inner layers have zero knowledge of external frameworks or libraries.

```mermaid
flowchart TD
    subgraph LayerPresentation["1. Presentation Layer (Inbound Adapters)"]
        Controllers["REST Controllers (Express 5)"]
        Middlewares["Middlewares (Auth, Rate Limiter, Helmet, CSRF, Logger)"]
        SocketServer["Socket.IO Server & WebRTC CallHandler"]
        Validators["Zod Request Schemas & DTO Validation"]
    end

    subgraph LayerApplication["2. Application Layer (Use Cases & Ports)"]
        UseCases["Business Use Cases (Login, BookSlot, SettleEndedSession, etc.)"]
        AppServices["Application Services (TokenService, WhiteboardCache)"]
        EventHandlers["Domain Event Handlers (UserRegistered, CheckoutCompleted)"]
        Ports["Outbound Ports (JobQueuePort, BookingJobQueuePort)"]
    end

    subgraph LayerDomain["3. Domain Layer (Enterprise Core)"]
        Entities["Domain Entities (User, Mentor, Booking, Session, Article, Wallet)"]
        DomainEvents["Domain Events (MessageSent, CheckoutCompleted, etc.)"]
        Policies["Domain Policies (Refund, Cancellation, No-Show)"]
        RepoInterfaces["Repository Interfaces (IUserRepository, IBookingRepository, etc.)"]
    end

    subgraph LayerInfrastructure["4. Infrastructure Layer (Outbound Adapters)"]
        MongoRepos["MongoDB Repositories & Mongoose Models"]
        RedisRepos["Redis Repositories (OTP, TokenRevocation, Whiteboard)"]
        QueueAdapters["BullMQ Queue Adapters & Worker Handlers"]
        ExtServices["External Services (Stripe, S3, Nodemailer, WebPush, PDFKit)"]
        InMemoryBus["In-Memory Event Bus Implementation"]
    end

    subgraph LayerMain["5. Main / Composition Root"]
        DIContainers["InversifyJS DI Containers (API & Worker Containers)"]
        AppBootstrap["App Bootstrapper & Graceful Shutdown"]
    end

    LayerPresentation -->|Invokes| LayerApplication
    LayerInfrastructure -->|Implements Ports and Interfaces| LayerApplication
    LayerApplication -->|Coordinates| LayerDomain
    LayerMain -->|Assembles and Injects Dependencies| LayerPresentation
    LayerMain -->|Assembles and Injects Dependencies| LayerApplication
    LayerMain -->|Assembles and Injects Dependencies| LayerInfrastructure
```

### 1. Domain Layer (`src/domain`)

- **Entities**: Pure TypeScript classes encapsulating enterprise business rules (e.g., `User`, `Mentor`, `Booking`, `Session`, `Wallet`, `Article`).
- **Domain Events**: Dispatched when critical domain state transitions occur (e.g., `UserRegisteredEvent`, `CheckoutCompletedEvent`, `SessionRefundedEvent`, `MessageSentEvent`).
- **Policies**: Domain logic rules governing domain operations (e.g., OTP validation rules, refund calculations, mentor no-show policies).
- **Repository Interfaces**: Abstract contracts defining repository capabilities without binding to a database vendor.

### 2. Application Layer (`src/application`)

- **Use Cases**: Encapsulate application-specific workflows and orchestrate domain entities and repository interfaces.
- **Ports**: Inbound and outbound abstraction boundaries (e.g., `JobQueuePort`, `BookingJobQueuePort`).
- **Domain Event Handlers**: Decouple domain side effects (such as sending an email or issuing an in-app notification) from use case execution.
- **Data Transfer Objects (DTOs)**: Typed input/output contracts passed across layer boundaries.

### 3. Infrastructure Layer (`src/infrastructure`)

- **Persistence**: MongoDB repositories with Mongoose schemas and entity mappers.
- **Cache & Ephemeral State**: Redis implementations for OTP management, token revocation blacklisting, and live whiteboard state caching.
- **Queues & Workers**: BullMQ queue adapters and background worker handlers for notification and settlement pipelines.
- **External Services**: Integrations with Stripe, AWS S3, Nodemailer, WebPush, Google/LinkedIn OAuth, and PDFKit.

### 4. Presentation Layer (`src/presentation`)

- **HTTP**: Express 5 controllers, route definitions, error handlers, and security middlewares (rate limiting, helmet, cookie-parser, CORS, request logging).
- **WebSockets**: Socket.IO server configured with `@socket.io/redis-adapter` for multi-instance horizontal scaling, handling WebRTC signaling and real-time whiteboard collaboration.

### 5. Main / Composition Root (`src/main`)

- **Dependency Injection**: Uses InversifyJS containers (`apiContainer` and `workerContainer`) to resolve interfaces to concrete implementations at application startup.
- **Graceful Shutdown**: Intercepts `SIGTERM` and `SIGINT` to cleanly close HTTP listeners, WebSocket rooms, active worker queues, MongoDB connections, and Redis clients.

---

## Reverse Proxy & Gateway Layer (`nginx/`)

Production deployments route incoming traffic through **Nginx**, configured via `nginx/upstride-api.conf` and `nginx/upstride-http.conf`:
- **SSL Termination & Security**: Manages TLS certificates (Certbot) and injects hardened HTTP headers (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`).
- **WebSocket Upgrade Routing**: Proxies `/socket.io/` connections with connection upgrade headers, disabled buffering, and extended timeouts (86400s) for persistent WebRTC signaling channels.
- **Differentiated Traffic Limits**: Implements per-IP connection limits, dedicated non-limited passthrough for `/api/webhooks/stripe`, and stricter rate limiting for authentication endpoints (`/api/v1/auth/`).
- **Performance Optimization**: Enables Gzip compression for JSON payloads and static assets, and maintains persistent keepalive connections (64) to the upstream backend service.
