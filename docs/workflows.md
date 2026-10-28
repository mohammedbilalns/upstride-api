# Core Workflows & Lifecycles

This document details the primary business workflows and technical lifecycles across Upstride Backend with sequence and flow diagrams.

---

## 1. Booking, Payment & Settlement Lifecycle

Mentorship sessions transition through four discrete phases: **Reservation & Payment**, **Scheduling & Reminders**, **Live Collaboration**, and **Post-Session Settlement**.

```mermaid
sequenceDiagram
    autonumber
    actor Mentee as Mentee
    participant API as Upstride API
    participant Stripe as Stripe Gateway
    participant DB as MongoDB
    participant Queue as BullMQ (Redis)
    participant Worker as Background Worker
    actor Mentor as Mentor

    Mentee->>API: POST /api/v1/bookings (mentorId, slotId, date)
    API->>DB: Check slot availability & reserve booking (PENDING)
    API->>Stripe: Create Stripe Checkout Session
    Stripe-->>API: checkoutUrl & sessionId
    API-->>Mentee: Return payment redirect URL

    Mentee->>Stripe: Complete payment on Stripe checkout
    Stripe->>API: POST /api/webhooks/stripe (checkout.session.completed)
    API->>DB: Update Booking status to CONFIRMED & save PaymentTransaction
    API->>Queue: Schedule Session Reminder (Delayed Job: T - 15 mins)
    API->>Queue: Schedule Session Settlement (Delayed Job: EndTime + GracePeriod)

    Note over Mentee, Mentor: 15 Minutes Before Start Time
    Queue->>Worker: Trigger Session Reminder Job
    Worker->>Mentee: Send Email & Push Notification
    Worker->>Mentor: Send Email & Push Notification

    Note over Mentee, Mentor: Session Start Time Arrives
    Mentee->>API: Connect WebSocket & Conduct WebRTC Video Session
    Mentor->>API: Connect WebSocket & Conduct WebRTC Video Session

    Note over Mentee, Mentor: Session Ends & Settlement Window Opens
    Queue->>Worker: Trigger Booking Settlement Job
    Worker->>DB: Fetch session attendance & duration stats
    alt Session completed normally
        Worker->>DB: Credit Mentor Wallet (Platform fee deducted)
        Worker->>DB: Generate PDF receipt & update booking status to SETTLED
    else Mentor no-show
        Worker->>DB: Issue full refund to Mentee Wallet / Stripe
        Worker->>DB: Flag mentor account for administrative review
    else Mentee cancelled before cutoff
        Worker->>DB: Calculate refund according to domain policy
    end
```

### Key Phases:

1. **Slot Locking**: When a mentee initiates a booking, the slot is locked into a pending state to prevent race conditions or double-bookings.
2. **Payment Reconciliation**: Stripe webhooks verify signature integrity and safely mutate booking records within database transactions.
3. **Delayed Job Scheduling**: BullMQ schedules dual delayed jobs:
   - `SessionReminderJob`: Sends localized reminders 15 minutes before session start.
   - `BookingSettlementJob`: Fires after the scheduled end time plus a grace window.
4. **Automated Settlement & No-Show Handling**:
   - Compares session join timestamps of mentor and mentee.
   - Computes platform commissions, credits the mentor's digital wallet, or issues full/partial refunds according to cancellation policies.
   - Generates a PDF receipt stored on AWS S3.

---

## 2. WebRTC Video Call & Collaborative Whiteboard Flow

Real-time audio/video streaming relies on peer-to-peer WebRTC connections established via Socket.IO signaling, while whiteboard vector state is synchronized through a Redis-backed room cache.

```mermaid
sequenceDiagram
    autonumber
    actor UserA as Mentee (Peer A)
    participant SocketServer as Socket.IO Server
    participant Redis as Redis Cache
    actor UserB as Mentor (Peer B)

    UserA->>SocketServer: emit('call:pre-join-check', { bookingId })
    SocketServer-->>UserA: emit('call:pre-join-check:success')
    UserA->>SocketServer: emit('call:join', { bookingId })
    SocketServer->>SocketServer: Join room "call_{bookingId}"
    SocketServer->>UserB: emit('call:user-joined', { userId: PeerA })

    UserB->>SocketServer: emit('call:join', { bookingId })
    SocketServer->>SocketServer: Join room "call_{bookingId}"
    SocketServer->>UserA: emit('call:user-joined', { userId: PeerB })

    Note over UserA, UserB: WebRTC Peer-to-Peer Signaling
    UserA->>SocketServer: emit('call:signal:offer', { offer, targetUserId })
    SocketServer->>UserB: emit('call:signal:offer', { offer, fromUserId })
    UserB->>SocketServer: emit('call:signal:answer', { answer, targetUserId })
    SocketServer->>UserA: emit('call:signal:answer', { answer, fromUserId })

    UserA->>SocketServer: emit('call:signal:ice-candidate', { candidate })
    SocketServer->>UserB: emit('call:signal:ice-candidate', { candidate })
    UserB->>SocketServer: emit('call:signal:ice-candidate', { candidate })
    SocketServer->>UserA: emit('call:signal:ice-candidate', { candidate })

    Note over UserA, UserB: Direct Peer-to-Peer Media Established (Audio & Video)

    Note over UserA, UserB: Collaborative Whiteboard Synchronization
    UserA->>SocketServer: emit('whiteboard:draw', { strokeData, bookingId })
    SocketServer->>Redis: Persist stroke to cached room state
    SocketServer->>UserB: emit('whiteboard:update', { strokeData })
```

### Key Phases:

1. **Pre-Join Authorization**: Validates user identity and verifies whether the caller is an active participant in the scheduled booking.
2. **Room Clustering**: Socket.IO uses the Redis Sharded Adapter (`@socket.io/redis-adapter`) to scale rooms horizontally across multiple node instances.
3. **Signaling Exchange**: SDP Offers, Answers, and ICE candidates are relayed directly between peers without media traversing the application server.
4. **Whiteboard Caching**: Vector stroke data is streamed to room peers and cached in Redis so late-joiners or reconnected users instantly receive the latest canvas state.

---

## 3. Asynchronous Event-Driven & BullMQ Worker Architecture

Domain events decouple synchronous request handling from background tasks such as email delivery, push alerts, and ledger calculations.

```mermaid
flowchart LR
    subgraph Presentation["Presentation Layer"]
        Req["HTTP Controller Action"]
    end

    subgraph Application["Application Layer"]
        UseCase["Execute Use Case"]
        EventBus["In-Memory Event Bus"]
        Handlers["Event Handlers<br/>- UserRegisteredHandler<br/>- CheckoutCompletedHandler<br/>- SessionRefundedHandler<br/>- MessageSentHandler"]
    end

    subgraph Queues["Redis Queue System (BullMQ)"]
        NotifQ[("notification-queue")]
        SettlementQ[("booking-settlement-queue")]
    end

    subgraph WorkerProcess["Worker Service (worker.ts)"]
        NotifWorker["NotificationWorkerFactory<br/>- OTP emails<br/>- Mentor approvals<br/>- Session reminders<br/>- Web push alerts"]
        BookingWorker["BookingWorkerFactory<br/>- Session settlement<br/>- Mentor payouts<br/>- Mentee refunds<br/>- No-show resolution"]
    end

    subgraph Sinks["External Providers"]
        Email["SMTP / Nodemailer"]
        Push["Web Push (VAPID)"]
        Storage["AWS S3 Receipts"]
    end

    Req --> UseCase
    UseCase -->|Emit DomainEvent| EventBus
    EventBus --> Handlers
    Handlers -->|Enqueue Notification Job| NotifQ
    Handlers -->|Enqueue Settlement Job| SettlementQ

    NotifQ --> NotifWorker
    SettlementQ --> BookingWorker

    NotifWorker --> Email
    NotifWorker --> Push
    BookingWorker --> Storage
```

### Benefits:

- **Zero Request Latency Overhead**: HTTP responses return immediately without waiting for SMTP or PDFKit operations.
- **Reliability & Retries**: Failed email deliveries or payment jobs automatically retry with exponential backoff via BullMQ.
- **Process Isolation**: The background worker process (`pnpm run start:worker`) runs independently from the HTTP API server (`pnpm run start`).
