# National E-Waste Management & Formalization Platform (DPI)

An enterprise-grade Digital Public Infrastructure (DPI) connecting Citizens, Informal Waste Aggregators, Field Collectors, CPCB Authorized Recyclers, and Government Regulators in accordance with India's **E-Waste (Management) Rules 2022**.

---

## 1. Project Purpose

India generates over 1.7 million tonnes of e-waste annually, with 90%+ handled by the informal sector. This platform addresses:
- **Price Opacity**: AI dynamic scrap price intelligence benchmarks commodity recovery rates.
- **Occupational Health & Safety**: Contextual vernacular guidance alerts workers to hazardous handling (e.g. CRT implosions, Li-ion thermal runaway).
- **CPCB Regulatory Compliance**: End-to-end chain of custody with Form 6 digital manifests and auditable EPR credit generation.
- **Incentive Alignment**: Formal recycler premiums increase net profit margins for informal collectors and scrap aggregators by 15–25%.

---

## 2. Master System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    REACT.JS CLIENT (PWA)                    │
│    - Citizen Portal       - Aggregator Command Hub          │
│    - Collector Field App  - Recycler B2B Console            │
│    - Government Admin Real-time Command Center              │
└──────────────────────────────┬──────────────────────────────┘
                               │ REST (HTTPS) / WebSocket
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                       NESTJS GATEWAY                        │
│    - Role-Based Access Control (RBAC) & Supabase JWT Auth   │
│    - Material Lot Lifecycle Finite State Machine            │
│    - Smart Collector Dispatch & Recycler Match Router       │
│    - Double-Entry Ledger & Form 6 Manifest Generator        │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
               ▼                              ▼
┌──────────────────────────────┐ ┌────────────────────────────┐
│      SUPABASE PLATFORM       │ │   PYTHON FASTAPI AI ENGINE  │
│  - PostgreSQL 15+ & PostGIS  │ │  - YOLOv8 Vision Classifier│
│  - Supabase Auth (Phone OTP) │ │  - Dynamic Price Regressor │
│  - 5 Secure Storage Buckets  │ │  - Multi-Criteria Matcher  │
│  - Realtime WebSocket Stream │ │  - Anomaly Outlier Engine  │
└──────────────────────────────┘ └────────────────────────────┘
```

---

## 3. Directory Structure

```
sih-229/
├── frontend/             # React 18 + Vite + TypeScript PWA
│   ├── src/
│   │   ├── app/          # App providers & entry
│   │   ├── components/   # Common buttons, badges, modals
│   │   ├── layouts/      # AuthLayout & RoleLayout
│   │   ├── pages/        # Auth & Role-based dashboards
│   │   ├── routes/       # Protected RBAC routing
│   │   ├── services/     # Axios client & health check
│   │   ├── store/        # Zustand session & role store
│   │   ├── i18n/         # English, Hindi, Marathi catalogs
│   │   └── types/        # TypeScript interfaces
│   ├── package.json
│   └── vite.config.ts
│
├── backend/              # NestJS Modular Backend
│   ├── src/
│   │   ├── common/       # Guards, Decorators, Interceptors, Errors
│   │   ├── config/       # Supabase service & environment
│   │   ├── health/       # Health controller & dependency probes
│   │   ├── audit/        # Non-repudiation audit logger
│   │   ├── auth/         # Token verification & profile sync
│   │   ├── lots/         # Lot creation & state transitions
│   │   ├── ai/           # Bridge to Python microservice
│   │   ├── admin/        # Government command center endpoints
│   │   ├── aggregators/  # Scrap godown consolidation
│   │   ├── collectors/   # Field job queue & verification
│   │   └── main.ts       # Helmet, CORS, Swagger, Prefix
│   ├── package.json
│   └── tsconfig.json
│
├── ai-service/           # Python 3.11+ FastAPI Microservice
│   ├── app/
│   │   ├── api/          # Endpoints for classification, pricing, anomalies
│   │   ├── schemas/      # Pydantic request/response schemas
│   │   ├── services/     # AI Inference & algorithm implementations
│   │   └── main.py       # FastAPI application bootstrap
│   └── requirements.txt
│
├── supabase/             # Database Schemas & Migrations
│   ├── migrations/
│   │   ├── 01_core_schema.sql             # 24 normalized tables + PostGIS
│   │   ├── 02_auth_and_roles_triggers.sql # Auth user sync & role helpers
│   │   ├── 03_storage_buckets_and_policies.sql # 5 storage buckets
│   │   ├── 04_row_level_security.sql      # RLS security rules
│   │   └── 05_seed_data.sql               # Taxonomy & multilingual safety
│   └── supabase_setup.sql                 # Master copy-paste script for SQL editor
│
└── docs/                 # Architecture, API & CPCB specifications
```

---

## 4. Prerequisites

- **Node.js**: v18+ (tested on Node v24.13.1)
- **npm**: v9+ (tested on npm 11.8.0)
- **Python**: v3.10+ (tested on Python 3.14.3)
- **Supabase Project**: Free tier or self-hosted Supabase instance

---

## 5. Environment Configuration

### Frontend (`frontend/.env`)
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_API_URL=http://localhost:5000/api/v1
```

### Backend (`backend/.env`)
```env
PORT=5000
NODE_ENV=development
API_PREFIX=api/v1
FRONTEND_URL=http://localhost:5173
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
AI_SERVICE_URL=http://localhost:8000
```

### AI Microservice (`ai-service/.env`)
```env
PORT=8000
HOST=0.0.0.0
ENVIRONMENT=development
```

---

## 6. How to Run Services

### A. Run Python FastAPI Microservice
```bash
cd ai-service
# Activate virtual environment
# Windows:
.\venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
*Health endpoint:* `http://localhost:8000/health`  
*Swagger docs:* `http://localhost:8000/docs`

---

### B. Run NestJS API Gateway
```bash
cd backend
npm run start:dev
```
*Health endpoint:* `http://localhost:5000/api/v1/health`  
*Swagger docs:* `http://localhost:5000/api/docs`

---

### C. Run React.js Frontend
```bash
cd frontend
npm run dev
```
*Web Application:* `http://localhost:5173`

---

## 7. Supabase Database Setup

1. Open your Supabase Project Dashboard.
2. Go to the **SQL Editor**.
3. Copy the full contents of `supabase/supabase_setup.sql`.
4. Click **Run**.
5. All 24 normalized tables, PostGIS extensions, automatic `EW-YYYY-XXXXXX` lot generator, role triggers, storage buckets, and RLS policies are now active.

---

## 8. Role-Based Access Control (RBAC) Test Accounts

You can test any role directly via the one-click quick login buttons on the `/login` screen or using the **Active Role** dropdown in the top navigation bar:

| Role | Responsibility | Default Route |
| :--- | :--- | :--- |
| `USER` | Citizen disposing waste, requesting AI appraisal | `/user/dashboard` |
| `INFORMAL_AGGREGATOR` | Scrap godown consolidation, margins & dispatch | `/aggregator/dashboard` |
| `COLLECTION_COLLECTOR` | Field agent weighing on scale, GPS proof & payout | `/collector/dashboard` |
| `AUTHORIZED_RECYCLER` | CPCB licensed dismantler, Form 6 & EPR credits | `/recycler/dashboard` |
| `GOVERNMENT_ADMIN` | CPCB/SPCB Command Center, macro KPIs & anomalies | `/admin/dashboard` |
