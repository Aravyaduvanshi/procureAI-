# Deployment & Operations Guide

## 1. Local Docker Development Environment

The project includes a streamlined `docker-compose.yml` (`backend/docker-compose.yml`) providing Redis and PostgreSQL.

### Services Defined:
```yaml
services:
  redis:
    image: redis:latest
    container_name: procureai-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped

  postgres:
    image: postgres:16-alpine
    container_name: procureai-postgres
    environment:
      POSTGRES_USER: procureai
      POSTGRES_PASSWORD: procureai_dev_password
      POSTGRES_DB: procureai
    ports:
      - "5432:5432"
    volumes:
      - pg_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  redis_data:
  pg_data:
```

### Launching Docker Services:
```bash
cd backend
docker compose up -d
```

---

## 2. Running Microservices Concurrently

You can start the entire backend suite with a single command from `backend/`:
```bash
npm run dev
```
This invokes `concurrently`, spawning:
- Gateway on `http://localhost:8000`
- Auth Service on `http://localhost:8001`
- Supplier Service on `http://localhost:8002`
- Requirement Service on `http://localhost:8003`
- Vendor Rating Service on `http://localhost:8004`
- Matching Service on `http://localhost:8005`
- Approval Service on `http://localhost:8006`
- Negotiation Service on `http://localhost:8007`
- Communication Service on `http://localhost:8008`
- Billing Service on `http://localhost:8009`

### Running the Frontend:
```bash
cd ../frontend
npm run dev
```
Access the application in your browser at `http://localhost:5173`.

---

## 3. Database Persistence & Migrations

The database layer (`backend/shared/db.js`) is architected with dual-persistence:
1. **Production Mode (PostgreSQL):** When `DATABASE_URL` is set, it initializes connection pooling via `pg.Pool` and automatically runs idempotent table creation migrations for `users`, `requirements`, `matching_runs`, `approvals`, `negotiations`, `negotiation_messages`, and `audit_events`.
2. **Local Development Mode (Zero-Config):** When `DATABASE_URL` is empty, it uses atomic JSON file collections in `backend/data/store/`. Changes persist durably across restarts without requiring any installed database daemon.

---

## 4. Production Deployment Recommendations

For production environments (Kubernetes, AWS ECS, or Google Cloud Run):
1. **Containerization:** Package each service with Node 20+ Alpine base images.
2. **Gateway Protection:** Deploy behind an API Gateway (Kong, AWS API Gateway, or NGINX ingress) with TLS termination.
3. **Secrets Management:** Inject secrets (`JWT_SECRET`, `LLM_API_KEY`, `EMAIL_API_KEY`, `DATABASE_URL`) via Cloud Secret Manager or Kubernetes Secrets.
4. **Health Checking:** Monitor `/health` on the API Gateway; it probes all downstream microservices and returns `200 OK` or `207 Multi-Status` with detailed service-level health.
