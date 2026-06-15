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

