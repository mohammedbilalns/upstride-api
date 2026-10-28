# Configuration & Environment Variables

This document lists all environment variables required by the backend, validated via **Zod** at startup in `src/shared/config/env.ts`.

---

## Environment Variables Reference

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

| Variable                 | Description                                             | Example / Default                         |
| ------------------------ | ------------------------------------------------------- | ----------------------------------------- |
| `PORT`                   | HTTP port on which the Express server listens           | `8000`                                    |
| `NODE_ENV`               | Environment mode (`development`, `production`, `test`)  | `development`                             |
| `APP_URL`                | Base public URL of the backend API                      | `http://localhost:8000`                   |
| `CLIENT_URL`             | Frontend origin URL for CORS                            | `http://localhost:3000`                   |
| `MONGODB_URI`            | MongoDB connection string                               | `mongodb://localhost:27017/upstride`      |
| `REDIS_URI`              | Redis connection URL                                    | `redis://localhost:6379`                  |
| `LOG_LEVEL`              | Pino logging level (`debug`, `info`, `warn`, `error`)   | `info`                                    |
| `LOKI_HOST`              | Grafana Loki endpoint for structured log ingestion      | `http://localhost:3100`                   |
| `LOKI_USER`              | Loki basic auth username                                |                                           |
| `LOKI_PASSWORD`          | Loki basic auth password                                |                                           |
| `JWT_ACCESS_SECRET`      | Secret key for signing Access Tokens                    |                                           |
| `JWT_REFRESH_SECRET`     | Secret key for signing Refresh Tokens                   |                                           |
| `JWT_RESET_SECRET`       | Secret key for signing password reset tokens            |                                           |
| `JWT_SETUP_SECRET`       | Secret key for signing onboarding setup tokens          |                                           |
| `CSRF_SECRET`            | Secret key for Double Submit Cookie CSRF protection     |                                           |
| `DUMMY_LOGIN_EMAIL`      | Pre-configured email for demo/guest login bypassing OTP | `dummy@example.com`                       |
| `SMTP_HOST`              | Outgoing SMTP host                                      | `smtp.mailtrap.io`                        |
| `SMTP_PORT`              | SMTP port                                               | `25`                                      |
| `SMTP_USER`              | SMTP username                                           |                                           |
| `SMTP_PASS`              | SMTP password                                           |                                           |
| `AWS_BUCKET_NAME`        | S3 bucket name for uploads & PDF receipts               | `upstride-assets`                         |
| `AWS_ACCESS_KEY_ID`      | AWS IAM access key ID                                   |                                           |
| `AWS_SECRET_ACCESS_KEY`  | AWS IAM secret access key                               |                                           |
| `AWS_REGION`             | AWS S3 region                                           | `us-east-1`                               |
| `GOOGLE_CLIENT_ID`       | Google OAuth 2.0 Client ID                              |                                           |
| `GOOGLE_CLIENT_SECRET`   | Google OAuth 2.0 Client Secret                          |                                           |
| `LINKEDIN_CLIENT_ID`     | LinkedIn OAuth 2.0 Client ID                            |                                           |
| `LINKEDIN_CLIENT_SECRET` | LinkedIn OAuth 2.0 Client Secret                        |                                           |
| `STRIPE_SECRET_KEY`      | Stripe secret API key (`sk_test_...`)                   |                                           |
| `STRIPE_WEBHOOK_SECRET`  | Stripe webhook signing secret (`whsec_...`)             |                                           |
| `STRIPE_SUCCESS_URL`     | Frontend URL redirected after checkout completion       | `http://localhost:3000/booking/success`   |
| `STRIPE_CANCEL_URL`      | Frontend URL redirected when checkout is cancelled      | `http://localhost:3000/booking/cancelled` |
| `VAPID_PUBLIC_KEY`       | VAPID public key for Web Push notifications             |                                           |
| `VAPID_PRIVATE_KEY`      | VAPID private key for Web Push notifications            |                                           |
