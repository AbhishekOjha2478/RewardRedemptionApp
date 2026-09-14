# Build plan — Reward Redemption Application (CES Portal)

## Context

This repository previously held an unrelated Python video pipeline. That has been
removed. The project is now a bank reward redemption portal built from scratch as
a capstone: an internal back-office tool where Customer Executive Support staff
manage customers, credit cards, transactions, reward points and redemption on a
customer's behalf. Customers never log in.

The finished product must do three things: satisfy the requirement document,
survive a live demo on free hosting, and be something the owner can explain line
by line in an interview.

## Stack

| Tier | Choice | Why |
|---|---|---|
| Backend | Spring Boot 3.5.3, Java 21, Maven | Mandated by the spec |
| Database | MySQL 8, Flyway migrations | Mandated by the spec |
| Frontend | React 19 + TypeScript + Vite | Component model suits eleven data-driven screens |
| UI kit | MUI v7 | Tables, dialogs, forms and nav in one system |
| Data fetching | TanStack Query v5 + axios | Removes fifteen hand-rolled loading/error hooks |
| Routing | React Router v7 | Nested routes match the customer-centric screens |
| Forms | react-hook-form + zod | Rules declared once, types derived from them |
| Charts | Recharts | Charts are components with props, same model as the app |
| Hosting | Cloudflare Pages + Render + TiDB Cloud | Free, no credit card anywhere |

## Rules for the code

- Ordinary over clever. Nothing needing a system-design background to justify.
- Strict layering: Controller handles HTTP, Service holds business rules and
  transactions, Repository is a Spring Data interface. Entities never leave the
  service layer.
- No comments in the source. Explanations live in `docs/`, written separately.
- No Redis, Kafka, microservices, Redux or state libraries.
- Every dependency must be justifiable in one sentence.

## One-time setup

Run once, needs your password:

```bash
bash scripts/setup-local-env.sh
```

Adds you to the docker group and creates the `ces_rewards` database with an
application user matching the defaults in `application.yml`.

Already verified on this machine: Java 21, Maven 3.8.7 with dependencies cached,
Node 24.18.0, npm 11.16.0, MySQL 8.0.46 running, Docker installed.

---

## Stage 1 — Foundations

Backend skeleton and database, React skeleton. Nothing user-facing yet.

**Backend**
- `backend/pom.xml`: web, data-jpa, validation, security, actuator, MySQL driver,
  Flyway, JJWT, OpenPDF, Testcontainers.
- `application.yml` with `server.port: ${PORT:${SERVER_PORT:8080}}`, datasource
  from environment variables, `ddl-auto: validate`, actuator health exposed.
- `V1__initial_schema.sql`: all eleven tables, keys, indexes and constraints.
- `V2__reward_catalog_seed.sql`: six categories, twenty-eight items.
- Eleven JPA entities and their repositories.
- A `Clock` bean, injected anywhere a date is needed. The three-year tier
  boundary cannot be tested without it.

**Frontend**
- `npm create vite` into `frontend/`, TypeScript template.
- MUI theme, app layout with nav drawer, stub pages for all eleven screens.
- `public/_redirects` containing `/*    /index.html   200`.
- Vite dev proxy to `localhost:8080`, so CORS never exists in development.

**Done when** the backend boots against a Flyway-built schema with validation on,
which proves entities and migrations agree, and every frontend route renders a
stub inside the layout.

## Stage 2 — Authentication, end to end

The first real demo.

**Backend** — JWT service, authentication filter, security configuration, login
and refresh endpoints, bootstrap admin created from environment variables on
first start, global exception handler producing one error shape for the whole API.

Access token fifteen minutes, refresh token seven days, rotated on every use, and
only its hash stored in the database.

**Frontend** — axios client with both interceptors, token storage in one module,
auth context, protected and role-gated routes, login page.

The refresh handling is one module-level promise. If five requests fail with 401
at once, all five await the same refresh, so exactly one refresh call leaves the
browser. With rotation on, anything else logs the user out mid-task.

**Done when** both roles can log in through the browser, a CES user is bounced
from admin routes, and a corrupted access token silently recovers without the
user noticing.

## Stage 3 — Customers and credit cards

**Backend** — customer create, paginated list, search by name or card number,
soft delete, and the derived Regular/Premium tier. Card add with uniqueness
enforced by both a pre-check and the database index, the duplicate returned as a
409. CES user management with the self-delete guard. Audit logging via one
annotation on controller methods, writing in its own transaction so a failed
operation still leaves a trail and a broken audit table can never break a sale.

**Frontend** — the customer table, which is the flagship screen: server-side
pagination, debounced search, and page plus query held in the URL so the view is
bookmarkable. Search and page reset are written in a single update, which is what
stops the "page 5 of 2 results" bug. Card list with masked numbers, add-card
dialog mapping the 409 onto the field rather than a toast.

**Done when** you can create a customer dated five years ago and see Premium, one
dated six months ago and see Regular, soft-delete one and watch it vanish from
the list while its row survives in MySQL.

## Stage 4 — Transactions and reward processing

The first of the two hard business rules.

**Backend** — generate exactly fifty transactions per card, each between ₹500 and
₹50,000, dated across the last twelve months but never before the customer joined
the bank. Reward processing takes a pessimistic lock on the customer row as its
first statement, reads only unprocessed transactions, credits points rounded
down, and flips the processed flag. A second run therefore finds nothing.

**Frontend** — card-wise transaction table, a generate button, and a processing
result showing transactions processed and points earned. A second click reports
zero as an informational message, not an error. Idempotency should look boring.

**Done when** a concurrency test proves two simultaneous processing runs credit
the points exactly once, and the browser shows the same.

## Stage 5 — Catalog, cart and redemption

The second hard rule, and the heart of the project.

**Backend** — catalog endpoints, cart keyed on the customer rather than the CES
user, which is what makes surviving logout free. Redemption takes the same
customer row lock, sums the cart at current prices, refuses if the balance is
short, writes the redemption with frozen copies of each item's name and price,
deducts, and clears the cart. All in one transaction, so there is no partial path.

**Frontend** — catalog grid with affordability shown per item, cart with a live
total that turns red and says how many points short before the button is ever
pressed, and a receipt afterwards.

**Done when** an over-budget cart is blocked in the UI, rejected by the server if
forced, and leaves the balance and cart untouched.

## Stage 6 — Profile, dashboard, PDF export

- Consolidated customer profile in one request.
- Admin analytics: aggregate queries feeding four tiles and three charts. The
  customer-type breakdown cannot be a simple grouping, because the tier is
  derived, so it is computed in SQL from the association date.
- PDF statement and redemption receipt via OpenPDF, capped at the latest hundred
  transactions so a small instance is never asked to render forty pages.
- Demo seed data: twelve customers, including one exactly on the three-year
  boundary, one a day short, one soft-deleted, one with a cart left full, and
  three deliberately left unprocessed so the rewards button has something to do
  during a demo.

## Stage 7 — Tests, Docker, CI

- Unit tests for the reward calculation and tier boundary, integration tests on
  real MySQL via Testcontainers, and two concurrency tests covering the rules
  above. H2 would not prove anything here, because both rules rest on row locks.
- Coverage measured on services and security only, with an honest threshold.
  A project-wide ninety percent achieved by testing getters fools nobody.
- Multi-stage Dockerfile, compose file for local MySQL plus backend.
- GitHub Actions building and testing on every push.

## Stage 8 — Deployment

Free, no credit card, per the research in `docs/DEPLOYMENT.md`.

| Tier | Where |
|---|---|
| Frontend | Cloudflare Pages, root `frontend`, output `dist` |
| Backend | Render free web service |
| Database | TiDB Cloud Starter, MySQL-compatible, port 4000, TLS required |

Required before deploying:
- Health check pointed at liveness, not readiness, so a slow database wake cannot
  restart-loop the service.
- JVM flags tuned for 512 MB, with serial garbage collection.
- Connection pool lifetimes set under TiDB's idle timeout.
- `CORS_ORIGINS` set to the exact Pages origin, and `Content-Disposition`
  exposed or PDF filenames vanish cross-origin.

Render sleeps after fifteen idle minutes and takes about a minute to wake, so the
frontend starts waking the backend the moment the page loads, and shows a
progress bar with an elapsed counter rather than a spinner that looks hung.

## Stage 9 — Documentation and resume material

- README with architecture diagram, screenshots, live link and local setup.
- A written walkthrough per layer, which is the teaching material, kept outside
  the source so the code stays clean.
- An interview question bank on this specific code: why a pessimistic lock rather
  than optimistic, why the tier is derived rather than stored, why redemption
  copies prices instead of joining, why tokens rotate.
- A two-minute demo script that survives a cold start.

---

## Decisions still open

These change the code, so they need answering as their stage arrives.

1. **Generating transactions twice.** As specified, two requests give a hundred
   transactions. Probably intended for a demo tool, but it means "how many
   transactions does a card have" has no fixed answer. Recommend allowing it.
2. **Deleting the last administrator.** Not covered by the spec. One legal call
   could leave the system with no admin and no way in. Recommend blocking it.
3. **Cart quantity above one.** The redemption line stores a per-item price,
   which implies quantities are supported. Confirm, since it changes the cart API.
4. **Card numbers and soft delete.** A card belonging to a soft-deleted customer
   still holds its number, so that number can never be reused. Recommend keeping
   it simple and saying so.
5. **Editing a customer.** No update endpoint is specified. If one is added, the
   association date must be immutable, or a CES user could promote someone to
   Premium by editing one field.
6. **Refresh tokens across browser tabs.** Two tabs refreshing at once will log
   the user out unless the server allows a short reuse window on the old token.
   Worth adding.
