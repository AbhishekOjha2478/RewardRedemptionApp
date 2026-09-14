# Aurum

**Reward Redemption Application, CES Portal**

An internal back-office portal for bank Customer Executive Support staff. CES
users manage customers, credit cards, transactions, reward points and reward
redemption on a customer's behalf. Customers never log in.

## Stack

- **Backend** Spring Boot 3.5.3, Java 21, Spring Security with JWT, Spring Data JPA
- **Database** MySQL 8, schema managed by Flyway
- **Frontend** React 19, TypeScript, Vite, MUI, TanStack Query
- **Hosting** Cloudflare Pages, Render, TiDB Cloud

## Repository layout

```
backend/     Spring Boot application
frontend/    React single page application
docs/        Plan, deployment research, schema notes
scripts/     One-time local environment setup
```

## Running locally

One-time setup, creates the database and the application user:

```bash
bash scripts/setup-local-env.sh
```

Backend, on port 8080:

```bash
cd backend
mvn spring-boot:run
```

Frontend, on port 5173, proxying API calls to the backend:

```bash
cd frontend
npm install
npm run dev
```

## Configuration

Every setting has a working local default, so nothing needs to be set to run on a
development machine. In a deployed environment these must be overridden.

| Variable | Purpose |
|---|---|
| `PORT` | HTTP port, injected by the hosting platform |
| `DB_HOST`, `DB_PORT`, `DB_NAME` | Database location |
| `DB_USERNAME`, `DB_PASSWORD` | Database credentials |
| `DB_PARAMS` | JDBC query string, used to require TLS in production |
| `JWT_SECRET` | Token signing key, at least 32 bytes |
| `CORS_ORIGINS` | Exact origin of the deployed frontend |
| `SEED_ADMIN_USERNAME`, `SEED_ADMIN_PASSWORD`, `SEED_ADMIN_EMAIL` | First administrator, created on an empty database |
| `DEMO_SEED_ENABLED` | Loads sample customers on startup |

The frontend reads `VITE_API_BASE_URL`. Vite replaces it at build time, so
changing it requires a rebuild rather than a restart.

## Signing in

On an empty database the application creates one administrator from the
`SEED_ADMIN_*` settings. With the defaults that is `admin` / `Admin@123`.
Change it before deploying anywhere.

## Build status

Stages 1 to 5 of 9 are complete. All eight required epics work end to end:

| Epic | State |
|---|---|
| Authentication and authorisation | Done, with refresh tokens and role based access |
| CES user management | Done, including the self delete guard |
| Customer management | Done, with search, pagination and soft delete |
| Credit card management | Done, with bank wide uniqueness |
| Transaction management | Done, fifty generated per request |
| Reward processing | Done, processed exactly once under a row lock |
| Reward catalog and redemption | Done, cart only and all or nothing |
| Customer profile | Done |

Still to come: the admin analytics dashboard, PDF export, automated tests,
Docker and continuous integration, and deployment. Progress is tracked in
`docs/PLAN.md`.
