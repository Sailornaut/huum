# HUUM — Project Guide

## What is this?
HUUM is a short-form social media platform focused on diverse discourse, anti-echo-chamber feeds, and transparent community moderation. MVP targeting 4-8 week build.

## Tech Stack
- **Frontend**: Next.js 14 (App Router) + Tailwind CSS — in `apps/web/`
- **Backend**: NestJS + TypeORM — in `apps/api/`
- **Database**: PostgreSQL 15
- **Cache**: Redis (optional for MVP, used for feed caching)
- **Media storage**: S3-compatible (Minio for local dev)
- **Auth**: JWT + Google OAuth via Passport.js
- **Infra**: GCP (Cloud Run, Cloud SQL, Cloud Storage), Terraform in `infra/terraform/`

## Project Structure
```
huum/
├── apps/
│   ├── api/          # NestJS backend (port 3001)
│   └── web/          # Next.js frontend (port 3000)
├── db/
│   ├── migrations/   # SQL migration files
│   └── seeds/        # Seed data for development
├── infra/
│   ├── docker/       # Dockerfiles + docker-compose
│   └── terraform/    # GCP infrastructure
├── docs/
│   └── ARCHITECTURE.md  # Full system design document
└── package.json      # Root workspace scripts
```

## Local Development

### Quick start with Docker
```bash
docker compose -f infra/docker/docker-compose.yml up -d
# API: http://localhost:3001/api
# Web: http://localhost:3000
# Swagger: http://localhost:3001/api/docs
# Minio console: http://localhost:9001 (minioadmin/minioadmin)
```

### Without Docker
```bash
# 1. Start PostgreSQL and Redis locally
# 2. Copy env files
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
# 3. Install and run
npm run install:all
npm run db:migrate
npm run db:seed
# In separate terminals:
npm run api:dev
npm run web:dev
```

## Key Architecture Decisions
- **Feed algorithm**: Perspective Slider (0.0-1.0) controls ratio of followed vs diverse content. See `apps/api/src/modules/feed/feed.service.ts`
- **Moderation**: Hybrid system — user reports → community voting (10 voters, 70% threshold) → moderator review. Transparent public logs.
- **Auth**: JWT access tokens (15min) + refresh tokens (7d). Google OAuth for convenience.
- **Database**: Denormalized counts on posts (like_count, comment_count) for read performance. Updated via application logic.

## API Patterns
- All endpoints prefixed with `/api`
- JWT auth via `Authorization: Bearer <token>` header
- Standard response wrapper: `{ success: boolean, data: T, timestamp: string }`
- Pagination via cursor-based approach: `?cursor=<timestamp>&limit=20`

## Important Files
- `docs/ARCHITECTURE.md` — Complete system design, DB schema, API spec, feed algorithm pseudocode
- `db/migrations/001_initial_schema.sql` — Full database schema
- `db/seeds/001_seed_data.sql` — Demo users (password: Demo1234!), posts, comments
- `apps/api/src/modules/feed/feed.service.ts` — Feed ranking algorithm
- `apps/api/src/modules/moderation/moderation.service.ts` — Moderation workflow
- `apps/web/src/components/feed/PerspectiveSlider.tsx` — The signature UI component

## Environment Variables
See `apps/api/.env.example` and `apps/web/.env.example` for required variables.

## Deployment
- CI/CD via GitHub Actions (`.github/workflows/ci.yml`)
- Infrastructure via Terraform (`infra/terraform/`)
- Container images pushed to GCP Artifact Registry
- Deployed to GCP Cloud Run (scale-to-zero for cost efficiency)
