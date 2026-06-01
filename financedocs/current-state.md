# FinanceApp API - Current Application State & Implementation Documentation

Welcome to the **FinanceApp API** developer documentation. This document provides a comprehensive overview of the current state of the application, its architecture, database configurations, stateless authentication layer, and customized schemas as of today.

---

## 🏗️ 1. Project Overview & Architecture

The FinanceApp API is built on a modern **NestJS Boilerplate** designed around **Hexagonal Architecture (Ports and Adapters)**. This decoupling ensures that the core domain logic is completely separated from external infrastructure adapters (databases, upload drivers, and external libraries).

- **Current Active Stack**: PostgreSQL + TypeORM (Relational Database Adapter).
- **Clean Relational Codebase**: The project setup script has completely pruned MongoDB/Mongoose references, mongoose schemas, document-based seeders, and generator templates. The codebase is now dedicated entirely to the relational PostgreSQL stack.

---

## 🛢️ 2. Database & Infrastructure Configuration

All auxiliary services run locally inside isolated **Docker** containers. 

### Host Port Conflict Resolution
A native PostgreSQL service (`postgres.exe`) was detected running natively on the host port `5432`. To bypass port binding conflicts, **the Docker PostgreSQL host port was mapped to `5430`**. 

The configuration values inside the local `.env` are:
```env
DATABASE_TYPE=postgres
DATABASE_HOST=localhost
DATABASE_PORT=5430
DATABASE_USERNAME=root
DATABASE_PASSWORD=secret
DATABASE_NAME=financeappdb
```

### Infrastructure Services Cheat Sheet

| Service | Local URL / Host | Credentials / Config | Purpose |
| :--- | :--- | :--- | :--- |
| **PostgreSQL Database** | `localhost:5430` | User: `root` <br> Pass: `secret` <br> DB: `financeappdb` | Active application database. |
| **Adminer (DB GUI Client)** | [http://localhost:8080](http://localhost:8080) | Server: `postgres` <br> Username: `root` <br> Password: `secret` <br> Database: `financeappdb` | Inspect schemas, run SQL queries, and edit records inside the browser. |
| **Maildev (Local SMTP UI)** | [http://localhost:1080](http://localhost:1080) | SMTP Host: `localhost` <br> SMTP Port: `1025` | Captures outgoing confirmation and password reset emails for testing. |

---

## 🔑 3. Stateless JWT Authentication Flow

The authentication flow was refactored to operate in a **purely stateless model**. The application does not perform database reads/writes to verify or record sessions during normal operations:

1. **Access Token Generation (`POST /api/v1/auth/email/login`)**: Generates a standard JWT token containing the user's `id` and `role`. It does **not** write a session row to the `session` table.
2. **Stateless Refresh Token (`POST /api/v1/auth/refresh`)**:
   - In standard boilerplate setups, refresh tokens are verified against database session records.
   - **Our Refactor**: The user ID is stored inside the refresh token's `sessionId` payload field. This retains compatibility with the `JwtRefreshStrategy` type definitions without requiring changes to the validator strategy files.
   - When a refresh is requested, the system retrieves the user profile directly using the ID encoded in `sessionId` and generates a new pair of tokens cryptographically.
3. **Stateless Logout (`POST /api/v1/auth/logout`)**: Bypasses database session row deletions, completing the logout process instantly. True token invalidation is handled by the client-side application discarding the tokens.
4. **Session Module Preserved**: All files and controllers of the original `Session` module remain intact in the codebase to guarantee compilation sanity and allow you to toggle database-backed sessions back on later if desired.

---

## 👥 4. Customized User Entity (DrawSQL Schema Integration)

The `User` module has been completely refactored to align with the database design specified in `financedocs/dbschemewithoutcurrency.webp`:

### Major Schema Enhancements
* **UUID Primary Keys**: Changed the `user.id` field from serial integers to a **UUID string** mapped via `@PrimaryGeneratedColumn('uuid')` in TypeORM.
* **Base Currency Column**: Integrated the `baseCurrency` property (represented as the `base_currency` column in the database) to track each user's default transaction currency.
* **Foreign Key Cascade**: The `session.userId` column has automatically transitioned from an integer to a `uuid` type to preserve foreign key constraints cleanly.

### Endpoints Integrating `baseCurrency`
The `baseCurrency` parameter is fully supported in incoming request validation schemas:
* **`POST /api/v1/auth/email/register`**: Register a user with a default base currency (e.g. `USD`).
* **`PATCH /api/v1/auth/me`**: Logged-in users can update their base currency.
* **OpenAPI/Swagger Docs**: Both endpoints automatically expose the `baseCurrency` validation properties inside the Swagger UI at [http://localhost:3000/docs](http://localhost:3000/docs).

---

## 🗃️ 5. Active Database Schemas & Seed Data

The following tables are fully initialized inside the `financeappdb` PostgreSQL database:

* **`role`**: Defines user authorization groups.
* **`status`**: Defines user account state (Active, Inactive).
* **`file`**: Manages attachment paths.
* **`user`**: Stores user credentials, profiles, base currency, role, and status.
* **`session`**: Initialized in the database but currently bypassed by stateless auth.
* **`currency`**: Stores available currencies (`code`, `name`, `symbol`).
* **`currency_rate`**: Stores daily exchange rates against USD.
* **`account`**: User financial accounts with specific currencies and balances.
* **`category`**: Income and expense categories, supporting dual language (`nameEn`, `nameUk`) and global (system) defaults.

### Pre-Configured Seed Data (Run via `npm run seed:run:relational`)

* **Default Roles**: Admin (`1`), User (`2`)
* **Default Statuses**: Active (`1`), Inactive (`2`)
* **Seeded Accounts**:
  - **Super Admin**: `admin@example.com` (password: `secret`, role: Admin, status: Active)
  - **Test User**: `john.doe@example.com` (password: `secret`, role: User, status: Active)

---

## 💻 6. Commands & Operations Cheat Sheet

Use these standard commands inside the project's root folder (`d:\projects\FinanceApp\financeappapi`):

| Operation | Command |
| :--- | :--- |
| **Start Docker Infrastructure** | `docker compose up -d postgres adminer maildev` |
| **Stop Docker Infrastructure** | `docker compose down` |
| **Drop Database Schema (Clean state)** | `npm run schema:drop` |
| **Generate Schema Migrations** | `npm run migration:generate -- src/database/migrations/<MigrationName>` |
| **Run Migrations** | `npm run migration:run` |
| **Seed Default Database Rows** | `npm run seed:run:relational` |
| **Build & Compile NestJS App** | `npm run build` |
| **Start Application (Dev / Watch)** | `npm run start:dev` |
| **Run Linter & Auto-Fix Errors** | `npm run lint -- --fix` |
