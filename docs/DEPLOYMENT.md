# Deployment: Free, Long-Term Hosting for the Reward Redemption App

**Researched: 14 September 2026.** Every allowance below was checked against the provider's
current pricing or docs page on that date, and the verifying URL is cited inline. Free tiers move
fast — Heroku, PlanetScale and Railway all killed theirs, **Fly.io no longer has one at all**, and
**Oracle halved its ARM allowance in June 2026 with no announcement**. Re-check before you commit.

Anything that could not be confirmed from a provider's own page is listed in
[Unverified / open questions](#unverified--open-questions). Nothing in this document is quoted from
memory.

**Stack being deployed**

| Tier | What it is |
|---|---|
| Frontend | React SPA, static build output |
| Backend | Spring Boot 3.5.3 fat JAR, Java 21, ~300–500 MB RAM (`backend/pom.xml`) |
| Database | MySQL 8 — mandated by the project spec. MySQL-wire-compatible (TiDB) counts; PostgreSQL does not. |

---

## TL;DR

| | Primary | Fallback |
|---|---|---|
| **Frontend** | Cloudflare Pages | Cloudflare Pages (same) |
| **Backend** | Oracle Cloud Always Free ARM VM (Ampere A1, 2 OCPU / 12 GB) | Render free web service |
| **Database** | MySQL 8 in Docker on that same Oracle VM | TiDB Cloud Starter (serverless, MySQL-wire) |
| **Cold start** | **None** — always-on VM | **Yes** — backend sleeps after 15 min idle, ~1 min to wake |
| **Credit card** | Required (Oracle, $1 auth hold, never charged) | Not required for Render or TiDB |
| **Biggest risk** | Oracle's idle-reclamation policy and its willingness to cut the tier unilaterally | 512 MB RAM is tight for a JVM; Render Hobby gives only 5 GB egress/month |

The primary is the only option here with **no cold start, no sleep, and genuine MySQL 8**. The
fallback is the best zero-ops, no-credit-card option, and it accepts cold starts as the price.

---

## Tier 1 — Frontend (React static SPA)

| Option | Free allowance | CC? | Expires? | Sleeps / cold start | Storage limits | Catch |
|---|---|---|---|---|---|---|
| **Cloudflare Pages** ✅ | 500 builds/mo, 1 concurrent build, 100 projects, 100 custom domains/project. Static-asset **requests are free and unlimited**, and there are **no egress charges** | No | No | **None** (CDN edge) | 20,000 files/site, 25 MiB max file | Only if you add a Pages *Function*: that bills against Workers Free (100k req/day, 10 ms CPU/invocation) and returns **429** when exceeded. A pure static React build never touches this. |
| Vercel Hobby | 100 GB transfer, 1M edge requests, 200 projects, 100 deploys/day | No | No | None | 15,000 source files/deploy | **Commercial use explicitly forbidden** — and "commercial" includes *"a paid employee or consultant writing the code"*. Also **cannot connect to a repo owned by a GitHub org**. Overage is a **hard stop for 30 days**, not a bill. |
| Netlify Free | **300 credits/month, hard cap**, no top-ups on Free | No | No | None | 500 projects | Credits price everything: **20 credits/GB** bandwidth and **15 credits per production deploy**. That is a ceiling of ~15 GB/month, and ~20 deploys alone exhausts the month. At zero credits **all sites are paused** and serve `Site not available`. Applies to accounts created on/after 4 Sep 2025. |
| GitHub Pages | 1 GB site, **soft** 100 GB/mo bandwidth, **soft** 10 builds/hour | No | No | None | 1 GB | **Commercial use explicitly banned**; docs also say sites *"should not be used for sensitive transactions involving passwords"* — this app has a JWT login. Repo must be **public** on GitHub Free. **No server-side rewrites**, so SPA deep links need the `404.html` hack and return HTTP 404. |
| Firebase Hosting (Spark) | 10 GB storage; transfer quota is **contradictory in Google's own docs** — 10 GB/month (Hosting docs) vs 360 MB/day (pricing page) | **No** ("No payment method needed") | No | None | 10 GB | Over the transfer quota *"we offer a short grace period but then your sites will be disabled"*. Cleanest SPA rewrite config of any provider. |
| Azure Static Web Apps Free | 100 GB/mo bandwidth, 10 apps, 2 custom domains/app, 3 preview envs | Likely (Azure subscription) | No | None | **250 MB per app**, 15,000 files | Overage bandwidth is *"Unavailable"* — hard stop, cannot be billed past it. **No SLA** on Free. The 250 MB app cap is the binding constraint. |
| Render Static Sites | Free to deploy, but counts against workspace bandwidth | No | No | None documented for static | — | Hobby workspace bandwidth is **only 5 GB/month**; over it *"Render spins down your workspace's services until the start of the next month"*. |

Sources: [Cloudflare Pages limits](https://developers.cloudflare.com/pages/platform/limits/) ·
[Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/) ·
[Vercel Hobby](https://vercel.com/docs/plans/hobby) ·
[Vercel fair use](https://vercel.com/docs/limits/fair-use-guidelines) ·
[Vercel limits](https://vercel.com/docs/limits) ·
[Netlify credits](https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/how-credits-work/) ·
[GitHub Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits) ·
[Firebase Hosting quotas](https://firebase.google.com/docs/hosting/usage-quotas-pricing) ·
[Firebase pricing](https://firebase.google.com/pricing) ·
[Azure SWA quotas](https://learn.microsoft.com/en-us/azure/static-web-apps/quotas) ·
[Render bandwidth](https://render.com/docs/outbound-bandwidth)

**Winner: Cloudflare Pages.** It is the only option with unmetered static bandwidth, no
commercial-use clause, no hard stop that takes the site offline, and a documented one-line SPA
fallback. Vercel Hobby and GitHub Pages are disqualified outright by their commercial-use bans —
this is a company portal app. Netlify's effective 15 GB/month ceiling *with site pausing* rules it
out for anything real.

---

## Tier 2 — Backend (Spring Boot 3.5 fat JAR, Java 21, 300–500 MB RAM)

| Option | Free allowance | CC? | Expires? | Sleeps / cold start | RAM / disk | Catch |
|---|---|---|---|---|---|---|
| **Oracle Cloud Always Free ARM** ✅ | 1,500 OCPU-hours + 9,000 GB-hours/month = **2 OCPU / 12 GB** continuously. 200 GB block storage, **10 TB/mo egress**, 1 load balancer @10 Mbps, 2× AMD micro VMs (1/8 OCPU, 1 GB) | **Yes**, $1 auth hold, never charged unless you upgrade | **No** — *"Always Free offers that never expire"*; after the 30-day trial *"your account remains active. There is no interruption to the availability of the Always Free Resources"* | **None** — a real always-on VM | 12 GB RAM, 200 GB disk | See [the Oracle catches](#the-oracle-catches) below — idle reclamation, capacity, and a tier Oracle has already cut once. |
| **Render free web service** ✅ (fallback) | 750 instance-hours/month per workspace, 1 instance max | **No** — *"No credit card is required"* | No | **Yes.** Spins down after *"15 minutes without receiving any inbound traffic"*; wake *"takes about one minute"* (platform figure — a JVM on 0.1 CPU adds to it) | **512 MB / 0.1 CPU**, no persistent disk | 0.1 CPU makes JVM startup slow and 512 MB is tight — see [JVM flags](#3-jvm-flags-for-a-small-container). Hobby workspace gets only **5 GB/mo egress** and **500 build minutes/mo**; exhaust either with no card on file and services spin down until the 1st. **Render may also suspend a free service that *"initiates an uncommonly high volume of traffic over the public internet"*** — relevant if you pair it with an external database. Filesystem changes are lost on every restart. |
| Google Cloud Run | Request-based billing: **2M requests, 360,000 GiB-s, 180,000 vCPU-s, 1 GB North-America egress/month**. Instance-based billing gets a *different, larger* grant: **240,000 vCPU-s + 450,000 GiB-s**, no request allowance. *"The Free Tier has no end date"* | **Yes** — a billing account is required | No | **Yes**, scale-to-zero. Spring Boot cold start typically **5–15 s**; `--cpu-boost` helps a lot | Configurable | **vCPU is the binding constraint, not memory**: 180,000 vCPU-s ÷ 1 vCPU = **50 hours/month** of billed time (100 h at 0.5 vCPU), versus ~200 h of the memory grant at 512 MiB. Fine at low traffic with min-instances=0, since idle is not billed; **min-instances=1 does not fit** (~14× over). Only **1 GiB/month free egress**. Beyond free tier you are billed, not stopped. Limits may change on 30 days' notice. |
| Scaleway Serverless Containers | **400,000 GB-s + 200,000 vCPU-s per account per month**, perpetual | **Yes** — €1 authorisation, refunded in 48–72 h | No | **Yes**, scale-to-zero after **15 min** idle | 128–12,228 MB, 70–6,000 mvCPU | The biggest raw free grant here. Catches: **EU regions only** (Paris/Amsterdam/Warsaw); images must be **`linux/amd64`** (an ARM build fails at deploy); Docker `HEALTHCHECK` has no effect — readiness is "port is bound", so connect to the DB *before* binding; a new instance always starts after each deploy even at min-scale 0. |
| Northflank Sandbox | 2 services + 1 addon + 2 jobs, **"Always-on-compute – no sleeping"** | Unverified | No ("free forever") | **None** | **Not published** — table just says "Limited" | Would be the best fit here *if* the undisclosed per-service RAM is ≥512 MB, since it is always-on with a free database addon. Northflank's own docs say Sandbox *"should not be used for production applications"*. Cannot be planned against until you read the plan selector at signup. |
| Azure App Service Free (F1) | Always free, **1 GB RAM**, Java SE fat-JAR supported | Azure subscription | No | **Yes** — no Always On, so the app idles out | 1 GB RAM / 1 GB storage | **60 CPU-minutes per day** (and 3 min per 5 min). A Spring Boot cold start alone eats a real slice of that, and once the daily quota is gone the app returns 403 until reset. **0 custom domains**, no SLA. Marginal at best. |
| Koyeb | Docs still describe one free web service: 512 MB RAM, 0.1 vCPU, 2 GB SSD, Frankfurt or Washington DC only, no Volumes | Effectively yes — new users must subscribe to a paid plan | — | Scales to zero after **1 hour** with no traffic | 512 MB / 0.1 vCPU | **Treat as closed.** Koyeb was [acquired by Mistral AI in Feb 2026](https://www.koyeb.com/blog/koyeb-is-joining-mistral-ai-to-build-the-future-of-ai-infrastructure); its own post says *"The Starter plan will soon be removed and new users will instead need to subscribe to the Pro, Scale, or Enterprise plan"*. The live pricing page **no longer lists any free compute instance**. (The "$29" figure circulating is the **Pro plan's monthly fee**, not a card hold.) |
| **Fly.io** | **No free tier.** Trial is *"2 hours of machine runtime or 7 days of access, whichever comes first"*, and *"adding a card ends the free trial"*. Only free items are 10 hostname certs and 10 GB/mo snapshots | Yes — *"All organizations… require a credit card on file"* | **Yes** | — | — | **Disqualified.** Old free allowances are grandfathered only; it is now pure pay-as-you-go. |
| Clever Cloud | None. Their own position paper is titled *"Why isn't there a free tier in Clever Cloud"* | No, for trial credits | **Yes — credits are finite** | — | — | **Disqualified** by the hard requirement. |
| Back4App Containers | 0.25 CPU / **256 MB** / 100 GB transfer | **No** | No | — | 256 MB | **256 MB will not run Spring Boot 3.5.** Dockerfile mandatory. |
| Zeabur / Qovery / Sevalla / Leapcell | — | — | — | — | — | **All unusable.** Zeabur's "Free" plan is now dashboard-only (bring your own server); Qovery's cheapest ongoing plan is **$2,999/mo** after a 14-day trial; Sevalla's cheapest app pod is $5/mo (only static sites are free); Leapcell's Hobby tier allows **3 GB-hours/month** ≈ 6 hours at 512 MB. |
| Glitch / Adaptable.io | — | — | — | — | — | **Dead.** Glitch app hosting ended 8 July 2025; Adaptable.io deleted all free apps and data on 15 March 2025. |

Sources: [Oracle Always Free resources](https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm) ·
[Oracle Free Tier](https://docs.oracle.com/iaas/Content/FreeTier/freetier.htm) ·
[Oracle signup](https://docs.oracle.com/en-us/iaas/Content/GSG/Tasks/signingup_topic-Sign_Up_for_Free_Oracle_Cloud_Promotion.htm) ·
[Render free tier](https://render.com/docs/free) ·
[Render bandwidth](https://render.com/docs/outbound-bandwidth) ·
[Render compute plans](https://render.com/docs/compute-plans) ·
[Render build pipeline](https://render.com/docs/build-pipeline) ·
[Render health checks](https://render.com/docs/health-checks) ·
[Render web services](https://render.com/docs/web-services) ·
[Cloud Run pricing](https://cloud.google.com/run/pricing) ·
[Google Cloud free features](https://docs.cloud.google.com/free/docs/free-cloud-features) ·
[Cloud Run container contract](https://docs.cloud.google.com/run/docs/container-contract) ·
[Scaleway serverless pricing](https://www.scaleway.com/en/pricing/serverless/) ·
[Scaleway container limits](https://www.scaleway.com/en/docs/serverless-containers/reference-content/containers-limitations/) ·
[Northflank pricing](https://northflank.com/pricing) ·
[Northflank plan docs](https://northflank.com/docs/v1/application/billing/pricing-on-northflank) ·
[Koyeb pricing FAQ](https://www.koyeb.com/docs/faqs/pricing) ·
[Koyeb instances](https://www.koyeb.com/docs/reference/instances) ·
[Fly.io free trial](https://fly.io/docs/about/free-trial/) ·
[Fly.io pricing](https://fly.io/docs/about/pricing/) ·
[Clever Cloud: why no free tier](https://www.clever.cloud/blog/company/2015/04/14/why-isnt-t-there-a-free-tier-in-clever-cloud/) ·
[Back4App pricing](https://www.back4app.com/pricing/container-as-a-service) ·
[Zeabur pricing](https://zeabur.com/pricing) ·
[Qovery pricing](https://www.qovery.com/pricing) ·
[Leapcell pricing](https://leapcell.io/pricing) ·
[Glitch shutdown](https://blog.glitch.com/post/changes-are-coming-to-glitch/) ·
[Adaptable.io shutdown](https://adaptable.io/docs/free-app-hosting)

### The Oracle catches

These are real and you must design around them.

1. **The tier was halved in June 2026, silently.** Ampere A1 Always Free went from 4 OCPU / 24 GB
   (3,000 OCPU-h, 18,000 GB-h) to **2 OCPU / 12 GB** (1,500 OCPU-h, 9,000 GB-h), effective
   15 June 2026, with no blog post and no customer notification. Over-limit instances were
   terminated from 18 August 2026. Oracle can do this again.
   ([InfoQ](https://www.infoq.com/news/2026/07/oracle-cloud-free-tier-limits/),
   [Linuxiac](https://linuxiac.com/oracle-quietly-cuts-free-tier-ampere-a1-resources-in-half/))
2. **Idle reclamation.** Verbatim from Oracle's docs: *"Idle Always Free compute instances may be
   reclaimed by Oracle. Oracle will deem virtual machine and bare metal compute instances as idle
   if, during a 7-day period, the following are true: CPU utilization for the 95th percentile is
   less than 20%; Network utilization is less than 20%; Memory utilization is less than 20%
   (applies to A1 shapes only)."* All three must hold, so **keeping memory above 20% of 12 GB
   (≈2.4 GB) alone prevents reclamation** — which a JVM with `-Xms3g` plus a MySQL buffer pool does
   naturally. This is the single most important mitigation and it is configured in
   [step 4](#4-prevent-oracle-idle-reclamation).
3. **Capacity.** `Out of host capacity` on Ampere A1 is common in popular home regions. You may
   have to retry over days, or pick a less popular home region.
4. **Home region is permanent.** Always Free resources exist *only* in the tenancy's home region,
   and it cannot be changed after signup. Choose carefully.
5. **Accounts have been purged without warning.** There is at least one report on Oracle's own
   community forum of a Free Tier account being terminated and all data deleted with no prior
   alert, while within limits.
   ([Oracle Cloud Customer Connect](https://community.oracle.com/customerconnect/discussion/875400/free-tier-instance-terminated-without-warning-need-urgent-help-recovering-data))
   **Treat the box as disposable: keep backups off-box and keep the whole setup reproducible from
   the repo.**
6. **Two firewalls.** Ports are blocked at the VCN security list / NSG *and* at the instance's
   own `iptables`/`firewalld`. Both must be opened or connections silently fail.
   ([Oracle networking docs](https://docs.oracle.com/en-us/iaas/Content/Network/Concepts/waystosecure.htm))

---

## Tier 3 — Database (MySQL 8 or MySQL-wire-compatible)

| Option | Free allowance | CC? | Expires? | Sleeps / cold start | Connections | Catch |
|---|---|---|---|---|---|---|
| **MySQL 8 in Docker on the Oracle VM** ✅ | Whatever the 12 GB / 200 GB box allows | Via Oracle | No | None | Yours to set | You operate it: backups, upgrades, tuning are on you. But it is **real MySQL 8**, exactly what the spec mandates, with zero compatibility risk. |
| **TiDB Cloud Starter** ✅ (fallback) | **5 GiB row + 5 GiB columnar storage + 50M Request Units per month, per instance**, up to **5 free instances per org** | **No** — *"No credit card is required to get started"* | **No** — permanent free quota, resets monthly | Scales to zero; **resume latency is not documented** | **400 concurrent** — HikariCP's default 10 is fine | On quota exhaustion reads/writes are **throttled and new connections denied**, not billed. MySQL-wire but **not MySQL**: no triggers, stored procedures, UDFs, FULLTEXT, XA. **Foreign keys are supported and GA since TiDB v8.5.0** — important, since this app uses `@ManyToOne`/`@JoinColumn` throughout. Backups only 1 day, no PITR. |
| Oracle MySQL HeatWave Always Free | Shape `MySQL.Free`, **50 GB storage + 50 GB backup**, 16 GB HeatWave node, 10 GB Lakehouse. **One per tenancy, in the home region** | Via Oracle | No | No | Not documented | **Private subnet only — no public endpoint**, so it is reachable only from inside your VCN. That makes it a great pairing with the Oracle VM and *useless* for a backend hosted anywhere else. Also: no HA, no manual backup, no PITR, 1-day retention, no SLA, no Oracle Support. |
| Aiven for MySQL free plan | 1 CPU, **1 GB RAM, 1 GB disk**, single node | **No** — *"Always free. No credit card required. No 30-day trial"* | **No** — *"no trial period and no expiry date"* | **Yes — powers off after inactivity**, with email warning; resume is a **manual power-on** from the console | **76** | **Services powered off for more than 180 days are automatically deleted.** 1 GB disk is very small. DigitalOcean/UpCloud only, no region choice, no VPC, no static IP, not covered by SLA. One service of each type per org. Upside: genuine MySQL 8, full FK/trigger/procedure/FULLTEXT support. |
| Clever Cloud MySQL DEV | — | — | **Yes** (trial credits) | — | — | Free tier reportedly removed Aug 2023; current signup offers finite trial credits. **Disqualified.** |
| filess.io Hobby | 2 databases, **10 MB storage each**, weekly backups | **No** | No | — | Not published | **10 MB** makes it a toy. Shared resources. |
| db4free.net | 200 MB, MySQL 8 | No | No | — | — | The operators say outright: *"If you need a MySQL database for production use, please do not use db4free.net!"* Excess data *"is automatically purged"*. |
| PlanetScale | — | — | — | — | — | **Dead.** Hobby free tier killed April 2024. |

Sources: [TiDB Starter limitations](https://docs.pingcap.com/tidbcloud/serverless-limitations/) ·
[TiDB Starter FAQs](https://docs.pingcap.com/tidbcloud/serverless-faqs/) ·
[TiDB foreign keys](https://docs.pingcap.com/tidb/stable/foreign-key/) ·
[TiDB MySQL compatibility](https://docs.pingcap.com/tidb/stable/mysql-compatibility/) ·
[Oracle Always Free DB system](https://docs.oracle.com/en-us/iaas/mysql-database/doc/creating-always-free-db-system.html) ·
[Aiven MySQL free tier](https://aiven.io/docs/products/mysql/concepts/mysql-free-tier) ·
[Aiven free MySQL](https://aiven.io/free-mysql-database) ·
[Aiven power cycle](https://aiven.io/docs/platform/concepts/service-power-cycle) ·
[filess.io](https://filess.io/) · [db4free.net](https://db4free.net/)

> **Note on Aiven.** `https://aiven.io/pricing?product=mysql` rendered for us as though MySQL had
> no free plan. The MySQL-specific docs and landing page both clearly state it does. Trust the
> docs pages cited above.

---

## Primary recommendation

> ### Cloudflare Pages (frontend) + Oracle Cloud Always Free ARM VM running both Spring Boot and MySQL 8 (backend + database)

**Why.**

- **It is the only combination with no cold start and no spin-down anywhere in the stack.** The VM
  is always on; the SPA is served from Cloudflare's edge.
- **12 GB of RAM against a 300–500 MB app** means no JVM tuning games, room for MySQL's buffer
  pool, and headroom for a reverse proxy — versus 512 MB total on Render.
- **Genuine MySQL 8**, which is what the spec mandates. No wire-compatibility caveats, no missing
  foreign keys, no missing stored procedures.
- **Both free tiers are permanent, not trials.** Oracle: *"Always Free offers that never expire."*
  Cloudflare Pages has no trial language and no expiry.
- **10 TB/month egress** on Oracle, versus 5 GB on Render Hobby and 1 GB on Cloud Run.

**What you are accepting.** You become the sysadmin: OS patching, MySQL backups, TLS renewal and
uptime are yours. Oracle requires a credit card. And Oracle has demonstrated — in June 2026 — that
it will cut the tier without telling anyone, so keep the whole thing reproducible and keep backups
off the box.

## Fallback recommendation

> ### Cloudflare Pages (frontend) + Render free web service (backend) + TiDB Cloud Starter (database)

**Why.** Zero operations, **no credit card anywhere**, and both free tiers are permanent rather
than trials. Deploys are git-push simple. Choose this if you cannot or will not give Oracle a card,
if Ampere A1 capacity is unobtainable in your region, or if you simply do not want to run a server.

**What you are accepting — call this out to stakeholders:**

- **Cold starts.** Render spins the backend down after 15 minutes of no inbound traffic and takes
  *"about one minute"* to wake. The first request after an idle period will appear to hang. On
  0.1 CPU, a Spring Boot fat JAR's start-up is at the slow end of that.
- **512 MB total**, which a default-configured JVM will overrun. The flags in
  [step 3](#3-jvm-flags-for-a-small-container) are mandatory here, not optional.
- **5 GB/month egress and 500 build minutes/month** on the Hobby workspace; exhaust either with no
  card on file and your services spin down until the 1st.
- **750 instance-hours/month** across the whole workspace. A calendar month is ~730 hours, so
  750 h looks like enough for one always-on service — but it leaves almost no margin and none at
  all for a second service. Spun-down time does not consume hours, which is what makes the free
  tier work at all.
- **Render may suspend a free service that *"initiates an uncommonly high volume of traffic over
  the public internet"*.** This combination puts the database on a different provider, so every
  query is public-internet egress. Keep query volume modest, and be aware that recovering from
  such a suspension requires moving to a paid plan.
- Useful quirk: crawler requests to `/robots.txt` are answered by Render with a "disallow all" and
  *"do not reach your service or trigger a spin-up"* — so bots will not keep your instance-hours
  burning.
- **TiDB is MySQL-wire, not MySQL.** Foreign keys are fine (GA since v8.5.0), but triggers, stored
  procedures, UDFs, FULLTEXT and XA are not supported. This app uses plain JPA, so it fits — but do
  not add a `MATCH … AGAINST` native query later.
- Keeping the free instance awake with an external pinger burns your 750 instance-hours and, on
  Render, is against the spirit of the tier. Prefer accepting the cold start.

### Why not Google Cloud Run or Scaleway?

Both are genuinely perpetual and both are technically excellent, so they deserve an explicit
rejection rather than silence.

- **Cloud Run** has the best-documented perpetual grant of any serverless option and a 5–15 s JVM
  cold start (better than Render's). It loses on two points: it **requires a billing account with a
  card**, and — unlike every other option here — **exceeding the free tier bills you rather than
  stopping you**. With only **1 GiB/month of free egress** for a JSON API, an accidental traffic
  spike becomes an invoice. For a "must be free forever, no surprises" requirement, a hard stop is
  a feature and a bill is a bug. If you are comfortable setting a billing budget alarm and capping
  max-instances, Cloud Run is a very strong third choice.
- **Scaleway Serverless Containers** has the largest raw grant (400,000 GB-s + 200,000 vCPU-s), but
  is **EU-region only**, requires a card, and is `linux/amd64` only. It is a good option if your
  users are in Europe.

---

## Deploying the primary recommendation

### Prerequisites and app changes

Three changes to the repo are needed before any of this works. They are cheap and they also make
the fallback work.

#### 1. Bind to the platform's `PORT`

`backend/src/main/resources/application.yml` currently reads:

```yaml
server:
  port: ${SERVER_PORT:8080}
```

Most container platforms use **`PORT`**, not `SERVER_PORT`. As written, the app would ignore the
assigned port and the platform's health check would fail. Make it accept either, falling back to
8080:

```yaml
server:
  port: ${PORT:${SERVER_PORT:8080}}
```

You must also **bind to `0.0.0.0`, not `127.0.0.1`** — Spring Boot's default is all interfaces, so
just do not set `server.address`.

Per-platform specifics:

- **Cloud Run** *injects* `PORT` (default 8080) and requires you to listen on `0.0.0.0`. Instances
  *"must listen for requests within 4 minutes after being started"*.
  ([container contract](https://docs.cloud.google.com/run/docs/container-contract))
- **Render** works the other way round: **you** set `PORT` as an env var and Render's *"default
  expected port is `10000`"*. Either set `PORT=8080` in the dashboard, or leave it and let the
  config above pick Render's value up. ([web services](https://render.com/docs/web-services))
- **Scaleway** injects `PORT` and treats "port is bound" as readiness — so open your DB connections
  *before* the server binds. Docker `HEALTHCHECK` directives are ignored.
- **Oracle VM**: irrelevant, you control the port. But making the change now means the same
  artifact deploys to the fallback without edits.

#### 2. Add a health check endpoint

`backend/pom.xml` has **no Actuator dependency**, so there is currently no health endpoint for a
platform or a load balancer to probe. Add:

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>
```

and expose only what you need — the app uses Spring Security, so the endpoint must also be
permitted in your `SecurityFilterChain`:

```yaml
management:
  endpoints:
    web:
      exposure:
        include: health
  endpoint:
    health:
      probes:
        enabled: true
      show-details: never
```

That gives you `/actuator/health`, plus `/actuator/health/liveness` and `/actuator/health/readiness`.
Use **readiness** for load-balancer and platform health checks: it goes UP only once the
datasource and the web server are actually ready.

On **Render**, the default probe is a plain TCP connect to the open port; you can set
`healthCheckPath` to `/actuator/health/readiness` instead, but note the probe must return 2xx/3xx
**within five seconds** or it counts as a failure — so keep `show-details: never` and do not add
slow custom health indicators. ([Render health checks](https://render.com/docs/health-checks))

#### 3. JVM flags for a small container

Do not set `-Xmx` to a fixed value in a container. Use percentages so the JVM tracks the cgroup
limit (`-XX:+UseContainerSupport` is on by default since Java 10):

```bash
# Oracle VM (12 GB available, app gets its own share) — also satisfies idle reclamation
JAVA_OPTS="-XX:MaxRAMPercentage=75 -Xms3g -XX:+UseG1GC -XX:+ExitOnOutOfMemoryError"

# Render / any 512 MB container — leave headroom for metaspace, threads and native memory
JAVA_OPTS="-XX:MaxRAMPercentage=70 -XX:+UseSerialGC -Xss512k -XX:+ExitOnOutOfMemoryError"
```

Notes:
- `MaxRAMPercentage=70` on 512 MB gives ~358 MB of heap and leaves ~154 MB for metaspace, thread
  stacks, code cache and the GC's own structures. Going higher gets you OOM-killed.
- `UseSerialGC` beats G1 on a 0.1-CPU single-core-equivalent instance — G1's background threads
  are pure overhead there.
- `-Xms3g` on the Oracle box is deliberate: it pins resident memory above the 20% threshold in
  Oracle's idle-reclamation rule. See step 4.
- `-XX:+ExitOnOutOfMemoryError` makes the container die and restart rather than limp on.

#### 4. Prevent Oracle idle reclamation

Oracle reclaims an A1 instance only if, over 7 days, 95th-percentile CPU **and** network **and**
memory are *all* below 20%. Memory is the cheapest one to hold above the line: on a 12 GB box you
need ~2.4 GB resident. Between `-Xms3g` on the JVM and MySQL's InnoDB buffer pool, you clear it
comfortably and permanently, with no cron-job CPU-burning hacks.

Set the buffer pool explicitly in your MySQL config:

```
innodb_buffer_pool_size = 2G
```

### Step by step

#### A. Create the Oracle tenancy and the VM

1. Sign up at Oracle Cloud Free Tier. A credit card is required for identity verification: it is
   authorised for **$1**, which is a hold that drops off, and *"your credit card will not be
   charged unless you upgrade your account"*
   ([signup docs](https://docs.oracle.com/en-us/iaas/Content/GSG/Tasks/signingup_topic-Sign_Up_for_Free_Oracle_Cloud_Promotion.htm)).
2. **Choose your home region carefully — it is permanent**, and Always Free resources exist only
   there. Less popular regions have better Ampere A1 capacity.
3. Create a compute instance:
   - Shape: **VM.Standard.A1.Flex**, **2 OCPU / 12 GB** (the current Always Free maximum).
   - Image: Ubuntu 22.04/24.04 LTS (aarch64) or Oracle Linux 9 (aarch64).
   - Boot volume: ≤ 200 GB total across all volumes.
   - Add your SSH public key.
   - If you get `Out of host capacity`, retry — it is transient and region-dependent. Do not
     create an AMD micro instance instead; 1 GB will not run this stack.
4. Assign a **reserved** public IPv4 (not ephemeral) so the address survives instance restarts.

#### B. Open the ports — both layers

**VCN layer:** Networking → your VCN → subnet → Security List → add ingress rules for TCP 80 and
443 from `0.0.0.0/0`. Do **not** open 3306 or 8080 to the internet.

**Instance layer:**

```bash
# Ubuntu
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo netfilter-persistent save

# Oracle Linux
sudo firewall-cmd --permanent --zone=public --add-port=80/tcp
sudo firewall-cmd --permanent --zone=public --add-port=443/tcp
sudo firewall-cmd --reload
```

Forgetting the instance-level firewall is the single most common Oracle Cloud failure: the cloud
console shows everything as correct and connections just time out.

#### C. Install Docker and bring up MySQL 8

```bash
sudo apt-get update && sudo apt-get install -y docker.io docker-compose-plugin
sudo usermod -aG docker $USER && newgrp docker
```

`/opt/rewards/docker-compose.yml`:

```yaml
services:
  mysql:
    image: mysql:8.4
    restart: always
    command: ["--innodb-buffer-pool-size=2G", "--max-connections=100"]
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: ces_rewards
      MYSQL_USER: ${DB_USERNAME}
      MYSQL_PASSWORD: ${DB_PASSWORD}
    volumes:
      - mysql-data:/var/lib/mysql
    ports:
      - "127.0.0.1:3306:3306"     # loopback only — never expose MySQL publicly
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      retries: 10

  backend:
    image: ghcr.io/abhishekojha2478/rewardredemptionapp-backend:latest
    restart: always
    depends_on:
      mysql:
        condition: service_healthy
    environment:
      JAVA_OPTS: "-XX:MaxRAMPercentage=75 -Xms3g -XX:+UseG1GC -XX:+ExitOnOutOfMemoryError"
      DB_HOST: mysql
      DB_PORT: "3306"
      DB_NAME: ces_rewards
      DB_USERNAME: ${DB_USERNAME}
      DB_PASSWORD: ${DB_PASSWORD}
      JWT_SECRET: ${JWT_SECRET}
      CORS_ORIGINS: ${CORS_ORIGINS}
      SEED_ADMIN_USERNAME: ${SEED_ADMIN_USERNAME}
      SEED_ADMIN_PASSWORD: ${SEED_ADMIN_PASSWORD}
      SEED_ADMIN_EMAIL: ${SEED_ADMIN_EMAIL}
    ports:
      - "127.0.0.1:8080:8080"     # only Caddy talks to it
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:8080/actuator/health/readiness"]
      interval: 30s
      retries: 5

  caddy:
    image: caddy:2
    restart: always
    ports: ["80:80", "443:443"]
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy-data:/data
    network_mode: host

volumes: { mysql-data: {}, caddy-data: {} }
```

`mysql:8.4` publishes an `arm64` manifest, so it runs natively on Ampere — verify with
`docker manifest inspect mysql:8.4 | grep arm64` before relying on it.

#### D. Backend container image

`backend/Dockerfile` — multi-stage, so CI does not need a JDK on the runner:

```dockerfile
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn -B dependency:go-offline
COPY src ./src
RUN mvn -B clean package -DskipTests

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/target/reward-redemption-1.0.0.jar app.jar
EXPOSE 8080
ENV JAVA_OPTS=""
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar app.jar"]
```

`exec` matters: without it the JVM is not PID 1 and will not receive `SIGTERM`, so shutdowns
become 10-second kills and connections are dropped mid-request.

#### E. TLS and reverse proxy

Point a domain at the reserved public IP. If you have no domain, DuckDNS gives you up to 5 free
`*.duckdns.org` subdomains. Then let Caddy obtain and renew Let's Encrypt certificates
automatically.

`/opt/rewards/Caddyfile`:

```
api.example.com {
    encode gzip zstd
    reverse_proxy localhost:8080
}
```

That is the whole TLS configuration — Caddy provisions and renews certs on its own, provided ports
80 and 443 are open at *both* firewall layers.

#### F. Deploy the React SPA to Cloudflare Pages

1. **Build command:** `npm ci && npm run build`
2. **Output directory:** `dist`.
   Vite writes the built site flat into `dist/`, so that is the whole path. Set the
   Pages project's **root directory** to `frontend`, since this is a monorepo and the
   React app is not at the repository root.
   ([Vite build docs](https://vite.dev/guide/build))
3. **SPA fallback routing.** Without this, a refresh on `/rewards/42` returns 404 because no such
   file exists. Add `public/_redirects` (Vite copies everything in `public/` into the
   build output verbatim), containing exactly:

   ```
   /*    /index.html   200
   ```

   Status **200** makes it a rewrite rather than a redirect, so the URL in the address bar is
   preserved and React Router picks it up on the client. Real files are not shadowed by it.
   ([Cloudflare redirects](https://developers.cloudflare.com/pages/configuration/redirects/))
4. Add your custom domain in the Pages project; TLS is issued automatically and is free.
5. Set `CORS_ORIGINS` on the backend to the exact Pages origin (scheme + host, no trailing slash),
   e.g. `https://rewards.example.com`. A mismatch here is the usual cause of "it works in Postman
   but not in the browser".

---

## Environment variables and secrets

Everything below is already parameterised in `application.yml` — nothing is hardcoded except the
insecure defaults, which exist for local development only.

| Variable | Purpose | Default in repo | Must override in production? |
|---|---|---|---|
| `PORT` / `SERVER_PORT` | HTTP listen port | `8080` | Only on platforms that assign one |
| `DB_HOST`, `DB_PORT`, `DB_NAME` | Datasource location | `localhost`, `3306`, `ces_rewards` | Yes |
| `DB_USERNAME`, `DB_PASSWORD` | Datasource credentials | `ces_app` / `ces_app_pw` | **Yes — secret** |
| `JWT_SECRET` | HS256 signing key, **must be ≥ 32 bytes** | a base64 dev placeholder | **Yes — secret.** The committed default is publicly readable; anyone could forge tokens. |
| `JWT_EXPIRATION_MINUTES` | Token lifetime | `120` | Optional |
| `CORS_ORIGINS` | Allowed browser origins | `http://localhost:4200` | **Yes** — set to the Pages URL |
| `SEED_ADMIN_USERNAME`, `SEED_ADMIN_PASSWORD`, `SEED_ADMIN_EMAIL` | Bootstrap admin account | `admin` / `Admin@123` | **Yes — secret.** `Admin@123` on a public URL is an open door. |

### Two datasource URL changes for any hosted database

The current JDBC URL is written for a local MySQL:

```
jdbc:mysql://${DB_HOST}:${DB_PORT}/${DB_NAME}?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
```

- `useSSL=false` — fine over Docker loopback on the Oracle box, **unacceptable** for TiDB or Aiven,
  which require TLS. Make the query string an env var (`DB_PARAMS`) rather than editing code per
  environment.
- `createDatabaseIfNotExist=true` — will fail on managed services where your user cannot create
  schemas. Drop it and pre-create the database.

Also consider moving `spring.jpa.hibernate.ddl-auto` from `update` to `validate` for production and
managing schema with Flyway or Liquibase. `update` never drops or alters safely, and it silently
diverges from your entities over time.

**If you use the TiDB fallback**, the connection differs from stock MySQL in three ways:

```
jdbc:mysql://gateway01.<region>.prod.aws.tidbcloud.com:4000/<db>?sslMode=VERIFY_IDENTITY
```

- Port **4000**, not 3306.
- Username carries an instance prefix: `<prefix>.root`.
- Use `org.hibernate.dialect.TiDBDialect`, not `MySQLDialect`.
- Cap the connection lifetime below TiDB's 340-second AWS Global Accelerator idle timeout, or you
  will see sporadic `CommunicationsException`:
  ```yaml
  spring.datasource.hikari.max-lifetime: 280000
  spring.datasource.hikari.idle-timeout: 120000
  ```

### Wiring secrets through GitHub Actions

Store every secret as a **repository secret** (Settings → Secrets and variables → Actions →
Secrets), and non-secret config as **variables** on the same page. Never put them in
`application.yml`. Note that `.gitignore` already excludes `.env` and `application-local.yml` —
keep it that way.

GitHub Actions is free and unlimited for **public** repositories; a private repo on GitHub Free
gets **2,000 Linux minutes/month** plus 500 MB of artifact storage.
([GitHub billing docs](https://docs.github.com/en/billing/concepts/product-billing/github-actions))

**Secrets to create:** `SSH_PRIVATE_KEY`, `SSH_HOST`, `SSH_USER`, `DB_PASSWORD`,
`MYSQL_ROOT_PASSWORD`, `JWT_SECRET`, `SEED_ADMIN_PASSWORD`, `CLOUDFLARE_API_TOKEN`,
`CLOUDFLARE_ACCOUNT_ID`.
**Variables:** `CORS_ORIGINS`, `DB_USERNAME`, `SEED_ADMIN_USERNAME`, `SEED_ADMIN_EMAIL`.

`.github/workflows/deploy-backend.yml`:

```yaml
name: Deploy backend
on:
  push:
    branches: [main]
    paths: ['backend/**', '.github/workflows/deploy-backend.yml']

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v4

      - uses: docker/setup-qemu-action@v3        # needed to build arm64 on an x86 runner
      - uses: docker/setup-buildx-action@v3

      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}   # provided automatically, do not create it

      - uses: docker/build-push-action@v6
        with:
          context: ./backend
          platforms: linux/arm64                  # Ampere A1 is ARM
          push: true
          tags: ghcr.io/${{ github.repository }}-backend:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max

      - name: Deploy over SSH
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.SSH_HOST }}
          username: ${{ secrets.SSH_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          envs: DB_USERNAME,DB_PASSWORD,MYSQL_ROOT_PASSWORD,JWT_SECRET,CORS_ORIGINS,SEED_ADMIN_USERNAME,SEED_ADMIN_PASSWORD,SEED_ADMIN_EMAIL
          script: |
            cd /opt/rewards
            docker compose pull backend
            docker compose up -d
            docker image prune -f
        env:
          DB_USERNAME: ${{ vars.DB_USERNAME }}
          DB_PASSWORD: ${{ secrets.DB_PASSWORD }}
          MYSQL_ROOT_PASSWORD: ${{ secrets.MYSQL_ROOT_PASSWORD }}
          JWT_SECRET: ${{ secrets.JWT_SECRET }}
          CORS_ORIGINS: ${{ vars.CORS_ORIGINS }}
          SEED_ADMIN_USERNAME: ${{ vars.SEED_ADMIN_USERNAME }}
          SEED_ADMIN_PASSWORD: ${{ secrets.SEED_ADMIN_PASSWORD }}
          SEED_ADMIN_EMAIL: ${{ vars.SEED_ADMIN_EMAIL }}
```

Because the Ampere A1 is ARM, the image **must** be built for `linux/arm64`. Building the default
`linux/amd64` on the runner and pushing it produces an `exec format error` on the VM.

`.github/workflows/deploy-frontend.yml`:

```yaml
name: Deploy frontend
on:
  push:
    branches: [main]
    paths: ['frontend/**', '.github/workflows/deploy-frontend.yml']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
          cache-dependency-path: frontend/package-lock.json

      - run: npm ci
        working-directory: frontend
      - run: npm run build
        working-directory: frontend

      - uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: pages deploy frontend/dist --project-name=reward-redemption
```

The Cloudflare API token needs only the **Cloudflare Pages: Edit** permission — do not use a global
API key.
([Cloudflare CI docs](https://developers.cloudflare.com/pages/how-to/use-direct-upload-with-continuous-integration/))

### Backups — do not skip this

Given the reports of Oracle free accounts being purged, treat the VM as disposable:

```bash
# /etc/cron.daily/rewards-backup
docker compose -f /opt/rewards/docker-compose.yml exec -T mysql \
  mysqldump -u root -p"$MYSQL_ROOT_PASSWORD" --single-transaction ces_rewards \
  | gzip > /opt/rewards/backups/ces_rewards-$(date +%F).sql.gz
find /opt/rewards/backups -name '*.sql.gz' -mtime +14 -delete
```

Then copy those off the box — Oracle Object Storage Always Free gives you 20 GB, but storing
backups in the same tenancy that might be purged defeats the purpose. Push them somewhere else.

---

## Unverified / open questions

Flagged honestly; do not treat these as established.

1. **Firebase Spark transfer quota is self-contradictory in Google's own docs** — 10 GB/month on
   the [Hosting quotas page](https://firebase.google.com/docs/hosting/usage-quotas-pricing) versus
   360 MB/day on the [pricing page](https://firebase.google.com/pricing). Unresolved.
2. **Credit-card requirements** for Cloudflare, Vercel, Netlify and Azure could not be confirmed
   from any provider page stating it in words; they are inferred from the absence of a payment step
   at signup. Only Oracle (required), Aiven (explicitly not required), TiDB (explicitly not
   required), Firebase (*"No payment method needed"*), Koyeb (required, $29 hold) and Fly.io
   (required) are directly verified.
3. **Cloudflare Pages bandwidth** is not stated on the Pages limits page. "Unlimited" rests on the
   Workers pricing page's *"Requests to static assets are free and unlimited"* and *"no additional
   charges for data transfer (egress)"*.
4. **Cloudflare Pages' long-term future.** There is **no official deprecation notice**, but new
   feature work lands on Workers Static Assets first and a migration guide exists. If Pages is ever
   sunset, the migration is small: SPA fallback becomes
   `assets.not_found_handling = "single-page-application"` instead of a `_redirects` file.
5. **TiDB Cloud Starter cold-start/resume latency after scaling to zero is not documented
   anywhere.** PingCAP markets scale-to-zero but publishes no figure. Budget a slow first query and
   set a generous HikariCP `connection-timeout`.
6. **TiDB inactivity deletion:** no such policy appears in the docs. That is *absence of a
   documented policy*, not a guarantee.
7. **Aiven's exact inactivity threshold before a free service powers off is not published.** Only
   the "powered off for more than 180 days → deleted" rule is documented.
8. **Northflank's free Sandbox plan does not publish per-service vCPU/RAM** (the comparison table
   just says "Limited"), nor whether a credit card is required, nor whether its free addon can be
   MySQL, nor its port/health-check contract. It looks compelling — always-on, no sleeping, free
   database addon — and **if its RAM cap is ≥512 MB it would be the best backend option in this
   entire document**. Worth checking the plan selector at signup before settling for the fallback.
9. **Oracle `MySQL.Free` `max_connections`** is not documented. With 8 GiB of RAM on that shape it
   will comfortably exceed HikariCP's default 10, but the number is unconfirmed.
10. **Oracle MySQL HeatWave version.** Oracle's CLI example shows **MySQL 9.0.1**, not 8.x. The
    project spec says MySQL 8; 9.x is a superset and wire-compatible, but whether an 8.4 LTS
    version can be selected on the free shape was not confirmed. Moot under the primary
    recommendation, which uses `mysql:8.4` in Docker.
11. **Oracle's 2 free reserved public IPv4 addresses** come from a secondary source, not Oracle's
    own pricing page.
12. **Render cold-start time for this specific app** is untested. Render documents *"about one
    minute"* generally; a Spring Boot fat JAR on 0.1 CPU may be slower. Measure before promising an
    SLA to anyone.
13. **Clever Cloud's current MySQL add-on pricing table** could not be fetched; the conclusion that
    the free DEV plan is gone is strongly indicated but not quoted from their own pricing table.
14. **Koyeb signup availability** for the free tier after the Mistral AI acquisition is reported by
    third parties, not stated on Koyeb's own docs.
15. **Cloudflare Zero Trust free seat count** (for Cloudflare Tunnel, an alternative to opening
    ports on the Oracle VM) was not confirmed; only the 1,000-tunnels-per-account limit was.
16. **IBM Cloud Code Engine.** IBM's docs confirm only that *"Code Engine includes a free tier"*.
    The widely-cited "100,000 vCPU-seconds + 200,000 GB-seconds/month" could **not** be verified on
    any IBM page — their pricing pages are JS-rendered and returned no numbers. If those figures
    are real it is roughly 55 h/month at 0.5 vCPU, which would make it a serious contender. Worth
    checking manually.
17. **Scaleway billing during the 15-minute idle window** before scale-to-zero is inferred from the
    pricing model, not stated by Scaleway. If idle time *is* billed, the effective allowance is
    ~111 h/month at 500 mvCPU rather than the headline number.
18. **WSO2 Choreo** has contradictory official sources: the pricing page shows only a 2-week trial,
    while the docs FAQ still describes a free Developer plan with up to 5 components. Component
    CPU/memory limits are undocumented. Treat as in flux.
19. **Alwaysdata's free plan** (100 MB storage, 256 MB RAM) lists Java as supported, but whether a
    free account may run a long-lived custom daemon such as a fat JAR is not stated. 100 MB of disk
    would not comfortably hold the JAR anyway.
20. **Back4App's "600 active hours/month, 5 projects"** appears only in third-party sources, not on
    its official pricing page, and its PORT/health-check contract is undocumented. Moot — 256 MB is
    too small regardless.

---

## Appendix — the small "free MySQL host" services, checked one by one

These come up in every search result for free MySQL hosting. All eight were
checked against their own sites in September 2026, including opening a TCP
connection to the advertised database port and reading the server greeting.
Most are not usable. Recorded here so nobody loses an evening to them.

| Service | State | Engine seen on the wire | TLS | Max connections | Verdict |
|---|---|---|---|---|---|
| Alwaysdata Free | Alive | MariaDB 10.11 / 11.8 | Yes | 40 | Usable, with policy catches |
| filess.io | Alive | MySQL 8.0 / 5.7 | Required | 5 | Usable only with a reduced pool |
| FreeSQLDatabase.com | Alive | MySQL 5.5.62 on Ubuntu 14.04 | None | Not published | Avoid |
| remotemysql.com | Signups closed | MariaDB 10.6.28 | None | Unpublished | Dead to new users |
| InfinityFree | Alive | MySQL 8.0 claimed | n/a | n/a | Remote access blocked by design |
| db4free.net | Gone | n/a | n/a | n/a | Domain now redirects elsewhere |
| freemysqlhosting.net | Website unreachable | MySQL 5.5.x still answering | None | Unpublished | Treat as dead |
| Scaleway | Alive | PostgreSQL only | n/a | n/a | No free MySQL exists |

### The two that work, and what they cost you

**Alwaysdata Free** is the strongest on paper: 1 GB of storage, real TLS, no
credit card, and 40 simultaneous connections, which means the default Spring
Boot connection pool of 10 works untouched. Three catches. It is MariaDB, not
MySQL, on the free plan. The account is suspended if you do not log into their
web panel at least once every 120 days. And their own terms forbid both
commercial use and using a free pack to host only a database, which is exactly
what we would be doing.

**filess.io** offers genuine MySQL 8.0 with TLS required and no credit card,
but caps the free tier at five concurrent connections. Spring Boot opens ten by
default, so the application would fail on startup unless the pool is capped at
three or four. Storage is 10 MB per database, which is enough for a demo and
nothing more.

### Why this strengthens the main recommendation

Every one of these services is either dead, closed, insecure, or carries a
restriction that this project would violate. Running MySQL 8 in a container on
the Oracle virtual machine avoids all of it: a real MySQL, no connection cap, no
inactivity deletion, no terms about commercial use, and the database sits on the
same host as the backend so nothing crosses the public internet.

Keep filess.io in mind only as an emergency stand-in, and remember to cap the
pool if you ever use it.
