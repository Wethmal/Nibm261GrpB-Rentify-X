<p align="center">
  <h1 align="center">Rentify</h1>
  <p align="center">A trusted rental & services marketplace for Sri Lanka</p>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen?style=flat-square&logo=node.js" alt="Node">
  <img src="https://img.shields.io/badge/react-18.3-61DAFB?style=flat-square&logo=react" alt="React">
  <img src="https://img.shields.io/badge/express-4.x-000000?style=flat-square&logo=express" alt="Express">
  <img src="https://img.shields.io/badge/postgresql-14+-336791?style=flat-square&logo=postgresql" alt="PostgreSQL">
</p>

---

## Table of Contents

- [About the Project](#about-the-project)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
  - [1. Clone the Repository](#1-clone-the-repository)
  - [2. Install Dependencies](#2-install-dependencies)
  - [3. Configure Environment Variables](#3-configure-environment-variables)
  - [4. Set Up the Database](#4-set-up-the-database)
  - [5. Run the Application](#5-run-the-application)
- [Available Scripts](#available-scripts)
- [API Overview](#api-overview)
- [Database Migrations](#database-migrations)
- [Testing](#testing)
- [Architecture Overview](#architecture-overview)
- [User Roles](#user-roles)
- [Contributing](#contributing)
- [Environment Variables Reference](#environment-variables-reference)
- [License](#license)

---

## About the Project

**Rentify** is a digital marketplace that bridges the gap between the gig economy and physical asset rentals in Sri Lanka. It allows users to discover, book, and **bundle** verified freelance services (photographers, electricians, tutors) and equipment rentals (cameras, drones, power tools) in a single, secure transaction.

### Key Differentiators

- **Bundle Bookings** — Book a professional _and_ rent their equipment in one transaction (e.g., Sound Technician + PA System).
- **Identity Verification** — Mandatory mobile OTP and NIC document verification to eliminate fraud.
- **Geo-Aware Discovery** — Location-based search prioritising providers within the consumer's district.
- **Ratings** — Moderated review system building public trust scores for both parties.

---

## Tech Stack

| Layer            | Technology                                                        |
| ---------------- | ----------------------------------------------------------------- |
| **Frontend**     | React 18, Vite 5, React Router v6, Axios, Context API            |
| **Backend**      | Node.js, Express.js 4, PostgreSQL (pg / node-postgres), JWT Auth  |
| **File Storage** | Cloudinary                                                        |

---

## Project Structure

```
rentify/
├── package.json              ← Root monorepo scripts (concurrently)
├── client/                   ← React Frontend (Vite)
│   ├── src/
│   │   ├── api/              ← Axios instance + interceptors
│   │   ├── context/          ← AuthContext (global auth state)
│   │   ├── hooks/            ← Custom React hooks
│   │   ├── pages/            ← Route-level page components
│   │   ├── components/       ← Reusable UI components
│   │   └── utils/            ← Formatters, validators
│   └── __tests__/            ← Client test files
└── server/                   ← Express Backend
    ├── config/               ← DB pool, constants
    ├── middleware/            ← Auth, roles, uploads, errors, validation
    ├── routes/               ← Express route definitions
    ├── controllers/          ← Request handlers
    ├── services/             ← Business logic layer
    ├── models/               ← Database query functions
    ├── database/
    │   ├── migrations/       ← PostgreSQL DDL scripts
    │   └── seed/             ← Development seed data
    └── __tests__/            ← Server test files
```
---

## Prerequisites

Before you begin, ensure you have the following installed on your local machine:

| Tool           | Minimum Version | Installation                                         |
| -------------- | --------------- | ---------------------------------------------------- |
| **Node.js**    | `>= 18.0.0`    | [nodejs.org](https://nodejs.org/)                    |
| **npm**        | `>= 9.0.0`     | Comes with Node.js                                   |
| **PostgreSQL** | `>= 14.0`      | [postgresql.org](https://www.postgresql.org/download) |
| **Git**        | Latest          | [git-scm.com](https://git-scm.com/)                 |

**Optional (for full functionality):**
- [Cloudinary](https://cloudinary.com/) account — for file/image uploads
- SMTP credentials (Gmail App Password) — for email notifications
- Payment gateway keys (PayHere / Stripe) — for payment processing

---

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd rentify
```

### 2. Install Dependencies

```bash
# Install root dependencies (concurrently)
npm install

# Install client dependencies
cd client && npm install && cd ..

# Install server dependencies
cd server && npm install && cd ..
```

> **Tip:** You can also run `npm install` in each directory separately if you prefer.

### 3. Configure Environment Variables

```bash
# Copy the example environment files
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Now open `server/.env` in your editor and fill in your **actual values**:

```env
# Required — Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=rentify_db
DB_USER=postgres
DB_PASSWORD=<your_postgres_password>

# Required — JWT
JWT_SECRET=<generate_a_strong_random_string>

# Optional — Cloudinary (for image uploads)
CLOUDINARY_CLOUD_NAME=<your_cloud_name>
CLOUDINARY_API_KEY=<your_api_key>
CLOUDINARY_API_SECRET=<your_api_secret>
```


### 4. Set Up the Database

Create the database and run migrations **in order**:

```bash
# Create the database
psql -U postgres -c "CREATE DATABASE rentify_db;"

# Run all migrations in sequence
psql -U postgres -d rentify_db -f server/db/migrations/01_users.sql
psql -U postgres -d rentify_db -f server/db/migrations/02_categories.sql
psql -U postgres -d rentify_db -f server/db/migrations/03_listings.sql
psql -U postgres -d rentify_db -f server/db/migrations/04_listing_availability.sql
psql -U postgres -d rentify_db -f server/db/migrations/05_bookings.sql
psql -U postgres -d rentify_db -f server/db/migrations/06_payments.sql
psql -U postgres -d rentify_db -f server/db/migrations/07_reviews.sql
psql -U postgres -d rentify_db -f server/db/migrations/08_messages.sql
psql -U postgres -d rentify_db -f server/db/migrations/09_notifications.sql

# (Optional) Seed with initial categories
psql -U postgres -d rentify_db -f server/db/seeds/seed.sql
```

### 5. Run the Application

```bash
# Start both client and server concurrently
npm run dev
```

The application will be available at:

| Service    | URL                           |
| ---------- | ----------------------------- |
| **Client** | http://localhost:5173         |
| **Server** | http://localhost:5000         |
| **Health** | http://localhost:5000/api/v1/health |

---

## Database Migrations

Migrations are plain SQL files in `server/db/migrations/`. Apply them in this order (note `003b` creates the
`condition_enum` type that `03_listings.sql` needs, so it runs **before** `03` and again after it):

`01_users` → `02_categories` → `003b_alter_listings_equipment` → `03_listings` → `003b_alter_listings_equipment` →
`04_listing_availability` → `05_bookings` → `06_payments` → `07_reviews` → `08_messages` → `09_notifications` →
`10`–`17` → `18_gap_features`.

| File                          | Purpose                                                                                     |
| ----------------------------- | ------------------------------------------------------------------------------------------- |
| `01_users.sql`                | Users, roles, NIC verification                                                              |
| `02_categories.sql`           | Hierarchical service/equipment types                                                        |
| `03_listings.sql`             | Services and equipment with geo + JSONB                                                     |
| `04_listing_availability.sql` | Date-level availability per listing                                                         |
| `05_bookings.sql`             | Booking transactions with bundle support                                                    |
| `06_payments.sql`             | Escrow tracking and gateway references                                                      |
| `07_reviews.sql`              | Ratings and moderated comments                                                              |
| `08_messages.sql`             | Booking-scoped in-app chat                                                                  |
| `09_notifications.sql`        | In-app notification feed                                                                    |
| `10`–`17`                     | Lockout/refresh tokens, password reset, 2FA, visibility, tags, quantity/condition, search   |
| `18_gap_features.sql`         | Cancellation policies & refunds, provider payouts, user reports, admin audit log, timed suspensions, multi-equipment bundles, message delivery status. Idempotent. |

To apply migration 18 to the database configured in `server/.env`:

```bash
cd server && npm run migrate
```

> `npm run migrate` prints the target DB host before running. Check `server/.env` first.

## Real-time, Payments & Moderation Features

- **Live notifications & chat** — Server-Sent Events at `GET /api/v1/realtime/stream?token=<jwt>`; the client opens it automatically.
- **Cancellation & refunds** — `GET/PUT /listings/:id/cancellation-policy`, `GET /bookings/:id/cancellation-preview`, `POST /bookings/:id/cancel`, `POST /bookings/:id/cancel-by-provider`.
- **Earnings** — `GET /providers/me/payouts`, `/providers/me/earnings/bookings`, `/providers/me/earnings/summary`, `/providers/me/earnings/export` (CSV).
- **Public provider profile** — `GET /providers/:id`, `/providers/:id/listings`, `/providers/:id/reviews`; page at `/providers/:id`.
- **Reports & moderation** — `POST /users/:id/report`; admin: `GET /admin/reports`, `GET /admin/reports/:id`, `PUT /admin/reports/:id/resolve`, `GET /admin/audit-logs`, `PUT /admin/users/:id/suspend` (`days`), `/ban`, `/reinstate`.
- **NIC review** — `GET /admin/nic-verifications[/:id]`, `PUT /admin/nic-verifications/:id/decision` (note required).

--------------------------- | ---------------------- | ---------------------------------------- |
| `01_users.sql`              | `users`                | Roles, profiles, NIC verification        |
| `02_categories.sql`         | `categories`           | Hierarchical service/equipment types     |
| `03_listings.sql`           | `listings`             | Services and equipment with geo + JSONB  |
| `04_listing_availability.sql` | `listing_availability` | Date-level availability per listing    |
| `05_bookings.sql`           | `bookings`             | Booking transactions with bundle support |
| `06_payments.sql`           | `payments`             | Escrow tracking and gateway references   |
| `07_reviews.sql`            | `reviews`              | Ratings and moderated comments           |
| `08_messages.sql`           | `messages`             | Booking-scoped in-app chat               |
| `09_notifications.sql`      | `notifications`        | In-app notification feed                 |


---

