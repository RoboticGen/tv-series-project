# RoboticGen Projects — How to Run

An Instructables-style platform where students publish step-by-step project write-ups, mentors/admins review them before they go public, and the community likes, stars, and builds from them.

---

## Architecture overview

```mermaid
flowchart LR
    subgraph Client
        UI[Next.js 16 · React 19]
    end
    UI -->|auth, metadata, likes, review| PG[(PostgreSQL 16)]
    UI -->|project & submission bodies| MDB[(MongoDB 7)]
    UI -->|upload / serve images| DISK[(Local disk)]
    PG -. content_doc_id .-> MDB
    PG -. file_path .-> DISK
```

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, Tailwind CSS v4, shadcn/ui |
| ORM | Drizzle ORM (query typing only — SQL files own the schema) |
| Auth | Auth.js v5 · Google OAuth · JWT sessions |
| Relational DB | PostgreSQL 16 (Docker) |
| Document DB | MongoDB 7 (Docker) |
| Image storage | Local disk via `STORAGE_ROOT` env var |

---

## Prerequisites

| Tool | Minimum version |
|---|---|
| Node.js | 20 |
| npm | 10 |
| Docker Desktop (or Docker Engine + Compose plugin) | Any current release |

---

## 1 — Start the databases

Both PostgreSQL and MongoDB run in Docker. The schema is bootstrapped automatically from `database/init/*.sql` the first time the `pgdata` volume is created.

```bash
cd database
docker compose up -d
```

Verify both containers are healthy:

```bash
docker compose ps
```

**Default connection strings (used in the next step):**

| Database | URI |
|---|---|
| PostgreSQL | `postgresql://roboticgen:roboticgen@localhost:5432/roboticgen` |
| MongoDB | `mongodb://roboticgen:roboticgen@localhost:27017` |

> To use custom credentials, create `database/.env` before running `docker compose up -d`:
> ```env
> POSTGRES_USER=myuser
> POSTGRES_PASSWORD=mysecret
> POSTGRES_DB=mydb
> POSTGRES_PORT=5432
> MONGO_USER=myuser
> MONGO_PASSWORD=mysecret
> MONGO_PORT=27017
> ```

---

## 2 — Configure the frontend

Create `frontend/.env.local` with the following variables:

```env
# ── PostgreSQL ────────────────────────────────────────────────────────────────
DATABASE_URL=postgresql://roboticgen:roboticgen@localhost:5432/roboticgen

# ── MongoDB ───────────────────────────────────────────────────────────────────
MONGODB_URI=mongodb://roboticgen:roboticgen@localhost:27017
MONGODB_DB=roboticgen

# ── Google OAuth (Auth.js v5) ─────────────────────────────────────────────────
# Create credentials at https://console.cloud.google.com/apis/credentials
# Authorised redirect URI: http://localhost:3000/api/auth/callback/google
CLIENT_ID=your-google-client-id
CLIENT_SECRET=your-google-client-secret

# Auth.js session secret — any long random string, e.g.:
#   openssl rand -base64 32
AUTH_SECRET=your-auth-secret

# ── Image storage ─────────────────────────────────────────────────────────────
# Absolute path to a directory where uploaded images will be stored.
# Must be outside frontend/public/ (reads are served through the API, not statically).
STORAGE_ROOT=/tmp/roboticgen-uploads
```

### Getting Google OAuth credentials

1. Go to [Google Cloud Console → APIs & Services → Credentials](https://console.cloud.google.com/apis/credentials).
2. Create an **OAuth 2.0 Client ID** (Application type: **Web application**).
3. Add `http://localhost:3000/api/auth/callback/google` as an **Authorised redirect URI**.
4. Copy the **Client ID** and **Client Secret** into `.env.local`.

---

## 3 — Install dependencies and run the frontend

```bash
cd frontend
npm install
npm run dev
```

The app is now available at **[http://localhost:3000](http://localhost:3000)**.

---

## 4 — Other frontend commands

| Command | Description |
|---|---|
| `npm run dev` | Development server with hot reload |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |
| `npx drizzle-kit studio` | Browse the database in a local GUI (requires `DATABASE_URL`) |

---

## 5 — Stopping the databases

```bash
cd database
docker compose down          # stop containers, keep data volumes
docker compose down -v       # stop and delete all data (clean slate)
```

---

## Project structure

```
.
├── database/
│   ├── docker-compose.yml   # PostgreSQL + MongoDB services
│   ├── init/                # SQL bootstrap scripts (run once on first volume creation)
│   │   ├── 001_extensions.sql
│   │   ├── 002_types.sql
│   │   ├── 003_functions.sql
│   │   ├── 004_tables.sql
│   │   └── 005_views.sql
│   └── README.md            # Schema design rationale
├── docs/
│   ├── features.md          # Feature reference
│   └── README.md            # This file
└── frontend/
    ├── src/
    │   ├── app/             # Next.js App Router pages and API routes
    │   ├── auth.ts          # Auth.js configuration (Google OAuth)
    │   ├── components/      # Shared UI components
    │   ├── db/              # Drizzle client, MongoDB client, schema
    │   ├── lib/             # Utilities (storage, slugs, validation, etc.)
    │   └── types/
    ├── drizzle.config.ts    # Drizzle Kit config (studio only)
    └── package.json
```

---

## User roles

| Role | Capabilities |
|---|---|
| `student` | Create projects (draft → pending review), submit builds |
| `mentor` | Everything a student can do + approve / reject pending projects |
| `admin` | Full access including role management |

Roles are stored in `users.role` (PostgreSQL). The default role for new sign-ins is `student`. Promote a user by updating the column directly:

```sql
UPDATE users SET role = 'mentor' WHERE email = 'user@example.com';
```

---

## Changing the database schema

`database/init/*.sql` is the **source of truth**, but it only runs once (when the `pgdata` volume is first created). For subsequent changes:

1. Write a plain SQL migration and run it against the live container:
   ```bash
   docker exec -i roboticgen_postgres psql -U roboticgen -d roboticgen < my_migration.sql
   ```
2. Update `frontend/src/db/schema.ts` to match (Drizzle uses this for query typing — it does not drive migrations).
