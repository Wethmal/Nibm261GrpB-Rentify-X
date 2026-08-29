# Rentify — Full Project Documentation

> **Author:** Wethmal
> **Scope:** Architecture, setup, data model, REST API, business rules, front-end, security, testing, operations and troubleshooting.
> **Audience:** New developers, reviewers and markers who need to understand the whole system without reading every file.

This document complements the top-level `README.md` (quick start) and `docs/HISTORY_RECONSTRUCTION.md`
(how the git history was produced). The test write-ups live in `docs/testing/`.

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Goals and Non-Goals](#2-goals-and-non-goals)
3. [System Architecture](#3-system-architecture)
4. [Technology Stack](#4-technology-stack)
5. [Repository Layout](#5-repository-layout)
6. [Local Development Setup](#6-local-development-setup)
7. [Configuration Reference](#7-configuration-reference)
8. [Domain Model and Enumerations](#8-domain-model-and-enumerations)
9. [Database Schema](#9-database-schema)
10. [Authentication and Authorization](#10-authentication-and-authorization)
11. [REST API Reference](#11-rest-api-reference)
12. [Business Rules](#12-business-rules)
13. [Real-Time Delivery](#13-real-time-delivery)
14. [Front-End Documentation](#14-front-end-documentation)
15. [Security Considerations](#15-security-considerations)
16. [Testing Strategy](#16-testing-strategy)
17. [Coding Conventions](#17-coding-conventions)
18. [Git Workflow and Jira Traceability](#18-git-workflow-and-jira-traceability)
19. [Deployment Notes](#19-deployment-notes)
20. [Troubleshooting](#20-troubleshooting)
21. [Known Limitations and Roadmap](#21-known-limitations-and-roadmap)
22. [Glossary](#22-glossary)
23. [Frequently Asked Questions](#23-frequently-asked-questions)
24. [Appendix](#24-appendix)

---

## 1. Introduction

**Rentify** is a rental and services marketplace for Sri Lanka. It joins two markets that are normally
separate:

- **Services** — freelancers such as photographers, electricians and tutors.
- **Equipment** — physical assets such as cameras, drones and power tools.

A consumer can book a service, rent equipment, or **bundle** both in one transaction (for example a sound
technician together with a PA system). Money is held in **escrow** and only released to the provider when the
job is complete.

### 1.1 Who uses the system

| Role       | What they do                                                                          |
| ---------- | ------------------------------------------------------------------------------------- |
| Consumer   | Searches, books, pays, messages providers, cancels, reviews, reports abusive users.   |
| Provider   | Publishes listings, manages availability, accepts bookings, tracks earnings/payouts.  |
| Admin      | Approves providers and listings, verifies NIC documents, moderates reports and users. |

### 1.2 Key differentiators

1. **Bundle bookings** — one checkout for a person plus their gear.
2. **Identity verification** — mobile OTP plus NIC document review by an admin.
3. **Geo-aware discovery** — nearby search using the visitor's coordinates.
4. **Moderated trust** — reviews, reports, suspensions and bans all pass through admin tooling with an audit trail.

---

## 2. Goals and Non-Goals

### 2.1 Goals

- A working, demonstrable marketplace covering the full booking life cycle.
- Clear separation between the React client and the Express API.
- Enforced business rules on the server, never only in the UI.
- Every admin decision recorded in an audit log.
- Idempotent database migrations that are safe to re-run.

### 2.2 Non-Goals (current release)

- A live payment gateway. The payment service is a facade; refunds and escrow bookkeeping are real, the
  gateway calls are stubs (see [Known Limitations](#21-known-limitations-and-roadmap)).
- Native mobile apps.
- Multi-currency. All amounts are in LKR.
- Horizontal scaling of the real-time hub (it is in-memory, single instance).

---

## 3. System Architecture

```
┌──────────────────────┐        HTTPS / JSON         ┌───────────────────────────┐
│  React 18 SPA (Vite) │ ──────────────────────────▶ │  Express 4 REST API       │
│  React Router v6     │ ◀────────────────────────── │  /api/v1/*                │
│  Axios + Context API │      SSE (text/event-stream)│  JWT auth, role guards    │
└──────────────────────┘                             └────────────┬──────────────┘
                                                                  │ node-postgres
                                                     ┌────────────▼──────────────┐
                                                     │  PostgreSQL 14+           │
                                                     │  pg_trgm, JSONB, ENUMs    │
                                                     └───────────────────────────┘
                                                                  │
                                                     ┌────────────▼──────────────┐
                                                     │  Cloudinary (image files) │
                                                     └───────────────────────────┘
```

### 3.1 Request life cycle

1. The browser calls the API through the shared Axios instance (`client/src/api/axiosInstance.js`), which
   attaches the access token and refreshes it on `401`.
2. Express applies global middleware: `helmet`, CORS, JSON body parser.
3. The router matches a path under `/api/v1/...`.
4. Route-level middleware runs in order: `authenticate` → `authorize(role)` → validation → controller.
5. The controller reads/writes PostgreSQL through models or a direct `query()` call.
6. Errors are passed to `next(err)` and rendered by `error.middleware.js`.

### 3.2 Layers on the server

| Layer       | Folder         | Responsibility                                                            |
| ----------- | -------------- | ------------------------------------------------------------------------- |
| Routes      | `routes/`      | Map HTTP verbs and paths to middleware chains and controllers.            |
| Controllers | `controllers/` | Parse input, enforce ownership rules, shape responses.                    |
| Services    | `services/`    | Reusable business logic (payouts, restrictions, OTP, availability, SSE).  |
| Models      | `models/`      | Thin SQL wrappers per table.                                              |
| Middleware  | `middleware/`  | Authentication, roles, uploads, validation, error handling.               |
| Config      | `config/`      | DB pool, enumerations, cancellation policy presets.                       |

### 3.3 Design principles

- **Thin controllers, testable services.** Logic that needs unit tests (refund maths, payout split,
  restriction checks) lives in `services/` or `config/` as pure or easily mocked functions.
- **Fail closed for security, fail open for availability.** Missing role → `403`. But if the restriction lookup
  itself errors, the user is not locked out (`checkRestriction` returns `restricted: false`).
- **Idempotency.** Payout creation uses `ON CONFLICT (booking_id) DO NOTHING`; migration 18 is re-runnable.
- **Notifications never block the response.** Notification writes are fired after the HTTP response is sent
  and their errors are only logged.

---

## 4. Technology Stack

| Layer          | Technology                                                                 |
| -------------- | -------------------------------------------------------------------------- |
| Front-end      | React 18.3, Vite 5, React Router v6, Axios, Context API                    |
| Back-end       | Node.js ≥ 18, Express 4, `pg`, `jsonwebtoken`, `bcryptjs`, `express-validator`, `helmet`, `cors`, `multer` |
| Database       | PostgreSQL 14+ with `pg_trgm` for fuzzy search                             |
| Files          | Cloudinary (`multer-storage-cloudinary`) plus local `/uploads` static dir  |
| Images         | `sharp` for server-side image processing                                   |
| Server tests   | Jest 29, Supertest                                                         |
| Client tests   | Vitest 1.6, Testing Library                                                |
| Tooling        | `concurrently`, `nodemon`, `cross-env`                                     |

---

## 5. Repository Layout

```
Rentify-X/
├── package.json                 Root scripts (dev, test) using concurrently
├── README.md                    Quick start
├── docs/
│   ├── HISTORY_RECONSTRUCTION.md
│   ├── PROJECT_DOCUMENTATION.md This file
│   └── testing/                 One short note per unit-test file
├── client/
│   ├── index.html
│   ├── vite.config.js
│   ├── __tests__/               App-level tests
│   └── src/
│       ├── App.jsx              Route table
│       ├── main.jsx             Entry point
│       ├── api/                 axiosInstance.js
│       ├── context/             AuthContext, RealtimeContext
│       ├── hooks/               useAuth
│       ├── utils/               formatters, geo, imageHelper, validators
│       ├── components/          bookings, common, layout, listings, provider, reports, reviews
│       └── pages/               admin, auth, consumer, errors, provider, shared
└── server/
    ├── server.js                App bootstrap and route mounting
    ├── config/                  db.js, constants.js, cancellationPolicies.js
    ├── controllers/             13 controllers
    ├── db/
    │   ├── migrate.js           Applies migration 18
    │   ├── migrations/          SQL files 01–18
    │   └── seeds/seed.sql       Initial categories
    ├── middleware/              auth, role, optionalAuth, upload, validate, error
    ├── models/                  10 table models
    ├── routes/                  12 route modules
    ├── services/                audit, auth, availability, notification, otp, payment, payout, realtime, restriction, trust, upload
    └── __tests__/               Jest suites
```

---

## 6. Local Development Setup

### 6.1 Prerequisites

| Tool        | Version | Check command        |
| ----------- | ------- | -------------------- |
| Node.js     | ≥ 18    | `node --version`     |
| npm         | ≥ 9     | `npm --version`      |
| PostgreSQL  | ≥ 14    | `psql --version`     |
| Git         | any     | `git --version`      |

### 6.2 Install dependencies

```bash
npm install                 # root (concurrently)
cd server && npm install    # API
cd ../client && npm install # SPA
```

### 6.3 Create the environment file

Create `server/.env` (never commit it):

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

DB_HOST=localhost
DB_PORT=5432
DB_NAME=rentify_db
DB_USER=postgres
DB_PASSWORD=change_me

JWT_SECRET=use-a-long-random-string
JWT_EXPIRES_IN=7d

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

### 6.4 Create the database

```bash
psql -U postgres -c "CREATE DATABASE rentify_db;"
```

Apply the migrations in order. `003b_alter_listings_equipment.sql` creates the `condition_enum` type that
`03_listings.sql` needs, so it runs **before** `03` and again afterwards:

```
01_users → 02_categories → 003b_alter_listings_equipment → 03_listings → 003b_alter_listings_equipment
→ 04_listing_availability → 05_bookings → 06_payments → 07_reviews → 08_messages → 09_notifications
→ 10 … 17 → 18_gap_features
```

Migration 18 can also be applied with:

```bash
cd server
npm run migrate
```

`npm run migrate` prints the target database host before running, so check `server/.env` first.

Optional seed data (categories):

```bash
psql -U postgres -d rentify_db -f server/db/seeds/seed.sql
```

### 6.5 Run the application

```bash
npm run dev
```

| Service | URL                                   |
| ------- | ------------------------------------- |
| Client  | http://localhost:5173                 |
| Server  | http://localhost:5000                 |
| Health  | http://localhost:5000/api/v1/health   |

### 6.6 Available scripts

| Location | Script                | Purpose                                     |
| -------- | --------------------- | ------------------------------------------- |
| root     | `npm run dev`         | Start API and client together               |
| root     | `npm test`            | Run server and client tests concurrently    |
| root     | `npm run test:server` | Jest only                                   |
| root     | `npm run test:client` | Vitest only                                 |
| server   | `npm start`           | Run the API with Node                       |
| server   | `npm run dev`         | Run the API with nodemon                    |
| server   | `npm run migrate`     | Apply migration 18                          |
| server   | `npm run db:export`   | Runs `db/export_db.js` (script file is not present in this checkout) |
| client   | `npm run dev`         | Vite dev server                             |
| client   | `npm test`            | `vitest run`                                |

---

## 7. Configuration Reference

All variables are read on the server. Values shown are examples.

| Variable                | Required | Default                 | Description                                              |
| ----------------------- | -------- | ----------------------- | -------------------------------------------------------- |
| `PORT`                  | no       | `5000`                  | HTTP port.                                               |
| `NODE_ENV`              | no       | `development`           | In production, localhost CORS origins are not auto-allowed. |
| `CLIENT_URL`            | no       | `http://localhost:5173` | Comma-separated list of allowed browser origins.         |
| `DB_HOST`               | yes      | —                       | PostgreSQL host.                                         |
| `DB_PORT`               | yes      | `5432`                  | PostgreSQL port.                                         |
| `DB_NAME`               | yes      | —                       | Database name.                                           |
| `DB_USER`               | yes      | —                       | Database user.                                           |
| `DB_PASSWORD`           | yes      | —                       | Database password.                                       |
| `DB_SSL`                | no       | off                     | Enable TLS for hosted databases.                         |
| `JWT_SECRET`            | yes      | —                       | Signing key for access tokens.                           |
| `JWT_EXPIRES_IN`        | no       | `7d`                    | Access token lifetime (any `jsonwebtoken` string).       |
| `CLOUDINARY_CLOUD_NAME` | no       | —                       | Enables cloud image uploads.                             |
| `CLOUDINARY_API_KEY`    | no       | —                       | Cloudinary key.                                          |
| `CLOUDINARY_API_SECRET` | no       | —                       | Cloudinary secret.                                       |
| `UPLOAD_MAX_SIZE_MB`    | no       | —                       | Maximum size of an uploaded file.                        |

### 7.1 CORS behaviour

- Requests with **no** `Origin` header (curl, mobile apps) are allowed.
- Origins listed in `CLIENT_URL` are allowed.
- Outside production, any `http://localhost:*` or `http://127.0.0.1:*` origin is allowed.
- Everything else is rejected with `Not allowed by CORS`.
- `credentials: true` is set so cookies/authorization headers work.

### 7.2 Body limits

`express.json` accepts up to **10 MB** per request. Uploaded files pass through `multer`, not the JSON parser.

---

## 8. Domain Model and Enumerations

Defined in `server/config/constants.js` and frozen with `Object.freeze` so they cannot be mutated.

### 8.1 User roles

| Constant   | Value      |
| ---------- | ---------- |
| `CONSUMER` | `consumer` |
| `PROVIDER` | `provider` |
| `ADMIN`    | `admin`    |

### 8.2 User statuses

| Value                  | Meaning                                                        |
| ---------------------- | -------------------------------------------------------------- |
| `pending_verification` | Registered but not yet verified.                               |
| `verified`             | Normal, active account.                                        |
| `suspended`            | Temporarily blocked; `suspended_until` says when it lifts.     |
| `banned`               | Permanently blocked.                                           |

### 8.3 Listing types and statuses

| Type        | Description                     |
| ----------- | ------------------------------- |
| `service`   | A freelancer's offering.        |
| `equipment` | A rentable physical asset.      |

| Status             | Description                                          |
| ------------------ | ---------------------------------------------------- |
| `pending_approval` | Waiting for admin approval.                          |
| `active`           | Visible in search.                                   |
| `suspended`        | Hidden by an admin; a reason is stored.              |
| `deleted`          | Soft-deleted.                                        |

### 8.4 Booking types and statuses

| Type        | Description                                         |
| ----------- | --------------------------------------------------- |
| `service`   | Service only.                                       |
| `equipment` | Equipment only.                                     |
| `bundle`    | A service plus one or more pieces of equipment.     |

| Status      | Description                                                   |
| ----------- | ------------------------------------------------------------- |
| `pending`   | Created, waiting for the provider.                            |
| `confirmed` | Accepted by the provider.                                     |
| `rejected`  | Declined by the provider (added to the enum at start-up).     |
| `cancelled` | Cancelled by consumer or provider.                            |
| `completed` | Job finished; a pending payout is created.                    |
| `disputed`  | Under admin review.                                           |

### 8.5 Payment and review statuses

| Payment status | Description                                   |
| -------------- | --------------------------------------------- |
| `pending`      | Awaiting payment.                             |
| `escrowed`     | Held by the platform.                         |
| `released`     | Paid out to the provider.                     |
| `refunded`     | Returned to the consumer.                     |
| `failed`       | Gateway failure.                              |

| Review status        | Description                          |
| -------------------- | ------------------------------------ |
| `pending_moderation` | Submitted, not yet visible.          |
| `approved`           | Publicly visible.                    |
| `rejected`           | Hidden.                              |

### 8.6 State diagrams

Booking:

```
            ┌────────── reject ──────────▶ rejected
pending ────┤
            └─ accept ─▶ confirmed ─ complete ─▶ completed
   │                        │
   └──── cancel ────────────┴──── cancel ─────▶ cancelled
```

User restriction:

```
verified ── suspend(days) ─▶ suspended ── expiry or reinstate ─▶ verified
verified ── ban ───────────▶ banned    ── reinstate ───────────▶ verified
```

Report:

```
pending ─▶ reviewing ─▶ resolved
   └──────────────────▶ dismissed
```

---

## 9. Database Schema

The schema is created by the SQL files in `server/db/migrations/`. This section documents the tables added or changed by the later
migrations in detail and summarises the earlier ones.

### 9.1 Core tables (migrations 01–09)

| Table                  | Purpose                                                        |
| ---------------------- | -------------------------------------------------------------- |
| `users`                | Accounts, roles, profile, NIC verification, status.            |
| `categories`           | Hierarchical service/equipment categories.                     |
| `listings`             | Services and equipment, with geo data and JSONB attributes.    |
| `listing_availability` | Per-date availability flag per listing.                        |
| `bookings`             | Booking transactions including bundle support.                 |
| `payments`             | Escrow tracking and gateway references.                        |
| `reviews`              | Ratings and moderated comments.                                |
| `messages`             | Booking-scoped chat messages.                                  |
| `notifications`        | In-app notification feed.                                      |

### 9.2 Supporting migrations (10–17)

| File                                       | Adds                                                |
| ------------------------------------------ | --------------------------------------------------- |
| `10_add_lockout_and_refresh_tokens.sql`    | Login lockout counters and refresh-token storage.   |
| `11_add_password_reset_tokens.sql`         | Password-reset token table.                         |
| `12_add_2fa_to_users.sql`                  | Two-factor authentication fields.                   |
| `13_add_visibility_settings.sql`           | Profile visibility preferences.                     |
| `14_add_tags_to_listings.sql`              | Tags on listings.                                   |
| `15_add_quantity_and_condition_to_listings.sql` | Equipment quantity and condition.              |
| `16_enable_pg_trgm.sql`                    | `pg_trgm` extension for fuzzy text search.          |
| `17_add_search_indexes.sql`                | Indexes supporting search.                          |

### 9.3 Migration 18 — "gap features"

Idempotent; every statement uses `IF NOT EXISTS` (or a `WHERE NOT EXISTS` guard for seed rows).

#### 9.3.1 `cancellation_policies`

| Column                   | Type          | Notes                                                          |
| ------------------------ | ------------- | -------------------------------------------------------------- |
| `id`                     | UUID PK       | `gen_random_uuid()`                                            |
| `listing_id`             | UUID FK       | `listings(id)`, cascade delete. `NULL` for platform defaults.  |
| `listing_type`           | VARCHAR(20)   | `service` or `equipment`.                                      |
| `policy_type`            | VARCHAR(20)   | `flexible`, `moderate`, `strict`, `non_refundable`.            |
| `full_refund_hours`      | INT           | Hours before start for a 100% refund.                          |
| `partial_refund_hours`   | INT           | Hours before start for a partial refund.                       |
| `partial_refund_percent` | INT           | Percentage refunded in the partial window.                     |
| `created_at`/`updated_at`| TIMESTAMPTZ   | Defaults to now.                                               |

Constraints: either `listing_id` or `listing_type` must be set. A unique index allows one policy per listing,
and another allows one platform default per listing type. Two default rows (`moderate`) are seeded.

#### 9.3.2 `provider_payouts`

| Column         | Type          | Notes                                                    |
| -------------- | ------------- | -------------------------------------------------------- |
| `id`           | UUID PK       |                                                          |
| `provider_id`  | UUID FK       | `users(id)`, cascade delete.                             |
| `booking_id`   | UUID FK       | `bookings(id)`, cascade delete, **unique**.              |
| `gross_amount` | NUMERIC(10,2) | Booking amount before fees.                              |
| `platform_fee` | NUMERIC(10,2) | 10% of gross by default.                                 |
| `net_amount`   | NUMERIC(10,2) | Gross minus fee.                                         |
| `status`       | VARCHAR(20)   | `pending`, `processing`, `paid`, `failed`.               |
| `paid_at`      | TIMESTAMPTZ   | Set when paid.                                           |

Indexes: `(provider_id, status)` and `created_at`.

#### 9.3.3 `user_reports`

| Column             | Type         | Notes                                                                  |
| ------------------ | ------------ | ---------------------------------------------------------------------- |
| `id`               | UUID PK      |                                                                        |
| `reporter_id`      | UUID FK      | Who filed the report.                                                  |
| `reported_user_id` | UUID FK      | Who is being reported.                                                 |
| `booking_id`       | UUID FK      | Optional context; set to `NULL` if the booking is deleted.             |
| `reason`           | VARCHAR(40)  | `abusive_behavior`, `fraud`, `fake_profile`, `no_show`, `harassment`, `other`. |
| `description`      | TEXT         | Free text, at least 20 characters (enforced by the API).               |
| `status`           | VARCHAR(20)  | `pending`, `reviewing`, `resolved`, `dismissed`.                       |
| `admin_id`         | UUID FK      | Admin who handled it.                                                  |
| `resolution_note`  | TEXT         | Admin explanation.                                                     |
| `resolved_at`      | TIMESTAMPTZ  |                                                                        |

A `CHECK` forbids reporting yourself, and a partial unique index allows only **one open report** per
reporter/target pair.

#### 9.3.4 `admin_audit_logs`

| Column        | Type         | Notes                                      |
| ------------- | ------------ | ------------------------------------------ |
| `id`          | UUID PK      |                                            |
| `admin_id`    | UUID FK      | Nullable (set null if the admin is removed). |
| `action`      | VARCHAR(60)  | e.g. a ban, suspend or report resolution.  |
| `target_type` | VARCHAR(30)  | e.g. user, report, listing.                |
| `target_id`   | UUID         | The affected record.                       |
| `details`     | JSONB        | Free-form metadata.                        |
| `created_at`  | TIMESTAMPTZ  |                                            |

#### 9.3.5 `booking_equipment`

Links a bundle booking to several pieces of equipment.

| Column       | Type          | Notes                                       |
| ------------ | ------------- | ------------------------------------------- |
| `booking_id` | UUID FK       | Cascade delete.                             |
| `listing_id` | UUID FK       | `ON DELETE RESTRICT`.                       |
| `price`      | NUMERIC(10,2) | Price of that item.                         |

Unique on `(booking_id, listing_id)`.

#### 9.3.6 Columns added to existing tables

| Table      | Columns                                                                                      |
| ---------- | -------------------------------------------------------------------------------------------- |
| `bookings` | `cancelled_by`, `cancelled_at`, `cancellation_reason`, `refund_amount`, `refund_percent`, `payout_status` |
| `payments` | `refund_amount`, `refund_reason`, `refunded_at`                                              |
| `users`    | `status_reason`, `suspended_until`, `banned_at`, `nic_review_note`, `nic_reviewed_at`        |
| `listings` | `suspension_reason` (with `is_suspended`)                                                    |
| `messages` | `delivered_at`, `read_at`                                                                    |

### 9.4 Entity relationships

```
users 1───* listings
users 1───* bookings (as consumer)
users 1───* bookings (as provider)
listings 1───* bookings
bookings 1───* payments
bookings 1───1 provider_payouts
bookings 1───* messages
bookings *───* listings  (via booking_equipment, for bundles)
users 1───* user_reports (as reporter)
users 1───* user_reports (as reported user)
users 1───* admin_audit_logs (as admin)
listings 1───0..1 cancellation_policies
```

### 9.5 Applying and verifying migrations

```bash
psql -U postgres -d rentify_db -c "\dt"
psql -U postgres -d rentify_db -c "\d provider_payouts"
```

At start-up the server checks `to_regclass('public.provider_payouts')` and prints a warning if migration 18
has not been applied. It does **not** crash.

---

## 10. Authentication and Authorization

### 10.1 Token model

- **Access token** — a JWT signed with `JWT_SECRET`, lifetime `JWT_EXPIRES_IN` (default 7 days).
  Payload contains at least `userId` and `role`.
- **Refresh token** — stored in the database; `refresh_token.model.js` can revoke every token for a user.
- Passwords are hashed with **bcrypt, 12 rounds** (`auth.service.js`).

### 10.2 Middleware chain

| Middleware            | File                          | Behaviour                                                                    |
| --------------------- | ----------------------------- | ---------------------------------------------------------------------------- |
| `authenticate`        | `auth.middleware.js`          | Verifies the JWT, loads `req.user`, then checks account restriction.         |
| `optionalAuth`        | `optionalAuth.middleware.js`  | Populates `req.user` if a valid token exists, otherwise continues anonymously.|
| `authorize(...roles)` | `role.middleware.js`          | `401` with no user, `403` if the role is not in the allowed list.            |
| `validate`            | `validate.middleware.js`      | Turns `express-validator` failures into a `400` with `{ field, message }` items. |
| `uploadSingle` etc.   | `upload.middleware.js`        | File uploads via multer.                                                     |
| `errorMiddleware`     | `error.middleware.js`         | Final error renderer.                                                        |

### 10.3 Restriction enforcement (banned / suspended users)

Inside `authenticate`, after the token is verified, `restriction.checkRestriction(userId)` runs:

| Situation                         | Result                                                        |
| --------------------------------- | ------------------------------------------------------------- |
| User not found                    | Not restricted.                                               |
| `status = banned`                 | Restricted; message "Your account has been banned."           |
| `status = suspended`, not expired | Restricted; message "Your account is suspended."              |
| `status = suspended`, expired     | The user is reinstated automatically and let through.         |
| Database error                    | **Fails open** — not restricted, so an outage does not lock everyone out. |

Suspending or banning also **revokes every refresh token**, which forces the user to log out everywhere.

### 10.4 Two-factor authentication

`PUT /auth/2fa/toggle` enables or disables 2FA. When on, login returns a challenge that is completed at
`POST /auth/login/2fa/verify`.

### 10.5 One-time codes (OTP)

`otp.service.js` rules:

| Rule                | Value                                   |
| ------------------- | --------------------------------------- |
| Length              | 6 digits                                |
| Lifetime            | 10 minutes                              |
| Resend cooldown     | 60 seconds                              |
| Maximum attempts    | 3 (then the code is invalidated)        |
| Storage             | bcrypt hash in an in-memory `Map`       |
| Delivery            | SMS stub (logs to the console)          |

The in-memory store is fine for development; production should use Redis.

### 10.6 Role matrix

| Capability                                   | Anonymous | Consumer | Provider | Admin |
| -------------------------------------------- | :-------: | :------: | :------: | :---: |
| Browse/search listings                       | ✔         | ✔        | ✔        | ✔     |
| View public provider profile                 | ✔         | ✔        | ✔        | ✔     |
| Create a booking                             |           | ✔        |          |       |
| Accept/reject/complete a booking             |           |          | ✔        |       |
| Cancel own booking                           |           | ✔        | ✔ (provider flow) |  |
| Create/edit listings                         |           |          | ✔        |       |
| View earnings and payouts                    |           |          | ✔        |       |
| Report another user                          |           | ✔        | ✔        |       |
| Moderate users, listings, reports            |           |          |          | ✔     |

---

## 11. REST API Reference

Base URL: `http://localhost:5000/api/v1`. All bodies are JSON unless noted.
Authentication uses the header `Authorization: Bearer <access token>`.

### 11.1 Conventions

**Success** responses return the resource or a `{ message, ... }` object.

**Errors** use one of these shapes:

```json
{ "error": "Bad Request", "message": "Human readable explanation" }
```

```json
{ "error": "Validation failed", "details": [ { "field": "email", "message": "Invalid email" } ] }
```

| Status | Meaning                                                    |
| ------ | ---------------------------------------------------------- |
| 200    | OK                                                         |
| 201    | Created                                                    |
| 400    | Validation failed or business rule violated                |
| 401    | Not authenticated                                          |
| 403    | Authenticated but not allowed (role, ownership, restriction)|
| 404    | Resource not found                                         |
| 409    | Conflict (for example a duplicate open report)             |
| 429    | Rate limited (for example report daily limit)              |
| 500    | Unexpected server error                                    |

**Pagination** — list endpoints accept `page` (default 1) and `limit`. Limits are clamped: 50 for provider
lists, 100 for admin report lists (default 20 for admin, 10 for provider).

### 11.2 Auth — `/auth`

| Method | Path                | Auth | Description                                   |
| ------ | ------------------- | ---- | --------------------------------------------- |
| POST   | `/register`         | —    | Create an account (validated).                |
| POST   | `/login`            | —    | Log in with email/mobile and password.        |
| POST   | `/login/2fa/verify` | —    | Complete a two-factor login.                  |
| PUT    | `/2fa/toggle`       | yes  | Turn 2FA on or off.                           |
| POST   | `/refresh`          | —    | Exchange a refresh token for a new access token. |
| POST   | `/otp/send`         | —    | Send a one-time code.                         |
| POST   | `/otp/verify`       | —    | Verify a one-time code.                       |
| POST   | `/forgot-password`  | —    | Start the reset flow (emails a secure link).  |
| POST   | `/reset-password`   | —    | Set a new password with the reset token.      |

Example login request:

```json
POST /api/v1/auth/login
{ "identifier": "user@example.lk", "password": "Password123" }
```

### 11.3 Users — `/users`

| Method | Path               | Auth | Description                                       |
| ------ | ------------------ | ---- | ------------------------------------------------- |
| GET    | `/me`              | yes  | The current user's profile.                       |
| GET    | `/:id`             | —    | Public profile of a user.                         |
| PUT    | `/:id`             | yes  | Update a profile (validated; own account).        |
| POST   | `/:id/avatar`      | yes  | Upload an avatar (multipart).                     |
| POST   | `/:id/nic-upload`  | yes  | Upload NIC documents for verification.            |
| GET    | `/:id/bookings`    | yes  | Booking history of a user.                        |
| POST   | `/:id/report`      | yes  | Report a user (see below).                        |

**Report a user**

```json
POST /api/v1/users/{reportedUserId}/report
{
  "reason": "fraud",
  "description": "At least twenty characters explaining what happened.",
  "bookingId": "optional uuid linking both users"
}
```

Validation, in order: cannot report yourself (400) → `reason` must be one of the six allowed values (400) →
description at least 20 characters (400) → target must exist and not be an admin (404) → at most 5 reports per
24 hours (429) → no existing open report against the same user (409) → if `bookingId` is sent it must link
reporter and target (400). Success returns `201` with `{ message, report: { id, status, reason, created_at } }`.
After three pending reports against one user, admins receive an email and an in-app notification.

### 11.4 Listings — `/listings`

| Method | Path                         | Auth       | Description                                        |
| ------ | ---------------------------- | ---------- | -------------------------------------------------- |
| GET    | `/`                          | optional   | List listings.                                     |
| GET    | `/:id`                       | optional   | Listing details.                                   |
| POST   | `/`                          | provider   | Create a listing.                                  |
| POST   | `/:id/photos`                | provider   | Upload photos.                                     |
| PUT    | `/:id`                       | provider   | Update own listing.                                |
| DELETE | `/:id`                       | provider   | Remove own listing.                                |
| GET    | `/:id/availability`          | —          | Availability calendar.                             |
| PUT    | `/:id/availability`          | provider   | Add, update or delete blocked dates.               |
| GET    | `/:id/cancellation-policy`   | —          | Effective cancellation policy.                     |
| PUT    | `/:id/cancellation-policy`   | provider   | Set the policy for your own listing.               |

Setting a policy requires `policy_type` to be one of `flexible`, `moderate`, `strict`, `non_refundable`;
otherwise `400`. Changing someone else's listing returns `403`.

### 11.5 Bookings — `/bookings`

| Method | Path                          | Auth      | Description                                           |
| ------ | ----------------------------- | --------- | ----------------------------------------------------- |
| POST   | `/`                           | consumer  | Create a booking (availability is checked).           |
| GET    | `/`                           | yes       | List the caller's bookings.                           |
| GET    | `/:id`                        | yes       | Booking details.                                      |
| PUT    | `/:id/accept`                 | provider  | Accept a pending booking.                             |
| PUT    | `/:id/reject`                 | provider  | Reject a pending booking.                             |
| PUT    | `/:id/complete`               | provider  | Mark complete; creates a pending payout.              |
| PUT    | `/:id/cancel`                 | yes       | Legacy cancel; routes by role.                        |
| POST   | `/:id/cancel`                 | consumer  | Consumer cancellation with refund.                    |
| POST   | `/:id/cancel-by-provider`     | provider  | Provider cancellation, full refund.                   |
| GET    | `/:id/cancellation-preview`   | consumer  | Show the refund without changing anything.            |

Cancellation response:

```json
{
  "message": "Booking cancelled successfully",
  "booking": { "id": "…", "status": "cancelled" },
  "refundPercent": 50,
  "refundAmount": 500
}
```

Errors: `404` unknown booking, `403` not your booking, `400` when the status is not `pending` or `confirmed`.

### 11.6 Payments — `/payments`

| Method | Path             | Description                                  |
| ------ | ---------------- | -------------------------------------------- |
| POST   | `/initiate`      | Start a payment for a booking.               |
| POST   | `/webhook`       | Gateway callback (signature verified).       |
| POST   | `/:id/release`   | Release escrow to the provider.              |
| POST   | `/:id/refund`    | Refund a payment.                            |
| GET    | `/:id/receipt`   | Receipt for a payment.                       |

### 11.7 Reviews — `/reviews`

| Method | Path                    | Description                                  |
| ------ | ----------------------- | -------------------------------------------- |
| POST   | `/`                     | Submit a rating and review (moderated).      |
| PUT    | `/:id`                  | Edit your own review.                        |
| DELETE | `/:id`                  | Delete your own review.                      |
| GET    | `/listing/:listingId`   | Approved reviews for a listing.              |
| GET    | `/provider/:providerId` | Approved reviews for a provider.             |

### 11.8 Search — `/search`

| Method | Path          | Description                                                         |
| ------ | ------------- | ------------------------------------------------------------------- |
| GET    | `/`           | Full-text/fuzzy search with filters. Suspended listings are excluded. |
| GET    | `/categories` | Category tree used by the filters.                                  |
| GET    | `/nearby`     | Listings near the caller's GPS coordinates.                         |

### 11.9 Messages — `/messages`

| Method | Path             | Description                                        |
| ------ | ---------------- | -------------------------------------------------- |
| GET    | `/conversations` | Conversations of the current user.                 |
| GET    | `/:bookingId`    | Messages of a booking.                             |
| POST   | `/:bookingId`    | Send a message in a booking thread.                |

Messages are scoped to a booking so only the two parties can read them. `delivered_at` and `read_at` track status.

### 11.10 Notifications — `/notifications`

| Method | Path            | Description                              |
| ------ | --------------- | ---------------------------------------- |
| GET    | `/`             | List notifications.                      |
| PUT    | `/:id/read`     | Mark one as read.                        |
| PUT    | `/read-all`     | Mark all as read.                        |
| GET    | `/preferences`  | Notification preferences.                |
| PUT    | `/preferences`  | Update preferences.                      |

### 11.11 Providers — `/providers`

| Method | Path                       | Auth      | Description                                         |
| ------ | -------------------------- | --------- | --------------------------------------------------- |
| GET    | `/me/payouts`              | provider  | Payout history; optional `status`, `page`, `limit`. |
| GET    | `/me/earnings/bookings`    | provider  | Earnings per booking.                               |
| GET    | `/me/earnings/summary`     | provider  | Summary cards and monthly chart data.               |
| GET    | `/me/earnings/export`      | provider  | CSV export of payouts.                              |
| GET    | `/:id`                     | —         | Safe public provider details (no private data).     |
| GET    | `/:id/listings`            | —         | The provider's active listings, paginated.          |
| GET    | `/:id/reviews`             | —         | The provider's approved reviews, paginated.         |

The `/me/...` routes are declared **before** `/:id` so `me` is never treated as an id.

Payout list response:

```json
{ "payouts": [ { "id": "…", "gross_amount": "1000.00", "platform_fee": "100.00",
                 "net_amount": "900.00", "status": "pending",
                 "listing_title": "Wedding photography", "scheduled_date": "2026-09-01" } ],
  "total": 1, "page": 1, "limit": 10 }
```

### 11.12 Admin — `/admin` (admin role only)

| Method | Path                                | Description                                              |
| ------ | ----------------------------------- | -------------------------------------------------------- |
| GET    | `/providers`                        | Providers awaiting approval.                             |
| PUT    | `/providers/:id/approve`            | Approve a provider.                                      |
| PUT    | `/providers/:id/reject`             | Reject a provider.                                       |
| GET    | `/nic-verifications`                | Pending NIC documents.                                   |
| GET    | `/nic-verifications/:id`            | One NIC submission.                                      |
| PUT    | `/nic-verifications/:id/decision`   | Approve/reject; a review note is required.               |
| GET    | `/listings`                         | Listings for moderation.                                 |
| PUT    | `/listings/:id/approve`             | Approve a listing.                                       |
| PUT    | `/listings/:id/suspend`             | Suspend with a required reason.                          |
| GET    | `/users`                            | Search users.                                            |
| GET    | `/users/:id`                        | User detail with history.                                |
| PUT    | `/users/:id/ban`                    | Permanently ban.                                         |
| PUT    | `/users/:id/suspend`                | Suspend for `days` (1–3650).                             |
| PUT    | `/users/:id/reinstate`              | Lift a ban or suspension.                                |
| GET    | `/categories`                       | List categories.                                         |
| POST   | `/categories`                       | Create a category.                                       |
| PUT    | `/categories/:id`                   | Update a category.                                       |
| DELETE | `/categories/:id`                   | Delete a category.                                       |
| GET    | `/disputes`                         | Disputed bookings.                                       |
| PUT    | `/disputes/:id/resolve`             | Resolve a dispute.                                       |
| GET    | `/analytics`                        | Platform analytics.                                      |
| GET    | `/reports`                          | Reported-user queue.                                     |
| GET    | `/reports/:id`                      | Full report context and reported user's history.         |
| PUT    | `/reports/:id/resolve`              | Resolve or dismiss a report.                             |
| GET    | `/audit-logs`                       | Audit trail of admin decisions.                          |

Report queue query parameters:

| Parameter | Description                                            |
| --------- | ------------------------------------------------------ |
| `status`  | `pending`, `reviewing`, `resolved`, `dismissed`, or `all`. |
| `reason`  | One of the six report reasons.                         |
| `page`    | Page number (minimum 1).                               |
| `limit`   | Page size (1–100, default 20).                         |

The queue lists pending reports first, then newest. The response also contains a `counts` object with the
number of reports per status.

### 11.13 Real-time — `/realtime`

| Method | Path       | Description                                                                 |
| ------ | ---------- | --------------------------------------------------------------------------- |
| GET    | `/stream`  | Server-Sent Events stream. Pass the JWT as `?token=<jwt>` (EventSource cannot set headers). |

---

## 12. Business Rules

### 12.1 Cancellation and refunds

Presets (`server/config/cancellationPolicies.js`):

| Policy           | Full refund if cancelled at least | Partial refund if at least | Partial % |
| ---------------- | --------------------------------: | -------------------------: | --------: |
| `flexible`       | 24 h before start                 | 0 h                        | 0%        |
| `moderate`       | 48 h                              | 24 h                       | 50%       |
| `strict`         | 168 h (7 days)                    | 72 h                       | 50%       |
| `non_refundable` | never                             | never                      | 0%        |

Rules:

1. The start time is built from `scheduled_date` and `scheduled_time`.
2. If the **provider** cancels, the consumer always receives 100%.
3. Otherwise the refund percent follows the table; amounts are rounded to two decimals.
4. The effective policy is chosen in this order: the listing's own policy → the platform default for the
   listing type → the built-in `moderate` preset.
5. If the payment is `escrowed` and the refund is greater than zero, `processRefund` marks it `refunded`.
6. On a **late consumer cancellation** the part that was not refunded is retained; a pending payout is created
   for the provider for that retained amount.
7. Only `pending` or `confirmed` bookings can be cancelled.

Worked example, `moderate` policy, booking of LKR 1,000:

| Cancelled                        | Refund |
| -------------------------------- | -----: |
| 3 days before start              | 1,000  |
| 30 hours before start            | 500    |
| 12 hours before start            | 0      |

### 12.2 Provider payouts

- A `pending` payout is created when a booking becomes `completed`, or when a late cancellation leaves the
  provider with retained money.
- Platform fee: **10%** of gross, rounded to two decimals. `net = gross − fee`.
- Amounts of zero or less are skipped.
- `booking_id` is unique, so creating the payout twice is harmless.
- After creating a payout the booking's `payout_status` is set to `pending`.

Example: gross 333.33 → fee 33.33 → net 300.00.

### 12.3 Reporting users

| Rule                                   | Value                                 |
| -------------------------------------- | ------------------------------------- |
| Allowed reasons                        | 6 (see schema)                        |
| Minimum description length             | 20 characters                         |
| Reports per reporter per 24 hours      | 5                                     |
| Open reports per reporter/target pair  | 1                                     |
| Admins alerted at                      | 3 pending reports against one user    |
| Admins can be reported                 | No                                    |

### 12.4 Suspensions and bans

- Suspension length must be a whole number between **1 and 3650** days, otherwise `400`.
- Default reasons: "Suspended by admin" and "Banned by admin".
- Suspension sets `suspended_until = now + days`; a ban sets `banned_at` and clears `suspended_until`.
- Both actions revoke all refresh tokens.
- Reinstating sets the status back to `verified` and clears reasons and dates.
- Restricted users are hidden from listings, profiles and other public access points.

### 12.5 Listing moderation

- Suspending a listing needs a **reason**; it is stored in `suspension_reason`.
- Suspended listings are excluded from the consumer search API.
- Only admins may suspend or restore listings.

### 12.6 Availability and double-booking

`availability.service.js` performs these checks for a date, time and duration:

1. Unknown listing → unavailable.
2. **Equipment** only: if `listing_availability` marks the date `is_available = false` → unavailable.
3. Any **confirmed** booking on the same date whose time range `OVERLAPS` the requested range → unavailable.
4. When unavailable, the service scans forward up to **30 days** and returns the first free date as
   `nextAvailableDate`, or `null` if none is found.

### 12.7 Reviews

Reviews start as `pending_moderation` and become public only when `approved`.

---

## 13. Real-Time Delivery

Live notifications and chat use **Server-Sent Events**.

### 13.1 Server hub (`services/realtime.js`)

| Function                       | Behaviour                                                              |
| ------------------------------ | ---------------------------------------------------------------------- |
| `addClient(userId, res)`       | Registers an open stream. A user can hold several (multiple tabs).     |
| `removeClient(userId, res)`    | Removes a stream; the user goes offline when the last one closes.      |
| `isOnline(userId)`             | `true` if at least one stream is open.                                 |
| `publish(userId, event, data)` | Writes `event: <name>\ndata: <json>\n\n` to every stream; returns `true` if any received it. |

A broken connection throws inside `write`; this is swallowed so the other streams still receive the event.

### 13.2 Client

`client/src/context/RealtimeContext.jsx` opens `GET /api/v1/realtime/stream?token=<jwt>` automatically after
login and shows incoming notifications.

### 13.3 Scaling note

The hub is a process-local `Map`. To run several API instances, replace it with Redis pub/sub while keeping
the same four function names.

---

## 14. Front-End Documentation

### 14.1 Route table

Defined in `client/src/App.jsx`. `ProtectedRoute` accepts an optional `allowedRoles` array.

| Path                                  | Page                          | Access            |
| ------------------------------------- | ----------------------------- | ----------------- |
| `/`                                   | HomePage                      | public            |
| `/register`                           | RegisterPage                  | public            |
| `/login`                              | LoginPage                     | public            |
| `/reset-password`                     | ResetPasswordPage             | public            |
| `/search`                             | SearchPage                    | public            |
| `/listings/:id`                       | ListingDetailPage             | public            |
| `/providers/:id`                      | ProviderProfilePage           | public            |
| `/bookings`                           | BookingHistoryPage            | any signed-in user|
| `/bundle-booking`                     | BundleBookingPage             | consumer          |
| `/provider/dashboard`                 | ProviderDashboardPage         | provider          |
| `/provider/listings/new/service`      | CreateServiceListingPage      | provider          |
| `/provider/listings/new/equipment`    | CreateEquipmentListingPage    | provider          |
| `/provider/availability`              | AvailabilityCalendarPage      | provider          |
| `/provider/earnings`                  | ProviderEarningsPage          | provider          |
| `/provider/booking-requests`          | BookingRequestsPage           | provider          |
| `/admin/dashboard`                    | AdminDashboardPage            | admin             |
| `/admin/provider-approvals`           | ProviderApprovalPage          | admin             |
| `/admin/nic-verification`             | NICVerificationPage           | admin             |
| `/admin/listing-moderation`           | ListingModerationPage         | admin             |
| `/admin/users`                        | UserManagementPage            | admin             |
| `/admin/disputes`                     | DisputesPage                  | admin             |
| `/admin/reports`                      | ReportsPage                   | admin             |
| `/admin/categories`                   | CategoryManagementPage        | admin             |
| `/profile`                            | ProfilePage                   | signed in         |
| `/messages`                           | MessagingPage                 | signed in         |
| `/notifications`                      | NotificationsPage             | signed in         |
| `/unauthorized`                       | UnauthorizedPage              | public            |
| `*`                                   | NotFoundPage                  | public            |

### 14.2 Shared state

| Context           | File                                | Provides                                             |
| ----------------- | ----------------------------------- | ---------------------------------------------------- |
| `AuthContext`     | `context/AuthContext.jsx`           | Current user, token handling, login/logout.          |
| `RealtimeContext` | `context/RealtimeContext.jsx`       | The SSE connection and live notification toasts.     |

The `useAuth` hook wraps `AuthContext` for components.

### 14.3 Components

| Folder        | Components                                              | Used for                                        |
| ------------- | ------------------------------------------------------- | ----------------------------------------------- |
| `common`      | Badge, BarChart, Button, InputField, Modal, ProtectedRoute, Spinner | Reusable building blocks.        |
| `layout`      | Navbar, Sidebar, Footer                                 | Page chrome.                                    |
| `listings`    | ListingCard, ListingGrid, LocationSearch, Steps         | Discovery and listing creation.                 |
| `bookings`    | CancelBookingModal, CancellationPolicy                  | Refund preview and policy summary.              |
| `provider`    | EarningsWidget, ListingPolicyControl                    | Dashboard widget and policy selector.           |
| `reports`     | ReportButton, ReportUserModal                           | Reporting from profiles, bookings and chats.    |
| `reviews`     | ReviewForm                                              | Rating and review submission.                   |

### 14.4 Utilities

| File               | Purpose                                              |
| ------------------ | ---------------------------------------------------- |
| `formatters.js`    | Currency, date and text formatting.                  |
| `geo.js`           | GPS and distance helpers for "Use My Location".      |
| `imageHelper.js`   | Image URL helpers.                                   |
| `validators.js`    | Client-side form validation.                         |

### 14.5 Notable pages

- **ProviderProfilePage** — hero section, collapsible sections, listings, approved reviews, sticky action bar with
  *Book a Service* and *Send a Message*, and friendly empty states for missing listings, reviews, bios or avatars.
- **ProviderEarningsPage** — four summary cards, a six-month chart and payout history.
- **ReportsPage** (admin) — table with filters, detail view and dismiss/ban actions.
- **BookingHistoryPage** — booking list with a *Cancel Booking* button visible only for cancellable bookings.

### 14.6 API access

`api/axiosInstance.js` centralises the base URL and interceptors. Components never build absolute URLs.

---

## 15. Security Considerations

| Area                | Measure                                                                                          |
| ------------------- | ------------------------------------------------------------------------------------------------ |
| Passwords           | bcrypt with 12 salt rounds; never returned in responses.                                         |
| Tokens              | JWT signed with `JWT_SECRET`; expiry enforced; tampered/wrong-secret tokens rejected.            |
| Sessions            | Refresh tokens revocable per user; ban/suspend revokes all.                                      |
| Headers             | `helmet` with cross-origin resource policy set to `cross-origin` for uploaded images.            |
| CORS                | Allow-list from `CLIENT_URL`; localhost only outside production.                                 |
| SQL injection       | Parameterised queries throughout; filters use `$n` placeholders (limit/offset are integers clamped in code). |
| Authorization       | Role guards on routes plus ownership checks in controllers (`403`).                              |
| Rate limiting       | OTP resend cooldown, OTP attempts, login lockout, 5 reports/day.                                 |
| Privacy             | Public provider endpoints return only safe fields; admins cannot be reported.                    |
| Auditability        | Report decisions and user bans/suspensions are written to `admin_audit_logs`.                    |
| Uploads             | Size limit through `UPLOAD_MAX_SIZE_MB`; files stored in Cloudinary or `/uploads`.               |

### 15.1 Security checklist before going live

- [ ] `JWT_SECRET` is long, random and different per environment.
- [ ] `NODE_ENV=production` so localhost origins are not accepted.
- [ ] `CLIENT_URL` lists only the real front-end origin(s).
- [ ] `DB_SSL` enabled for a hosted database.
- [ ] OTP store moved from memory to Redis.
- [ ] A real payment gateway with webhook signature verification is wired in.
- [ ] `.env` is not committed.
- [ ] HTTPS terminates in front of the API.

---

## 16. Testing Strategy

### 16.1 Layers

| Layer        | Tool                | Location                                   | Needs a database? |
| ------------ | ------------------- | ------------------------------------------ | ----------------- |
| Server unit  | Jest (mocked `db`)  | `server/__tests__/*.test.js`               | No                |
| Server integration | Jest + Supertest | `admin`, `auth`, `booking`, `listing`, `payment`, `search`, `user` suites | Yes |
| Client       | Vitest + Testing Library | `client/**/__tests__/*.test.jsx`      | No                |

### 16.2 Running

```bash
cd server && npx jest                       # everything
cd server && npx jest payout restriction    # a few files by name
cd client && npm test                       # Vitest, single run
npm test                                    # root: both at once
```

### 16.3 Unit test suites and what they prove

| Test file                  | Task      | Subject                                       |
| -------------------------- | --------- | --------------------------------------------- |
| `cancellationPolicy.test.js` | US26/27 | Refund maths, policy summaries, payout split. |
| `authService.test.js`      | SCRUM-86  | bcrypt hashing and JWT helpers.               |
| `otp.test.js`              | SCRUM-119 | OTP generation, cooldown, attempts, expiry.   |
| `availability.test.js`     | SCRUM-127 | Double-booking prevention, next free date.    |
| `roleMiddleware.test.js`   | SCRUM-165 | 401/403/allow behaviour of `authorize`.       |
| `realtime.test.js`         | SCRUM-178 | SSE hub delivery and cleanup.                 |
| `reportList.test.js`       | SCRUM-188 | Admin reported-user queue.                    |
| `restriction.test.js`      | SCRUM-197 | Ban/suspend enforcement, fail-open, expiry.   |
| `cancelBooking.test.js`    | SCRUM-226 | Cancellation and refund preview.              |
| `payout.test.js`           | SCRUM-233 | Payout amounts and idempotent creation.       |
| `reportSubmit.test.js`     | SCRUM-247 | Report submission rules.                      |

### 16.4 Mocking pattern

Controllers and services call `query()` from `config/db`. Unit tests replace it:

```js
jest.mock('../config/db', () => ({ query: jest.fn() }));
const { query } = require('../config/db');

query.mockResolvedValueOnce({ rows: [{ id: 'r1' }] });   // first SQL call
query.mockResolvedValueOnce({ rows: [] });               // second SQL call
```

Because results are consumed in call order, a test must queue one result per SQL statement the code executes.
When a controller sends its response and then keeps working (for example notifications), give the trailing
calls a default with `mockResolvedValue`.

### 16.5 Writing a new test

1. Put the file in `server/__tests__/` and name it `*.test.js` (the Jest `testMatch` pattern).
2. Start with a `@file` and `@description` header mentioning the Jira key.
3. Mock `config/db` and any model that talks to the database.
4. Cover the happy path, each validation failure and each guard (`401`, `403`, `404`).
5. Add a short note under `docs/testing/`.

### 16.6 What is not covered yet

- Client tests for the newest pages (`ProviderProfilePage`, `ProviderEarningsPage`, `ReportsPage`).
- Integration tests for payouts and reports against a real database.
- Load and accessibility testing.

---

## 17. Coding Conventions

### 17.1 JavaScript

- CommonJS on the server (`require`/`module.exports`), ES modules in the client.
- Controllers wrap their body in `try { … } catch (error) { next(error); }`.
- Use early returns for validation instead of deep nesting.
- Money is rounded with `Math.round(n * 100) / 100` and stored as `NUMERIC(10,2)`.
- Never interpolate user input into SQL; use `$1, $2, …`.

### 17.2 File headers

Server files carry a JSDoc block: `@file`, `@module`, `@description`, `@dependencies`, `@exports`, `@author`.

### 17.3 Naming

| Item                | Convention             | Example                    |
| ------------------- | ---------------------- | -------------------------- |
| Files (server)      | `name.type.js`         | `report.controller.js`     |
| React components    | PascalCase `.jsx`      | `ProviderProfilePage.jsx`  |
| Tests               | `*.test.js(x)`         | `payout.test.js`           |
| Database tables     | snake_case, plural     | `provider_payouts`         |
| Migrations          | `NN_description.sql`   | `18_gap_features.sql`      |
| Routes              | kebab/lowercase        | `/cancel-by-provider`      |

### 17.4 Error responses

Always include both `error` (short label) and `message` (human sentence), as in
`{ "error": "Forbidden", "message": "You can only cancel your own bookings" }`.

---

## 18. Git Workflow and Jira Traceability

### 18.1 Branches

| Branch                 | Purpose                                        |
| ---------------------- | ---------------------------------------------- |
| `main`                 | Stable, released code.                         |
| `develop`              | Integration branch; pull requests merge here first. |
| `feature/SCRUM-<n>-…`  | One branch per user story.                     |
| `fix/SCRUM-<n>-…`      | Bug fixes.                                     |

### 18.2 Commit messages

Follow Conventional Commits with the Jira key:

```
feat(SCRUM-233): Create Payouts History Endpoint
fix(SCRUM-124): An error occurred with the npm build
test(SCRUM-194): Write tests for the reported-user moderation flow
docs: note that this history was reconstructed from the Jira export
```

| Prefix  | Use                                  |
| ------- | ------------------------------------ |
| `feat`  | New behaviour                        |
| `fix`   | Bug fix                              |
| `test`  | Tests only                           |
| `docs`  | Documentation only                   |
| `feat(db)` | Schema change                     |

### 18.3 Pull requests

1. Branch from `develop`.
2. Keep changes to one story.
3. Run `npm test` before opening the PR.
4. Reference the SCRUM key in the title.
5. At least one teammate reviews before merge.

### 18.4 History note

The history was reconstructed from the Jira export; dates follow each task's status timeline and commits are
attributed to the task assignee. Test and documentation commits added afterwards are dated shortly after the
feature they cover. See `docs/HISTORY_RECONSTRUCTION.md`.

### 18.5 User story map

| Story | Theme                                     | Representative tasks                           |
| ----- | ----------------------------------------- | ---------------------------------------------- |
| US13  | Bundle bookings with several equipment    | SCRUM-71                                       |
| US17/18 | Real-time notifications and chat        | SCRUM-55, SCRUM-178                            |
| US20  | Suspend suspicious listings               | SCRUM-89 to SCRUM-92, SCRUM-168, SCRUM-169     |
| US23  | Review reported users                     | SCRUM-186 to SCRUM-194                         |
| US24  | Ban or suspend users                      | SCRUM-195 to SCRUM-203                         |
| US26  | Cancel a booking and receive a refund     | SCRUM-222 to SCRUM-231                         |
| US27  | Earnings, payout history                  | SCRUM-232 to SCRUM-237                         |
| US28  | Public provider profile                   | SCRUM-239 to SCRUM-245                         |
| US29  | Report abusive, fraudulent or fake users  | SCRUM-247 to SCRUM-251                         |

---

## 19. Deployment Notes

### 19.1 Build

```bash
cd client && npm run build      # outputs client/dist
cd ../server && npm start
```

Serve `client/dist` from a static host or a reverse proxy, and point it at the API.

### 19.2 Environment

Set every variable in [Section 7](#7-configuration-reference) on the host. Use `NODE_ENV=production`.

### 19.3 Database

1. Provision PostgreSQL 14+ and enable `pg_trgm`.
2. Apply migrations in the order in [Section 6.4](#64-create-the-database).
3. Take a backup before every migration in production.

### 19.4 Reverse proxy

- Terminate HTTPS at the proxy.
- Forward `/api/` to the Node process.
- **Disable response buffering** for `/api/v1/realtime/stream`, otherwise SSE events are delayed.
- Serve `/uploads` from the API or offload to Cloudinary.

### 19.5 Health check

`GET /api/v1/health` returns a simple status; use it for load balancer probes.

### 19.6 Backups and export

Use `pg_dump` for backups; the `db:export` npm script points at `db/export_db.js`, which is not present in this checkout.

---

## 20. Troubleshooting

| Symptom                                                    | Likely cause and fix                                                                 |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `Schema is missing migration 18` warning at start-up       | Run `cd server && npm run migrate`.                                                  |
| `type "condition_enum" does not exist` during migration    | Apply `003b_alter_listings_equipment.sql` before `03_listings.sql`.                  |
| `Not allowed by CORS`                                      | Add the front-end origin to `CLIENT_URL` (comma-separated).                          |
| `401` on every request                                     | Missing/expired token, or `JWT_SECRET` differs between issue and verify.             |
| `403 Account suspended/banned`                             | An admin restricted the account; reinstate from `/admin/users`.                      |
| Live notifications never arrive behind a proxy             | Disable proxy buffering for the SSE route.                                           |
| `Please wait 60 seconds before resending`                  | OTP cooldown; wait one minute.                                                       |
| `429` when reporting a user                                | Daily limit of 5 reports reached.                                                    |
| `409` when reporting a user                                | You already have an open report against that user.                                   |
| Jest: `Cannot find module`                                 | Run `npm install` in `server/`.                                                      |
| Jest hangs                                                 | The script already uses `--forceExit --detectOpenHandles`; check for an un-mocked DB pool. |
| Vitest: tests cannot import React                          | Run `npm install` in `client/`.                                                      |
| Port 5000 already in use                                   | Change `PORT` or stop the other process.                                             |
| Uploaded images do not show                                | Check Cloudinary keys, or that `/uploads` is served and CORP header allows cross-origin. |
| `booking_status_enum` value `rejected` missing             | The server adds it on boot; ensure the DB user may `ALTER TYPE`.                     |

### 20.1 Inspecting the database quickly

```bash
psql -U postgres -d rentify_db -c "SELECT status, COUNT(*) FROM user_reports GROUP BY status;"
psql -U postgres -d rentify_db -c "SELECT * FROM provider_payouts ORDER BY created_at DESC LIMIT 5;"
psql -U postgres -d rentify_db -c "SELECT id, status, suspended_until FROM users WHERE status <> 'verified';"
```

### 20.2 Debugging a failing request

1. Reproduce with curl and the same `Authorization` header.
2. Read the server console; unhandled errors are logged by `error.middleware.js`.
3. Run the SQL from the controller in `psql` with sample parameters.
4. Write a failing unit test before the fix.

---

## 21. Known Limitations and Roadmap

### 21.1 Limitations

| Area               | Limitation                                                                             |
| ------------------ | -------------------------------------------------------------------------------------- |
| Payments           | `createPaymentSession`, `verifyWebhookSignature` and `releaseEscrow` are stubs. Refund bookkeeping is real. |
| OTP                | In-memory store and console SMS stub.                                                  |
| Real-time          | Single-instance SSE hub.                                                               |
| Payouts            | Status changes from `pending` to `paid` are not automated.                             |
| Client tests       | No tests yet for several newer pages.                                                  |
| Currency           | LKR only.                                                                              |

### 21.2 Roadmap

1. Integrate PayHere or Stripe and verify webhook signatures.
2. Redis for OTP storage and SSE fan-out.
3. Automated payout runs and payout statements.
4. Push/email channels driven by notification preferences.
5. Admin analytics with date ranges and CSV export.
6. End-to-end tests (Playwright) for the booking journey.
7. Continuous integration running `npm test` on every pull request.

---

## 22. Glossary

| Term            | Meaning                                                                         |
| --------------- | ------------------------------------------------------------------------------- |
| Bundle          | A booking that combines a service with one or more equipment rentals.           |
| Escrow          | Money held by the platform until the job is complete.                           |
| Gross           | Booking amount before the platform fee.                                         |
| Net             | Gross minus the platform fee; what the provider receives.                       |
| Payout          | A record of money owed or paid to a provider for a booking.                     |
| NIC             | National Identity Card, used for identity verification in Sri Lanka.            |
| OTP             | One-time password sent to a mobile number.                                      |
| SSE             | Server-Sent Events, a one-way streaming channel from server to browser.         |
| JWT             | JSON Web Token used as the access token.                                        |
| Suspension      | A timed account block that lifts automatically.                                 |
| Ban             | A permanent account block until an admin reinstates the user.                   |
| Audit log       | Immutable-style record of admin decisions in `admin_audit_logs`.                |
| Policy preset   | One of `flexible`, `moderate`, `strict`, `non_refundable`.                      |
| Fail open       | On an internal error, allow the action instead of blocking it.                  |
| Idempotent      | Safe to run more than once with the same effect.                                |
| Jira key        | Task identifier such as `SCRUM-233` used in branch and commit names.            |

---

## 23. Frequently Asked Questions

**Why are business rules enforced on the server as well as the UI?**
The UI can be bypassed. Every rule, such as the report daily limit or refund calculation, is re-checked in the
controller or service.

**Why does the restriction check fail open?**
If the database lookup errors, locking every user out would be worse than a brief lapse. The ban itself is
stored in the database and applies again as soon as the lookup succeeds.

**Why is `/providers/me/...` declared before `/providers/:id`?**
Express matches routes in order. Declared the other way round, `me` would be captured as an id.

**Why does the SSE endpoint take the token in the query string?**
The browser `EventSource` API cannot send custom headers. Use short-lived tokens and HTTPS to limit exposure.

**How is double booking prevented?**
`availability.service.js` compares the requested range with confirmed bookings using PostgreSQL's `OVERLAPS`.

**Can a provider change the platform fee?**
No. The 10% rate is a constant in `payout.service.js`.

**What happens to a payout when a booking is cancelled early?**
Nothing is created: the consumer receives a full refund and the provider retains nothing.

**Can admins be reported?**
No. The report query excludes users whose role is `admin`.

**How do I add a new API endpoint?**
Add the controller function, register it in the matching `routes/*.routes.js` with the right middleware chain,
write a unit test, then document it in Section 11.

**How do I add a database change?**
Add idempotent SQL to a new numbered migration (or extend migration 18 during development) and mention it in
Section 9.

---

## 24. Appendix

### 24.1 Sample cURL session

```bash
# 1. Log in
curl -s -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"user@example.lk","password":"Password123"}'

# 2. Use the token
TOKEN="paste-the-token-here"
curl -s http://localhost:5000/api/v1/users/me -H "Authorization: Bearer $TOKEN"

# 3. Preview a cancellation
curl -s http://localhost:5000/api/v1/bookings/<id>/cancellation-preview -H "Authorization: Bearer $TOKEN"

# 4. Cancel it
curl -s -X POST http://localhost:5000/api/v1/bookings/<id>/cancel \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"reason":"Plans changed"}'
```

### 24.2 Sample admin session

```bash
ADMIN="paste-an-admin-token"
curl -s "http://localhost:5000/api/v1/admin/reports?status=pending&limit=10" -H "Authorization: Bearer $ADMIN"
curl -s -X PUT http://localhost:5000/api/v1/admin/users/<id>/suspend \
  -H "Authorization: Bearer $ADMIN" -H "Content-Type: application/json" \
  -d '{"days":7,"reason":"Repeated abusive messages"}'
```

### 24.3 Refund calculator cheat sheet

```
hoursBeforeStart = (bookingStart − now) / 3600000
if provider cancels           → 100%
else if policy is non_refundable → 0%
else if hoursBeforeStart ≥ full_refund_hours    → 100%
else if hoursBeforeStart ≥ partial_refund_hours → partial_refund_percent
else                          → 0%
refundAmount = round(total × percent) / 100
```

### 24.4 Payout cheat sheet

```
gross = round2(amount)
fee   = round2(gross × 0.10)
net   = round2(gross − fee)
```

### 24.5 Pre-merge checklist

- [ ] Feature branch is up to date with `develop`.
- [ ] New endpoints are documented in Section 11.
- [ ] New tables/columns are in an idempotent migration and Section 9.
- [ ] Unit tests added for every new rule and guard.
- [ ] `npm test` passes locally.
- [ ] No secrets, `.env` files or `node_modules` are committed.
- [ ] Commit messages use the `type(SCRUM-n): summary` format.
- [ ] Pull request references the Jira key.

### 24.6 Release checklist

- [ ] All migrations applied on the target database.
- [ ] Environment variables reviewed against Section 7.
- [ ] Security checklist in Section 15.1 completed.
- [ ] Health endpoint returns success.
- [ ] Smoke test: register, log in, search, book, cancel, report, admin approve.
- [ ] Backup taken and restore verified.

### 24.7 Contact and ownership

| Area                         | Owner                       |
| ---------------------------- | --------------------------- |
| Documentation                | Wethmal                     |
| Repository                   | `Wethmal/Rentify-X`         |
| Issue tracking               | Jira project `SCRUM`        |

*End of document.*
