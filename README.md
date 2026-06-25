# 🔐 Secure File Vault

A production-grade encrypted file storage and sharing platform sustaining **1,063 RPS with P99 latency of 154ms** under 500 concurrent users.

Built with Node.js, Express, PostgreSQL, Redis, React, and AWS S3.

![CI/CD Pipeline](https://github.com/thor-51/secure-file-vault/actions/workflows/ci-cd.yml/badge.svg)

---

## Architecture

```
┌─────────────┐     ┌─────────────────────────────────────────┐
│   React +   │────▶│              Nginx (reverse proxy)       │
│   Vite SPA  │     └──────────────┬──────────────────────────┘
└─────────────┘                    │
                                   ▼
                     ┌─────────────────────────┐
                     │   Node.js / Express API  │
                     │   JWT Auth · RBAC · Zod  │
                     └────┬──────────┬──────────┘
                          │          │
               ┌──────────▼──┐  ┌───▼──────────┐
               │  PostgreSQL  │  │    Redis      │
               │  (Prisma)    │  │  rate limit   │
               └─────────────┘  └───────────────┘
                          │
               ┌──────────▼──────────┐
               │      AWS S3          │
               │  AES-256 encryption  │
               │  SHA-256 dedup       │
               └─────────────────────┘
```

---

## Performance (k6 Load Test — 500 concurrent users, 3m30s)

| Metric | Result |
|---|---|
| Throughput | **1,063 RPS** |
| P99 latency (all endpoints) | **154ms** |
| Upload P95 | 95ms |
| Search P95 | 93ms |
| Download P95 | 114ms |
| Error rate | < 1% |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js 22, Express 4, Prisma ORM |
| Database | PostgreSQL 16 |
| Cache / Rate Limiting | Redis 7 (ioredis + rate-limiter-flexible) |
| File Storage | AWS S3 (AES-256 SSE, signed URLs) |
| Auth | JWT (access + refresh token rotation), bcrypt |
| Validation | Zod |
| Queue | BullMQ |
| Frontend | React, Vite, Tailwind CSS, Redux Toolkit |
| API Docs | Swagger / OpenAPI |
| DevOps | Docker, Docker Compose, Nginx, GitHub Actions |
| Testing | Jest, Supertest, k6 (load testing) |
| Logging | Winston (structured JSON) |

---

## Features

- JWT authentication with refresh token rotation and revocation
- SHA-256 content-addressable deduplication (same content → single S3 object regardless of owner)
- AES-256 server-side encryption on all S3 objects
- Role-based access control (admin / user)
- File sharing: public / private / specific users with granular read/delete permissions
- Advanced search with combinable filters — MIME type, size range, date range, tags
- Redis rate limiting (2 req/s per user, configurable)
- Storage quota enforcement per user (10MB default, configurable)
- Audit logging for every operation (UPLOAD, DOWNLOAD, DELETE, SHARE, LOGIN, etc.)
- Presigned S3 URLs for secure time-limited downloads
- Admin dashboard with upload analytics
- Drag-and-drop upload with progress bars
- Dark / light mode

---

## Project Structure

```
secure-file-vault/
├── backend/
│   ├── src/
│   │   ├── config/          # DB, Redis, S3, env, swagger
│   │   ├── controllers/     # auth, file, admin
│   │   ├── middlewares/     # JWT auth, upload, rate limit, audit, validate
│   │   ├── repositories/    # auth.repository, file.repository
│   │   ├── routes/          # auth, file, admin, health
│   │   ├── services/        # auth.service, file.service, s3.service
│   │   ├── utils/           # errors, logger, pagination, response
│   │   └── validators/      # auth.validator, file.validator (Zod)
│   ├── prisma/
│   │   ├── schema.prisma    # Users, Files, Tags, Permissions, AuditLogs
│   │   └── seed.js          # Dev admin + user seed
│   └── src/tests/
│       ├── unit/            # AuthService (mocked)
│       └── integration/     # Auth API, File API (real DB + mocked S3)
├── frontend/                # React + Vite + Tailwind + Redux
├── nginx/                   # Reverse proxy config
├── load-test/               # k6 load test scripts
└── docker-compose.yml
```

---

## Quick Start (Docker)

```bash
cp backend/.env.example backend/.env   # fill in your secrets
docker compose up --build
```

- App → http://localhost
- API docs → http://localhost:5000/api/docs

---

## Quick Start (Local Dev)

**Prerequisites:** Node.js 22+, Docker (for Postgres + Redis)

```bash
# 1 — Start Postgres and Redis
docker compose up -d postgres redis

# 2 — Backend
cd backend
cp .env.example .env          # edit with your values (see below)
npm install
npx prisma migrate dev --name init
npx prisma db seed
npm run dev                   # http://localhost:5000

# 3 — Frontend (new terminal)
cd frontend
npm install
npm run dev                   # http://localhost:5173
```

### Key .env values for local dev (mock S3)

```env
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
AWS_S3_BUCKET=test-bucket
S3_MOCK=true                  # bypasses real S3 calls
RATE_LIMIT_MAX_REQUESTS=1000  # disable rate limiting in dev
DEFAULT_STORAGE_QUOTA_MB=1000
```

---

## Seed Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@vault.dev | Admin@123456 |
| User | user@vault.dev | User@123456 |

---

## API Reference

Full Swagger docs at `/api/docs` when running locally.

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/auth/register` | Register new user |
| POST | `/api/v1/auth/login` | Login, returns access + refresh tokens |
| POST | `/api/v1/auth/refresh` | Rotate refresh token |
| POST | `/api/v1/auth/logout` | Revoke refresh token |
| GET | `/api/v1/auth/me` | Current user profile |
| POST | `/api/v1/files/upload` | Upload file (multipart/form-data) |
| GET | `/api/v1/files/search` | Search with filters |
| GET | `/api/v1/files/:id` | File metadata |
| GET | `/api/v1/files/:id/download` | Presigned S3 download URL |
| PATCH | `/api/v1/files/:id/rename` | Rename file |
| POST | `/api/v1/files/:id/share` | Set visibility / share with users |
| DELETE | `/api/v1/files/:id` | Soft delete |
| GET | `/api/v1/admin/users` | List users (admin only) |
| GET | `/api/v1/admin/stats` | Upload analytics (admin only) |

---

## Running Tests

```bash
cd backend
npm test                  # all tests
npm run test:coverage     # with coverage report
```

Unit tests mock the repository layer. Integration tests use a real Postgres + Redis instance with S3 mocked via `jest.mock`.

---

## Load Testing

```bash
# Requires k6 — brew install k6
k6 run load-test/vault_load_test.js
```

Tests auth, upload, search, download, and delete under ramp-up to 500 concurrent users.

---

## CI/CD

GitHub Actions pipeline (`.github/workflows/ci-cd.yml`):

1. **Backend Tests** — Jest with coverage, Postgres + Redis as service containers
2. **Frontend Build** — Vite production build check
3. **Docker Build & Push** — Builds and pushes images to GitHub Container Registry (main branch only)
4. **Deploy** — Render (backend) + Vercel (frontend) via deploy hooks (configure secrets to enable)

### Required GitHub Secrets for deployment

| Secret | Description |
|---|---|
| `RENDER_DEPLOY_HOOK_URL` | Render deploy hook URL |
| `RENDER_API_KEY` | Render API key |
| `VERCEL_TOKEN` | Vercel API token |
| `VERCEL_ORG_ID` | Vercel org ID |
| `VERCEL_PROJECT_ID` | Vercel project ID |

---

## Deployment Guide

### Backend → Render

1. Create a new **Web Service** on [Render](https://render.com)
2. Connect this repo, set root directory to `backend`
3. Build command: `npm install && npx prisma generate && npx prisma migrate deploy`
4. Start command: `npm start`
5. Add all environment variables from `.env.example` (use real AWS credentials)
6. Add a **PostgreSQL** database and **Redis** instance on Render
7. Copy the **Deploy Hook URL** → add as `RENDER_DEPLOY_HOOK_URL` in GitHub secrets

### Frontend → Vercel

1. Import repo on [Vercel](https://vercel.com)
2. Set root directory to `frontend`
3. Add env var: `VITE_API_URL=https://your-render-backend-url/api/v1`
4. Copy `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` → add to GitHub secrets

### Database (Production)

Use [Neon](https://neon.tech) or [Supabase](https://supabase.com) for a managed PostgreSQL instance — both have free tiers compatible with Prisma.

### Redis (Production)

Use [Upstash](https://upstash.com) — serverless Redis with a free tier. Set `REDIS_URL` to the `rediss://` connection string.

---

## Allowed File Types

Images (JPEG, PNG, GIF, WebP, SVG), PDF, Word, Excel, PowerPoint, plain text, CSV, HTML, JSON, XML, ZIP, TAR, GZIP, MP4, WebM, OGG, MP3, WAV.

Max file size: 50MB (configurable via `MAX_FILE_SIZE_MB`).
