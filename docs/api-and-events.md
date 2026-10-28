# API & WebSocket Reference

This document provides a reference for all HTTP REST API endpoints and real-time WebSocket events.

---

## REST API Overview

All v1 endpoints are prefixed with `/api/v1` (with the exception of webhooks and health probes).

### Base Response Format

Standard success response:
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... }
}
```

Standard error response:
```json
{
  "success": false,
  "message": "Descriptive error message",
  "errors": [ ... ]
}
```

---

## Endpoint Catalog

### 1. Health & Status

| Method | Endpoint  | Description                  | Auth Required |
| ------ | --------- | ---------------------------- | ------------- |
| `GET`  | `/health` | Liveness and readiness check | No            |

### 2. Authentication (`/api/v1/auth`)

| Method | Endpoint                      | Description                                 | Auth Required |
| ------ | ----------------------------- | ------------------------------------------- | ------------- |
| `POST` | `/api/v1/auth/register`       | Register a new user account                 | No            |
| `POST` | `/api/v1/auth/login`          | Authenticate with email and password        | No            |
| `POST` | `/api/v1/auth/logout`         | Revoke tokens and end session               | Yes           |
| `POST` | `/api/v1/auth/refresh-token`  | Exchange refresh token for new access token | No (Cookie)   |
| `POST` | `/api/v1/auth/otp/send`       | Request email verification OTP              | No            |
| `POST` | `/api/v1/auth/otp/verify`     | Verify OTP code                             | No            |
| `POST` | `/api/v1/auth/password/reset` | Complete password reset using token         | No            |
| `POST` | `/api/v1/auth/google`         | Authenticate via Google OAuth 2.0           | No            |
| `POST` | `/api/v1/auth/linkedin`       | Authenticate via LinkedIn OAuth 2.0         | No            |

### 3. Mentors & Discovery (`/api/v1/mentors`, `/api/v1/mentor-lists`)

| Method | Endpoint                    | Description                                           | Auth Required |
| ------ | --------------------------- | ----------------------------------------------------- | ------------- |
| `GET`  | `/api/v1/mentors`           | Search and filter mentors (pagination, skills, price) | No            |
| `GET`  | `/api/v1/mentors/:id`       | Fetch public mentor profile details                   | No            |
| `POST` | `/api/v1/mentors/apply`     | Submit mentor verification application                | Yes           |
| `GET`  | `/api/v1/mentor-lists`      | Retrieve saved mentors and custom lists               | Yes           |
| `POST` | `/api/v1/mentor-lists/save` | Bookmark a mentor to saved list                       | Yes           |

### 4. Availability & Scheduling (`/api/v1/availabilities`)

| Method   | Endpoint                                  | Description                                    | Auth Required |
| -------- | ----------------------------------------- | ---------------------------------------------- | ------------- |
| `GET`    | `/api/v1/availabilities/mentor/:mentorId` | Fetch available slots for a given mentor       | No            |
| `POST`   | `/api/v1/availabilities`                  | Create/update mentor weekly recurring schedule | Mentor        |
| `POST`   | `/api/v1/availabilities/custom`           | Add custom single-day date slot                | Mentor        |
| `DELETE` | `/api/v1/availabilities/:id`              | Remove an availability slot                    | Mentor        |

### 5. Bookings & Sessions (`/api/v1/bookings`)

| Method | Endpoint                          | Description                                        | Auth Required |
| ------ | --------------------------------- | -------------------------------------------------- | ------------- |
| `POST` | `/api/v1/bookings`                | Create pending booking reservation                 | Mentee        |
| `GET`  | `/api/v1/bookings`                | List user's active/past bookings                   | Yes           |
| `GET`  | `/api/v1/bookings/:id`            | Get single booking details and session credentials | Yes           |
| `POST` | `/api/v1/bookings/:id/cancel`     | Cancel booking under policy terms                  | Yes           |
| `POST` | `/api/v1/bookings/:id/reschedule` | Request session rescheduling                       | Yes           |
| `GET`  | `/api/v1/bookings/:id/receipt`    | Download PDF receipt for session                   | Yes           |

### 6. Payments & Wallet (`/api/v1/payments`, `/api/v1/wallet`)

| Method | Endpoint                                   | Description                             | Auth Required    |
| ------ | ------------------------------------------ | --------------------------------------- | ---------------- |
| `POST` | `/api/v1/payments/create-checkout-session` | Initialize Stripe checkout session      | Yes              |
| `POST` | `/api/webhooks/stripe`                     | Raw Stripe webhook endpoint             | Stripe Signature |
| `GET`  | `/api/v1/wallet`                           | Fetch wallet balance and platform coins | Yes              |
| `GET`  | `/api/v1/wallet/transactions`              | List transaction ledger history         | Yes              |
| `POST` | `/api/v1/wallet/withdraw`                  | Request balance withdrawal to bank      | Yes              |

### 7. Articles & Social Feed (`/api/v1/articles`)

| Method | Endpoint                        | Description                                 | Auth Required |
| ------ | ------------------------------- | ------------------------------------------- | ------------- |
| `GET`  | `/api/v1/articles`              | Get paginated article feed (cached via LRU) | No            |
| `GET`  | `/api/v1/articles/:slug`        | Get article detail by slug                  | No            |
| `POST` | `/api/v1/articles`              | Create a new article                        | Yes           |
| `PUT`  | `/api/v1/articles/:id`          | Update article draft or published content   | Yes           |
| `POST` | `/api/v1/articles/:id/reaction` | Toggle like/reaction on an article          | Yes           |
| `POST` | `/api/v1/articles/:id/comments` | Post comment or reply to article            | Yes           |

### 8. Storage & Media (`/api/v1/storage`)

| Method | Endpoint                        | Description                                    | Auth Required |
| ------ | ------------------------------- | ---------------------------------------------- | ------------- |
| `POST` | `/api/v1/storage/presigned-url` | Generate S3 presigned PUT URL for media upload | Yes           |

### 9. Administration (`/api/v1/admins`, `/api/v1/admin/dashboard`, `/api/v1/users`, `/api/v1/reports`)

| Method  | Endpoint                        | Description                                  | Auth Required |
| ------- | ------------------------------- | -------------------------------------------- | ------------- |
| `GET`   | `/api/v1/admin/dashboard/stats` | Platform metrics, revenue, active sessions   | Admin         |
| `GET`   | `/api/v1/users`                 | List platform users with filtering           | Admin         |
| `PATCH` | `/api/v1/users/:id/status`      | Suspend or reactivate user account           | Admin         |
| `GET`   | `/api/v1/reports`               | List flagged user/content moderation reports | Admin         |
| `PATCH` | `/api/v1/reports/:id/resolve`   | Mark report as resolved or dismissed         | Admin         |

---

## WebSocket Events (Socket.IO)

Clients connect to the WebSocket server using JWT bearer authentication in the connection handshake headers or query.

### Connection & Authentication

```typescript
const socket = io("http://localhost:8000", {
	auth: {
		token: "Bearer <ACCESS_TOKEN>",
	},
});
```

### Event Matrix

| Event Name                    | Direction            | Payload Schema                                                | Description                                               |
| ----------------------------- | -------------------- | ------------------------------------------------------------- | --------------------------------------------------------- |
| `call:pre-join-check`         | Client &rarr; Server | `{ bookingId: string }`                                       | Verifies whether the client is eligible to join the room. |
| `call:pre-join-check:success` | Server &rarr; Client | `{ bookingId: string }`                                       | Emitted when validation succeeds.                         |
| `call:join`                   | Client &rarr; Server | `{ bookingId: string }`                                       | Joins the designated call room `call_<bookingId>`.        |
| `call:user-joined`            | Server &rarr; Room   | `{ userId: string }`                                          | Broadcast to peers when a user joins the call.            |
| `call:user-left`              | Server &rarr; Room   | `{ userId: string }`                                          | Broadcast to peers when a participant disconnects.        |
| `call:signal:offer`           | Client &rarr; Peer   | `{ offer: RTCSessionDescriptionInit, targetUserId: string }`  | Transmits SDP offer to target peer.                       |
| `call:signal:answer`          | Client &rarr; Peer   | `{ answer: RTCSessionDescriptionInit, targetUserId: string }` | Transmits SDP answer back to caller.                      |
| `call:signal:ice-candidate`   | Client &rarr; Peer   | `{ candidate: RTCIceCandidateInit, targetUserId: string }`    | Exchanged ICE connection candidate.                       |
| `call:media-toggle`           | Client &rarr; Peer   | `{ audio: boolean, video: boolean }`                          | Synchronizes mute/camera toggle states.                   |
| `whiteboard:sync`             | Client &rarr; Peer   | `{ strokeData: object, bookingId: string }`                   | Broadcasts drawing stroke updates.                        |
| `whiteboard:permission`       | Client &rarr; Server | `{ targetUserId: string, canDraw: boolean }`                  | Mentor grants or restricts whiteboard drawing.            |
| `call:chat-message`           | Client &rarr; Room   | `{ message: string, timestamp: string }`                      | Sends in-call chat message to room participants.          |
| `call:terminate`              | Client &rarr; Server | `{ bookingId: string, reason?: string }`                      | Terminates call and triggers post-call settlement flow.   |
