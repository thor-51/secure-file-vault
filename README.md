# 🔐 Secure File Vault System

[![CI](https://github.com/thor-51/secure-file-vault/actions/workflows/ci.yml/badge.svg)](https://github.com/thor-51/secure-file-vault/actions/workflows/ci.yml)

A production-grade encrypted file storage and sharing platform.

## Tech Stack
- **Backend**: Node.js + Express + Prisma ORM + PostgreSQL
- **Cache / Rate Limiting**: Redis (Upstash-compatible)
- **File Storage**: AWS S3 (AES-256 server-side encryption)
- **Auth**: JWT + bcrypt + refresh token rotation
- **Frontend**: React + Vite + Tailwind CSS + Redux Toolkit
- **DevOps**: Docker + Docker Compose + GitHub Actions

## Quick Start (Docker)

```bash
cp backend/.env.example backend/.env   # fill in your secrets
docker compose up --build
```

App → http://localhost  
API docs → http://localhost:5000/api/docs

## Quick Start (local dev)

```bash
# Backend
cd backend
cp .env.example .env        # edit with your values
npm install
npx prisma migrate dev --name init
npm run prisma:seed
npm run dev                 # http://localhost:5000

# Frontend (new terminal)
cd frontend
cp .env.example .env.local
npm install
npm run dev                 # http://localhost:5173
```

## Seed credentials
| Role  | Email               | Password      |
|-------|---------------------|---------------|
| Admin | admin@vault.dev     | Admin@123456  |
| User  | user@vault.dev      | User@123456   |

## Features
- JWT auth with refresh token rotation
- SHA-256 deduplication (same file → same S3 object)
- 10 MB storage quota per user (configurable)
- Redis rate limiting (2 req/s per user)
- Role-based access control (admin / user)
- File sharing: public / private / specific users
- Advanced search with MIME type, size, date filters
- Admin dashboard with upload analytics
- Audit logging for all operations
- Signed S3 URLs for secure downloads
- Dark / light mode
- Drag-and-drop upload with progress bars

## Environment Variables
See `backend/.env.example` for all required variables.

## Running Tests
```bash
cd backend
npm test              # all tests
npm run test:coverage # with coverage report
```
