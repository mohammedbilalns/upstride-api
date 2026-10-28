# Domain Data Model

Upstride utilizes a hybrid persistence architecture: **MongoDB** acts as the primary document database for core entities, while **Redis** serves as an ultra-fast store for ephemeral data (OTP codes, token revocation blacklists, rate limits, and live whiteboard state).

---

## Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    USER ||--o{ MENTOR : "applies/becomes"
    USER ||--o{ BOOKING : "books (mentee)"
    MENTOR ||--o{ BOOKING : "hosts (mentor)"
    MENTOR ||--o{ AVAILABILITY : "configures"
    BOOKING ||--o| SESSION : "spawns"
    BOOKING ||--o| PAYMENT_TRANSACTION : "funded_by"
    USER ||--o| WALLET : "owns"
    WALLET ||--o{ COIN_TRANSACTION : "contains"
    USER ||--o{ ARTICLE : "authors"
    ARTICLE ||--o{ ARTICLE_COMMENT : "has"
    ARTICLE ||--o{ ARTICLE_REACTION : "receives"
    USER ||--o{ REVIEW : "writes"
    MENTOR ||--o{ REVIEW : "receives"
    USER ||--o{ REPORT : "files"
    USER ||--o{ PUSH_SUBSCRIPTION : "registers"

    USER {
        string id PK
        string email
        string passwordHash
        string fullName
        string role "user | mentor | admin | superadmin"
        string status "active | suspended | pending"
        boolean isEmailVerified
    }

    MENTOR {
        string id PK
        string userId FK
        string bio
        string headline
        string[] skillIds
        string[] professionIds
        string status "draft | pending | approved | rejected"
        number hourlyRate
        number ratingAverage
        number totalReviews
    }

    AVAILABILITY {
        string id PK
        string mentorId FK
        string dayOfWeek
        string startTime
        string endTime
        boolean isRecurring
        date specificDate
    }

    BOOKING {
        string id PK
        string menteeId FK
        string mentorId FK
        string slotId
        datetime sessionStartTime
        datetime sessionEndTime
        number amountPaid
        string status "pending | confirmed | completed | cancelled | settled"
    }

    SESSION {
        string id PK
        string bookingId FK
        datetime actualStartTime
        datetime actualEndTime
        boolean mentorJoined
        boolean menteeJoined
        string terminationReason
    }

    WALLET {
        string id PK
        string userId FK
        number balance
        number coinBalance
        string currency
    }

    ARTICLE {
        string id PK
        string authorId FK
        string title
        string slug
        string content
        string coverImageUrl
        string status "draft | published | blocked"
        number viewCount
    }

    ARTICLE_COMMENT {
        string id PK
        string articleId FK
        string authorId FK
        string parentCommentId FK
        string content
    }

    REVIEW {
        string id PK
        string bookingId FK
        string menteeId FK
        string mentorId FK
        number rating
        string feedback
    }

    REPORT {
        string id PK
        string reporterId FK
        string targetType "article | comment | user"
        string targetId
        string reason
        string status "pending | reviewed | dismissed | resolved"
    }
```

---

## Core Domain Entities

| Entity                 | Description                                                                                 | Key Attributes                                                                                                |
| ---------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| **User**               | Core identity entity representing platform members (mentees, mentors, admins, superadmins). | `id`, `email`, `fullName`, `role`, `status`, `avatarUrl`, `isEmailVerified`                                   |
| **Mentor**             | Extended profile for vetted mentors containing professional details and ratings.            | `userId`, `headline`, `bio`, `skills`, `professions`, `hourlyRate`, `ratingAverage`, `totalReviews`, `status` |
| **Availability**       | Defines available time blocks for mentorship bookings (recurring weekly or specific dates). | `mentorId`, `dayOfWeek`, `startTime`, `endTime`, `isRecurring`, `specificDate`                                |
| **Booking**            | Represents an agreement between a mentee and mentor for a scheduled session.                | `menteeId`, `mentorId`, `slotId`, `sessionStartTime`, `sessionEndTime`, `amountPaid`, `status`                |
| **Session**            | Live video session telemetry tracking actual attendance and call metrics.                   | `bookingId`, `actualStartTime`, `actualEndTime`, `mentorJoined`, `menteeJoined`, `terminationReason`          |
| **Wallet**             | Financial ledger entity tracking available cash balance and platform coins.                 | `userId`, `balance`, `coinBalance`, `currency`                                                                |
| **PaymentTransaction** | Immutable audit record for payments, payouts, and refunds.                                  | `walletId`, `stripeSessionId`, `amount`, `type`, `status`                                                     |
| **Article**            | User-generated content feed item with rich markdown support.                                | `authorId`, `title`, `slug`, `content`, `coverImageUrl`, `status`, `tags`, `viewCount`                        |
| **Review**             | Post-session rating and qualitative feedback left by mentees for mentors.                   | `bookingId`, `menteeId`, `mentorId`, `rating`, `feedback`                                                     |
| **Report**             | Moderation entity flagged by users for abusive content or bad actors.                       | `reporterId`, `targetType`, `targetId`, `reason`, `status`, `resolutionNotes`                                 |

---

## Ephemeral Storage (Redis)

| Key Pattern                | Purpose                                                                | Expiration / TTL          |
| -------------------------- | ---------------------------------------------------------------------- | ------------------------- |
| `otp:{purpose}:{email}`    | Transient verification codes for registration and password changes     | 5 minutes                 |
| `revoked_token:{jti}`      | Blacklisted JWT access/refresh token IDs upon logout or password reset | Remaining token lifetime  |
| `whiteboard:{bookingId}`   | Real-time vector drawing state for active video sessions               | Session duration + buffer |
| `rate_limit:{ip}:{window}` | Sliding window request counts for DDoS and brute-force mitigation      | 60 seconds                |
