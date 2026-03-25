.PHONY: help dev prod build down logs clean db-migrate db-seed cloud-setup cloud-deploy cloud-teardown

# Default target
help:
	@echo "Performa-Edu Commands"
	@echo "====================="
	@echo ""
	@echo "Local Development (Docker):"
	@echo "  make dev          - Start all services in development mode"
	@echo "  make dev-build    - Build and start all services in development mode"
	@echo "  make dev-logs     - View logs for all development services"
	@echo ""
	@echo "Local Production (Docker):"
	@echo "  make prod         - Start all services in production mode"
	@echo "  make prod-build   - Build and start all services in production mode"
	@echo ""
	@echo "Individual Services:"
	@echo "  make api-gateway  - Start only api-gateway service"
	@echo "  make auth         - Start only auth-service"
	@echo "  make content      - Start only content-service"
	@echo "  make customer     - Start only customer-service"
	@echo "  make student      - Start only student-service"
	@echo ""
	@echo "Database:"
	@echo "  make db           - Start only PostgreSQL and Redis"
	@echo "  make db-migrate   - Run Prisma migrations"
	@echo "  make db-seed      - Seed the database"
	@echo "  make db-studio    - Open Prisma Studio"
	@echo ""
	@echo "Cloud Deployment (GCP Cloud Run):"
	@echo "  make cloud-setup    - Setup GCP infrastructure (one-time)"
	@echo "  make cloud-deploy   - Deploy all services to Cloud Run"
	@echo "  make cloud-build    - Submit build to Cloud Build"
	@echo "  make cloud-logs     - View Cloud Run logs"
	@echo "  make cloud-teardown - Delete all GCP resources (DESTRUCTIVE)"
	@echo ""
	@echo "Utilities:"
	@echo "  make down         - Stop all services"
	@echo "  make clean        - Stop and remove all containers, volumes, and images"
	@echo "  make logs         - View logs for all services"
	@echo "  make ps           - List running containers"
	@echo "  make shell-<svc>  - Open shell in a service (e.g., make shell-api-gateway)"

# ===========================================
# Development Commands
# ===========================================
dev:
	docker-compose up -d

dev-build:
	docker-compose up -d --build

dev-logs:
	docker-compose logs -f

# ===========================================
# Production Commands
# ===========================================
prod:
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

prod-build:
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# ===========================================
# Individual Services
# ===========================================
api-gateway:
	docker-compose up -d postgres redis api-gateway

auth:
	docker-compose up -d postgres redis auth-service

content:
	docker-compose up -d postgres redis content-service

customer:
	docker-compose up -d postgres redis customer-service

student:
	docker-compose up -d postgres redis student-service

# ===========================================
# Infrastructure Only
# ===========================================
db:
	docker-compose up -d postgres redis

# ===========================================
# Database Commands
# ===========================================
db-migrate:
	docker-compose exec api-gateway pnpm prisma migrate deploy --schema=./libs/src/prisma/schema.prisma

db-seed:
	docker-compose exec api-gateway pnpm prisma db seed --schema=./libs/src/prisma/schema.prisma

db-studio:
	pnpm prisma studio --schema=./libs/src/prisma/schema.prisma

# ===========================================
# Utility Commands
# ===========================================
down:
	docker-compose down

clean:
	docker-compose down -v --rmi local
	docker system prune -f

logs:
	docker-compose logs -f

ps:
	docker-compose ps

# Shell access to containers
shell-api-gateway:
	docker-compose exec api-gateway sh

shell-auth:
	docker-compose exec auth-service sh

shell-content:
	docker-compose exec content-service sh

shell-customer:
	docker-compose exec customer-service sh

shell-student:
	docker-compose exec student-service sh

shell-postgres:
	docker-compose exec postgres psql -U postgres -d performa_edu_db

shell-redis:
	docker-compose exec redis redis-cli

# ===========================================
# Cloud Deployment Commands (GCP Cloud Run)
# ===========================================

# Initial GCP infrastructure setup (one-time)
cloud-setup:
	@echo "Setting up GCP infrastructure..."
	@if [ -z "$(GCP_PROJECT_ID)" ]; then \
		echo "Error: GCP_PROJECT_ID is required"; \
		echo "Usage: make cloud-setup GCP_PROJECT_ID=your-project-id"; \
		exit 1; \
	fi
	./deploy/scripts/setup-gcp.sh

# Deploy all services to Cloud Run
cloud-deploy:
	@echo "Deploying to Cloud Run..."
	@if [ -z "$(GCP_PROJECT_ID)" ]; then \
		echo "Error: GCP_PROJECT_ID is required"; \
		echo "Usage: make cloud-deploy GCP_PROJECT_ID=your-project-id"; \
		exit 1; \
	fi
	./deploy/scripts/deploy.sh

# Submit build to Cloud Build
cloud-build:
	@echo "Submitting build to Cloud Build..."
	gcloud builds submit --config=cloudbuild.yaml

# View Cloud Run logs
cloud-logs:
	@echo "Fetching Cloud Run logs..."
	@if [ -z "$(SERVICE)" ]; then \
		gcloud run services logs read api-gateway --region=$(GCP_REGION) --limit=50; \
	else \
		gcloud run services logs read $(SERVICE) --region=$(GCP_REGION) --limit=50; \
	fi

# List Cloud Run services
cloud-status:
	gcloud run services list --region=$(GCP_REGION)

# Delete all GCP resources (DESTRUCTIVE!)
cloud-teardown:
	@echo "WARNING: This will delete ALL GCP resources!"
	@if [ -z "$(GCP_PROJECT_ID)" ]; then \
		echo "Error: GCP_PROJECT_ID is required"; \
		echo "Usage: make cloud-teardown GCP_PROJECT_ID=your-project-id"; \
		exit 1; \
	fi
	./deploy/scripts/teardown-gcp.sh

# Default region for cloud commands
GCP_REGION ?= asia-southeast1
